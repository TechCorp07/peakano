"""
Database models for Metrics Service
Using TimescaleDB for time-series data
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, Float, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import os
import sys

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.models.base import Base


class SystemMetric(Base):
    """
    System metrics from all services
    TimescaleDB hypertable for time-series data
    """
    __tablename__ = "system_metrics"
    
    # Primary key (time + id for TimescaleDB)
    time = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Service identification
    service_name = Column(String(100), nullable=False, index=True)
    
    # Metric information
    metric_name = Column(String(100), nullable=False, index=True)
    metric_type = Column(String(50), nullable=False)  # "counter", "gauge", "histogram"
    value = Column(Float, nullable=False)
    unit = Column(String(50))  # "ms", "bytes", "count", "percent"
    
    # Additional context
    tags = Column(JSONB)  # {"endpoint": "/api/v1/users", "method": "GET", "status": 200}
    
    # Metadata
    hostname = Column(String(255))
    environment = Column(String(50))  # "production", "staging", "development"
    
    def __repr__(self):
        return f"<SystemMetric {self.service_name}.{self.metric_name} = {self.value}>"


# Index for efficient time-based queries
Index('idx_system_metrics_time_service', SystemMetric.time, SystemMetric.service_name)
Index('idx_system_metrics_time_metric', SystemMetric.time, SystemMetric.metric_name)


class UserActivity(Base):
    """
    User activity tracking
    TimescaleDB hypertable for time-series data
    """
    __tablename__ = "user_activity"
    
    # Primary key (time + id for TimescaleDB)
    time = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User identification
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Activity information
    activity_type = Column(String(100), nullable=False, index=True)
    # Examples: "login", "logout", "course_start", "course_complete", 
    #           "annotation_create", "assessment_submit", "certificate_earn"
    
    activity_category = Column(String(50))  # "auth", "learning", "annotation", "assessment"
    
    # Duration and timing
    duration_seconds = Column(Integer)  # For activities with duration
    session_id = Column(UUID(as_uuid=True))
    
    # Context
    resource_id = Column(UUID(as_uuid=True))  # Course ID, Annotation ID, etc.
    resource_type = Column(String(50))  # "course", "annotation", "assessment"
    
    # Additional data
    activity_metadata = Column(JSONB)
    
    # User agent and location
    ip_address = Column(String(45))
    user_agent = Column(Text)
    country = Column(String(2))  # ISO country code
    
    def __repr__(self):
        return f"<UserActivity {self.user_id} - {self.activity_type}>"


# Indexes for efficient queries
Index('idx_user_activity_time_user', UserActivity.time, UserActivity.user_id)
Index('idx_user_activity_time_type', UserActivity.time, UserActivity.activity_type)
Index('idx_user_activity_session', UserActivity.session_id)


class CourseAnalytics(Base):
    """
    Aggregated course analytics
    Regular table (not time-series)
    """
    __tablename__ = "course_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Course identification
    course_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    
    # Enrollment metrics
    enrollment_count = Column(Integer, default=0)
    active_enrollment_count = Column(Integer, default=0)
    completion_count = Column(Integer, default=0)
    dropout_count = Column(Integer, default=0)
    
    # Performance metrics
    average_score = Column(Float)
    median_score = Column(Float)
    pass_rate = Column(Float)  # Percentage
    
    # Time metrics
    average_completion_time_hours = Column(Float)
    median_completion_time_hours = Column(Float)
    
    # Engagement metrics
    average_time_spent_hours = Column(Float)
    total_time_spent_hours = Column(Float)
    average_sessions_per_user = Column(Float)
    
    # Assessment metrics
    total_assessments_taken = Column(Integer, default=0)
    average_attempts_per_assessment = Column(Float)
    
    # Trends
    enrollment_trend = Column(String(50))  # "increasing", "stable", "decreasing"
    completion_trend = Column(String(50))
    score_trend = Column(String(50))
    
    # Additional analytics
    analytics_data = Column(JSONB)  # Detailed breakdown, charts data
    
    # Timestamps
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<CourseAnalytics {self.course_id}>"


class ServiceHealth(Base):
    """
    Service health status tracking
    """
    __tablename__ = "service_health"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Service identification
    service_name = Column(String(100), nullable=False, index=True)
    
    # Health status
    status = Column(String(20), nullable=False)  # "healthy", "degraded", "down"
    
    # Last check
    last_check_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Response metrics
    response_time_ms = Column(Float)
    
    # Dependencies status
    dependencies_status = Column(JSONB)  # {"database": "healthy", "redis": "healthy"}
    
    # Error information
    error_message = Column(Text)
    consecutive_failures = Column(Integer, default=0)
    
    # Uptime
    uptime_percentage_24h = Column(Float)
    uptime_percentage_7d = Column(Float)
    uptime_percentage_30d = Column(Float)
    
    # Timestamps
    last_healthy_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<ServiceHealth {self.service_name} - {self.status}>"


class Alert(Base):
    """
    System alerts and anomalies
    """
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Alert information
    alert_type = Column(String(50), nullable=False)  # "performance", "error", "anomaly", "downtime"
    severity = Column(String(20), nullable=False)  # "critical", "warning", "info"
    
    # Source
    service_name = Column(String(100), nullable=False, index=True)
    metric_name = Column(String(100))
    
    # Alert details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    current_value = Column(Float)
    threshold_value = Column(Float)
    
    # Status
    status = Column(String(20), default="active")  # "active", "acknowledged", "resolved"
    acknowledged_by = Column(UUID(as_uuid=True))
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    
    # Notifications
    notification_sent = Column(Boolean, default=False)
    notification_channels = Column(JSONB)  # ["email", "slack", "sms"]
    
    # Timestamps
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Alert {self.alert_type} - {self.service_name}>"


Index('idx_alerts_service_status', Alert.service_name, Alert.status)
Index('idx_alerts_triggered', Alert.triggered_at.desc())