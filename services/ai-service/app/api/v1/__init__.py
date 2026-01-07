"""API v1 module"""
from fastapi import APIRouter
from .health import router as health_router
from .models import router as models_router
from .inference import router as inference_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include all sub-routers
router.include_router(health_router, prefix="/health", tags=["health"])
router.include_router(models_router, tags=["models"])
router.include_router(inference_router, tags=["inference"])

__all__ = ["router"]