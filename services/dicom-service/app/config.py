"""
DICOM Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "dicom-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8004
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@localhost:5432/dicom_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    
    # Orthanc Configuration
    ORTHANC_URL: str = "http://localhost:8042"
    ORTHANC_USERNAME: str = "admin"
    ORTHANC_PASSWORD: str = "admin123"
    ORTHANC_DICOM_PORT: int = 4242
    
    # Storage Service Configuration
    STORAGE_SERVICE_URL: str = "http://localhost:8009"
    
    # DICOM Configuration
    DICOM_AET: str = "TRAINING_PLATFORM"  # Application Entity Title
    DICOM_MAX_PDU_SIZE: int = 65536  # Maximum PDU size
    
    # File Upload Configuration
    MAX_DICOM_SIZE: int = 2 * 1024 * 1024 * 1024  # 2 GB
    TEMP_UPLOAD_DIR: str = "/tmp/dicom_uploads"
    
    # Processing Configuration
    AUTO_EXTRACT_METADATA: bool = True
    AUTO_SEND_TO_ORTHANC: bool = True
    AUTO_STORE_FILES: bool = True
    
    # Anonymization Configuration
    ENABLE_ANONYMIZATION: bool = False
    KEEP_PATIENT_ID: bool = True
    KEEP_STUDY_DATE: bool = True
    
    # Cache Configuration
    CACHE_METADATA_TTL: int = 3600  # 1 hour
    CACHE_THUMBNAILS_TTL: int = 7200  # 2 hours
    
    # Auth Service URL (for token verification)
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    
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
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()