"""
Health check endpoints for WebSocket Service
"""
from fastapi import APIRouter
from shared.common.responses import HealthResponse
from app.services.connection_manager import get_connection_manager
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
async def detailed_health_check():
    """Detailed health check with dependency status"""
    dependencies = {
        "connection_manager": "unknown",
        "redis": "unknown"
    }
    
    # Check Connection Manager
    try:
        manager = get_connection_manager()
        stats = manager.get_stats()
        dependencies["connection_manager"] = "healthy"
    except Exception as e:
        dependencies["connection_manager"] = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        from shared.common.redis_client import get_redis
        redis = get_redis()
        await redis.ping()
        dependencies["redis"] = "healthy"
    except Exception as e:
        dependencies["redis"] = f"unhealthy: {str(e)}"
    
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