"""
AI Service - ML Model Inference
FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys

import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from shared.auth.middleware import AuthMiddleware
from shared.common.database import init_postgres, db_manager
from shared.common.redis_client import init_redis, redis_client
from shared.common.exceptions import AppException

from app.config import settings
from app.api.v1 import router as v1_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    
    # Initialize database
    init_postgres(settings.DATABASE_URL)
    logger.info("Database initialized")
    
    # Initialize Redis
    init_redis(settings.REDIS_URL)
    logger.info("Redis initialized")
    
    # Check GPU availability
    if settings.ENABLE_GPU:
        import torch
        gpu_available = torch.cuda.is_available()
        logger.info(f"GPU Support: {'Enabled' if gpu_available else 'Disabled (no GPU found)'}")
        if gpu_available:
            logger.info(f"GPU Device: {torch.cuda.get_device_name(settings.GPU_DEVICE_ID)}")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully on {settings.HOST}:{settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Service...")
    if redis_client:
        await redis_client.close()
    if db_manager:
        await db_manager.close()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="AI Service",
    description="ML Model Inference for Medical Imaging",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication middleware
app.add_middleware(
    AuthMiddleware,
    auth_service_url=settings.AUTH_SERVICE_URL,
    secret_key=settings.JWT_SECRET_KEY,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc"]
)

# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(v1_router, prefix="/api")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )