"""
Storage Service Main Application
Medical Imaging Annotation Training Platform
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import sys
import os

# Add project root to system path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.config import settings
from app.api.v1 import storage, health
from shared.auth.middleware import AuthMiddleware
from shared.common.encryption import init_file_encryption
from shared.common.database import init_postgres
from shared.common.redis_client import init_redis
from shared.common.rabbitmq_client import init_rabbitmq
from app.services.minio_client import init_minio
from shared.common.exceptions import AppException

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
init_file_encryption(settings.ENCRYPTION_MASTER_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    
    # Initialize databases
    init_postgres(settings.DATABASE_URL)
    logger.info("PostgreSQL initialized")
    
    # Initialize Redis
    init_redis(settings.REDIS_URL)
    logger.info("Redis initialized")
    
    # Initialize RabbitMQ
    await init_rabbitmq(settings.RABBITMQ_URL)
    logger.info("RabbitMQ initialized")
    
    # Initialize MinIO and create buckets
    buckets = [
        settings.BUCKET_DICOM,
        settings.BUCKET_ANNOTATIONS,
        settings.BUCKET_EXPORTS,
        settings.BUCKET_AI_MODELS,
        settings.BUCKET_CERTIFICATES,
        settings.BUCKET_TEMP,
    ]
    
    init_minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
        region=settings.MINIO_REGION,
        buckets=buckets
    )
    logger.info("MinIO initialized with buckets")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully")
    
    yield
    
    # Cleanup on shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}")


# Create FastAPI app
app = FastAPI(
    title="Medical Imaging Storage Service",
    description="File Storage Service with MinIO/S3 Integration",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
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
    """Handle custom app exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "details": str(exc) if settings.DEBUG else None
        }
    )


# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(storage.router, prefix="/api/v1/storage", tags=["Storage"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
