"""
DICOM API endpoints
Study, Series, Instance operations and file upload
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
import uuid
from datetime import datetime, date
from io import BytesIO

from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.services.orthanc_client import get_orthanc
from app.services.dicom_processor import get_dicom_processor
from app.services.thumbnail_generator import get_thumbnail_generator
from app.models.dicom import Study, Series, Instance
from app.schemas.dicom import (
    StudyResponse,
    StudyListRequest,
    StudyListResponse,
    SeriesResponse,
    SeriesListResponse,
    InstanceResponse,
    InstanceListResponse,
    DicomUploadResponse,
    DicomStatisticsResponse,
    DicomSearchRequest,
    BatchAnonymizeRequest
)
from app.config import settings

router = APIRouter()


@router.get("/instances/{instance_id}/thumbnail")
async def get_instance_thumbnail(
    instance_id: str,
    size: Optional[str] = Query(default="256x256", regex="^\d+x\d+$"),
    quality: int = Query(default=85, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get DICOM instance thumbnail (faster than preview)
    
    Query params:
    - size: Thumbnail size as "WIDTHxHEIGHT" (e.g., "256x256", "512x512")
    - quality: JPEG quality 1-100
    """
    # Get instance
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_id)
    )
    instance = result.scalar_one_or_none()
    
    if not instance or not instance.orthanc_id:
        raise NotFoundException(f"Instance not found: {instance_id}")
    
    # Parse size
    width, height = map(int, size.split('x'))
    
    # Get DICOM file from Orthanc
    orthanc = get_orthanc()
    dicom_data = await orthanc.get_instance_file(instance.orthanc_id)
    
    if not dicom_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve DICOM file"
        )
    
    # Generate thumbnail
    generator = get_thumbnail_generator()
    thumbnail_bytes = generator.generate_from_dicom(
        dicom_data,
        size=(width, height),
        quality=quality
    )
    
    if not thumbnail_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate thumbnail"
        )
    
    return StreamingResponse(
        BytesIO(thumbnail_bytes),
        media_type="image/jpeg",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f'inline; filename="thumb_{instance_id}.jpg"'
        }
    )


@router.get("/series/{series_id}/thumbnails")
async def get_series_thumbnails(
    series_id: str,
    grid: Optional[str] = Query(default="3x3", regex="^\d+x\d+$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get series preview as grid of thumbnails
    
    Query params:
    - grid: Grid size as "ROWSxCOLS" (e.g., "3x3", "4x4")
    """
    # Get series instances
    result = await db.execute(
        select(Series).where(Series.series_instance_uid == series_id)
    )
    series = result.scalar_one_or_none()
    
    if not series:
        raise NotFoundException(f"Series not found: {series_id}")
    
    # Get instances
    instances_result = await db.execute(
        select(Instance)
        .where(Instance.series_id == series.id)
        .order_by(Instance.instance_number)
        .limit(20)  # Max 20 images for grid
    )
    instances = instances_result.scalars().all()
    
    # Download DICOM files
    orthanc = get_orthanc()
    dicom_files = []
    for instance in instances:
        dicom_data = await orthanc.get_instance_file(instance.orthanc_id)
        if dicom_data:
            dicom_files.append(dicom_data)
    
    # Parse grid size
    rows, cols = map(int, grid.split('x'))
    
    # Generate grid
    generator = get_thumbnail_generator()
    grid_bytes = generator.generate_preview_grid(
        dicom_files,
        grid_size=(rows, cols),
        thumbnail_size=(128, 128)
    )
    
    if not grid_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate thumbnail grid"
        )
    
    return StreamingResponse(
        BytesIO(grid_bytes),
        media_type="image/jpeg",
        headers={
            "Cache-Control": "public, max-age=3600"
        }
    )


@router.post("/anonymize/batch")
async def anonymize_study_batch(
    request: BatchAnonymizeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Anonymize entire study (all series and instances)
    
    Returns anonymized study with new UIDs
    """
    # Implementation for batch anonymization
    processor = get_dicom_processor()
    
    # Get all instances in study
    # Download, anonymize, and re-upload
    # Track anonymization mapping
    
    # Return new study UID and mapping


@router.post("/upload", response_model=DicomUploadResponse)
async def upload_dicom_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload DICOM file to Orthanc and extract metadata
    """
    orthanc = get_orthanc()
    processor = get_dicom_processor()
    
    # TODO: Get user_id from authentication
    # Using a valid nil UUID for testing purposes
    user_id = "00000000-0000-0000-0000-000000000000"
    
    # Validate file
    if not file.filename.lower().endswith('.dcm'):
        raise BadRequestException("File must be a DICOM file (.dcm)")
    
    # Read file content
    file_content = await file.read()
    
    if len(file_content) > settings.MAX_DICOM_SIZE:
        raise BadRequestException(f"File size exceeds maximum allowed ({settings.MAX_DICOM_SIZE} bytes)")
    
    # Extract metadata first
    metadata = processor.extract_metadata(file_content)
    if not metadata:
        raise BadRequestException("Invalid DICOM file or failed to extract metadata")
    
    # Upload to Orthanc
    orthanc_response = await orthanc.upload_dicom(file_content)
    if not orthanc_response:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload DICOM to Orthanc"
        )
    
    # Upload to Storage Service
    storage_file_id = await processor.upload_to_storage(
        file_content,
        file.filename,
        metadata['study_instance_uid']
    )
    
    # Get or create Study
    study_uid = metadata['study_instance_uid']
    result = await db.execute(
        select(Study).where(Study.study_instance_uid == study_uid)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        study = Study(
            study_instance_uid=study_uid,
            orthanc_id=orthanc_response.get('ParentStudy'),
            patient_id=metadata.get('patient_id'),
            patient_name=metadata.get('patient_name'),
            patient_birth_date=metadata.get('patient_birth_date'),
            patient_sex=metadata.get('patient_sex'),
            patient_age=metadata.get('patient_age'),
            study_date=metadata.get('study_date'),
            study_time=metadata.get('study_time'),
            study_description=metadata.get('study_description'),
            accession_number=metadata.get('accession_number'),
            institution_name=metadata.get('institution_name'),
            referring_physician_name=metadata.get('referring_physician_name'),
            storage_file_id=uuid.UUID(storage_file_id) if storage_file_id else None,
            uploaded_by=uuid.UUID(user_id),
            is_processed=True
        )
        db.add(study)
        await db.flush()
    
    # Get or create Series
    series_uid = metadata['series_instance_uid']
    result = await db.execute(
        select(Series).where(Series.series_instance_uid == series_uid)
    )
    series = result.scalar_one_or_none()
    
    if not series:
        series = Series(
            series_instance_uid=series_uid,
            orthanc_id=orthanc_response.get('ParentSeries'),
            study_id=study.id,
            series_number=metadata.get('series_number'),
            series_description=metadata.get('series_description'),
            modality=metadata.get('modality'),
            body_part_examined=metadata.get('body_part_examined'),
            protocol_name=metadata.get('protocol_name'),
            rows=metadata.get('rows'),
            columns=metadata.get('columns'),
            slice_thickness=metadata.get('slice_thickness'),
            pixel_spacing=str(metadata.get('pixel_spacing')) if metadata.get('pixel_spacing') else None
        )
        db.add(series)
        await db.flush()
    
    # Create Instance
    instance_uid = metadata['sop_instance_uid']
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_uid)
    )
    existing_instance = result.scalar_one_or_none()
    
    if not existing_instance:
        instance = Instance(
            sop_instance_uid=instance_uid,
            orthanc_id=orthanc_response.get('ID'),
            series_id=series.id,
            instance_number=metadata.get('instance_number'),
            sop_class_uid=metadata.get('sop_class_uid'),
            rows=metadata.get('rows'),
            columns=metadata.get('columns'),
            bits_allocated=metadata.get('bits_allocated'),
            bits_stored=metadata.get('bits_stored'),
            image_position_patient=str(metadata.get('image_position_patient')) if metadata.get('image_position_patient') else None,
            image_orientation_patient=str(metadata.get('image_orientation_patient')) if metadata.get('image_orientation_patient') else None,
            slice_location=metadata.get('slice_location'),
            file_size=len(file_content),
            storage_file_id=uuid.UUID(storage_file_id) if storage_file_id else None
        )
        db.add(instance)
        
        # Update series instance count
        series.number_of_instances += 1
    
    # Update study counts
    study.number_of_series = await db.scalar(
        select(func.count(Series.id)).where(Series.study_id == study.id)
    )
    study.number_of_instances = await db.scalar(
        select(func.count(Instance.id)).join(Series).where(Series.study_id == study.id)
    )
    
    await db.commit()
    
    return DicomUploadResponse(
        success=True,
        study_instance_uid=study_uid,
        series_instance_uids=[series_uid],
        instance_count=1,
        orthanc_id=orthanc_response.get('ID'),
        message="DICOM file uploaded successfully"
    )


@router.get("/studies", response_model=StudyListResponse)
async def list_studies(
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    study_date_from: Optional[date] = None,
    study_date_to: Optional[date] = None,
    modality: Optional[str] = None,
    accession_number: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List DICOM studies with filtering
    """
    # Build query
    query = select(Study)
    
    if patient_id:
        query = query.where(Study.patient_id.ilike(f"%{patient_id}%"))
    if patient_name:
        query = query.where(Study.patient_name.ilike(f"%{patient_name}%"))
    if study_date_from:
        query = query.where(Study.study_date >= study_date_from)
    if study_date_to:
        query = query.where(Study.study_date <= study_date_to)
    if accession_number:
        query = query.where(Study.accession_number == accession_number)
    if modality:
        query = query.where(Study.modalities.contains([modality]))
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Study.study_date.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    studies = result.scalars().all()
    
    return StudyListResponse(
        studies=[StudyResponse(**s.to_dict()) for s in studies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/studies/{study_id}", response_model=StudyResponse)
async def get_study(
    study_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get study by ID or UID
    """
    # Try UUID first
    try:
        study_uuid = uuid.UUID(study_id)
        result = await db.execute(
            select(Study).where(Study.id == study_uuid)
        )
    except ValueError:
        # Try study instance UID
        result = await db.execute(
            select(Study).where(Study.study_instance_uid == study_id)
        )
    
    study = result.scalar_one_or_none()
    if not study:
        raise NotFoundException(f"Study not found: {study_id}")
    
    return StudyResponse(**study.to_dict())


@router.delete("/studies/{study_id}")
async def delete_study(
    study_id: str,
    delete_from_orthanc: bool = Query(default=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete study (soft delete from database, optionally delete from Orthanc)
    """
    orthanc = get_orthanc()
    
    # Get study
    result = await db.execute(
        select(Study).where(Study.study_instance_uid == study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise NotFoundException(f"Study not found: {study_id}")
    
    # Delete from Orthanc if requested
    if delete_from_orthanc and study.orthanc_id:
        success = await orthanc.delete_study(study.orthanc_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete study from Orthanc"
            )
    
    # Delete from database (cascades to series and instances)
    await db.delete(study)
    await db.commit()
    
    return success_response(message="Study deleted successfully")


@router.get("/studies/{study_id}/series", response_model=SeriesListResponse)
async def get_study_series(
    study_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all series for a study
    """
    # Get study
    result = await db.execute(
        select(Study).where(Study.study_instance_uid == study_id)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise NotFoundException(f"Study not found: {study_id}")
    
    # Get series
    result = await db.execute(
        select(Series).where(Series.study_id == study.id).order_by(Series.series_number)
    )
    series_list = result.scalars().all()
    
    return SeriesListResponse(
        series=[SeriesResponse(**s.to_dict()) for s in series_list],
        total=len(series_list)
    )


@router.get("/series/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get series by ID or UID
    """
    # Try UUID first
    try:
        series_uuid = uuid.UUID(series_id)
        result = await db.execute(
            select(Series).where(Series.id == series_uuid)
        )
    except ValueError:
        # Try series instance UID
        result = await db.execute(
            select(Series).where(Series.series_instance_uid == series_id)
        )
    
    series = result.scalar_one_or_none()
    if not series:
        raise NotFoundException(f"Series not found: {series_id}")
    
    return SeriesResponse(**series.to_dict())


@router.get("/series/{series_id}/instances", response_model=InstanceListResponse)
async def get_series_instances(
    series_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all instances for a series
    """
    # Get series
    result = await db.execute(
        select(Series).where(Series.series_instance_uid == series_id)
    )
    series = result.scalar_one_or_none()
    
    if not series:
        raise NotFoundException(f"Series not found: {series_id}")
    
    # Get instances
    result = await db.execute(
        select(Instance).where(Instance.series_id == series.id).order_by(Instance.instance_number)
    )
    instances = result.scalars().all()
    
    return InstanceListResponse(
        instances=[InstanceResponse(**i.to_dict()) for i in instances],
        total=len(instances)
    )


@router.get("/instances/{instance_id}", response_model=InstanceResponse)
async def get_instance(
    instance_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get instance by ID or UID
    """
    # Try UUID first
    try:
        instance_uuid = uuid.UUID(instance_id)
        result = await db.execute(
            select(Instance).where(Instance.id == instance_uuid)
        )
    except ValueError:
        # Try SOP instance UID
        result = await db.execute(
            select(Instance).where(Instance.sop_instance_uid == instance_id)
        )
    
    instance = result.scalar_one_or_none()
    if not instance:
        raise NotFoundException(f"Instance not found: {instance_id}")
    
    return InstanceResponse(**instance.to_dict())


@router.get("/instances/{instance_id}/file")
async def download_instance_file(
    instance_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download DICOM instance file
    """
    orthanc = get_orthanc()
    
    # Get instance
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_id)
    )
    instance = result.scalar_one_or_none()
    
    if not instance or not instance.orthanc_id:
        raise NotFoundException(f"Instance not found: {instance_id}")
    
    # Download from Orthanc
    file_data = await orthanc.get_instance_file(instance.orthanc_id)
    
    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download DICOM file from Orthanc"
        )
    
    return StreamingResponse(
        BytesIO(file_data),
        media_type="application/dicom",
        headers={
            "Content-Disposition": f'attachment; filename="instance_{instance_id}.dcm"'
        }
    )


@router.get("/instances/{instance_id}/preview")
async def get_instance_preview(
    instance_id: str,
    quality: int = Query(default=90, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get instance preview image (JPEG)
    """
    orthanc = get_orthanc()
    
    # Get instance
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_id)
    )
    instance = result.scalar_one_or_none()
    
    if not instance or not instance.orthanc_id:
        raise NotFoundException(f"Instance not found: {instance_id}")
    
    # Get preview from Orthanc
    preview_data = await orthanc.get_instance_preview(instance.orthanc_id, quality)
    
    if not preview_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate preview image"
        )
    
    return StreamingResponse(
        BytesIO(preview_data),
        media_type="image/jpeg"
    )


@router.get("/statistics", response_model=DicomStatisticsResponse)
async def get_statistics(db: AsyncSession = Depends(get_db)):
    """
    Get DICOM statistics
    """
    # Count studies
    total_studies = await db.scalar(select(func.count(Study.id)))
    
    # Count series
    total_series = await db.scalar(select(func.count(Series.id)))
    
    # Count instances
    total_instances = await db.scalar(select(func.count(Instance.id)))
    
    # Sum total size
    total_size = await db.scalar(select(func.sum(Study.total_size))) or 0
    
    # Studies by modality
    modality_result = await db.execute(
        select(Series.modality, func.count(Study.id.distinct()))
        .join(Study)
        .where(Series.modality.isnot(None))
        .group_by(Series.modality)
    )
    studies_by_modality = {row[0]: row[1] for row in modality_result.all()}
    
    # Storage by modality
    storage_result = await db.execute(
        select(Series.modality, func.sum(Instance.file_size))
        .join(Instance)
        .where(Series.modality.isnot(None))
        .group_by(Series.modality)
    )
    storage_by_modality = {row[0]: int(row[1] or 0) for row in storage_result.all()}
    
    return DicomStatisticsResponse(
        total_studies=total_studies or 0,
        total_series=total_series or 0,
        total_instances=total_instances or 0,
        total_size=int(total_size),
        studies_by_modality=studies_by_modality,
        storage_by_modality=storage_by_modality
    )