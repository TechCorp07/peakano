"""
Pydantic schemas for Notification Service
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class NotificationChannel(str, Enum):
    """Notification channel"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, Enum):
    """Notification status"""
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class NotificationPriority(str, Enum):
    """Notification priority"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# Notification Schemas
class NotificationSendRequest(BaseModel):
    """Request to send a notification"""
    recipient_id: str
    channel: NotificationChannel
    subject: Optional[str] = None
    message: str
    priority: NotificationPriority = NotificationPriority.NORMAL
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    scheduled_for: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """Notification response"""
    id: str
    recipient_id: str
    recipient_email: Optional[str]
    recipient_phone: Optional[str]
    channel: str
    priority: str
    subject: Optional[str]
    message: str
    template_id: Optional[str]
    status: str
    retry_count: int
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    failed_at: Optional[datetime]
    error_message: Optional[str]
    provider: Optional[str]
    created_at: datetime
    scheduled_for: Optional[datetime]


class NotificationListResponse(BaseModel):
    """Notification list response"""
    notifications: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Preference Schemas
class NotificationPreferenceUpdate(BaseModel):
    """Update notification preferences"""
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    course_updates: Optional[bool] = None
    assignment_reminders: Optional[bool] = None
    grade_notifications: Optional[bool] = None
    system_announcements: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    quiet_hours_end: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    digest_enabled: Optional[bool] = None
    digest_frequency: Optional[str] = Field(None, pattern="^(daily|weekly)$")
    preferred_language: Optional[str] = None


class NotificationPreferenceResponse(BaseModel):
    """Notification preference response"""
    id: str
    user_id: str
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    course_updates: bool
    assignment_reminders: bool
    grade_notifications: bool
    system_announcements: bool
    marketing_emails: bool
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]
    digest_enabled: bool
    digest_frequency: str
    preferred_language: str
    created_at: datetime
    updated_at: datetime


# Template Schemas
class NotificationTemplateCreate(BaseModel):
    """Create notification template"""
    template_id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    subject_template: Optional[str] = None
    message_template: str
    channel: NotificationChannel
    language: str = "en"
    variables: Optional[List[str]] = None


class NotificationTemplateUpdate(BaseModel):
    """Update notification template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    subject_template: Optional[str] = None
    message_template: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None


class NotificationTemplateResponse(BaseModel):
    """Notification template response"""
    id: str
    template_id: str
    name: str
    description: Optional[str]
    subject_template: Optional[str]
    message_template: str
    channel: str
    language: str
    variables: Optional[List[str]]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class NotificationTemplateListResponse(BaseModel):
    """Template list response"""
    templates: List[NotificationTemplateResponse]
    total: int


# Batch Notification Schema
class BatchNotificationRequest(BaseModel):
    """Request to send batch notifications"""
    recipient_ids: List[str]
    channel: NotificationChannel
    subject: Optional[str] = None
    message: Optional[str] = None
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    priority: NotificationPriority = NotificationPriority.NORMAL


class BatchNotificationResponse(BaseModel):
    """Batch notification response"""
    success: bool
    total_queued: int
    message: str


# Statistics Schemas
class NotificationStatisticsResponse(BaseModel):
    """Notification statistics"""
    total_notifications: int
    sent_notifications: int
    failed_notifications: int
    pending_notifications: int
    notifications_by_channel: Dict[str, int]
    notifications_by_status: Dict[str, int]
    average_delivery_time_seconds: Optional[float]