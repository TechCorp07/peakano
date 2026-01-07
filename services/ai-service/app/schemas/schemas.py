"""
Pydantic schemas for AI Service
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class ModelTypeEnum(str, Enum):
    SEGMENTATION = "segmentation"
    CLASSIFICATION = "classification"
    DETECTION = "detection"
    INTERACTIVE = "interactive"


class FrameworkEnum(str, Enum):
    PYTORCH = "pytorch"
    TENSORFLOW = "tensorflow"
    ONNX = "onnx"
    MONAI = "monai"


class JobStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OutputFormatEnum(str, Enum):
    RLE = "rle"
    MASK = "mask"
    DICOM_SEG = "dicom_seg"


class PromptTypeEnum(str, Enum):
    POINT = "point"
    BOX = "box"
    MASK = "mask"


# Model schemas
class MLModelBase(BaseModel):
    """Base model schema"""
    model_config = {"protected_namespaces": ()}
    
    name: str = Field(..., description="Unique model identifier")
    display_name: str = Field(..., description="Human-readable name")
    description: Optional[str] = Field(None, description="Model description")
    model_type: ModelTypeEnum
    framework: FrameworkEnum
    version: str
    organ_system: Optional[str] = None
    modality: Optional[str] = None
    input_shape: Optional[List[int]] = None
    output_classes: Optional[int] = None
    preprocessing_config: Optional[Dict[str, Any]] = None
    postprocessing_config: Optional[Dict[str, Any]] = None
    dice_score: Optional[float] = None
    inference_time_ms: Optional[int] = None
    model_metadata: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_public: bool = False


class MLModelCreate(MLModelBase):
    """Create model request"""
    file_path: str = Field(..., description="Path in storage service")
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None


class MLModelUpdate(BaseModel):
    """Update model request"""
    model_config = {"protected_namespaces": ()}
    
    display_name: Optional[str] = None
    description: Optional[str] = None
    organ_system: Optional[str] = None
    modality: Optional[str] = None
    preprocessing_config: Optional[Dict[str, Any]] = None
    postprocessing_config: Optional[Dict[str, Any]] = None
    dice_score: Optional[float] = None
    inference_time_ms: Optional[int] = None
    model_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None


class MLModelResponse(MLModelBase):
    """Model response"""
    id: UUID
    file_path: str
    file_size_bytes: Optional[int]
    checksum: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MLModelList(BaseModel):
    """List of models"""
    models: List[MLModelResponse]
    total: int
    page: int
    page_size: int


# Inference schemas
class PromptInput(BaseModel):
    """Interactive segmentation prompt"""
    type: PromptTypeEnum
    x: Optional[int] = None
    y: Optional[int] = None
    label: Optional[int] = Field(None, description="1 for foreground, 0 for background")
    x1: Optional[int] = None
    y1: Optional[int] = None
    x2: Optional[int] = None
    y2: Optional[int] = None
    slice_index: Optional[int] = None
    
    @validator('x', 'y', 'x1', 'y1', 'x2', 'y2')
    def validate_coordinates(cls, v):
        if v is not None and v < 0:
            raise ValueError("Coordinates must be non-negative")
        return v


class AutoSegmentRequest(BaseModel):
    """Auto-segmentation request"""
    study_uid: str = Field(..., description="DICOM Study UID")
    series_uid: str = Field(..., description="DICOM Series UID")
    model: str = Field(..., description="Model name to use")
    output_format: OutputFormatEnum = OutputFormatEnum.RLE
    preprocessing: Optional[Dict[str, Any]] = None
    postprocessing: Optional[Dict[str, Any]] = None
    save_to_annotation: bool = True
    annotation_label: Optional[str] = "AI Generated"


class InteractiveSegmentRequest(BaseModel):
    """Interactive segmentation request"""
    study_uid: str = Field(..., description="DICOM Study UID")
    series_uid: str = Field(..., description="DICOM Series UID")
    instance_uid: Optional[str] = Field(None, description="DICOM Instance UID for 2D")
    model: str = Field(..., description="Model name (e.g., medsam2)")
    prompts: List[PromptInput] = Field(..., description="User prompts (points/boxes)")
    output_format: OutputFormatEnum = OutputFormatEnum.RLE
    save_to_annotation: bool = True
    annotation_label: Optional[str] = "AI Assisted"


class InferenceJobResponse(BaseModel):
    """Inference job response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    model_id: UUID
    model_name: str
    user_id: Optional[UUID]
    study_uid: str
    series_uid: Optional[str]
    instance_uid: Optional[str]
    status: JobStatusEnum
    priority: int
    output_path: Optional[str]
    output_format: Optional[str]
    annotation_id: Optional[UUID]
    execution_time_seconds: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class InferenceJobList(BaseModel):
    """List of inference jobs"""
    jobs: List[InferenceJobResponse]
    total: int
    page: int
    page_size: int


class InferenceResult(BaseModel):
    """Inference result"""
    job_id: UUID
    status: JobStatusEnum
    annotation_id: Optional[UUID] = None
    output_path: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# Health check
class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str
    service: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DetailedHealthResponse(HealthResponse):
    """Detailed health check"""
    database: str
    redis: str
    gpu_available: bool
    loaded_models: int
    pending_jobs: int