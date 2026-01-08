"""
Notification Service Main Application
Medical Imaging Annotation Training Platform
"""
import logging
import asyncio
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
from app.api.v1 import notification, health
from shared.auth.middleware import AuthMiddleware
from shared.common.database import init_postgres
from shared.common.redis_client import init_redis
from shared.common.rabbitmq_client import init_rabbitmq
from app.services.email_provider import init_email_provider
from app.services.sms_provider import init_sms_provider
from app.services.push_provider import init_push_provider
from app.services.template_engine import init_template_engine
from app.services.notification_processor import init_notification_processor, get_notification_processor
from shared.common.exceptions import AppException

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    
    # Initialize PostgreSQL
    init_postgres(settings.DATABASE_URL)
    logger.info("PostgreSQL initialized")
    
    # Initialize Redis
    init_redis(settings.REDIS_URL)
    logger.info("Redis initialized")
    
    # Initialize RabbitMQ
    await init_rabbitmq(settings.RABBITMQ_URL)
    logger.info("RabbitMQ initialized")
    
    # Initialize Email Provider
    init_email_provider(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.SMTP_FROM_EMAIL,
        from_name=settings.SMTP_FROM_NAME,
        use_tls=settings.SMTP_USE_TLS,
        sendgrid_api_key=settings.SENDGRID_API_KEY
    )
    logger.info("Email provider initialized")
    
    # Initialize SMS Provider (Africa's Talking)
    if settings.AFRICASTALKING_API_KEY:
        init_sms_provider(
            username=settings.AFRICASTALKING_USERNAME,
            api_key=settings.AFRICASTALKING_API_KEY,
            sender_id=settings.AFRICASTALKING_SENDER_ID,
            environment=settings.AFRICASTALKING_ENVIRONMENT
        )
        logger.info("SMS provider (Africa's Talking) initialized")
    else:
        logger.warning("SMS provider not initialized: No Africa's Talking API key")
    
    # Initialize Push Provider (FCM)
    if settings.FCM_SERVER_KEY:
        init_push_provider(
            server_key=settings.FCM_SERVER_KEY,
            project_id=settings.FCM_PROJECT_ID
        )
        logger.info("Push provider (FCM) initialized")
    else:
        logger.warning("Push provider not initialized: No FCM server key")
    
    # Initialize Template Engine
    init_template_engine()
    logger.info("Template engine initialized")
    
    # Initialize Notification Processor
    init_notification_processor()
    logger.info("Notification processor initialized")
    
    # Start notification worker in background
    processor = get_notification_processor()
    worker_task = asyncio.create_task(processor.start_worker())
    logger.info("Notification worker started")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully")
    
    yield
    
    # Cleanup on shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}")
    processor.stop_worker()
    worker_task.cancel()


# Create FastAPI app
app = FastAPI(
    title="Medical Imaging Notification Service",
    description="Notification Service with Email, SMS (Africa's Talking), and Push",
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
app.include_router(notification.router, prefix="/api/v1/notification", tags=["Notification"])


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