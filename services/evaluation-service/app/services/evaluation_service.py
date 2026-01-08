"""
Main evaluation service
Coordinates metric calculation and feedback generation
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any, Optional
from uuid import UUID
import numpy as np
from datetime import datetime, timedelta
import time
import logging
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException

from app.models.models import EvaluationResult, EvaluationSession, GroundTruthCache
from app.schemas.schemas import (
    EvaluateRequest,
    BatchEvaluateRequest,
    EvaluationResponse,
    BatchEvaluationResponse,
    MetricScores,
    QualityLevel
)
from app.services.metrics_calculator import MetricsCalculator
from app.services.feedback_generator import FeedbackGenerator
from app.config import settings

logger = logging.getLogger(__name__)


class EvaluationService:
    """Main evaluation service"""
    
    @staticmethod
    async def evaluate_annotation(
        db: AsyncSession,
        request: EvaluateRequest
    ) -> EvaluationResponse:
        """
        Evaluate a single annotation against ground truth
        """
        start_time = time.time()
        
        try:
            # Fetch annotation masks (placeholder - would integrate with Annotation Service)
            pred_mask, truth_mask, spacing = await EvaluationService._fetch_masks(
                request.annotation_id,
                request.ground_truth_id
            )
            
            # Calculate metrics
            metrics_dict = MetricsCalculator.calculate_all_metrics(pred_mask, truth_mask, spacing)
            
            # Generate feedback
            if request.generate_feedback:
                feedback = FeedbackGenerator.generate_feedback(metrics_dict, pred_mask, truth_mask, spacing)
            else:
                feedback = None
            
            # Determine quality
            quality_level = FeedbackGenerator._determine_quality(metrics_dict)
            pass_threshold = metrics_dict['dice_score'] >= settings.DICE_ACCEPTABLE
            
            # Calculate evaluation time
            eval_time_ms = int((time.time() - start_time) * 1000)
            
            # Create evaluation result
            result = EvaluationResult(
                annotation_id=request.annotation_id,
                ground_truth_id=request.ground_truth_id,
                user_id=request.user_id,
                case_id=request.case_id,
                assessment_id=request.assessment_id,
                **metrics_dict,
                overall_quality=quality_level.value,
                pass_threshold=pass_threshold,
                feedback_text=feedback.overall if feedback else None,
                feedback_items=feedback.model_dump(exclude={'overall', 'quality_level'}) if feedback else None,
                evaluation_time_ms=eval_time_ms
            )
            
            db.add(result)
            await db.commit()
            await db.refresh(result)
            
            # Update session if applicable
            if request.user_id and request.case_id:
                await EvaluationService._update_session(
                    db,
                    request.user_id,
                    request.case_id,
                    metrics_dict['dice_score']
                )
            
            # Create response
            return EvaluationResponse(
                result_id=result.id,
                annotation_id=result.annotation_id,
                ground_truth_id=result.ground_truth_id,
                metrics=MetricScores(**metrics_dict),
                feedback=feedback,
                overall_quality=quality_level,
                pass_threshold=pass_threshold,
                evaluation_time_ms=eval_time_ms,
                created_at=result.created_at
            )
            
        except Exception as e:
            logger.error(f"Error evaluating annotation: {str(e)}")
            raise AppException(message=f"Evaluation failed: {str(e)}")
    
    @staticmethod
    async def batch_evaluate(
        db: AsyncSession,
        request: BatchEvaluateRequest
    ) -> BatchEvaluationResponse:
        """
        Evaluate multiple annotations in batch
        """
        start_time = time.time()
        results = []
        successful = 0
        failed = 0
        
        for eval_request in request.evaluations:
            try:
                result = await EvaluationService.evaluate_annotation(db, eval_request)
                results.append(result)
                successful += 1
            except Exception as e:
                logger.error(f"Batch evaluation failed for {eval_request.annotation_id}: {str(e)}")
                failed += 1
        
        total_time = time.time() - start_time
        
        return BatchEvaluationResponse(
            assessment_id=request.assessment_id,
            total_evaluations=len(request.evaluations),
            successful=successful,
            failed=failed,
            results=results,
            total_time_seconds=total_time
        )
    
    @staticmethod
    async def get_evaluation_result(
        db: AsyncSession,
        result_id: UUID
    ) -> Optional[EvaluationResult]:
        """Get evaluation result by ID"""
        result = await db.execute(
            select(EvaluationResult).where(EvaluationResult.id == result_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_evaluations(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> List[EvaluationResult]:
        """Get all evaluations for a user"""
        result = await db.execute(
            select(EvaluationResult)
            .where(EvaluationResult.user_id == user_id)
            .order_by(EvaluationResult.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_assessment_evaluations(
        db: AsyncSession,
        assessment_id: UUID
    ) -> List[EvaluationResult]:
        """Get all evaluations for an assessment"""
        result = await db.execute(
            select(EvaluationResult)
            .where(EvaluationResult.assessment_id == assessment_id)
            .order_by(EvaluationResult.created_at.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_session(
        db: AsyncSession,
        user_id: UUID,
        case_id: UUID
    ) -> Optional[EvaluationSession]:
        """Get active session for user and case"""
        result = await db.execute(
            select(EvaluationSession)
            .where(EvaluationSession.user_id == user_id)
            .where(EvaluationSession.case_id == case_id)
            .where(EvaluationSession.is_complete == False)
            .order_by(EvaluationSession.created_at.desc())
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def _update_session(
        db: AsyncSession,
        user_id: UUID,
        case_id: UUID,
        score: float
    ):
        """Update evaluation session with new attempt"""
        session = await EvaluationService.get_session(db, user_id, case_id)
        
        if not session:
            # Create new session
            session = EvaluationSession(
                user_id=user_id,
                case_id=case_id,
                session_start=datetime.utcnow(),
                attempts=1,
                best_score=score,
                latest_score=score,
                learning_curve_data={"scores": [score]}
            )
            db.add(session)
        else:
            # Update existing session
            session.attempts += 1
            session.latest_score = score
            if score > (session.best_score or 0):
                session.best_score = score
            
            # Update learning curve
            learning_curve = session.learning_curve_data or {"scores": []}
            learning_curve["scores"].append(score)
            session.learning_curve_data = learning_curve
            
            # Calculate improvement rate
            if len(learning_curve["scores"]) > 1:
                first_score = learning_curve["scores"][0]
                session.improvement_rate = ((score - first_score) / first_score) * 100 if first_score > 0 else 0.0
        
        await db.commit()
    
    @staticmethod
    async def _fetch_masks(
        annotation_id: UUID,
        ground_truth_id: UUID
    ) -> tuple[np.ndarray, np.ndarray, tuple]:
        """
        Fetch annotation masks from Annotation Service
        Placeholder implementation - would make HTTP request to Annotation Service
        """
        # For now, return dummy data
        # In production, this would:
        # 1. Make HTTP request to Annotation Service
        # 2. Decode annotation data (RLE, polygon, etc.)
        # 3. Convert to numpy array
        # 4. Get voxel spacing from DICOM metadata
        
        logger.warning("Using dummy masks - integrate with Annotation Service")
        
        # Create dummy masks for testing
        shape = (128, 128, 64)
        pred_mask = np.random.randint(0, 2, shape).astype(np.uint8)
        truth_mask = np.random.randint(0, 2, shape).astype(np.uint8)
        spacing = (1.0, 1.0, 1.0)  # mm
        
        return pred_mask, truth_mask, spacing
