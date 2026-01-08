"""API v1 module"""
from fastapi import APIRouter
from .health import router as health_router
from .metrics import router as metrics_router
from .analytics import router as analytics_router
from .reports import router as reports_router

# Create main v1 router
router = APIRouter(prefix="/v1")

# Include all sub-routers
router.include_router(health_router, prefix="/health", tags=["health"])
router.include_router(metrics_router, tags=["metrics"])
router.include_router(analytics_router, tags=["analytics"])
router.include_router(reports_router, tags=["reports"])

__all__ = ["router"]