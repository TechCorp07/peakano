"""
Evaluation endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.responses import success_response
from shared.common.exceptions import AppException

from app.services.evaluation_service import EvaluationService
from app.schemas.schemas import (
    EvaluateRequest,
    BatchEvaluateRequest,
    EvaluationResponse,
    BatchEvaluationResponse,
    EvaluationResultResponse,
    EvaluationSessionResponse
)

router = APIRouter(prefix="/evaluate", tags=["evaluation"])


@router.post("/", response_model=EvaluationResponse)
async def evaluate_annotation(
    request: EvaluateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluate a single annotation against ground truth
    Returns metrics and feedback
    """
    try:
        result = await EvaluationService.evaluate_annotation(db, request)
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.post("/batch", response_model=BatchEvaluationResponse)
async def batch_evaluate(
    request: BatchEvaluateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluate multiple annotations in batch
    Used for grading assessments
    """
    try:
        result = await EvaluationService.batch_evaluate(db, request)
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/results/{result_id}", response_model=EvaluationResultResponse)
async def get_evaluation_result(
    result_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get evaluation result by ID"""
    try:
        result = await EvaluationService.get_evaluation_result(db, result_id)
        if not result:
            raise AppException(message="Evaluation result not found")
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/user/{user_id}", response_model=List[EvaluationResultResponse])
async def get_user_evaluations(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all evaluations for a user"""
    try:
        results = await EvaluationService.get_user_evaluations(db, user_id, skip, limit)
        return results
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/assessment/{assessment_id}", response_model=List[EvaluationResultResponse])
async def get_assessment_evaluations(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all evaluations for an assessment"""
    try:
        results = await EvaluationService.get_assessment_evaluations(db, assessment_id)
        return results
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/session/{user_id}/{case_id}", response_model=Optional[EvaluationSessionResponse])
async def get_evaluation_session(
    user_id: UUID,
    case_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get active evaluation session for user and case"""
    try:
        session = await EvaluationService.get_session(db, user_id, case_id)
        return session
    except Exception as e:
        raise AppException(message=str(e))
