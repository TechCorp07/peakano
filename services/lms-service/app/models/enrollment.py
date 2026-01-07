"""
LMS Service Models - Enrollment and Progress Tracking
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from shared.models.base import Base


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"


class LessonStatus(str, enum.Enum):
    """Lesson completion status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Enrollment(Base):
    """Course Enrollment model"""
    __tablename__ = "enrollments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Course and user reference
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(EnrollmentStatus), nullable=False, default=EnrollmentStatus.ACTIVE, index=True)
    
    # Progress
    progress_percentage = Column(Integer, default=0)  # 0-100
    completed_lessons = Column(Integer, default=0)
    total_lessons = Column(Integer, default=0)
    
    # Time tracking
    time_spent_minutes = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Completion
    completed_at = Column(DateTime(timezone=True), nullable=True)
    certificate_issued = Column(Boolean, default=False)
    certificate_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Assessment scores
    overall_score = Column(Integer, nullable=True)  # Percentage
    assessment_attempts = Column(Integer, default=0)
    
    # Metadata
    enrollment_source = Column(String(100), nullable=True)  # web, mobile, api
    enrollment_metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    enrolled_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    course = relationship("Course", back_populates="enrollments")
    lesson_progress = relationship("LessonProgress", back_populates="enrollment", cascade="all, delete-orphan")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="enrollment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Enrollment user={self.user_id} course={self.course_id}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "course_id": str(self.course_id),
            "user_id": str(self.user_id),
            "status": self.status.value if self.status else None,
            "progress_percentage": self.progress_percentage,
            "completed_lessons": self.completed_lessons,
            "total_lessons": self.total_lessons,
            "time_spent_minutes": self.time_spent_minutes,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "certificate_issued": self.certificate_issued,
            "certificate_id": str(self.certificate_id) if self.certificate_id else None,
            "overall_score": self.overall_score,
            "assessment_attempts": self.assessment_attempts,
            "enrollment_source": self.enrollment_source,
            "enrollment_metadata": self.enrollment_metadata,
            "enrolled_at": self.enrolled_at.isoformat() if self.enrolled_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class LessonProgress(Base):
    """Lesson Progress Tracking"""
    __tablename__ = "lesson_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(LessonStatus), nullable=False, default=LessonStatus.NOT_STARTED)
    
    # Progress
    completion_percentage = Column(Integer, default=0)  # For videos/content
    time_spent_minutes = Column(Integer, default=0)
    
    # Video tracking
    video_position_seconds = Column(Integer, nullable=True)
    video_watched_percentage = Column(Integer, nullable=True)
    
    # Completion
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Scores (for practical lessons)
    score = Column(Integer, nullable=True)  # Percentage
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    last_accessed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress")
    
    def __repr__(self):
        return f"<LessonProgress user={self.user_id} lesson={self.lesson_id}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "enrollment_id": str(self.enrollment_id),
            "lesson_id": str(self.lesson_id),
            "user_id": str(self.user_id),
            "status": self.status.value if self.status else None,
            "completion_percentage": self.completion_percentage,
            "time_spent_minutes": self.time_spent_minutes,
            "video_position_seconds": self.video_position_seconds,
            "video_watched_percentage": self.video_watched_percentage,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "score": self.score,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
        }