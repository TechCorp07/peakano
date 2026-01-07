"""
PostgreSQL Models for Annotation Service
Projects and Cases
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from shared.models.base import Base


class ProjectStatus(str, enum.Enum):
    """Project status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CaseStatus(str, enum.Enum):
    """Case status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    REJECTED = "rejected"


class Project(Base):
    """Annotation Project model"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Project information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Organization
    organ_system = Column(String(100), nullable=True)  # liver, lung, kidney, etc.
    modality = Column(String(50), nullable=True)  # CT, MRI, X-ray, etc.
    
    # Status
    status = Column(SQLEnum(ProjectStatus), nullable=False, default=ProjectStatus.ACTIVE)
    
    # Annotation configuration
    annotation_types = Column(JSONB, nullable=True)  # Allowed annotation types
    labels = Column(JSONB, nullable=True)  # Available labels/classes
    guidelines = Column(Text, nullable=True)  # Annotation guidelines
    
    # Statistics
    total_cases = Column(Integer, default=0)
    completed_cases = Column(Integer, default=0)
    total_annotations = Column(Integer, default=0)
    
    # Ownership
    created_by = Column(UUID(as_uuid=True), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    cases = relationship("Case", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project {self.name}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "organ_system": self.organ_system,
            "modality": self.modality,
            "status": self.status.value if self.status else None,
            "annotation_types": self.annotation_types,
            "labels": self.labels,
            "guidelines": self.guidelines,
            "total_cases": self.total_cases,
            "completed_cases": self.completed_cases,
            "total_annotations": self.total_annotations,
            "created_by": str(self.created_by),
            "organization_id": str(self.organization_id) if self.organization_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Case(Base):
    """Annotation Case model"""
    __tablename__ = "cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Project reference
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Case information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # DICOM references
    study_uid = Column(String(255), nullable=False, index=True)
    series_uid = Column(String(255), nullable=True, index=True)
    
    # Status
    status = Column(SQLEnum(CaseStatus), nullable=False, default=CaseStatus.PENDING, index=True)
    
    # Assignment
    assigned_to = Column(UUID(as_uuid=True), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Completion
    completed_by = Column(UUID(as_uuid=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Review
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_comments = Column(Text, nullable=True)
    
    # Ground truth (for training/evaluation)
    has_ground_truth = Column(Boolean, default=False)
    ground_truth_annotation_id = Column(String(255), nullable=True)  # MongoDB annotation ID
    
    # Quality metrics (if ground truth exists)
    dice_score = Column(Integer, nullable=True)  # Stored as percentage (0-100)
    iou_score = Column(Integer, nullable=True)  # Stored as percentage (0-100)
    
    # Statistics
    total_annotations = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    
    # Metadata
    case_metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="cases")
    
    def __repr__(self):
        return f"<Case {self.name}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "project_id": str(self.project_id),
            "name": self.name,
            "description": self.description,
            "study_uid": self.study_uid,
            "series_uid": self.series_uid,
            "status": self.status.value if self.status else None,
            "assigned_to": str(self.assigned_to) if self.assigned_to else None,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "completed_by": str(self.completed_by) if self.completed_by else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "reviewed_by": str(self.reviewed_by) if self.reviewed_by else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_comments": self.review_comments,
            "has_ground_truth": self.has_ground_truth,
            "ground_truth_annotation_id": self.ground_truth_annotation_id,
            "dice_score": self.dice_score,
            "iou_score": self.iou_score,
            "total_annotations": self.total_annotations,
            "total_sessions": self.total_sessions,
            "time_spent_seconds": self.time_spent_seconds,
            "metadata": self.case_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }