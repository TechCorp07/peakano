"""
Metrics collection service
Collects system metrics from all services
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta
import httpx
import logging
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException

from app.models.models import SystemMetric, UserActivity, CourseAnalytics, ServiceHealth
from app.schemas.schemas import (
    SystemMetricCreate,
    SystemMetricsSummary,
    UsageSummary,
    ServiceHealthSummary
)
from app.config import settings

logger = logging.getLogger(__name__)


class MetricsCollectionService:
    """Service for collecting metrics from all services"""
    
    @staticmethod
    async def record_system_metric(
        db: AsyncSession,
        metric: SystemMetricCreate
    ) -> SystemMetric:
        """Record a system metric"""
        try:
            db_metric = SystemMetric(
                **metric.model_dump(),
                time=datetime.utcnow()
            )
            db.add(db_metric)
            await db.commit()
            await db.refresh(db_metric)
            return db_metric
        except Exception as e:
            logger.error(f"Error recording system metric: {str(e)}")
            raise AppException(message=f"Failed to record metric: {str(e)}")
    
    @staticmethod
    async def get_service_metrics(
        db: AsyncSession,
        service_name: str,
        start_time: datetime,
        end_time: datetime,
        metric_name: Optional[str] = None
    ) -> List[SystemMetric]:
        """Get metrics for a specific service"""
        try:
            query = select(SystemMetric).where(
                SystemMetric.service_name == service_name,
                SystemMetric.time >= start_time,
                SystemMetric.time <= end_time
            )
            
            if metric_name:
                query = query.where(SystemMetric.metric_name == metric_name)
            
            query = query.order_by(SystemMetric.time.desc())
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error getting service metrics: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def get_system_summary(
        db: AsyncSession,
        period_hours: int = 24
    ) -> Dict[str, SystemMetricsSummary]:
        """Get system-wide metrics summary"""
        try:
            start_time = datetime.utcnow() - timedelta(hours=period_hours)
            
            # Get list of services
            services_query = select(SystemMetric.service_name).distinct()
            services_result = await db.execute(services_query)
            services = [row[0] for row in services_result.fetchall()]
            
            summaries = {}
            for service in services:
                # Get metrics for this service
                metrics = await MetricsCollectionService.get_service_metrics(
                    db, service, start_time, datetime.utcnow()
                )
                
                # Calculate aggregates
                total_requests = len([m for m in metrics if m.metric_name == "request_count"])
                
                response_times = [m.value for m in metrics if m.metric_name == "response_time"]
                avg_response_time = sum(response_times) / len(response_times) if response_times else 0
                
                error_count = len([m for m in metrics if m.metric_name == "error_count"])
                error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
                
                summaries[service] = SystemMetricsSummary(
                    service_name=service,
                    total_requests=total_requests,
                    average_response_time_ms=avg_response_time,
                    error_rate_percent=error_rate,
                    uptime_percent=99.9,  # Calculate from health checks
                    last_updated=datetime.utcnow()
                )
            
            return summaries
        except Exception as e:
            logger.error(f"Error getting system summary: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def collect_from_services():
        """
        Poll all services for their metrics
        This runs periodically in the background
        """
        services = {
            "auth-service": settings.AUTH_SERVICE_URL,
            "storage-service": settings.STORAGE_SERVICE_URL,
            "dicom-service": settings.DICOM_SERVICE_URL,
            "annotation-service": settings.ANNOTATION_SERVICE_URL,
            "lms-service": settings.LMS_SERVICE_URL,
            "ai-service": settings.AI_SERVICE_URL,
            "evaluation-service": settings.EVALUATION_SERVICE_URL,
            "notification-service": settings.NOTIFICATION_SERVICE_URL,
            "websocket-service": settings.WEBSOCKET_SERVICE_URL,
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            for service_name, service_url in services.items():
                try:
                    # Try to hit health endpoint
                    response = await client.get(f"{service_url}/api/v1/health/detailed")
                    
                    if response.status_code == 200:
                        data = response.json()
                        # Record service is healthy
                        logger.info(f"{service_name} is healthy")
                        # Could record metrics here
                    else:
                        logger.warning(f"{service_name} returned {response.status_code}")
                        
                except Exception as e:
                    logger.error(f"Failed to collect from {service_name}: {str(e)}")
    
    @staticmethod
    async def get_usage_summary(
        db: AsyncSession,
        start_time: datetime,
        end_time: datetime
    ) -> UsageSummary:
        """Get usage analytics summary"""
        try:
            # Count active users
            active_users_query = select(func.count(func.distinct(UserActivity.user_id))).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time
            )
            active_users = await db.scalar(active_users_query)
            
            # Count sessions
            sessions_query = select(func.count(func.distinct(UserActivity.session_id))).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time,
                UserActivity.session_id.isnot(None)
            )
            total_sessions = await db.scalar(sessions_query)
            
            # Average session duration
            duration_query = select(func.avg(UserActivity.duration_seconds)).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time,
                UserActivity.duration_seconds.isnot(None)
            )
            avg_duration_seconds = await db.scalar(duration_query) or 0
            
            # Count specific activities
            annotations_query = select(func.count()).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time,
                UserActivity.activity_type == "annotation_create"
            )
            annotations_count = await db.scalar(annotations_query)
            
            assessments_query = select(func.count()).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time,
                UserActivity.activity_type == "assessment_submit"
            )
            assessments_count = await db.scalar(assessments_query)
            
            courses_query = select(func.count()).where(
                UserActivity.time >= start_time,
                UserActivity.time <= end_time,
                UserActivity.activity_type == "course_complete"
            )
            courses_count = await db.scalar(courses_query)
            
            return UsageSummary(
                total_active_users=active_users or 0,
                total_sessions=total_sessions or 0,
                average_session_duration_minutes=avg_duration_seconds / 60,
                total_annotations_created=annotations_count or 0,
                total_assessments_taken=assessments_count or 0,
                total_courses_completed=courses_count or 0,
                period_start=start_time,
                period_end=end_time
            )
        except Exception as e:
            logger.error(f"Error getting usage summary: {str(e)}")
            raise AppException(message=str(e))
    
    @staticmethod
    async def update_course_analytics(
        db: AsyncSession,
        course_id: UUID
    ):
        """
        Update course analytics
        This should be called periodically or triggered by events
        """
        try:
            # This is a placeholder - would query LMS service for actual data
            analytics = await db.execute(
                select(CourseAnalytics).where(CourseAnalytics.course_id == course_id)
            )
            course_analytics = analytics.scalar_one_or_none()
            
            if not course_analytics:
                course_analytics = CourseAnalytics(course_id=course_id)
                db.add(course_analytics)
            
            # Update metrics (placeholder values)
            course_analytics.last_updated = datetime.utcnow()
            
            await db.commit()
            
        except Exception as e:
            logger.error(f"Error updating course analytics: {str(e)}")
            raise AppException(message=str(e))
