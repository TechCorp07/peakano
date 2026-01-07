"""
Inference endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.responses import success_response
from shared.common.exceptions import AppException

from app.services.inference_service import InferenceService
from app.schemas.schemas import (
    AutoSegmentRequest,
    InteractiveSegmentRequest,
    InferenceJobResponse,
    InferenceJobList,
    InferenceResult
)

router = APIRouter(prefix="/inference", tags=["inference"])

# Initialize inference service
inference_service = InferenceService()


@router.post("/segment/auto", response_model=InferenceJobResponse, status_code=202)
async def auto_segment(
    request: AutoSegmentRequest,
    db: AsyncSession = Depends(get_db),
    # user_id would come from auth middleware in production
):
    """
    Auto-segmentation inference
    Returns immediately with job ID. Poll /jobs/{job_id} for status.
    """
    try:
        job = await inference_service.create_auto_segment_job(db, request)
        return job
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.post("/segment/interactive", response_model=InferenceJobResponse, status_code=202)
async def interactive_segment(
    request: InteractiveSegmentRequest,
    db: AsyncSession = Depends(get_db),
    # user_id would come from auth middleware in production
):
    """
    Interactive segmentation with user prompts
    Returns immediately with job ID. Poll /jobs/{job_id} for status.
    """
    try:
        job = await inference_service.create_interactive_segment_job(db, request)
        return job
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/jobs/{job_id}", response_model=InferenceJobResponse)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get inference job by ID"""
    try:
        job = await inference_service.get_job(db, job_id)
        if not job:
            raise AppException(message="Job not found")
        return job
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/jobs/{job_id}/status", response_model=InferenceResult)
async def get_job_status(
    job_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get job status (lightweight)"""
    try:
        status = await inference_service.get_job_status(db, job_id)
        return InferenceResult(**status)
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending or running job"""
    try:
        await inference_service.cancel_job(db, job_id)
        return success_response(message="Job cancelled successfully")
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/jobs", response_model=InferenceJobList)
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    model_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List inference jobs with filters"""
    try:
        from sqlalchemy import select, func
        from app.models.models import InferenceJob, JobStatus
        
        query = select(InferenceJob)
        
        # Apply filters
        if status:
            query = query.where(InferenceJob.status == JobStatus(status))
        if model_name:
            query = query.where(InferenceJob.model_name == model_name)
        
        # Order by created_at desc
        query = query.order_by(InferenceJob.created_at.desc())
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        page = skip // limit + 1 if limit > 0 else 1
        
        return InferenceJobList(
            jobs=jobs,
            total=total,
            page=page,
            page_size=limit
        )
    except Exception as e:
        raise AppException(message=str(e))
