"""
Pydantic schemas for Metrics Service
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class MetricType(str, Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"


class ActivityCategory(str, Enum):
    AUTH = "auth"
    LEARNING = "learning"
    ANNOTATION = "annotation"
    ASSESSMENT = "assessment"
    SYSTEM = "system"


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Trend(str, Enum):
    INCREASING = "increasing"
    STABLE = "stable"
    DECREASING = "decreasing"


# System Metrics schemas
class SystemMetricCreate(BaseModel):
    """Create system metric"""
    service_name: str
    metric_name: str
    metric_type: MetricType
    value: float
    unit: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    hostname: Optional[str] = None
    environment: Optional[str] = "production"


class SystemMetricResponse(BaseModel):
    """System metric response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    time: datetime
    id: UUID
    service_name: str
    metric_name: str
    metric_type: str
    value: float
    unit: Optional[str]
    tags: Optional[Dict[str, Any]]


class SystemMetricsSummary(BaseModel):
    """Summary of system metrics"""
    service_name: str
    total_requests: int
    average_response_time_ms: float
    error_rate_percent: float
    uptime_percent: float
    last_updated: datetime


# User Activity schemas
class UserActivityCreate(BaseModel):
    """Create user activity record"""
    user_id: UUID
    activity_type: str
    activity_category: ActivityCategory
    duration_seconds: Optional[int] = None
    session_id: Optional[UUID] = None
    resource_id: Optional[UUID] = None
    resource_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    country: Optional[str] = None


class UserActivityResponse(BaseModel):
    """User activity response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    time: datetime
    id: UUID
    user_id: UUID
    activity_type: str
    activity_category: str
    duration_seconds: Optional[int]
    session_id: Optional[UUID]
    resource_id: Optional[UUID]
    resource_type: Optional[str]


class UsageSummary(BaseModel):
    """Usage analytics summary"""
    total_active_users: int
    total_sessions: int
    average_session_duration_minutes: float
    total_annotations_created: int
    total_assessments_taken: int
    total_courses_completed: int
    period_start: datetime
    period_end: datetime


# Course Analytics schemas
class CourseAnalyticsResponse(BaseModel):
    """Course analytics response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    course_id: UUID
    enrollment_count: int
    active_enrollment_count: int
    completion_count: int
    dropout_count: int
    average_score: Optional[float]
    median_score: Optional[float]
    pass_rate: Optional[float]
    average_completion_time_hours: Optional[float]
    median_completion_time_hours: Optional[float]
    average_time_spent_hours: Optional[float]
    total_time_spent_hours: Optional[float]
    average_sessions_per_user: Optional[float]
    total_assessments_taken: int
    average_attempts_per_assessment: Optional[float]
    enrollment_trend: Optional[str]
    completion_trend: Optional[str]
    score_trend: Optional[str]
    last_updated: datetime


class LearningAnalytics(BaseModel):
    """Learning analytics for a course"""
    course_id: UUID
    course_name: str
    total_students: int
    active_students: int
    completion_rate_percent: float
    average_progress_percent: float
    average_score: float
    pass_rate_percent: float
    average_time_to_complete_hours: float
    student_satisfaction_score: Optional[float]
    strengths: List[str]
    areas_for_improvement: List[str]


# Service Health schemas
class ServiceHealthResponse(BaseModel):
    """Service health response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    service_name: str
    status: str
    last_check_time: datetime
    response_time_ms: Optional[float]
    dependencies_status: Optional[Dict[str, str]]
    error_message: Optional[str]
    consecutive_failures: int
    uptime_percentage_24h: Optional[float]
    uptime_percentage_7d: Optional[float]
    uptime_percentage_30d: Optional[float]


class ServiceHealthSummary(BaseModel):
    """All services health summary"""
    healthy_services: int
    degraded_services: int
    down_services: int
    total_services: int
    services: List[ServiceHealthResponse]
    last_updated: datetime


# Alert schemas
class AlertCreate(BaseModel):
    """Create alert"""
    alert_type: str
    severity: AlertSeverity
    service_name: str
    metric_name: Optional[str] = None
    title: str
    description: str
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None


class AlertResponse(BaseModel):
    """Alert response"""
    model_config = {"protected_namespaces": (), "from_attributes": True}
    
    id: UUID
    alert_type: str
    severity: str
    service_name: str
    metric_name: Optional[str]
    title: str
    description: str
    current_value: Optional[float]
    threshold_value: Optional[float]
    status: str
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    triggered_at: datetime


class AlertList(BaseModel):
    """List of alerts"""
    alerts: List[AlertResponse]
    total: int
    active: int
    critical: int
    warnings: int


# Report schemas
class ReportRequest(BaseModel):
    """Report generation request"""
    report_type: str  # "system", "usage", "learning", "custom"
    start_date: datetime
    end_date: datetime
    services: Optional[List[str]] = None
    courses: Optional[List[UUID]] = None
    users: Optional[List[UUID]] = None
    format: str = "pdf"  # "pdf", "excel", "json"
    include_charts: bool = True


class ReportResponse(BaseModel):
    """Report response"""
    report_id: UUID
    report_type: str
    generated_at: datetime
    download_url: str
    expires_at: datetime


# Dashboard schemas
class DashboardWidget(BaseModel):
    """Dashboard widget configuration"""
    widget_id: str
    widget_type: str  # "metric", "chart", "table", "alert_list"
    title: str
    data_source: str
    configuration: Dict[str, Any]
    position: Dict[str, int]  # {"x": 0, "y": 0, "width": 6, "height": 4}


class DashboardCreate(BaseModel):
    """Create custom dashboard"""
    name: str
    description: Optional[str] = None
    widgets: List[DashboardWidget]
    refresh_interval_seconds: int = 30
    is_public: bool = False


class DashboardResponse(BaseModel):
    """Dashboard response"""
    id: UUID
    name: str
    description: Optional[str]
    widgets: List[DashboardWidget]
    refresh_interval_seconds: int
    is_public: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime


# Time Range schemas
class TimeRange(BaseModel):
    """Time range for queries"""
    start: datetime
    end: datetime
    granularity: str = "1h"  # "1m", "5m", "1h", "1d"


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
    timescaledb: str
    rabbitmq: str
    collection_active: bool
    hypertables_count: int
    total_metrics: int