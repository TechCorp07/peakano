"""
Notification Service Models
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from shared.models.base import Base


class NotificationChannel(str, enum.Enum):
    """Notification channel"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, enum.Enum):
    """Notification status"""
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class NotificationPriority(str, enum.Enum):
    """Notification priority"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Recipient information
    recipient_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=True)
    recipient_phone = Column(String(50), nullable=True)
    recipient_device_token = Column(String(500), nullable=True)  # For push notifications
    
    # Notification details
    channel = Column(SQLEnum(NotificationChannel), nullable=False, index=True)
    priority = Column(SQLEnum(NotificationPriority), nullable=False, default=NotificationPriority.NORMAL)
    
    # Content
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)
    template_id = Column(String(100), nullable=True, index=True)
    template_data = Column(JSON, nullable=True)
    
    # Delivery
    status = Column(SQLEnum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING, index=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Metadata
    notification_metadata = Column("metadata", JSON, nullable=True)
    
    # Related entity (optional)
    related_entity_type = Column(String(50), nullable=True)  # e.g., "course", "session"
    related_entity_id = Column(String(100), nullable=True, index=True)
    
    # Delivery tracking
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # External provider info
    provider = Column(String(50), nullable=True)  # "smtp", "sendgrid", "africastalking", "fcm"
    provider_message_id = Column(String(255), nullable=True)
    provider_response = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=True, index=True)
    
    def __repr__(self):
        return f"<Notification {self.channel.value} to {self.recipient_email or self.recipient_phone}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "recipient_id": str(self.recipient_id),
            "recipient_email": self.recipient_email,
            "recipient_phone": self.recipient_phone,
            "channel": self.channel.value if self.channel else None,
            "priority": self.priority.value if self.priority else None,
            "subject": self.subject,
            "message": self.message,
            "template_id": self.template_id,
            "template_data": self.template_data,
            "status": self.status.value if self.status else None,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "metadata": self.notification_metadata,
            "related_entity_type": self.related_entity_type,
            "related_entity_id": self.related_entity_id,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "failed_at": self.failed_at.isoformat() if self.failed_at else None,
            "error_message": self.error_message,
            "provider": self.provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "scheduled_for": self.scheduled_for.isoformat() if self.scheduled_for else None,
        }


class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    
    # Channel preferences
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    
    # Notification type preferences
    course_updates = Column(Boolean, default=True)
    assignment_reminders = Column(Boolean, default=True)
    grade_notifications = Column(Boolean, default=True)
    system_announcements = Column(Boolean, default=True)
    marketing_emails = Column(Boolean, default=False)
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String(5), nullable=True)  # "22:00"
    quiet_hours_end = Column(String(5), nullable=True)  # "08:00"
    
    # Frequency
    digest_enabled = Column(Boolean, default=False)
    digest_frequency = Column(String(20), default="daily")  # daily, weekly
    
    # Language
    preferred_language = Column(String(5), default="en")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<NotificationPreference for {self.user_id}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "email_enabled": self.email_enabled,
            "sms_enabled": self.sms_enabled,
            "push_enabled": self.push_enabled,
            "course_updates": self.course_updates,
            "assignment_reminders": self.assignment_reminders,
            "grade_notifications": self.grade_notifications,
            "system_announcements": self.system_announcements,
            "marketing_emails": self.marketing_emails,
            "quiet_hours_enabled": self.quiet_hours_enabled,
            "quiet_hours_start": self.quiet_hours_start,
            "quiet_hours_end": self.quiet_hours_end,
            "digest_enabled": self.digest_enabled,
            "digest_frequency": self.digest_frequency,
            "preferred_language": self.preferred_language,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class NotificationTemplate(Base):
    """Notification templates"""
    __tablename__ = "notification_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Template identification
    template_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Template content
    subject_template = Column(String(500), nullable=True)  # For email
    message_template = Column(Text, nullable=False)
    
    # Template metadata
    channel = Column(SQLEnum(NotificationChannel), nullable=False)
    language = Column(String(5), default="en")
    variables = Column(JSON, nullable=True)  # List of required variables
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<NotificationTemplate {self.template_id}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "template_id": self.template_id,
            "name": self.name,
            "description": self.description,
            "subject_template": self.subject_template,
            "message_template": self.message_template,
            "channel": self.channel.value if self.channel else None,
            "language": self.language,
            "variables": self.variables,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }