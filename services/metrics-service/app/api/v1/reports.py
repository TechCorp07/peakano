"""
Reports endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.exceptions import AppException

from app.services.report_service import ReportService
from app.schemas.schemas import ReportRequest, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a report based on specifications
    Supports PDF, Excel, and JSON formats
    """
    try:
        report = await ReportService.generate_report(request)
        return report
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/templates")
async def get_report_templates():
    """
    Get available report templates
    """
    return {
        "templates": [
            {
                "id": "system_health",
                "name": "System Health Report",
                "description": "Comprehensive system metrics and health status",
                "type": "system",
                "supported_formats": ["pdf", "excel", "json"]
            },
            {
                "id": "usage_analytics",
                "name": "Usage Analytics Report",
                "description": "User activity and engagement metrics",
                "type": "usage",
                "supported_formats": ["pdf", "excel", "json"]
            },
            {
                "id": "learning_analytics",
                "name": "Learning Analytics Report",
                "description": "Course performance and student progress",
                "type": "learning",
                "supported_formats": ["pdf", "excel", "json"]
            },
            {
                "id": "annotation_quality",
                "name": "Annotation Quality Report",
                "description": "Annotation accuracy and improvement metrics",
                "type": "custom",
                "supported_formats": ["pdf", "excel", "json"]
            }
        ]
    }


@router.get("/scheduled")
async def get_scheduled_reports(
    db: AsyncSession = Depends(get_db)
):
    """
    Get scheduled report configurations
    """
    return {
        "scheduled_reports": []
    }


@router.post("/schedule")
async def schedule_report(
    config: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Schedule a recurring report
    """
    try:
        # Would create scheduled report configuration
        return {
            "message": "Report scheduled successfully",
            "schedule_id": "placeholder"
        }
    except Exception as e:
        raise AppException(message=str(e))
