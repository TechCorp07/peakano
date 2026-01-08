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
    
    # Check TimescaleDB
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
    
    # Check TimescaleDB extension
    try:
        result = await db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'timescaledb'"))
        timescaledb_installed = result.scalar_one_or_none() is not None
        timescaledb_status = "healthy" if timescaledb_installed else "extension not installed"
    except Exception as e:
        timescaledb_status = f"unhealthy: {str(e)}"
    
    # Check RabbitMQ (placeholder)
    rabbitmq_status = "healthy"
    
    # Count hypertables
    try:
        hypertables_result = await db.execute(
            text("SELECT COUNT(*) FROM timescaledb_information.hypertables")
        )
        hypertables_count = hypertables_result.scalar() or 0
    except Exception:
        hypertables_count = 0
    
    # Count total metrics (placeholder)
    total_metrics = 0
    
    # Check if collection is active
    collection_active = settings.POLLING_INTERVAL_SECONDS > 0
    
    return DetailedHealthResponse(
        status="healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        version=settings.VERSION,
        service=settings.SERVICE_NAME,
        database=db_status,
        redis=redis_status,
        timescaledb=timescaledb_status,
        rabbitmq=rabbitmq_status,
        collection_active=collection_active,
        hypertables_count=hypertables_count,
        total_metrics=total_metrics
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