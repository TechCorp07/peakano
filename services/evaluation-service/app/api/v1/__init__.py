"""API v1 module"""
from fastapi import APIRouter
from .health import router as health_router
from .evaluate import router as evaluate_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include all sub-routers
router.include_router(health_router, prefix="/health", tags=["health"])
router.include_router(evaluate_router, tags=["evaluation"])

__all__ = ["router"]