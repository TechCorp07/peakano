"""
Pydantic schemas for LMS Service - Enrollment and Assessment
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class EnrollmentStatus(str, Enum):
    """Enrollment status"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"


class LessonStatus(str, Enum):
    """Lesson status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class AssessmentType(str, Enum):
    """Assessment type"""
    QUIZ = "quiz"
    EXAM = "exam"
    PRACTICAL = "practical"
    ASSIGNMENT = "assignment"


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    """Enrollment creation request"""
    course_id: str


class EnrollmentResponse(BaseModel):
    """Enrollment response"""
    id: str
    course_id: str
    user_id: str
    status: str
    progress_percentage: int
    completed_lessons: int
    total_lessons: int
    time_spent_minutes: int
    last_accessed_at: Optional[datetime]
    completed_at: Optional[datetime]
    certificate_issued: bool
    certificate_id: Optional[str]
    enrollment_source: Optional[str] = None
    enrollment_metadata: Optional[Dict[str, Any]] = None
    enrolled_at: datetime


class EnrollmentListResponse(BaseModel):
    """Enrollment list response"""
    enrollments: List[EnrollmentResponse]
    total: int


class EnrollmentProgressResponse(BaseModel):
    """Detailed enrollment progress"""
    enrollment: EnrollmentResponse
    course_title: str
    modules_progress: List[Dict[str, Any]]
    recent_lessons: List[Dict[str, Any]]
    assessment_scores: List[Dict[str, Any]]


# Lesson Progress Schemas
class LessonProgressUpdate(BaseModel):
    """Lesson progress update"""
    completion_percentage: Optional[int] = None
    video_position_seconds: Optional[int] = None
    video_watched_percentage: Optional[int] = None
    status: Optional[LessonStatus] = None


class LessonProgressResponse(BaseModel):
    """Lesson progress response"""
    id: str
    enrollment_id: str
    lesson_id: str
    user_id: str
    status: str
    completion_percentage: int
    time_spent_minutes: int
    video_position_seconds: Optional[int]
    video_watched_percentage: Optional[int]
    completed_at: Optional[datetime]
    score: Optional[int]
    started_at: datetime
    last_accessed_at: datetime


# Assessment Schemas
class AssessmentCreate(BaseModel):
    """Assessment creation request"""
    course_id: str
    module_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    assessment_type: AssessmentType
    passing_score: int = 70
    max_attempts: int = 3
    time_limit_minutes: Optional[int] = None
    randomize_questions: bool = False
    show_correct_answers: bool = True
    questions: List[Dict[str, Any]]
    is_required: bool = True


class AssessmentUpdate(BaseModel):
    """Assessment update request"""
    title: Optional[str] = None
    description: Optional[str] = None
    passing_score: Optional[int] = None
    max_attempts: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    questions: Optional[List[Dict[str, Any]]] = None


class AssessmentResponse(BaseModel):
    """Assessment response"""
    id: str
    course_id: str
    module_id: Optional[str]
    title: str
    description: Optional[str]
    assessment_type: str
    passing_score: int
    max_attempts: int
    time_limit_minutes: Optional[int]
    randomize_questions: bool
    show_correct_answers: bool
    questions: List[Dict[str, Any]]
    total_points: int
    is_required: bool
    created_at: datetime


class AssessmentListResponse(BaseModel):
    """Assessment list response"""
    assessments: List[AssessmentResponse]
    total: int


# Assessment Attempt Schemas
class AssessmentAttemptStart(BaseModel):
    """Start assessment attempt"""
    assessment_id: str


class AssessmentAttemptSubmit(BaseModel):
    """Submit assessment attempt"""
    answers: Dict[str, Any]


class AssessmentAttemptResponse(BaseModel):
    """Assessment attempt response"""
    id: str
    assessment_id: str
    enrollment_id: str
    user_id: str
    attempt_number: int
    status: str
    answers: Optional[Dict[str, Any]]
    score: Optional[int]
    points_earned: Optional[int]
    points_possible: Optional[int]
    passed: Optional[bool]
    feedback: Optional[str]
    time_spent_minutes: Optional[int]
    started_at: datetime
    submitted_at: Optional[datetime]
    graded_at: Optional[datetime]


# Certificate Schemas
class CertificateResponse(BaseModel):
    """Certificate response"""
    id: str
    user_id: str
    course_id: str
    certificate_number: str
    recipient_name: str
    course_title: str
    completion_date: datetime
    final_score: Optional[int]
    issued_at: datetime
    expires_at: Optional[datetime]
    is_revoked: bool
    pdf_url: Optional[str]
    verification_code: str


class CertificateVerifyRequest(BaseModel):
    """Certificate verification request"""
    verification_code: str


class CertificateVerifyResponse(BaseModel):
    """Certificate verification response"""
    valid: bool
    certificate: Optional[CertificateResponse]
    message: str


# Statistics Schemas
class LMSStatisticsResponse(BaseModel):
    """LMS statistics"""
    total_courses: int
    total_students: int
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    certificates_issued: int
    average_completion_rate: float
    total_assessments_taken: int