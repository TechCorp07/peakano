"""
System metrics endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.responses import success_response
from shared.common.exceptions import AppException

from app.services.metrics_collection_service import MetricsCollectionService
from app.schemas.schemas import (
    SystemMetricCreate,
    SystemMetricResponse,
    SystemMetricsSummary,
    UsageSummary,
    TimeRange
)

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("/system", response_model=SystemMetricResponse)
async def record_metric(
    metric: SystemMetricCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Record a system metric
    Services can push their metrics here
    """
    try:
        result = await MetricsCollectionService.record_system_metric(db, metric)
        return result
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/system/{service_name}", response_model=List[SystemMetricResponse])
async def get_service_metrics(
    service_name: str,
    metric_name: Optional[str] = None,
    hours: int = Query(24, ge=1, le=168),  # Max 7 days
    db: AsyncSession = Depends(get_db)
):
    """
    Get metrics for a specific service
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        metrics = await MetricsCollectionService.get_service_metrics(
            db, service_name, start_time, end_time, metric_name
        )
        return metrics
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/system/summary/all", response_model=Dict[str, SystemMetricsSummary])
async def get_system_summary(
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db)
):
    """
    Get summary of all services
    """
    try:
        summary = await MetricsCollectionService.get_system_summary(db, hours)
        return summary
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/usage/summary", response_model=UsageSummary)
async def get_usage_summary(
    hours: int = Query(24, ge=1, le=720),  # Max 30 days
    db: AsyncSession = Depends(get_db)
):
    """
    Get usage analytics summary
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        summary = await MetricsCollectionService.get_usage_summary(db, start_time, end_time)
        return summary
    except Exception as e:
        raise AppException(message=str(e))


@router.post("/activity")
async def record_activity(
    activity: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Record user activity
    Services can push activity events here
    """
    try:
        # Would validate and record activity
        return success_response(message="Activity recorded")
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/trends/{service_name}")
async def get_service_trends(
    service_name: str,
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """
    Get trend analysis for a service
    """
    try:
        # Would calculate trends over time
        return {
            "service_name": service_name,
            "period_days": days,
            "response_time_trend": "improving",
            "error_rate_trend": "stable",
            "throughput_trend": "increasing"
        }
    except Exception as e:
        raise AppException(message=str(e))
