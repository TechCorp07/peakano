"""
Database models for AI Service
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Enum as SQLEnum, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum


# Import shared base
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.models.base import Base


class ModelType(str, enum.Enum):
    """ML Model types"""
    SEGMENTATION = "segmentation"
    CLASSIFICATION = "classification"
    DETECTION = "detection"
    INTERACTIVE = "interactive"


class Framework(str, enum.Enum):
    """ML Frameworks"""
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    ONNX = "onnx"
    MONAI = "monai"


class JobStatus(str, enum.Enum):
    """Inference job statuses"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MLModel(Base):
    """ML Model metadata"""
    __tablename__ = "models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Model classification
    model_type = Column(SQLEnum(ModelType, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    framework = Column(SQLEnum(Framework, values_callable=lambda x: [e.value for e in x]), nullable=False)
    version = Column(String(50), nullable=False)
    
    # Medical context
    organ_system = Column(String(100), index=True)  # e.g., "liver", "lungs", "brain"
    modality = Column(String(50), index=True)  # e.g., "CT", "MRI", "X-ray"
    
    # File information
    file_path = Column(String(500), nullable=False)  # Path in Storage Service
    file_size_bytes = Column(Integer)
    checksum = Column(String(64))  # SHA256
    
    # Configuration
    input_shape = Column(JSON)  # e.g., [1, 1, 512, 512, 128]
    output_classes = Column(Integer)  # Number of output classes
    preprocessing_config = Column(JSON)  # Windowing, normalization, etc.
    postprocessing_config = Column(JSON)  # Smoothing, morphology, etc.
    
    # Performance metrics
    dice_score = Column(Float)  # Average Dice on validation set
    inference_time_ms = Column(Integer)  # Average inference time
    
    # Model metadata
    model_metadata = Column(JSON)  # Additional model-specific data
    
    # Status
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<MLModel {self.name} v{self.version}>"


class InferenceJob(Base):
    """Inference job tracking"""
    __tablename__ = "inference_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Model reference
    model_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    model_name = Column(String(255), nullable=False)
    
    # User context
    user_id = Column(UUID(as_uuid=True), index=True)
    
    # Input data
    study_uid = Column(String(100), nullable=False, index=True)
    series_uid = Column(String(100), index=True)
    instance_uid = Column(String(100), index=True)
    
    # Job configuration
    input_params = Column(JSON)  # Parameters passed to inference
    job_type = Column(String(50), default="auto")  # "auto" or "interactive"
    
    # Status
    status = Column(SQLEnum(JobStatus, values_callable=lambda x: [e.value for e in x]), default=JobStatus.PENDING, nullable=False, index=True)
    priority = Column(Integer, default=5)  # 1-10, higher = more priority
    
    # Results
    output_path = Column(String(500))  # Path to result in Storage Service
    output_format = Column(String(50))  # "rle", "mask", "dicom_seg"
    annotation_id = Column(UUID(as_uuid=True))  # Created annotation ID
    
    # Performance
    execution_time_seconds = Column(Float)
    gpu_memory_mb = Column(Integer)
    
    # Error handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    def __repr__(self):
        return f"<InferenceJob {self.id} - {self.status.value}>"