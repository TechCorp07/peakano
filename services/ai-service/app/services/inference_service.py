"""
Inference service for ML model execution
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from uuid import UUID
import asyncio
import torch
import numpy as np
from datetime import datetime
import logging

from app.models.models import InferenceJob, JobStatus, MLModel
from app.schemas.schemas import AutoSegmentRequest, InteractiveSegmentRequest, PromptInput
from app.config import settings
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException

logger = logging.getLogger(__name__)


class InferenceService:
    """Service for ML model inference"""
    
    def __init__(self):
        self.model_cache: Dict[str, Any] = {}
        self.gpu_available = torch.cuda.is_available() if settings.ENABLE_GPU else False
        self.device = torch.device(f"cuda:{settings.GPU_DEVICE_ID}" if self.gpu_available else "cpu")
        logger.info(f"Inference service initialized. GPU available: {self.gpu_available}, Device: {self.device}")
    
    async def create_auto_segment_job(
        self,
        db: AsyncSession,
        request: AutoSegmentRequest,
        user_id: Optional[UUID] = None
    ) -> InferenceJob:
        """Create auto-segmentation job"""
        # Get model
        model = await self._get_model_by_name(db, request.model)
        if not model:
            raise AppException(message=f"Model '{request.model}' not found")
        
        # Create job
        job = InferenceJob(
            model_id=model.id,
            model_name=model.name,
            user_id=user_id,
            study_uid=request.study_uid,
            series_uid=request.series_uid,
            job_type="auto",
            input_params={
                "output_format": request.output_format.value,
                "preprocessing": request.preprocessing or {},
                "postprocessing": request.postprocessing or {},
                "save_to_annotation": request.save_to_annotation,
                "annotation_label": request.annotation_label,
            },
            status=JobStatus.PENDING,
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Queue job for processing (async)
        asyncio.create_task(self._process_job(job.id))
        
        return job
    
    async def create_interactive_segment_job(
        self,
        db: AsyncSession,
        request: InteractiveSegmentRequest,
        user_id: Optional[UUID] = None
    ) -> InferenceJob:
        """Create interactive segmentation job"""
        # Get model
        model = await self._get_model_by_name(db, request.model)
        if not model:
            raise AppException(message=f"Model '{request.model}' not found")
        
        # Create job
        job = InferenceJob(
            model_id=model.id,
            model_name=model.name,
            user_id=user_id,
            study_uid=request.study_uid,
            series_uid=request.series_uid,
            instance_uid=request.instance_uid,
            job_type="interactive",
            input_params={
                "prompts": [p.model_dump() for p in request.prompts],
                "output_format": request.output_format.value,
                "save_to_annotation": request.save_to_annotation,
                "annotation_label": request.annotation_label,
            },
            status=JobStatus.PENDING,
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Queue job for processing (async)
        asyncio.create_task(self._process_job(job.id))
        
        return job
    
    async def get_job(self, db: AsyncSession, job_id: UUID) -> Optional[InferenceJob]:
        """Get inference job by ID"""
        result = await db.execute(select(InferenceJob).where(InferenceJob.id == job_id))
        return result.scalar_one_or_none()
    
    async def get_job_status(self, db: AsyncSession, job_id: UUID) -> Dict[str, Any]:
        """Get job status"""
        job = await self.get_job(db, job_id)
        if not job:
            raise AppException(message="Job not found")
        
        return {
            "job_id": job.id,
            "status": job.status.value,
            "annotation_id": job.annotation_id,
            "output_path": job.output_path,
            "execution_time_seconds": job.execution_time_seconds,
            "error_message": job.error_message,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
        }
    
    async def cancel_job(self, db: AsyncSession, job_id: UUID) -> bool:
        """Cancel a pending or running job"""
        job = await self.get_job(db, job_id)
        if not job:
            raise AppException(message="Job not found")
        
        if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
            raise AppException(message=f"Job is already {job.status.value}")
        
        job.status = JobStatus.CANCELLED
        await db.commit()
        return True
    
    async def _process_job(self, job_id: UUID):
        """
        Process inference job (runs in background)
        This is a simplified version - full implementation would include:
        - GPU job queue management
        - Model loading/caching
        - DICOM image fetching
        - Actual inference
        - Result saving
        """
        # Get database session
        from shared.common.database import db_manager
        
        async with db_manager.async_session_maker() as db:
            job = await self.get_job(db, job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            try:
                # Update status to running
                job.status = JobStatus.RUNNING
                job.started_at = datetime.utcnow()
                await db.commit()
                
                # Placeholder for actual inference
                # In production, this would:
                # 1. Fetch DICOM images from DICOM service
                # 2. Load and cache ML model
                # 3. Preprocess images
                # 4. Run inference
                # 5. Postprocess results
                # 6. Save to Storage service
                # 7. Create annotation in Annotation service
                
                logger.info(f"Processing job {job_id} with model {job.model_name}")
                await asyncio.sleep(5)  # Simulate processing
                
                # Update job as completed
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                job.execution_time_seconds = (job.completed_at - job.started_at).total_seconds()
                job.output_path = f"/outputs/{job_id}.npy"
                
                await db.commit()
                logger.info(f"Job {job_id} completed successfully")
                
            except Exception as e:
                logger.error(f"Job {job_id} failed: {str(e)}")
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                await db.commit()
    
    async def _get_model_by_name(self, db: AsyncSession, name: str) -> Optional[MLModel]:
        """Get model by name"""
        result = await db.execute(
            select(MLModel)
            .where(MLModel.name == name)
            .where(MLModel.is_active == True)
        )
        return result.scalar_one_or_none()
    
    def _load_model(self, model: MLModel):
        """Load ML model into memory"""
        # Check cache
        if model.name in self.model_cache:
            logger.info(f"Model {model.name} loaded from cache")
            return self.model_cache[model.name]
        
        # Load model (simplified - actual implementation would load from storage)
        logger.info(f"Loading model {model.name} from {model.file_path}")
        
        # Placeholder - actual implementation would use MONAI, PyTorch, etc.
        model_instance = None  # Load actual model here
        
        # Cache model
        self.model_cache[model.name] = model_instance
        
        return model_instance
