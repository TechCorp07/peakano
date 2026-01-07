"""
LMS Service Models - Courses and Modules
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from shared.models.base import Base


class CourseStatus(str, enum.Enum):
    """Course status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseDifficulty(str, enum.Enum):
    """Course difficulty level"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ContentType(str, enum.Enum):
    """Content type"""
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"
    DICOM = "dicom"
    QUIZ = "quiz"
    PRACTICAL = "practical"


class Course(Base):
    """Course model"""
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    
    # Categorization
    organ_system = Column(String(100), nullable=True)  # liver, lung, kidney, etc.
    modality = Column(String(50), nullable=True)  # CT, MRI, X-ray, etc.
    difficulty = Column(SQLEnum(CourseDifficulty), nullable=False, default=CourseDifficulty.BEGINNER)
    
    # Status and visibility
    status = Column(SQLEnum(CourseStatus), nullable=False, default=CourseStatus.DRAFT, index=True)
    is_featured = Column(Boolean, default=False)
    
    # Duration and effort
    estimated_hours = Column(Integer, nullable=True)  # Total course hours
    total_modules = Column(Integer, default=0)
    total_lessons = Column(Integer, default=0)
    
    # Requirements
    prerequisites = Column(JSONB, nullable=True)  # List of prerequisite course IDs
    learning_objectives = Column(JSONB, nullable=True)  # List of learning objectives
    
    # Media
    thumbnail_url = Column(String(500), nullable=True)
    video_intro_url = Column(String(500), nullable=True)
    
    # Pricing and access
    is_free = Column(Boolean, default=True)
    price = Column(Float, nullable=True)
    
    # Completion criteria
    passing_score = Column(Integer, default=70)  # Percentage
    certificate_enabled = Column(Boolean, default=True)
    
    # Statistics
    enrollment_count = Column(Integer, default=0)
    completion_count = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True)
    
    # Ownership
    created_by = Column(UUID(as_uuid=True), nullable=False, index=True)
    instructor_ids = Column(JSONB, nullable=True)  # List of instructor UUIDs
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.sequence")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Course {self.title}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "short_description": self.short_description,
            "organ_system": self.organ_system,
            "modality": self.modality,
            "difficulty": self.difficulty.value if self.difficulty else None,
            "status": self.status.value if self.status else None,
            "is_featured": self.is_featured,
            "estimated_hours": self.estimated_hours,
            "total_modules": self.total_modules,
            "total_lessons": self.total_lessons,
            "prerequisites": self.prerequisites,
            "learning_objectives": self.learning_objectives,
            "thumbnail_url": self.thumbnail_url,
            "video_intro_url": self.video_intro_url,
            "is_free": self.is_free,
            "price": self.price,
            "passing_score": self.passing_score,
            "certificate_enabled": self.certificate_enabled,
            "enrollment_count": self.enrollment_count,
            "completion_count": self.completion_count,
            "average_rating": self.average_rating,
            "created_by": str(self.created_by),
            "instructor_ids": self.instructor_ids,
            "organization_id": str(self.organization_id) if self.organization_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }


class Module(Base):
    """Course Module model"""
    __tablename__ = "modules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Course reference
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Module information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sequence = Column(Integer, nullable=False)  # Order in course
    
    # Duration
    estimated_hours = Column(Integer, nullable=True)
    
    # Requirements
    is_locked = Column(Boolean, default=False)  # Requires previous module completion
    
    # Statistics
    total_lessons = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.sequence")
    
    def __repr__(self):
        return f"<Module {self.title}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "course_id": str(self.course_id),
            "title": self.title,
            "description": self.description,
            "sequence": self.sequence,
            "estimated_hours": self.estimated_hours,
            "is_locked": self.is_locked,
            "total_lessons": self.total_lessons,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Lesson(Base):
    """Lesson model"""
    __tablename__ = "lessons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Module reference
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Lesson information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sequence = Column(Integer, nullable=False)  # Order in module
    
    # Content
    content_type = Column(SQLEnum(ContentType), nullable=False)
    content = Column(Text, nullable=True)  # Text content or HTML
    video_url = Column(String(500), nullable=True)
    video_duration = Column(Integer, nullable=True)  # seconds
    file_url = Column(String(500), nullable=True)  # PDF or other file
    
    # For DICOM/Practical lessons
    dicom_case_id = Column(String(255), nullable=True)
    annotation_project_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Duration
    estimated_minutes = Column(Integer, nullable=True)
    
    # Requirements
    is_required = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    module = relationship("Module", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Lesson {self.title}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "module_id": str(self.module_id),
            "title": self.title,
            "description": self.description,
            "sequence": self.sequence,
            "content_type": self.content_type.value if self.content_type else None,
            "content": self.content,
            "video_url": self.video_url,
            "video_duration": self.video_duration,
            "file_url": self.file_url,
            "dicom_case_id": self.dicom_case_id,
            "annotation_project_id": str(self.annotation_project_id) if self.annotation_project_id else None,
            "estimated_minutes": self.estimated_minutes,
            "is_required": self.is_required,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }