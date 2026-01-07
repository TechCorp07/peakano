"""
WebSocket Service Configuration
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Service info
    SERVICE_NAME: str = "websocket-service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8010
    
    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_CONNECTION_TIMEOUT: int = 300  # 5 minutes
    WS_MAX_CONNECTIONS_PER_USER: int = 3
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PRESENCE_TTL: int = 60  # seconds
    REDIS_ROOM_TTL: int = 3600  # 1 hour
    
    # RabbitMQ (optional for scaling)
    RABBITMQ_URL: str = "amqp://admin:admin123@localhost:5672/"
    ENABLE_RABBITMQ: bool = False
    
    # Service URLs
    ANNOTATION_SERVICE_URL: str = "http://localhost:8003"
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    
    # Event Configuration
    BROADCAST_ANNOTATION_UPDATES: bool = True
    BROADCAST_CURSOR_UPDATES: bool = True
    BROADCAST_PRESENCE_UPDATES: bool = True
    
    # Rate Limiting
    MAX_MESSAGES_PER_SECOND: int = 10
    MAX_EVENTS_PER_MINUTE: int = 600
    
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