"""
Notification Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "notification-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8008
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@localhost:5432/notification_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # RabbitMQ
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    RABBITMQ_QUEUE_NAME: str = "notifications"
    RABBITMQ_EXCHANGE_NAME: str = "notifications_exchange"
    
    # Email Configuration (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@peakpoint.africa"
    SMTP_FROM_NAME: str = "PeakPoint Training Platform"
    SMTP_USE_TLS: bool = True
    
    # SendGrid (alternative)
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = None
    
    # Africa's Talking SMS Configuration
    AFRICASTALKING_USERNAME: str = "sandbox"  # or your username
    AFRICASTALKING_API_KEY: str = ""
    AFRICASTALKING_SENDER_ID: str = "PeakPoint"
    AFRICASTALKING_ENVIRONMENT: str = "sandbox"  # or "production"
    
    # Firebase Cloud Messaging (Push Notifications)
    FCM_SERVER_KEY: Optional[str] = None
    FCM_PROJECT_ID: Optional[str] = None
    
    # Notification Configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY_SECONDS: int = 60
    BATCH_SIZE: int = 100
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Template Configuration
    TEMPLATE_DIR: str = "templates"
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: list = ["en", "sw", "zu", "af"]  # English, Swahili, Zulu, Afrikaans
    
    # Notification Types
    ENABLED_CHANNELS: list = ["email", "sms", "push"]
    
    # Service URLs
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    
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