"""
Health check endpoints for Storage Service
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from shared.common.database import get_db
from shared.common.responses import HealthResponse
from app.services.minio_client import get_minio
from app.config import settings
from datetime import datetime

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check():
    """Basic health check"""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        service=settings.SERVICE_NAME
    )


@router.get("/detailed", response_model=HealthResponse)
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with dependency status"""
    dependencies = {
        "database": "unknown",
        "minio": "unknown"
    }
    
    # Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        dependencies["database"] = "healthy"
    except Exception as e:
        dependencies["database"] = f"unhealthy: {str(e)}"
    
    # Check MinIO
    try:
        minio = get_minio()
        # Try to list buckets to verify connection
        if minio.client.bucket_exists(settings.BUCKET_TEMP):
            dependencies["minio"] = "healthy"
        else:
            dependencies["minio"] = "unhealthy: bucket not found"
    except Exception as e:
        dependencies["minio"] = f"unhealthy: {str(e)}"
    
    # Overall status
    all_healthy = all(
        status == "healthy" 
        for status in dependencies.values()
    )
    
    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        version=settings.VERSION,
        service=settings.SERVICE_NAME,
        dependencies=dependencies
    )


@router.get("/readiness")
async def readiness_check():
    """Kubernetes readiness probe"""
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}


@router.get("/liveness")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}