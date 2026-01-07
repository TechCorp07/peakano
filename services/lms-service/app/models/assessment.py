"""
LMS Service Models - Assessments and Certificates
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum
from shared.models.base import Base


class AssessmentType(str, enum.Enum):
    """Assessment type"""
    QUIZ = "quiz"
    EXAM = "exam"
    PRACTICAL = "practical"
    ASSIGNMENT = "assignment"


class QuestionType(str, enum.Enum):
    """Question type"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    ANNOTATION = "annotation"


class AttemptStatus(str, enum.Enum):
    """Attempt status"""
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    GRADED = "graded"


class Assessment(Base):
    """Assessment model"""
    __tablename__ = "assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Course/Module reference
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Assessment information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assessment_type = Column(SQLEnum(AssessmentType), nullable=False)
    
    # Configuration
    passing_score = Column(Integer, default=70)  # Percentage
    max_attempts = Column(Integer, default=3)
    time_limit_minutes = Column(Integer, nullable=True)
    randomize_questions = Column(Boolean, default=False)
    show_correct_answers = Column(Boolean, default=True)
    
    # Questions (stored as JSONB)
    questions = Column(JSONB, nullable=False)  # List of question objects
    total_points = Column(Integer, default=0)
    
    # Requirements
    is_required = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Assessment {self.title}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "course_id": str(self.course_id),
            "module_id": str(self.module_id) if self.module_id else None,
            "title": self.title,
            "description": self.description,
            "assessment_type": self.assessment_type.value if self.assessment_type else None,
            "passing_score": self.passing_score,
            "max_attempts": self.max_attempts,
            "time_limit_minutes": self.time_limit_minutes,
            "randomize_questions": self.randomize_questions,
            "show_correct_answers": self.show_correct_answers,
            "questions": self.questions,
            "total_points": self.total_points,
            "is_required": self.is_required,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AssessmentAttempt(Base):
    """Assessment Attempt model"""
    __tablename__ = "assessment_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('assessments.id', ondelete='CASCADE'), nullable=False, index=True)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Attempt information
    attempt_number = Column(Integer, nullable=False)
    status = Column(SQLEnum(AttemptStatus), nullable=False, default=AttemptStatus.IN_PROGRESS)
    
    # Answers
    answers = Column(JSONB, nullable=True)  # User's answers
    
    # Scoring
    score = Column(Integer, nullable=True)  # Percentage
    points_earned = Column(Integer, nullable=True)
    points_possible = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    
    # Feedback
    feedback = Column(Text, nullable=True)
    graded_by = Column(UUID(as_uuid=True), nullable=True)  # Instructor ID
    
    # Time tracking
    time_spent_minutes = Column(Integer, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="attempts")
    enrollment = relationship("Enrollment", back_populates="assessment_attempts")
    
    def __repr__(self):
        return f"<AssessmentAttempt user={self.user_id} assessment={self.assessment_id}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "assessment_id": str(self.assessment_id),
            "enrollment_id": str(self.enrollment_id),
            "user_id": str(self.user_id),
            "attempt_number": self.attempt_number,
            "status": self.status.value if self.status else None,
            "answers": self.answers,
            "score": self.score,
            "points_earned": self.points_earned,
            "points_possible": self.points_possible,
            "passed": self.passed,
            "feedback": self.feedback,
            "graded_by": str(self.graded_by) if self.graded_by else None,
            "time_spent_minutes": self.time_spent_minutes,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "graded_at": self.graded_at.isoformat() if self.graded_at else None,
        }


class Certificate(Base):
    """Certificate model"""
    __tablename__ = "certificates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # References
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False)
    
    # Certificate information
    certificate_number = Column(String(100), unique=True, nullable=False, index=True)
    
    # Recipient details
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    
    # Course details
    course_title = Column(String(255), nullable=False)
    completion_date = Column(DateTime(timezone=True), nullable=False)
    
    # Scores
    final_score = Column(Integer, nullable=True)  # Percentage
    
    # Validity
    issued_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(Text, nullable=True)
    
    # File
    pdf_url = Column(String(500), nullable=True)
    
    # Verification
    verification_code = Column(String(100), unique=True, nullable=False)
    
    def __repr__(self):
        return f"<Certificate {self.certificate_number}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "course_id": str(self.course_id),
            "enrollment_id": str(self.enrollment_id),
            "certificate_number": self.certificate_number,
            "recipient_name": self.recipient_name,
            "recipient_email": self.recipient_email,
            "course_title": self.course_title,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "final_score": self.final_score,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_revoked": self.is_revoked,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "revocation_reason": self.revocation_reason,
            "pdf_url": self.pdf_url,
            "verification_code": self.verification_code,
        }