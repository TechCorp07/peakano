"""
Custom exceptions for the application
"""
from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class BadRequestException(AppException):
    """400 Bad Request"""
    
    def __init__(self, message: str = "Bad Request", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)


class UnauthorizedException(AppException):
    """401 Unauthorized"""
    
    def __init__(self, message: str = "Unauthorized", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class ForbiddenException(AppException):
    """403 Forbidden"""
    
    def __init__(self, message: str = "Forbidden", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class NotFoundException(AppException):
    """404 Not Found"""
    
    def __init__(self, message: str = "Not Found", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class ConflictException(AppException):
    """409 Conflict"""
    
    def __init__(self, message: str = "Conflict", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_409_CONFLICT, details)


class ValidationException(AppException):
    """422 Validation Error"""
    
    def __init__(self, message: str = "Validation Error", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class ServiceUnavailableException(AppException):
    """503 Service Unavailable"""
    
    def __init__(self, message: str = "Service Unavailable", details: Optional[Dict] = None):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, details)


# Database exceptions
class DatabaseException(AppException):
    """Database operation failed"""
    pass


class RecordNotFoundException(NotFoundException):
    """Database record not found"""
    
    def __init__(self, model: str, identifier: Any):
        super().__init__(f"{model} with id '{identifier}' not found")


class DuplicateRecordException(ConflictException):
    """Duplicate record in database"""
    pass


# Auth exceptions
class InvalidCredentialsException(UnauthorizedException):
    """Invalid username or password"""
    
    def __init__(self):
        super().__init__("Invalid credentials")


class TokenExpiredException(UnauthorizedException):
    """JWT token has expired"""
    
    def __init__(self):
        super().__init__("Token has expired")


class InvalidTokenException(UnauthorizedException):
    """Invalid JWT token"""
    
    def __init__(self):
        super().__init__("Invalid token")


class InsufficientPermissionsException(ForbiddenException):
    """User lacks required permissions"""
    
    def __init__(self, required_permission: str):
        super().__init__(f"Insufficient permissions: requires '{required_permission}'")


# Business logic exceptions
class AnnotationException(AppException):
    """Annotation-related error"""
    pass


class DICOMException(AppException):
    """DICOM processing error"""
    pass


class AIInferenceException(AppException):
    """AI inference error"""
    pass


class EvaluationException(AppException):
    """Evaluation error"""
    pass
