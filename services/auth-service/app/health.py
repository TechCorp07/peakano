"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.common.database import get_db
from shared.common.redis_client import get_redis
from shared.common.rabbitmq_client import get_rabbitmq
from shared.common.responses import HealthResponse
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
        "redis": "unknown",
        "rabbitmq": "unknown",
        "keycloak": "unknown"
    }
    
    # Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        dependencies["database"] = "healthy"
    except Exception as e:
        dependencies["database"] = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis = get_redis()
        await redis.set("health_check", "ok", expiration=10)
        dependencies["redis"] = "healthy"
    except Exception as e:
        dependencies["redis"] = f"unhealthy: {str(e)}"
    
    # Check RabbitMQ
    try:
        rabbitmq = get_rabbitmq()
        if rabbitmq and rabbitmq.connection:
            dependencies["rabbitmq"] = "healthy"
        else:
            dependencies["rabbitmq"] = "unhealthy: not connected"
    except Exception as e:
        dependencies["rabbitmq"] = f"unhealthy: {str(e)}"
    
    # Check Keycloak
    if settings.KEYCLOAK_ENABLED:
        try:
            from app.services.keycloak_client import get_keycloak
            keycloak = get_keycloak()
            if keycloak:
                dependencies["keycloak"] = "healthy"
            else:
                dependencies["keycloak"] = "unhealthy: not initialized"
        except Exception as e:
            dependencies["keycloak"] = f"unhealthy: {str(e)}"
    else:
        dependencies["keycloak"] = "disabled"
    
    # Overall status
    all_healthy = all(
        status == "healthy" or status == "disabled" 
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

