"""
Storage Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "storage-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8009
    
    # Database (for file metadata tracking)
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@localhost:5432/storage_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    
    # MinIO / S3 Configuration
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "admin"
    MINIO_SECRET_KEY: str = "admin123456"
    MINIO_SECURE: bool = False  # Use HTTPS
    MINIO_REGION: str = "us-east-1"
    
    # Storage Buckets
    BUCKET_DICOM: str = "dicom-files"
    BUCKET_ANNOTATIONS: str = "annotations"
    BUCKET_EXPORTS: str = "exports"
    BUCKET_AI_MODELS: str = "ai-models"
    BUCKET_CERTIFICATES: str = "certificates"
    BUCKET_TEMP: str = "temp-uploads"
    
    # File Upload Limits
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500 MB
    MAX_DICOM_SIZE: int = 2 * 1024 * 1024 * 1024  # 2 GB
    ALLOWED_EXTENSIONS: list = [".dcm", ".nii", ".nii.gz", ".json", ".zip", ".pdf", ".png", ".jpg"]
    
    # Presigned URL expiration (seconds)
    PRESIGNED_URL_EXPIRY: int = 3600  # 1 hour
    DOWNLOAD_URL_EXPIRY: int = 300  # 5 minutes
    
    # Auth Service URL (for token verification)
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    
    ENCRYPTION_ENABLED: bool = True
    ENCRYPTION_MASTER_KEY: str = "your-256-bit-key-base64-encoded"  # Change in production!

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