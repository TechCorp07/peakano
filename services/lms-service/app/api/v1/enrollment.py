"""
LMS API endpoints - Enrollment and Progress Tracking
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
import uuid
from datetime import datetime

from shared.common.database import get_db
from shared.common.responses import success_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.models.course import Course
from app.models.enrollment import Enrollment, LessonProgress, EnrollmentStatus, LessonStatus
from app.models.assessment import Certificate
from app.schemas.enrollment import (
    EnrollmentCreate, EnrollmentResponse, EnrollmentListResponse,
    LessonProgressUpdate, LessonProgressResponse,
    CertificateResponse, CertificateVerifyRequest, CertificateVerifyResponse
)
from app.config import settings

router = APIRouter()


# ==================== ENROLLMENTS ====================

@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    enrollment_data: EnrollmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Enroll in a course"""
    # TODO: Get user_id from JWT token
    user_id = uuid.uuid4()  # Placeholder
    
    # Check if course exists
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(enrollment_data.course_id))
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundException(f"Course not found: {enrollment_data.course_id}")
    
    # Check if already enrolled
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.course_id == uuid.UUID(enrollment_data.course_id),
                Enrollment.user_id == user_id
            )
        )
    )
    if existing.scalar_one_or_none():
        raise BadRequestException("Already enrolled in this course")
    
    # Create enrollment
    enrollment = Enrollment(
        course_id=uuid.UUID(enrollment_data.course_id),
        user_id=user_id,
        total_lessons=course.total_lessons
    )
    
    db.add(enrollment)
    
    # Update course enrollment count
    course.enrollment_count += 1
    
    await db.commit()
    await db.refresh(enrollment)
    
    # TODO: Send enrollment notification
    
    return EnrollmentResponse(**enrollment.to_dict())


@router.get("/enrollments", response_model=EnrollmentListResponse)
async def list_enrollments(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List user enrollments"""
    # TODO: Get user_id from JWT token
    user_id = uuid.uuid4()  # Placeholder
    
    query = select(Enrollment).where(Enrollment.user_id == user_id)
    
    if status:
        query = query.where(Enrollment.status == EnrollmentStatus(status))
    
    query = query.order_by(Enrollment.enrolled_at.desc())
    
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    return EnrollmentListResponse(
        enrollments=[EnrollmentResponse(**e.to_dict()) for e in enrollments],
        total=len(enrollments)
    )


@router.get("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get enrollment by ID"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == uuid.UUID(enrollment_id))
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise NotFoundException(f"Enrollment not found: {enrollment_id}")
    
    return EnrollmentResponse(**enrollment.to_dict())


@router.post("/enrollments/{enrollment_id}/withdraw")
async def withdraw_enrollment(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Withdraw from course"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == uuid.UUID(enrollment_id))
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise NotFoundException(f"Enrollment not found: {enrollment_id}")
    
    enrollment.status = EnrollmentStatus.WITHDRAWN
    
    await db.commit()
    
    return success_response(message="Successfully withdrawn from course")


# ==================== LESSON PROGRESS ====================

@router.post("/lessons/{lesson_id}/progress", response_model=LessonProgressResponse)
async def update_lesson_progress(
    lesson_id: str,
    progress_data: LessonProgressUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update lesson progress"""
    # TODO: Get user_id from JWT token
    user_id = uuid.uuid4()  # Placeholder
    
    # Find enrollment
    # For now, get any active enrollment that contains this lesson
    # In production, you'd need to determine which enrollment based on context
    
    # Get or create lesson progress
    result = await db.execute(
        select(LessonProgress).where(
            and_(
                LessonProgress.lesson_id == uuid.UUID(lesson_id),
                LessonProgress.user_id == user_id
            )
        )
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        # Create new progress record
        # Need to find enrollment_id - simplified for now
        progress = LessonProgress(
            enrollment_id=uuid.uuid4(),  # TODO: Get actual enrollment
            lesson_id=uuid.UUID(lesson_id),
            user_id=user_id
        )
        db.add(progress)
    
    # Update fields
    update_data = progress_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(progress, field, value)
    
    # Mark as completed if threshold met
    if progress_data.completion_percentage and progress_data.completion_percentage >= settings.LESSON_COMPLETION_THRESHOLD:
        if progress.status != LessonStatus.COMPLETED:
            progress.status = LessonStatus.COMPLETED
            progress.completed_at = datetime.utcnow()
    
    progress.last_accessed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(progress)
    
    return LessonProgressResponse(**progress.to_dict())


@router.get("/enrollments/{enrollment_id}/progress")
async def get_enrollment_progress(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed enrollment progress"""
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == uuid.UUID(enrollment_id))
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise NotFoundException(f"Enrollment not found: {enrollment_id}")
    
    # Get lesson progress
    progress_result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.enrollment_id == uuid.UUID(enrollment_id)
        )
    )
    lesson_progress = progress_result.scalars().all()
    
    return {
        "enrollment": EnrollmentResponse(**enrollment.to_dict()),
        "lesson_progress": [LessonProgressResponse(**lp.to_dict()) for lp in lesson_progress]
    }


# ==================== CERTIFICATES ====================

@router.get("/certificates/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get certificate by ID"""
    result = await db.execute(
        select(Certificate).where(Certificate.id == uuid.UUID(certificate_id))
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise NotFoundException(f"Certificate not found: {certificate_id}")
    
    return CertificateResponse(**certificate.to_dict())


@router.post("/certificates/verify", response_model=CertificateVerifyResponse)
async def verify_certificate(
    verify_data: CertificateVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify certificate by verification code"""
    result = await db.execute(
        select(Certificate).where(
            Certificate.verification_code == verify_data.verification_code
        )
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        return CertificateVerifyResponse(
            valid=False,
            certificate=None,
            message="Certificate not found"
        )
    
    if certificate.is_revoked:
        return CertificateVerifyResponse(
            valid=False,
            certificate=CertificateResponse(**certificate.to_dict()),
            message="Certificate has been revoked"
        )
    
    if certificate.expires_at and certificate.expires_at < datetime.utcnow():
        return CertificateVerifyResponse(
            valid=False,
            certificate=CertificateResponse(**certificate.to_dict()),
            message="Certificate has expired"
        )
    
    return CertificateVerifyResponse(
        valid=True,
        certificate=CertificateResponse(**certificate.to_dict()),
        message="Certificate is valid"
    )


@router.get("/users/{user_id}/certificates")
async def list_user_certificates(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """List user certificates"""
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == uuid.UUID(user_id))
        .order_by(Certificate.issued_at.desc())
    )
    certificates = result.scalars().all()
    
    return {
        "certificates": [CertificateResponse(**c.to_dict()) for c in certificates],
        "total": len(certificates)
    }