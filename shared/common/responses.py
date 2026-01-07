"""
Standard API response schemas
"""
from typing import Any, Optional, Generic, TypeVar, List
from pydantic import BaseModel, Field
from datetime import datetime


T = TypeVar('T')


class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseResponse, Generic[T]):
    """Success response with data"""
    data: Optional[T] = None


class ErrorResponse(BaseResponse):
    """Error response"""
    success: bool = False
    error: str
    details: Optional[dict] = None
    trace_id: Optional[str] = None


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class PaginatedResponse(BaseResponse, Generic[T]):
    """Paginated response with data"""
    data: List[T] = []
    pagination: PaginationMeta


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    version: str
    service: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dependencies: dict = {}


def success_response(
    data: Any = None,
    message: Optional[str] = None
) -> dict:
    """Create success response"""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }


def error_response(
    error: str,
    details: Optional[dict] = None,
    trace_id: Optional[str] = None
) -> dict:
    """Create error response"""
    return {
        "success": False,
        "error": error,
        "details": details,
        "trace_id": trace_id,
        "timestamp": datetime.utcnow().isoformat()
    }


def paginated_response(
    data: List[Any],
    page: int,
    page_size: int,
    total_items: int
) -> dict:
    """Create paginated response"""
    total_pages = (total_items + page_size - 1) // page_size
    
    return {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "timestamp": datetime.utcnow().isoformat()
    }

