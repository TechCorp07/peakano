"""
Pydantic schemas for Annotation Service
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class ProjectStatus(str, Enum):
    """Project status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CaseStatus(str, Enum):
    """Case status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    REJECTED = "rejected"


class SessionStatus(str, Enum):
    """Session status"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class AnnotationType(str, Enum):
    """Annotation type"""
    POLYGON = "polygon"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"
    ELLIPSE = "ellipse"
    FREEHAND = "freehand"
    BRUSH = "brush"
    POINT = "point"
    LINE = "line"
    ANGLE = "angle"
    ARROW = "arrow"


class AnnotationStatus(str, Enum):
    """Annotation status"""
    DRAFT = "draft"
    ACTIVE = "active"
    DELETED = "deleted"


# Project Schemas
class ProjectCreate(BaseModel):
    """Project creation request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    organ_system: Optional[str] = None
    modality: Optional[str] = None
    annotation_types: Optional[List[str]] = None
    labels: Optional[List[Dict[str, Any]]] = None
    guidelines: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Project update request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    annotation_types: Optional[List[str]] = None
    labels: Optional[List[Dict[str, Any]]] = None
    guidelines: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project response"""
    id: str
    name: str
    description: Optional[str]
    organ_system: Optional[str]
    modality: Optional[str]
    status: str
    annotation_types: Optional[List[str]]
    labels: Optional[List[Dict[str, Any]]]
    guidelines: Optional[str]
    total_cases: int
    completed_cases: int
    total_annotations: int
    created_by: str
    organization_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    """Project list response"""
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Case Schemas
class CaseCreate(BaseModel):
    """Case creation request"""
    project_id: str
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    study_uid: str
    series_uid: Optional[str] = None
    has_ground_truth: bool = False
    ground_truth_annotation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CaseUpdate(BaseModel):
    """Case update request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    assigned_to: Optional[str] = None
    review_comments: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CaseResponse(BaseModel):
    """Case response"""
    id: str
    project_id: str
    name: str
    description: Optional[str]
    study_uid: str
    series_uid: Optional[str]
    status: str
    assigned_to: Optional[str]
    assigned_at: Optional[datetime]
    completed_by: Optional[str]
    completed_at: Optional[datetime]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_comments: Optional[str]
    has_ground_truth: bool
    ground_truth_annotation_id: Optional[str]
    dice_score: Optional[int]
    iou_score: Optional[int]
    total_annotations: int
    total_sessions: int
    time_spent_seconds: int
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class CaseListResponse(BaseModel):
    """Case list response"""
    cases: List[CaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Session Schemas
class SessionStartRequest(BaseModel):
    """Session start request"""
    case_id: str


class SessionResponse(BaseModel):
    """Session response"""
    id: str
    case_id: str
    user_id: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    time_spent_seconds: int
    annotation_count: int
    metadata: Optional[Dict[str, Any]]


# Annotation Schemas
class AnnotationPoint(BaseModel):
    """2D point"""
    x: float
    y: float
    z: Optional[float] = None  # For 3D annotations


class AnnotationData(BaseModel):
    """Annotation data structure"""
    type: AnnotationType
    points: Optional[List[AnnotationPoint]] = None  # For polygon, line, etc.
    center: Optional[AnnotationPoint] = None  # For circle, ellipse
    radius: Optional[float] = None  # For circle
    radiusX: Optional[float] = None  # For ellipse
    radiusY: Optional[float] = None  # For ellipse
    width: Optional[float] = None  # For rectangle
    height: Optional[float] = None  # For rectangle
    mask_rle: Optional[str] = None  # Run-length encoded mask for brush
    properties: Optional[Dict[str, Any]] = None  # Additional properties


class AnnotationCreate(BaseModel):
    """Annotation creation request"""
    session_id: str
    case_id: str
    instance_uid: Optional[str] = None  # DICOM instance
    slice_index: Optional[int] = None  # For multi-slice
    label: str
    data: AnnotationData
    metadata: Optional[Dict[str, Any]] = None


class AnnotationUpdate(BaseModel):
    """Annotation update request"""
    label: Optional[str] = None
    data: Optional[AnnotationData] = None
    status: Optional[AnnotationStatus] = None
    metadata: Optional[Dict[str, Any]] = None


class AnnotationResponse(BaseModel):
    """Annotation response"""
    id: str
    session_id: str
    case_id: str
    user_id: str
    instance_uid: Optional[str]
    slice_index: Optional[int]
    label: str
    data: AnnotationData
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]]


class AnnotationListResponse(BaseModel):
    """Annotation list response"""
    annotations: List[AnnotationResponse]
    total: int


# Export Schemas
class ExportFormat(str, Enum):
    """Export format"""
    JSON = "json"
    COCO = "coco"
    DICOM_SEG = "dicom_seg"


class ExportRequest(BaseModel):
    """Export request"""
    session_id: Optional[str] = None
    case_id: Optional[str] = None
    format: ExportFormat = ExportFormat.JSON
    include_metadata: bool = True


class ExportResponse(BaseModel):
    """Export response"""
    success: bool
    file_url: Optional[str]
    file_id: Optional[str]
    format: str
    total_annotations: int
    message: str


# Statistics Schemas
class AnnotationStatisticsResponse(BaseModel):
    """Annotation statistics"""
    total_projects: int
    total_cases: int
    total_sessions: int
    total_annotations: int
    annotations_by_type: Dict[str, int]
    annotations_by_label: Dict[str, int]
    average_dice_score: Optional[float]
    average_iou_score: Optional[float]