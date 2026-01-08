"""
Report generation service
Generate PDF and Excel reports
"""
from typing import Dict, Any, List
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import logging
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException

from app.schemas.schemas import ReportRequest, ReportResponse
from app.config import settings

logger = logging.getLogger(__name__)


class ReportService:
    """Service for generating reports"""
    
    @staticmethod
    async def generate_report(
        request: ReportRequest
    ) -> ReportResponse:
        """
        Generate a report based on request parameters
        """
        try:
            report_id = uuid4()
            
            # Validate date range
            if request.end_date < request.start_date:
                raise AppException(message="End date must be after start date")
            
            # Generate report based on type
            if request.report_type == "system":
                report_data = await ReportService._generate_system_report(request)
            elif request.report_type == "usage":
                report_data = await ReportService._generate_usage_report(request)
            elif request.report_type == "learning":
                report_data = await ReportService._generate_learning_report(request)
            elif request.report_type == "custom":
                report_data = await ReportService._generate_custom_report(request)
            else:
                raise AppException(message=f"Unknown report type: {request.report_type}")
            
            # Generate file based on format
            if request.format == "pdf":
                file_path = await ReportService._generate_pdf(report_id, report_data)
            elif request.format == "excel":
                file_path = await ReportService._generate_excel(report_id, report_data)
            elif request.format == "json":
                file_path = await ReportService._generate_json(report_id, report_data)
            else:
                raise AppException(message=f"Unknown format: {request.format}")
            
            # Create download URL (would use Storage Service in production)
            download_url = f"http://localhost:{settings.PORT}/api/v1/reports/download/{report_id}"
            
            # Set expiration
            expires_at = datetime.utcnow() + timedelta(seconds=settings.REPORT_CACHE_TTL)
            
            return ReportResponse(
                report_id=report_id,
                report_type=request.report_type,
                generated_at=datetime.utcnow(),
                download_url=download_url,
                expires_at=expires_at
            )
            
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise AppException(message=f"Report generation failed: {str(e)}")
    
    @staticmethod
    async def _generate_system_report(request: ReportRequest) -> Dict[str, Any]:
        """Generate system metrics report"""
        return {
            "title": "System Metrics Report",
            "period": f"{request.start_date} to {request.end_date}",
            "services": request.services or [],
            "sections": [
                {
                    "title": "Service Health",
                    "data": {
                        "healthy_services": 9,
                        "degraded_services": 0,
                        "down_services": 0
                    }
                },
                {
                    "title": "Performance Metrics",
                    "data": {
                        "average_response_time_ms": 150,
                        "error_rate_percent": 0.5,
                        "uptime_percent": 99.9
                    }
                },
                {
                    "title": "Resource Usage",
                    "data": {
                        "cpu_usage_percent": 45,
                        "memory_usage_percent": 60,
                        "disk_usage_percent": 30
                    }
                }
            ]
        }
    
    @staticmethod
    async def _generate_usage_report(request: ReportRequest) -> Dict[str, Any]:
        """Generate usage analytics report"""
        return {
            "title": "Usage Analytics Report",
            "period": f"{request.start_date} to {request.end_date}",
            "sections": [
                {
                    "title": "Active Users",
                    "data": {
                        "total_active_users": 150,
                        "new_users": 25,
                        "returning_users": 125
                    }
                },
                {
                    "title": "User Activity",
                    "data": {
                        "total_sessions": 500,
                        "average_session_duration_minutes": 45,
                        "annotations_created": 1200,
                        "assessments_taken": 300
                    }
                },
                {
                    "title": "Top Features",
                    "data": [
                        {"feature": "Annotation Tool", "usage_count": 1200},
                        {"feature": "AI Assist", "usage_count": 800},
                        {"feature": "Assessments", "usage_count": 300}
                    ]
                }
            ]
        }
    
    @staticmethod
    async def _generate_learning_report(request: ReportRequest) -> Dict[str, Any]:
        """Generate learning analytics report"""
        return {
            "title": "Learning Analytics Report",
            "period": f"{request.start_date} to {request.end_date}",
            "courses": request.courses or [],
            "sections": [
                {
                    "title": "Course Enrollment",
                    "data": {
                        "total_enrollments": 200,
                        "active_students": 150,
                        "completions": 75
                    }
                },
                {
                    "title": "Student Performance",
                    "data": {
                        "average_score": 85.5,
                        "pass_rate_percent": 92,
                        "completion_rate_percent": 37.5
                    }
                },
                {
                    "title": "Time Metrics",
                    "data": {
                        "average_time_to_complete_hours": 40,
                        "average_study_time_per_week_hours": 5
                    }
                }
            ]
        }
    
    @staticmethod
    async def _generate_custom_report(request: ReportRequest) -> Dict[str, Any]:
        """Generate custom report"""
        return {
            "title": "Custom Report",
            "period": f"{request.start_date} to {request.end_date}",
            "sections": []
        }
    
    @staticmethod
    async def _generate_pdf(report_id: UUID, data: Dict[str, Any]) -> str:
        """
        Generate PDF report
        Placeholder - would use ReportLab or WeasyPrint in production
        """
        logger.info(f"Generating PDF report {report_id}")
        # Would generate actual PDF here
        return f"/tmp/reports/{report_id}.pdf"
    
    @staticmethod
    async def _generate_excel(report_id: UUID, data: Dict[str, Any]) -> str:
        """
        Generate Excel report
        Placeholder - would use openpyxl or xlsxwriter in production
        """
        logger.info(f"Generating Excel report {report_id}")
        # Would generate actual Excel file here
        return f"/tmp/reports/{report_id}.xlsx"
    
    @staticmethod
    async def _generate_json(report_id: UUID, data: Dict[str, Any]) -> str:
        """Generate JSON report"""
        import json
        
        file_path = f"/tmp/reports/{report_id}.json"
        os.makedirs("/tmp/reports", exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        return file_path
