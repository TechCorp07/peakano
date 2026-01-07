"""
LMS API endpoints - Assessment Management
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
import uuid
from datetime import datetime

from shared.common.database import get_db
from shared.common.responses import success_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.models.assessment import Assessment, AssessmentAttempt, AttemptStatus
from app.schemas.enrollment import (
    AssessmentCreate, AssessmentUpdate, AssessmentResponse, AssessmentListResponse,
    AssessmentAttemptStart, AssessmentAttemptSubmit, AssessmentAttemptResponse
)

router = APIRouter()


# ==================== ASSESSMENTS ====================

@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new assessment"""
    # Calculate total points
    total_points = sum(q.get('points', 1) for q in assessment_data.questions)
    
    assessment = Assessment(
        course_id=uuid.UUID(assessment_data.course_id),
        module_id=uuid.UUID(assessment_data.module_id) if assessment_data.module_id else None,
        title=assessment_data.title,
        description=assessment_data.description,
        assessment_type=assessment_data.assessment_type,
        passing_score=assessment_data.passing_score,
        max_attempts=assessment_data.max_attempts,
        time_limit_minutes=assessment_data.time_limit_minutes,
        randomize_questions=assessment_data.randomize_questions,
        show_correct_answers=assessment_data.show_correct_answers,
        questions=assessment_data.questions,
        total_points=total_points,
        is_required=assessment_data.is_required
    )
    
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    
    return AssessmentResponse(**assessment.to_dict())


@router.get("/courses/{course_id}/assessments", response_model=AssessmentListResponse)
async def list_course_assessments(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    """List assessments for a course"""
    result = await db.execute(
        select(Assessment).where(Assessment.course_id == uuid.UUID(course_id))
    )
    assessments = result.scalars().all()
    
    return AssessmentListResponse(
        assessments=[AssessmentResponse(**a.to_dict()) for a in assessments],
        total=len(assessments)
    )


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get assessment by ID"""
    result = await db.execute(
        select(Assessment).where(Assessment.id == uuid.UUID(assessment_id))
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise NotFoundException(f"Assessment not found: {assessment_id}")
    
    return AssessmentResponse(**assessment.to_dict())


# ==================== ASSESSMENT ATTEMPTS ====================

@router.post("/assessments/{assessment_id}/start", response_model=AssessmentAttemptResponse)
async def start_assessment_attempt(
    assessment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Start a new assessment attempt"""
    # TODO: Get user_id from JWT token
    user_id = uuid.uuid4()
    
    # Get assessment
    result = await db.execute(
        select(Assessment).where(Assessment.id == uuid.UUID(assessment_id))
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        raise NotFoundException(f"Assessment not found: {assessment_id}")
    
    # Count existing attempts
    count_result = await db.execute(
        select(func.count(AssessmentAttempt.id)).where(
            and_(
                AssessmentAttempt.assessment_id == uuid.UUID(assessment_id),
                AssessmentAttempt.user_id == user_id
            )
        )
    )
    attempt_count = count_result.scalar()
    
    if attempt_count >= assessment.max_attempts:
        raise BadRequestException("Maximum attempts reached")
    
    # Create attempt
    attempt = AssessmentAttempt(
        assessment_id=uuid.UUID(assessment_id),
        enrollment_id=uuid.uuid4(),  # TODO: Get actual enrollment
        user_id=user_id,
        attempt_number=attempt_count + 1,
        points_possible=assessment.total_points
    )
    
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    
    return AssessmentAttemptResponse(**attempt.to_dict())


@router.post("/attempts/{attempt_id}/submit", response_model=AssessmentAttemptResponse)
async def submit_assessment_attempt(
    attempt_id: str,
    submit_data: AssessmentAttemptSubmit,
    db: AsyncSession = Depends(get_db)
):
    """Submit assessment attempt"""
    result = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == uuid.UUID(attempt_id))
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise NotFoundException(f"Attempt not found: {attempt_id}")
    
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise BadRequestException("Attempt already submitted")
    
    # Get assessment for grading
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == attempt.assessment_id)
    )
    assessment = assessment_result.scalar_one()
    
    # Store answers
    attempt.answers = submit_data.answers
    attempt.submitted_at = datetime.utcnow()
    attempt.status = AttemptStatus.SUBMITTED
    
    # Auto-grade (simplified)
    points_earned = 0
    for question in assessment.questions:
        question_id = question.get('id')
        correct_answer = question.get('correct_answer')
        user_answer = submit_data.answers.get(question_id)
        
        if user_answer == correct_answer:
            points_earned += question.get('points', 1)
    
    attempt.points_earned = points_earned
    attempt.score = int((points_earned / assessment.total_points) * 100) if assessment.total_points > 0 else 0
    attempt.passed = attempt.score >= assessment.passing_score
    attempt.status = AttemptStatus.GRADED
    attempt.graded_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(attempt)
    
    return AssessmentAttemptResponse(**attempt.to_dict())


@router.get("/attempts/{attempt_id}", response_model=AssessmentAttemptResponse)
async def get_assessment_attempt(
    attempt_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get assessment attempt"""
    result = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == uuid.UUID(attempt_id))
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise NotFoundException(f"Attempt not found: {attempt_id}")
    
    return AssessmentAttemptResponse(**attempt.to_dict())


from sqlalchemy import func