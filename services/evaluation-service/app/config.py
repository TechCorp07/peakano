"""
Configuration for Evaluation Service
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Evaluation Service Configuration"""
    
    # Service Info
    SERVICE_NAME: str = "evaluation-service"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8007
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@postgres:5434/evaluation_db"
    
    # Redis (for caching ground truth masks)
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None
    
    # Service URLs
    ANNOTATION_SERVICE_URL: str = "http://annotation-service:8003"
    LMS_SERVICE_URL: str = "http://lms-service:8005"
    WEBSOCKET_SERVICE_URL: str = "http://websocket-service:8010"
    
    # Evaluation Configuration
    CACHE_GROUND_TRUTH: bool = True
    GROUND_TRUTH_CACHE_TTL: int = 3600  # 1 hour
    MAX_CONCURRENT_EVALUATIONS: int = 10
    
    # Metric Thresholds
    DICE_EXCELLENT: float = 0.90
    DICE_GOOD: float = 0.80
    DICE_ACCEPTABLE: float = 0.70
    
    IOU_EXCELLENT: float = 0.85
    IOU_GOOD: float = 0.75
    IOU_ACCEPTABLE: float = 0.65
    
    HAUSDORFF_EXCELLENT: float = 3.0  # mm
    HAUSDORFF_GOOD: float = 5.0
    HAUSDORFF_ACCEPTABLE: float = 10.0
    
    # Feedback Configuration
    ENABLE_DETAILED_FEEDBACK: bool = True
    FEEDBACK_LANGUAGE: str = "en"  # "en", "fr", "sw" (Swahili for Africa)
    MAX_FEEDBACK_ITEMS: int = 10
    
    # Batch Evaluation
    MAX_BATCH_SIZE: int = 100
    BATCH_TIMEOUT_SECONDS: int = 300  # 5 minutes
    
    # Real-time Updates
    ENABLE_REALTIME_UPDATES: bool = True
    UPDATE_INTERVAL_MS: int = 500  # milliseconds
    
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