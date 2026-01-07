"""
LMS Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "lms-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8005
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@localhost:5432/lms_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    
    # Service URLs
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    STORAGE_SERVICE_URL: str = "http://localhost:8009"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8008"
    ANNOTATION_SERVICE_URL: str = "http://localhost:8003"
    
    # Course Configuration
    DEFAULT_PASSING_SCORE: int = 70  # percentage
    MAX_ASSESSMENT_ATTEMPTS: int = 3
    CERTIFICATE_VALIDITY_DAYS: int = 365
    
    # Progress Tracking
    LESSON_COMPLETION_THRESHOLD: int = 80  # % of content viewed
    VIDEO_COMPLETION_THRESHOLD: int = 90  # % of video watched
    ASSESSMENT_COMPLETION_THRESHOLD: int = 70  # passing score
    
    # Content Configuration
    MAX_COURSE_DURATION_DAYS: int = 365
    DEFAULT_LESSON_DURATION: int = 30  # minutes
    MAX_FILE_SIZE_MB: int = 500
    
    # Enrollment Configuration
    AUTO_ENROLL_ENABLED: bool = False
    REQUIRE_APPROVAL: bool = False
    MAX_ENROLLMENTS_PER_USER: int = 10
    
    # Assessment Configuration
    RANDOMIZE_QUESTIONS: bool = True
    SHOW_CORRECT_ANSWERS: bool = True
    ALLOW_REVIEW_AFTER_COMPLETION: bool = True
    
    # Certification Configuration
    ENABLE_CERTIFICATES: bool = True
    CERTIFICATE_TEMPLATE_PATH: str = "templates/certificate.html"
    
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