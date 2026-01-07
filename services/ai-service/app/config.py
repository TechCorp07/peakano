"""
Configuration for AI Service
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import Optional, Union


class Settings(BaseSettings):
    """AI Service Configuration"""
    
    # Service Info
    SERVICE_NAME: str = "ai-service"
    VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8006
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://admin:admin123@postgres:5434/ai_db"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None
    
    # RabbitMQ (for job queue)
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "admin"
    RABBITMQ_PASS: str = "admin123"
    RABBITMQ_QUEUE: str = "ai_inference_jobs"
    
    # Storage Service
    STORAGE_SERVICE_URL: str = "http://storage-service:8009"
    MODEL_BUCKET: str = "models"
    
    # DICOM Service
    DICOM_SERVICE_URL: str = "http://dicom-service:8004"
    
    # Annotation Service
    ANNOTATION_SERVICE_URL: str = "http://annotation-service:8003"
    
    # Model Configuration
    MODEL_CACHE_DIR: str = "/tmp/model_cache"
    MAX_MODEL_CACHE_SIZE_GB: int = 20
    MODEL_IDLE_TIMEOUT_SECONDS: int = 300  # Unload after 5 minutes
    
    # GPU Configuration
    ENABLE_GPU: bool = True
    GPU_DEVICE_ID: int = 0
    MAX_CONCURRENT_GPU_JOBS: int = 2
    
    # Inference Configuration
    DEFAULT_INFERENCE_TIMEOUT: int = 600  # 10 minutes
    MAX_BATCH_SIZE: int = 4
    
    # Preprocessing
    DEFAULT_SPACING: Union[list, str] = [1.0, 1.0, 1.0]  # mm
    DEFAULT_WINDOW_CENTER: int = 40
    DEFAULT_WINDOW_WIDTH: int = 400
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @field_validator('DEFAULT_SPACING', mode='before')
    @classmethod
    def parse_spacing(cls, v):
        """Parse DEFAULT_SPACING from comma-separated string or list"""
        if isinstance(v, str):
            # Handle comma-separated format: "1.0,1.0,1.0"
            return [float(x.strip()) for x in v.split(',')]
        elif isinstance(v, list):
            # Already a list, ensure floats
            return [float(x) for x in v]
        return v
    
    @field_validator('REDIS_URL', mode='before')
    @classmethod
    def build_redis_url(cls, v, info):
        """Build REDIS_URL from components if not provided"""
        if v:
            return v
        # Access other field values from info.data
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