"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.redis_client import get_redis

from app.config import settings
from app.schemas.schemas import HealthResponse, DetailedHealthResponse
import torch

router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Basic health check"""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        service=settings.SERVICE_NAME
    )


@router.get("/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with dependency status"""
    
    # Check database
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis = get_redis()
        await redis.set("health_check", "ok", expiration=10)
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    # Check GPU
    gpu_available = torch.cuda.is_available() if settings.ENABLE_GPU else False
    
    # Count loaded models (would check actual cache in production)
    loaded_models = 0
    
    # Count pending jobs
    pending_jobs = 0
    
    return DetailedHealthResponse(
        status="healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        version=settings.VERSION,
        service=settings.SERVICE_NAME,
        database=db_status,
        redis=redis_status,
        gpu_available=gpu_available,
        loaded_models=loaded_models,
        pending_jobs=pending_jobs
    )


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Kubernetes readiness probe"""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "error": str(e)}


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}