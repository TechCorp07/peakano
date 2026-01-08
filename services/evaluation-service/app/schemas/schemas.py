"""
Pydantic schemas for Evaluation Service
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class QualityLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"


class MetricType(str, Enum):
    DICE = "dice"
    IOU = "iou"
    HAUSDORFF = "hausdorff"
    SURFACE_DISTANCE = "surface_distance"
    VOLUME_DIFFERENCE = "volume_difference"
    CENTROID_DISTANCE = "centroid_distance"


# Evaluation Request schemas
class EvaluateRequest(BaseModel):
    """Single annotation evaluation request"""
    annotation_id: UUID = Field(..., description="Annotation to evaluate")
    ground_truth_id: UUID = Field(..., description="Ground truth annotation")
    metrics: List[MetricType] = Field(default=[MetricType.DICE, MetricType.IOU, MetricType.HAUSDORFF])
    generate_feedback: bool = True
    user_id: Optional[UUID] = None
    case_id: Optional[UUID] = None
    assessment_id: Optional[UUID] = None


class BatchEvaluateRequest(BaseModel):
    """Batch evaluation request"""
    evaluations: List[EvaluateRequest] = Field(..., description="List of evaluations")
    assessment_id: Optional[UUID] = None
    parallel: bool = True


# Metrics schemas
class MetricScores(BaseModel):
    """Individual metric scores"""
    dice_score: Optional[float] = None
    iou_score: Optional[float] = None
    hausdorff_distance: Optional[float] = None
    hausdorff_95: Optional[float] = None
    surface_distance_mean: Optional[float] = None
    surface_distance_rms: Optional[float] = None
    volume_difference: Optional[float] = None
    centroid_distance: Optional[float] = None
    sensitivity: Optional[float] = None
    specificity: Optional[float] = None
    precision: Optional[float] = None


class FeedbackItem(BaseModel):
    """Individual feedback item"""
    type: str = Field(..., description="Type: 'issue' or 'suggestion'")
    category: str = Field(..., description="Category: 'boundary', 'completeness', 'smoothness', 'anatomical'")
    message: str
    severity: str = Field(..., description="Severity: 'critical', 'major', 'minor'")
    region: Optional[Dict[str, Any]] = None  # Specific region coordinates


class FeedbackResponse(BaseModel):
    """Feedback for annotation"""
    overall: str = Field(..., description="Overall assessment")
    quality_level: QualityLevel
    issues: List[FeedbackItem] = Field(default_factory=list)
    suggestions: List[FeedbackItem] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)


# Evaluation Response schemas
class EvaluationResultResponse(BaseModel):
    """Evaluation result response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    annotation_id: UUID
    ground_truth_id: UUID
    user_id: Optional[UUID]
    case_id: Optional[UUID]
    assessment_id: Optional[UUID]
    
    # Metrics
    dice_score: Optional[float]
    iou_score: Optional[float]
    hausdorff_distance: Optional[float]
    hausdorff_95: Optional[float]
    surface_distance_mean: Optional[float]
    surface_distance_rms: Optional[float]
    volume_difference: Optional[float]
    centroid_distance: Optional[float]
    sensitivity: Optional[float]
    specificity: Optional[float]
    precision: Optional[float]
    
    # Quality
    overall_quality: Optional[str]
    pass_threshold: Optional[bool]
    
    # Feedback
    feedback_text: Optional[str]
    feedback_items: Optional[Dict[str, Any]]
    error_regions: Optional[Dict[str, Any]]
    
    # Performance
    evaluation_time_ms: Optional[int]
    
    # Timestamp
    created_at: datetime


class EvaluationResponse(BaseModel):
    """Combined evaluation response with metrics and feedback"""
    result_id: UUID
    annotation_id: UUID
    ground_truth_id: UUID
    
    metrics: MetricScores
    feedback: FeedbackResponse
    
    overall_quality: QualityLevel
    pass_threshold: bool
    evaluation_time_ms: int
    created_at: datetime


class BatchEvaluationResponse(BaseModel):
    """Batch evaluation response"""
    assessment_id: Optional[UUID]
    total_evaluations: int
    successful: int
    failed: int
    results: List[EvaluationResponse]
    total_time_seconds: float


# Session schemas
class EvaluationSessionResponse(BaseModel):
    """Evaluation session response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    user_id: UUID
    case_id: UUID
    session_start: datetime
    session_end: Optional[datetime]
    attempts: int
    best_score: Optional[float]
    latest_score: Optional[float]
    total_time_seconds: Optional[int]
    average_time_per_attempt: Optional[int]
    improvement_rate: Optional[float]
    learning_curve_data: Optional[Dict[str, Any]]
    is_complete: bool
    passed: bool
    created_at: datetime
    updated_at: datetime


class SessionSummary(BaseModel):
    """Session summary for analytics"""
    user_id: UUID
    total_sessions: int
    total_attempts: int
    average_best_score: float
    total_time_hours: float
    pass_rate: float
    improvement_trend: str  # "improving", "stable", "declining"


# Comparison schemas
class ComparisonRequest(BaseModel):
    """Compare multiple annotations"""
    annotation_ids: List[UUID] = Field(..., min_length=2, max_length=10)
    ground_truth_id: UUID
    metric: MetricType = MetricType.DICE


class ComparisonResult(BaseModel):
    """Comparison result for one annotation"""
    annotation_id: UUID
    score: float
    rank: int
    percentile: float


class ComparisonResponse(BaseModel):
    """Comparison response"""
    ground_truth_id: UUID
    metric: MetricType
    results: List[ComparisonResult]
    best_annotation_id: UUID
    worst_annotation_id: UUID
    mean_score: float
    std_deviation: float


# Real-time update schemas
class RealTimeMetrics(BaseModel):
    """Real-time metrics update"""
    annotation_id: UUID
    current_dice: float
    current_iou: float
    progress_percent: float
    estimated_quality: QualityLevel
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Health check schemas
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
    annotation_service: str
    active_evaluations: int
    cached_ground_truths: int