"""
Configuration for Metrics Service
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Metrics Service Configuration"""
    
    # Service Info
    SERVICE_NAME: str = "metrics-service"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8011
    
    # TimescaleDB (PostgreSQL with time-series extension)
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@timescaledb:5433/metrics_db"
    
    # Redis (for real-time aggregation and caching)
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None
    
    # RabbitMQ (for event consumption)
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "admin"
    RABBITMQ_PASS: str = "admin123"
    RABBITMQ_EXCHANGE: str = "metrics_exchange"
    RABBITMQ_QUEUE: str = "metrics_queue"
    
    # Service URLs (for polling metrics)
    AUTH_SERVICE_URL: str = "http://auth-service:8001"
    STORAGE_SERVICE_URL: str = "http://storage-service:8009"
    DICOM_SERVICE_URL: str = "http://dicom-service:8004"
    ANNOTATION_SERVICE_URL: str = "http://annotation-service:8003"
    LMS_SERVICE_URL: str = "http://lms-service:8005"
    AI_SERVICE_URL: str = "http://ai-service:8006"
    EVALUATION_SERVICE_URL: str = "http://evaluation-service:8007"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8008"
    WEBSOCKET_SERVICE_URL: str = "http://websocket-service:8010"
    
    # Collection Configuration
    POLLING_INTERVAL_SECONDS: int = 60  # Poll services every minute
    EVENT_CONSUMPTION_ENABLED: bool = True
    PUSH_METRICS_ENABLED: bool = True
    
    # Data Retention
    RAW_DATA_RETENTION_DAYS: int = 30
    AGGREGATED_DATA_RETENTION_DAYS: int = 365
    
    # Aggregation Configuration
    ENABLE_REALTIME_AGGREGATION: bool = True
    AGGREGATION_INTERVAL_SECONDS: int = 300  # 5 minutes
    
    # Report Generation
    ENABLE_PDF_REPORTS: bool = True
    ENABLE_EXCEL_REPORTS: bool = True
    REPORT_CACHE_TTL: int = 3600  # 1 hour
    
    # Analytics Configuration
    MIN_DATA_POINTS_FOR_TREND: int = 5
    ANOMALY_DETECTION_ENABLED: bool = True
    ANOMALY_THRESHOLD_SIGMA: float = 3.0
    
    # Dashboard Configuration
    DASHBOARD_REFRESH_INTERVAL_SECONDS: int = 30
    MAX_DASHBOARD_WIDGETS: int = 20
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @field_validator('REDIS_URL', mode='before')
    @classmethod
    def build_redis_url(cls, v, info):
        """Build REDIS_URL from components if not provided"""
        if v:
            return v
        data = info.data
        host = data.get('REDIS_HOST', 'redis')
        port = data.get('REDIS_PORT', 6379)
        db = data.get('REDIS_DB', 0)
        return f"redis://{host}:{port}/{db}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()