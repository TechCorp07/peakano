"""
Annotation Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "annotation-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8003
    
    # PostgreSQL (for projects/cases metadata)
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@localhost:5432/annotation_db"
    
    # MongoDB (for annotation data)
    MONGODB_URL: str = "mongodb://admin:admin123@localhost:27017"
    MONGODB_DB_NAME: str = "annotations"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    
    # Service URLs
    DICOM_SERVICE_URL: str = "http://localhost:8004"
    STORAGE_SERVICE_URL: str = "http://localhost:8009"
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    
    # Annotation Configuration
    MAX_ANNOTATIONS_PER_SESSION: int = 1000
    AUTO_SAVE_INTERVAL: int = 30  # seconds
    SESSION_TIMEOUT: int = 3600  # 1 hour
    
    # Version Control
    MAX_VERSION_HISTORY: int = 100
    ENABLE_VERSION_CONTROL: bool = True
    
    # Export Configuration
    SUPPORTED_EXPORT_FORMATS: list = ["json", "coco", "dicom_seg"]
    EXPORT_COMPRESSION: bool = True
    
    # Annotation Types
    SUPPORTED_ANNOTATION_TYPES: list = [
        "polygon",
        "rectangle", 
        "circle",
        "ellipse",
        "freehand",
        "brush",
        "point",
        "line",
        "angle",
        "arrow"
    ]
    
    # Quality Thresholds
    MIN_DICE_SCORE: float = 0.70
    MIN_IOU_SCORE: float = 0.50
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()