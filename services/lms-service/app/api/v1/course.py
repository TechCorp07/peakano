"""
LMS API endpoints - Course Management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
import uuid
from datetime import datetime

from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.models.course import Course, Module, Lesson, CourseStatus, CourseDifficulty
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseListResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse, ModuleListResponse,
    LessonCreate, LessonUpdate, LessonResponse, LessonListResponse
)

router = APIRouter()


# ==================== COURSES ====================

@router.post("/courses", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new course"""
    # TODO: Get user_id from JWT token
    user_id = uuid.uuid4()  # Placeholder
    
    course = Course(
        title=course_data.title,
        description=course_data.description,
        short_description=course_data.short_description,
        organ_system=course_data.organ_system,
        modality=course_data.modality,
        difficulty=course_data.difficulty,
        estimated_hours=course_data.estimated_hours,
        prerequisites=course_data.prerequisites,
        learning_objectives=course_data.learning_objectives,
        thumbnail_url=course_data.thumbnail_url,
        video_intro_url=course_data.video_intro_url,
        is_free=course_data.is_free,
        price=course_data.price,
        passing_score=course_data.passing_score,
        certificate_enabled=course_data.certificate_enabled,
        created_by=user_id
    )
    
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(**course.to_dict())


@router.get("/courses", response_model=CourseListResponse)
async def list_courses(
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    organ_system: Optional[str] = None,
    modality: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List courses with filtering"""
    query = select(Course)
    
    # Filters
    if status:
        query = query.where(Course.status == CourseStatus(status))
    if difficulty:
        query = query.where(Course.difficulty == CourseDifficulty(difficulty))
    if organ_system:
        query = query.where(Course.organ_system == organ_system)
    if modality:
        query = query.where(Course.modality == modality)
    if search:
        query = query.where(
            or_(
                Course.title.ilike(f"%{search}%"),
                Course.description.ilike(f"%{search}%")
            )
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Course.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return CourseListResponse(
        courses=[CourseResponse(**c.to_dict()) for c in courses],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get course by ID"""
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundException(f"Course not found: {course_id}")
    
    return CourseResponse(**course.to_dict())


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update course"""
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundException(f"Course not found: {course_id}")
    
    # Update fields
    update_data = course_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    # Update published_at if status changes to published
    if course_data.status == CourseStatus.PUBLISHED and not course.published_at:
        course.published_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(course)
    
    return CourseResponse(**course.to_dict())


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete course"""
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundException(f"Course not found: {course_id}")
    
    await db.delete(course)
    await db.commit()
    
    return success_response(message="Course deleted successfully")


# ==================== MODULES ====================

@router.post("/modules", response_model=ModuleResponse)
async def create_module(
    module_data: ModuleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new module"""
    # Verify course exists
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(module_data.course_id))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundException(f"Course not found: {module_data.course_id}")
    
    module = Module(
        course_id=uuid.UUID(module_data.course_id),
        title=module_data.title,
        description=module_data.description,
        sequence=module_data.sequence,
        estimated_hours=module_data.estimated_hours,
        is_locked=module_data.is_locked
    )
    
    db.add(module)
    
    # Update course total_modules
    course.total_modules += 1
    
    await db.commit()
    await db.refresh(module)
    
    return ModuleResponse(**module.to_dict())


@router.get("/courses/{course_id}/modules", response_model=ModuleListResponse)
async def list_course_modules(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    """List modules for a course"""
    result = await db.execute(
        select(Module)
        .where(Module.course_id == uuid.UUID(course_id))
        .order_by(Module.sequence)
    )
    modules = result.scalars().all()
    
    return ModuleListResponse(
        modules=[ModuleResponse(**m.to_dict()) for m in modules],
        total=len(modules)
    )


@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get module by ID"""
    result = await db.execute(
        select(Module).where(Module.id == uuid.UUID(module_id))
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise NotFoundException(f"Module not found: {module_id}")
    
    return ModuleResponse(**module.to_dict())


@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update module"""
    result = await db.execute(
        select(Module).where(Module.id == uuid.UUID(module_id))
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise NotFoundException(f"Module not found: {module_id}")
    
    # Update fields
    update_data = module_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(module, field, value)
    
    await db.commit()
    await db.refresh(module)
    
    return ModuleResponse(**module.to_dict())


@router.delete("/modules/{module_id}")
async def delete_module(
    module_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete module"""
    result = await db.execute(
        select(Module).where(Module.id == uuid.UUID(module_id))
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise NotFoundException(f"Module not found: {module_id}")
    
    # Update course total_modules
    course_result = await db.execute(
        select(Course).where(Course.id == module.course_id)
    )
    course = course_result.scalar_one_or_none()
    if course:
        course.total_modules -= 1
    
    await db.delete(module)
    await db.commit()
    
    return success_response(message="Module deleted successfully")


# ==================== LESSONS ====================

@router.post("/lessons", response_model=LessonResponse)
async def create_lesson(
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new lesson"""
    # Verify module exists
    result = await db.execute(
        select(Module).where(Module.id == uuid.UUID(lesson_data.module_id))
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise NotFoundException(f"Module not found: {lesson_data.module_id}")
    
    lesson = Lesson(
        module_id=uuid.UUID(lesson_data.module_id),
        title=lesson_data.title,
        description=lesson_data.description,
        sequence=lesson_data.sequence,
        content_type=lesson_data.content_type,
        content=lesson_data.content,
        video_url=lesson_data.video_url,
        video_duration=lesson_data.video_duration,
        file_url=lesson_data.file_url,
        dicom_case_id=lesson_data.dicom_case_id,
        annotation_project_id=uuid.UUID(lesson_data.annotation_project_id) if lesson_data.annotation_project_id else None,
        estimated_minutes=lesson_data.estimated_minutes,
        is_required=lesson_data.is_required
    )
    
    db.add(lesson)
    
    # Update module and course totals
    module.total_lessons += 1
    
    course_result = await db.execute(
        select(Course).where(Course.id == module.course_id)
    )
    course = course_result.scalar_one_or_none()
    if course:
        course.total_lessons += 1
    
    await db.commit()
    await db.refresh(lesson)
    
    return LessonResponse(**lesson.to_dict())


@router.get("/modules/{module_id}/lessons", response_model=LessonListResponse)
async def list_module_lessons(
    module_id: str,
    db: AsyncSession = Depends(get_db)
):
    """List lessons for a module"""
    result = await db.execute(
        select(Lesson)
        .where(Lesson.module_id == uuid.UUID(module_id))
        .order_by(Lesson.sequence)
    )
    lessons = result.scalars().all()
    
    return LessonListResponse(
        lessons=[LessonResponse(**l.to_dict()) for l in lessons],
        total=len(lessons)
    )


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get lesson by ID"""
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise NotFoundException(f"Lesson not found: {lesson_id}")
    
    return LessonResponse(**lesson.to_dict())


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update lesson"""
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise NotFoundException(f"Lesson not found: {lesson_id}")
    
    # Update fields
    update_data = lesson_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)
    
    await db.commit()
    await db.refresh(lesson)
    
    return LessonResponse(**lesson.to_dict())


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete lesson"""
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise NotFoundException(f"Lesson not found: {lesson_id}")
    
    # Update module and course totals
    module_result = await db.execute(
        select(Module).where(Module.id == lesson.module_id)
    )
    module = module_result.scalar_one_or_none()
    if module:
        module.total_lessons -= 1
        
        course_result = await db.execute(
            select(Course).where(Course.id == module.course_id)
        )
        course = course_result.scalar_one_or_none()
        if course:
            course.total_lessons -= 1
    
    await db.delete(lesson)
    await db.commit()
    
    return success_response(message="Lesson deleted successfully")