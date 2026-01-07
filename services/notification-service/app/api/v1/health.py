"""
Health check endpoints for Notification Service
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.common.database import get_db
from shared.common.responses import HealthResponse
from app.services.email_provider import get_email_provider
from app.services.sms_provider import get_sms_provider
from app.config import settings
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=HealthResponse)
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
        "email_provider": "unknown",
        "sms_provider": "unknown"
    }
    
    # Check PostgreSQL
    try:
        await db.execute("SELECT 1")
        dependencies["database"] = "healthy"
    except Exception as e:
        dependencies["database"] = f"unhealthy: {str(e)}"
    
    # Check Email Provider
    try:
        email_provider = get_email_provider()
        dependencies["email_provider"] = "healthy"
    except Exception as e:
        dependencies["email_provider"] = f"unhealthy: {str(e)}"
    
    # Check SMS Provider
    try:
        sms_provider = get_sms_provider()
        dependencies["sms_provider"] = "healthy"
    except Exception as e:
        dependencies["sms_provider"] = f"unhealthy: {str(e)}"
    
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