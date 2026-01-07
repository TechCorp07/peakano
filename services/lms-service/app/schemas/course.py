"""
Pydantic schemas for LMS Service - Courses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class CourseStatus(str, Enum):
    """Course status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseDifficulty(str, Enum):
    """Course difficulty"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ContentType(str, Enum):
    """Content type"""
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"
    DICOM = "dicom"
    QUIZ = "quiz"
    PRACTICAL = "practical"


# Course Schemas
class CourseCreate(BaseModel):
    """Course creation request"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    organ_system: Optional[str] = None
    modality: Optional[str] = None
    difficulty: CourseDifficulty = CourseDifficulty.BEGINNER
    estimated_hours: Optional[int] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None
    video_intro_url: Optional[str] = None
    is_free: bool = True
    price: Optional[float] = None
    passing_score: int = 70
    certificate_enabled: bool = True


class CourseUpdate(BaseModel):
    """Course update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    status: Optional[CourseStatus] = None
    difficulty: Optional[CourseDifficulty] = None
    estimated_hours: Optional[int] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    thumbnail_url: Optional[str] = None
    is_featured: Optional[bool] = None
    passing_score: Optional[int] = None


class CourseResponse(BaseModel):
    """Course response"""
    id: str
    title: str
    description: Optional[str]
    short_description: Optional[str]
    organ_system: Optional[str]
    modality: Optional[str]
    difficulty: str
    status: str
    is_featured: bool
    estimated_hours: Optional[int]
    total_modules: int
    total_lessons: int
    prerequisites: Optional[List[str]]
    learning_objectives: Optional[List[str]]
    thumbnail_url: Optional[str]
    video_intro_url: Optional[str]
    is_free: bool
    price: Optional[float]
    passing_score: int
    certificate_enabled: bool
    enrollment_count: int
    completion_count: int
    average_rating: Optional[float]
    created_by: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]


class CourseListResponse(BaseModel):
    """Course list response"""
    courses: List[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Module Schemas
class ModuleCreate(BaseModel):
    """Module creation request"""
    course_id: str
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sequence: int
    estimated_hours: Optional[int] = None
    is_locked: bool = False


class ModuleUpdate(BaseModel):
    """Module update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sequence: Optional[int] = None
    estimated_hours: Optional[int] = None
    is_locked: Optional[bool] = None


class ModuleResponse(BaseModel):
    """Module response"""
    id: str
    course_id: str
    title: str
    description: Optional[str]
    sequence: int
    estimated_hours: Optional[int]
    is_locked: bool
    total_lessons: int
    created_at: datetime
    updated_at: datetime


class ModuleListResponse(BaseModel):
    """Module list response"""
    modules: List[ModuleResponse]
    total: int


# Lesson Schemas
class LessonCreate(BaseModel):
    """Lesson creation request"""
    module_id: str
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sequence: int
    content_type: ContentType
    content: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[int] = None
    file_url: Optional[str] = None
    dicom_case_id: Optional[str] = None
    annotation_project_id: Optional[str] = None
    estimated_minutes: Optional[int] = None
    is_required: bool = True


class LessonUpdate(BaseModel):
    """Lesson update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sequence: Optional[int] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    estimated_minutes: Optional[int] = None
    is_required: Optional[bool] = None


class LessonResponse(BaseModel):
    """Lesson response"""
    id: str
    module_id: str
    title: str
    description: Optional[str]
    sequence: int
    content_type: str
    content: Optional[str]
    video_url: Optional[str]
    video_duration: Optional[int]
    file_url: Optional[str]
    dicom_case_id: Optional[str]
    annotation_project_id: Optional[str]
    estimated_minutes: Optional[int]
    is_required: bool
    created_at: datetime
    updated_at: datetime


class LessonListResponse(BaseModel):
    """Lesson list response"""
    lessons: List[LessonResponse]
    total: int