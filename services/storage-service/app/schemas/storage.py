"""
Pydantic schemas for Storage Service
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FileCategory(str, Enum):
    """File category"""
    DICOM = "dicom"
    ANNOTATION = "annotation"
    EXPORT = "export"
    AI_MODEL = "ai_model"
    CERTIFICATE = "certificate"
    TEMP = "temp"
    OTHER = "other"


class FileStatus(str, Enum):
    """File status"""
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


# Upload Schemas
class FileUploadRequest(BaseModel):
    """File upload request"""
    category: FileCategory = FileCategory.OTHER
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_public: bool = False


class FileUploadResponse(BaseModel):
    """File upload response"""
    file_id: str
    filename: str
    file_size: int
    bucket_name: str
    object_name: str
    upload_url: Optional[str] = None
    status: str
    created_at: datetime


class MultipartUploadInitRequest(BaseModel):
    """Multipart upload initialization"""
    filename: str
    file_size: int
    content_type: str
    category: FileCategory = FileCategory.OTHER
    chunk_size: int = Field(default=5 * 1024 * 1024, ge=5242880)  # Min 5MB


class MultipartUploadInitResponse(BaseModel):
    """Multipart upload initialization response"""
    upload_id: str
    file_id: str
    total_chunks: int
    chunk_urls: List[str]


# Download Schemas
class FileDownloadRequest(BaseModel):
    """File download request"""
    file_id: str
    generate_url: bool = True
    url_expiry: int = Field(default=300, ge=60, le=3600)  # 1-60 minutes


class FileDownloadResponse(BaseModel):
    """File download response"""
    file_id: str
    filename: str
    file_size: int
    content_type: str
    download_url: Optional[str] = None


# File Info Schemas
class FileInfoResponse(BaseModel):
    """File information response"""
    id: str
    filename: str
    original_filename: str
    file_extension: Optional[str]
    bucket_name: str
    object_name: str
    file_size: int
    content_type: Optional[str]
    category: str
    status: str
    uploaded_by: str
    is_public: bool
    related_entity_type: Optional[str]
    related_entity_id: Optional[str]
    metadata: Optional[Dict[str, Any]]
    tags: Optional[List[str]]
    version: int
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime]
    access_count: int


class FileListRequest(BaseModel):
    """File list request"""
    category: Optional[FileCategory] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    status: Optional[FileStatus] = None
    uploaded_by: Optional[str] = None
    tags: Optional[List[str]] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be "asc" or "desc"')
        return v


class FileListResponse(BaseModel):
    """File list response"""
    files: List[FileInfoResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Delete Schemas
class FileDeleteRequest(BaseModel):
    """File delete request"""
    file_id: str
    permanent: bool = False  # Soft delete by default


class BulkFileDeleteRequest(BaseModel):
    """Bulk file delete request"""
    file_ids: List[str]
    permanent: bool = False


# Presigned URL Schemas
class PresignedUrlRequest(BaseModel):
    """Presigned URL generation request"""
    file_id: str
    expiry: int = Field(default=3600, ge=60, le=86400)  # 1 min - 24 hours
    method: str = Field(default="GET")
    
    @validator('method')
    def validate_method(cls, v):
        if v not in ['GET', 'PUT', 'POST']:
            raise ValueError('method must be GET, PUT, or POST')
        return v


class PresignedUrlResponse(BaseModel):
    """Presigned URL response"""
    file_id: str
    url: str
    expires_in: int
    method: str


# Bucket Schemas
class BucketStatsResponse(BaseModel):
    """Bucket statistics"""
    bucket_name: str
    total_files: int
    total_size: int
    size_by_category: Dict[str, int]


# Copy/Move Schemas
class FileCopyRequest(BaseModel):
    """File copy request"""
    source_file_id: str
    destination_category: Optional[FileCategory] = None
    new_filename: Optional[str] = None


class FileMoveRequest(BaseModel):
    """File move request"""
    file_id: str
    destination_category: FileCategory


# Search Schemas
class FileSearchRequest(BaseModel):
    """File search request"""
    query: str
    category: Optional[FileCategory] = None
    uploaded_by: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_size: Optional[int] = None
    max_size: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)