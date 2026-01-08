"""
Storage API endpoints
File upload, download, delete, and management
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
import uuid
from datetime import datetime, timedelta
import hashlib
import os

from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.services.minio_client import get_minio
from app.models.file_metadata import FileMetadata, FileCategory, FileStatus
from app.schemas.storage import (
    FileUploadRequest,
    FileUploadResponse,
    FileDownloadResponse,
    FileInfoResponse,
    FileListRequest,
    FileListResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    BucketStatsResponse,
    FileCopyRequest,
    FileDeleteRequest,
    BulkFileDeleteRequest
)
from app.config import settings

router = APIRouter()


def get_bucket_for_category(category: FileCategory) -> str:
    """Get bucket name for file category"""
    bucket_map = {
        FileCategory.DICOM: settings.BUCKET_DICOM,
        FileCategory.ANNOTATION: settings.BUCKET_ANNOTATIONS,
        FileCategory.EXPORT: settings.BUCKET_EXPORTS,
        FileCategory.AI_MODEL: settings.BUCKET_AI_MODELS,
        FileCategory.CERTIFICATE: settings.BUCKET_CERTIFICATES,
        FileCategory.TEMP: settings.BUCKET_TEMP,
        FileCategory.OTHER: settings.BUCKET_TEMP,
    }
    return bucket_map.get(category, settings.BUCKET_TEMP)


def generate_object_name(filename: str, user_id: str, category: FileCategory) -> str:
    """Generate unique object name"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    file_id = str(uuid.uuid4())[:8]
    name, ext = os.path.splitext(filename)
    return f"{category.value}/{user_id}/{timestamp}_{file_id}{ext}"


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(default="other"),
    related_entity_type: Optional[str] = Form(default=None),
    related_entity_id: Optional[str] = Form(default=None),
    is_public: bool = Form(default=False),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file to storage
    """
    minio = get_minio()
    
    # TODO: Get user_id from authentication
    user_id = "00000000-0000-0000-0000-000000000000"
    
    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise BadRequestException(f"File size exceeds maximum allowed ({settings.MAX_UPLOAD_SIZE} bytes)")
    
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise BadRequestException(f"File type {file_extension} not allowed")
    
    # Get bucket and generate object name
    file_category = FileCategory(category)
    bucket_name = get_bucket_for_category(file_category)
    object_name = generate_object_name(file.filename, user_id, file_category)
    
    # Calculate checksum
    file_content = await file.read()
    checksum = hashlib.md5(file_content).hexdigest()
    file.file.seek(0)
    
    # Upload to MinIO
    from io import BytesIO
    success = minio.upload_file_encrypted(
        bucket_name=bucket_name,
        object_name=object_name,
        file_data=BytesIO(file_content),
        file_size=file_size,
        content_type=file.content_type or "application/octet-stream"
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage"
        )
    
    # Save metadata to database
    file_metadata = FileMetadata(
        filename=file.filename,
        original_filename=file.filename,
        file_extension=file_extension,
        bucket_name=bucket_name,
        object_name=object_name,
        file_size=file_size,
        content_type=file.content_type,
        checksum=checksum,
        category=file_category,
        status=FileStatus.COMPLETED,
        uploaded_by=uuid.UUID(user_id),
        is_public=is_public,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id
    )
    
    db.add(file_metadata)
    await db.commit()
    await db.refresh(file_metadata)
    
    return FileUploadResponse(
        file_id=str(file_metadata.id),
        filename=file_metadata.filename,
        file_size=file_metadata.file_size,
        bucket_name=file_metadata.bucket_name,
        object_name=file_metadata.object_name,
        status=file_metadata.status.value,
        created_at=file_metadata.created_at
    )


@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    generate_url: bool = False,  # Deprecated parameter
    db: AsyncSession = Depends(get_db)
):
    """
    Download a file (decrypted stream only)
    Note: generate_url is disabled due to encryption enforcement
    """
    minio = get_minio()
    
    # Get file metadata
    result = await db.execute(
        select(FileMetadata).where(FileMetadata.id == uuid.UUID(file_id))
    )
    file_metadata = result.scalar_one_or_none()
    
    if not file_metadata:
        raise NotFoundException(f"File not found: {file_id}")
    
    if file_metadata.status == FileStatus.DELETED:
        raise NotFoundException("File has been deleted")
    
    # Update access tracking
    file_metadata.last_accessed_at = datetime.utcnow()
    file_metadata.access_count += 1
    await db.commit()
    
    if generate_url:
        # Encryption prevents using presigned URLs
        raise BadRequestException("Presigned URLs are disabled when encryption is enabled. Please download the file directly.")
    
    # Stream file directly (decrypted on the fly)
    file_data = minio.download_file_decrypted(
        bucket_name=file_metadata.bucket_name,
        object_name=file_metadata.object_name
    )
    
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download file from storage"
        )
    
    from io import BytesIO
    return StreamingResponse(
        BytesIO(file_data),
        media_type=file_metadata.content_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{file_metadata.filename}"'
        }
    )


@router.get("/files/{file_id}", response_model=FileInfoResponse)
async def get_file_info(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get file metadata
    """
    result = await db.execute(
        select(FileMetadata).where(FileMetadata.id == uuid.UUID(file_id))
    )
    file_metadata = result.scalar_one_or_none()
    
    if not file_metadata:
        raise NotFoundException(f"File not found: {file_id}")
    
    return FileInfoResponse(**file_metadata.to_dict())


@router.get("/files", response_model=FileListResponse)
async def list_files(
    category: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    List files with filtering
    """
    # Build query
    query = select(FileMetadata).where(
        FileMetadata.status != FileStatus.DELETED
    )
    
    if category:
        query = query.where(FileMetadata.category == FileCategory(category))
    if related_entity_type:
        query = query.where(FileMetadata.related_entity_type == related_entity_type)
    if related_entity_id:
        query = query.where(FileMetadata.related_entity_id == related_entity_id)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(FileMetadata.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    files = result.scalars().all()
    
    return FileListResponse(
        files=[FileInfoResponse(**f.to_dict()) for f in files],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    permanent: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file (soft delete by default)
    """
    minio = get_minio()
    
    # Get file metadata
    result = await db.execute(
        select(FileMetadata).where(FileMetadata.id == uuid.UUID(file_id))
    )
    file_metadata = result.scalar_one_or_none()
    
    if not file_metadata:
        raise NotFoundException(f"File not found: {file_id}")
    
    if permanent:
        # Delete from MinIO
        success = minio.delete_file(
            bucket_name=file_metadata.bucket_name,
            object_name=file_metadata.object_name
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file from storage"
            )
        
        # Delete from database
        await db.delete(file_metadata)
    else:
        # Soft delete
        file_metadata.status = FileStatus.DELETED
        file_metadata.deleted_at = datetime.utcnow()
    
    await db.commit()
    
    return success_response(
        message=f"File {'permanently ' if permanent else ''}deleted successfully"
    )


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(
    request: PresignedUrlRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a presigned URL for file access
    DISABLED: Presigned URLs are not supported with encryption enabled.
    """
    raise BadRequestException(
        "Presigned URLs are disabled when encryption is enabled. "
        "Files must be accessed via the storage service API to handle decryption."
    )
    
    # Dead code below - kept for reference if encryption is disabled
    # minio = get_minio()
    # ... (rest of logic)


@router.get("/stats/{bucket_name}", response_model=BucketStatsResponse)
async def get_bucket_stats(
    bucket_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get storage statistics for a bucket
    """
    # Count files
    count_result = await db.execute(
        select(func.count()).where(
            and_(
                FileMetadata.bucket_name == bucket_name,
                FileMetadata.status != FileStatus.DELETED
            )
        )
    )
    total_files = count_result.scalar()
    
    # Sum file sizes
    size_result = await db.execute(
        select(func.sum(FileMetadata.file_size)).where(
            and_(
                FileMetadata.bucket_name == bucket_name,
                FileMetadata.status != FileStatus.DELETED
            )
        )
    )
    total_size = size_result.scalar() or 0
    
    # Size by category
    category_result = await db.execute(
        select(
            FileMetadata.category,
            func.sum(FileMetadata.file_size)
        ).where(
            and_(
                FileMetadata.bucket_name == bucket_name,
                FileMetadata.status != FileStatus.DELETED
            )
        ).group_by(FileMetadata.category)
    )
    
    size_by_category = {
        row[0].value: row[1] for row in category_result.all()
    }
    
    return BucketStatsResponse(
        bucket_name=bucket_name,
        total_files=total_files,
        total_size=total_size,
        size_by_category=size_by_category
    )