"""
Metrics Service - System Monitoring & Analytics
FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from shared.common.database import init_postgres
from shared.common.redis_client import init_redis, get_redis
from shared.common.exceptions import AppException

from app.config import settings
from app.api.v1 import router as v1_router
from app.services.metrics_collection_service import MetricsCollectionService

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Background task for metrics collection
collection_task = None


async def collect_metrics_periodically():
    """Background task to collect metrics from all services"""
    logger.info("Starting periodic metrics collection")
    while True:
        try:
            await MetricsCollectionService.collect_from_services()
            logger.debug("Metrics collection completed")
        except Exception as e:
            logger.error(f"Error in metrics collection: {str(e)}")
        
        # Wait for next collection interval
        await asyncio.sleep(settings.POLLING_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management"""
    global collection_task
    
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    
    # Initialize database
    init_postgres(settings.DATABASE_URL)
    logger.info("TimescaleDB initialized")
    
    # Initialize Redis
    init_redis(settings.REDIS_URL)
    logger.info("Redis initialized")
    
    # Start background metrics collection
    if settings.POLLING_INTERVAL_SECONDS > 0:
        collection_task = asyncio.create_task(collect_metrics_periodically())
        logger.info(f"Background metrics collection started (interval: {settings.POLLING_INTERVAL_SECONDS}s)")
    
    logger.info(f"{settings.SERVICE_NAME} started successfully on {settings.HOST}:{settings.PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Metrics Service...")
    
    # Cancel background task
    if collection_task:
        collection_task.cancel()
        try:
            await collection_task
        except asyncio.CancelledError:
            logger.info("Background collection task cancelled")
    
    redis_client = get_redis()
    if redis_client:
        await redis_client.close()
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Metrics Service",
    description="System Monitoring, Analytics & Reporting for Medical Imaging Platform",
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
        "docs": "/docs",
        "features": {
            "system_metrics": "Collect and analyze system-wide metrics",
            "usage_analytics": "Track user activity and engagement",
            "learning_analytics": "Analyze course performance and progress",
            "report_generation": "Generate PDF/Excel reports",
            "real_time_monitoring": "Live metrics and alerts",
            "timescaledb": "Time-series data optimization"
        }
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