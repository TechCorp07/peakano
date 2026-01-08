"""
Analytics service
Learning analytics and reporting
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import logging
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException

from app.models.models import UserActivity, CourseAnalytics
from app.schemas.schemas import LearningAnalytics, Trend
from app.config import settings

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for learning analytics"""
    
    @staticmethod
    async def get_course_analytics(
        db: AsyncSession,
        course_id: UUID
    ) -> LearningAnalytics:
        """
        Get comprehensive learning analytics for a course
        """
        try:
            # Get course analytics record
            result = await db.execute(
                select(CourseAnalytics).where(CourseAnalytics.course_id == course_id)
            )
            analytics = result.scalar_one_or_none()
            
            if not analytics:
                raise AppException(message="Course analytics not found")
            
            # Calculate completion rate
            completion_rate = (analytics.completion_count / analytics.enrollment_count * 100) \
                if analytics.enrollment_count > 0 else 0
            
            # Calculate average progress (for active students)
            avg_progress = (analytics.active_enrollment_count / analytics.enrollment_count * 100) \
                if analytics.enrollment_count > 0 else 0
            
            # Identify strengths and areas for improvement
            strengths = []
            improvements = []
            
            if analytics.pass_rate and analytics.pass_rate > 80:
                strengths.append("High pass rate indicates effective content")
            
            if analytics.average_score and analytics.average_score > 85:
                strengths.append("Students demonstrate strong understanding")
            
            if analytics.completion_trend == Trend.INCREASING.value:
                strengths.append("Completion rate is trending upward")
            
            if analytics.dropout_count > analytics.completion_count:
                improvements.append("High dropout rate - review course difficulty")
            
            if analytics.average_attempts_per_assessment and analytics.average_attempts_per_assessment > 2:
                improvements.append("Multiple assessment attempts - consider additional support materials")
            
            if analytics.average_completion_time_hours and analytics.average_completion_time_hours > 100:
                improvements.append("Course duration is lengthy - consider breaking into modules")
            
            return LearningAnalytics(
                course_id=course_id,
                course_name=f"Course {course_id}",  # Would fetch from LMS Service
                total_students=analytics.enrollment_count,
                active_students=analytics.active_enrollment_count,
                completion_rate_percent=completion_rate,
                average_progress_percent=avg_progress,
                average_score=analytics.average_score or 0,
                pass_rate_percent=analytics.pass_rate or 0,
                average_time_to_complete_hours=analytics.average_completion_time_hours or 0,
                student_satisfaction_score=None,  # Would fetch from surveys
                strengths=strengths,
                areas_for_improvement=improvements
            )
            
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Error getting course analytics: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def get_user_learning_path(
        db: AsyncSession,
        user_id: UUID,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get user's learning path and progress
        """
        try:
            start_time = datetime.utcnow() - timedelta(days=days)
            
            # Get all learning activities
            query = select(UserActivity).where(
                UserActivity.user_id == user_id,
                UserActivity.activity_category == "learning",
                UserActivity.time >= start_time
            ).order_by(UserActivity.time.asc())
            
            result = await db.execute(query)
            activities = result.scalars().all()
            
            # Aggregate by course
            courses = {}
            for activity in activities:
                if activity.resource_id:
                    course_id = str(activity.resource_id)
                    if course_id not in courses:
                        courses[course_id] = {
                            "course_id": course_id,
                            "activities": [],
                            "total_time_hours": 0,
                            "sessions": 0
                        }
                    
                    courses[course_id]["activities"].append({
                        "type": activity.activity_type,
                        "time": activity.time.isoformat(),
                        "duration": activity.duration_seconds
                    })
                    
                    if activity.duration_seconds:
                        courses[course_id]["total_time_hours"] += activity.duration_seconds / 3600
                    
                    if activity.activity_type in ["course_start", "lesson_start"]:
                        courses[course_id]["sessions"] += 1
            
            return {
                "user_id": str(user_id),
                "period_days": days,
                "total_courses": len(courses),
                "courses": list(courses.values()),
                "total_time_hours": sum(c["total_time_hours"] for c in courses.values())
            }
            
        except Exception as e:
            logger.error(f"Error getting user learning path: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def calculate_trends(
        db: AsyncSession,
        course_id: UUID
    ) -> Dict[str, str]:
        """
        Calculate trends for enrollment, completion, and scores
        """
        try:
            # Get course analytics history (would need a history table in production)
            # For now, return placeholder
            
            return {
                "enrollment_trend": "increasing",
                "completion_trend": "stable",
                "score_trend": "increasing"
            }
            
        except Exception as e:
            logger.error(f"Error calculating trends: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def get_cohort_analysis(
        db: AsyncSession,
        course_id: UUID,
        cohort_start: datetime,
        cohort_end: datetime
    ) -> Dict[str, Any]:
        """
        Analyze a specific cohort of students
        """
        try:
            # Get all students who started in this period
            query = select(UserActivity).where(
                UserActivity.resource_id == course_id,
                UserActivity.activity_type == "course_start",
                UserActivity.time >= cohort_start,
                UserActivity.time <= cohort_end
            )
            
            result = await db.execute(query)
            cohort_students = result.scalars().all()
            
            student_ids = [s.user_id for s in cohort_students]
            
            # Calculate cohort metrics
            total_students = len(student_ids)
            
            # Count completions
            completions_query = select(func.count()).where(
                UserActivity.user_id.in_(student_ids),
                UserActivity.resource_id == course_id,
                UserActivity.activity_type == "course_complete"
            )
            completions = await db.scalar(completions_query) or 0
            
            completion_rate = (completions / total_students * 100) if total_students > 0 else 0
            
            return {
                "course_id": str(course_id),
                "cohort_start": cohort_start.isoformat(),
                "cohort_end": cohort_end.isoformat(),
                "total_students": total_students,
                "completions": completions,
                "completion_rate_percent": completion_rate,
                "average_time_to_complete_days": 0,  # Would calculate from data
                "retention_rate_30d": 0,  # Would calculate
                "retention_rate_60d": 0,
                "retention_rate_90d": 0
            }
            
        except Exception as e:
            logger.error(f"Error in cohort analysis: {str(e)}")
            raise AppException(message=str(e))
