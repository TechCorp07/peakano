"""
DICOMweb REST API Endpoints
Implements WADO-RS, QIDO-RS, STOW-RS protocols
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
import uuid
from datetime import datetime
import json
from io import BytesIO

from shared.common.database import get_db
from shared.common.exceptions import NotFoundException, BadRequestException
from app.models.dicom import Study, Series, Instance
from app.services.orthanc_client import get_orthanc
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dicomweb", tags=["DICOMweb"])


# ==================== WADO-RS (Retrieve) ====================

@router.get("/studies/{study_uid}")
async def wado_retrieve_study(
    study_uid: str,
    accept: Optional[str] = Query(default="multipart/related; type=application/dicom"),
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS: Retrieve Study
    GET /dicomweb/studies/{study_uid}
    
    Returns all instances in study as multipart/related
    """
    # Get study
    result = await db.execute(
        select(Study).where(Study.study_instance_uid == study_uid)
    )
    study = result.scalar_one_or_none()
    
    if not study:
        raise NotFoundException(f"Study not found: {study_uid}")
    
    # Get all instances
    instances_result = await db.execute(
        select(Instance)
        .join(Series)
        .where(Series.study_id == study.id)
    )
    instances = instances_result.scalars().all()
    
    if not instances:
        raise NotFoundException(f"No instances found for study: {study_uid}")
    
    # Download instances from Orthanc
    orthanc = get_orthanc()
    dicom_files = []
    
    for instance in instances:
        if instance.orthanc_id:
            dicom_data = await orthanc.get_instance_file(instance.orthanc_id)
            if dicom_data:
                dicom_files.append(dicom_data)
    
    # Return as multipart/related
    return _create_multipart_response(dicom_files, "application/dicom")


@router.get("/studies/{study_uid}/series/{series_uid}")
async def wado_retrieve_series(
    study_uid: str,
    series_uid: str,
    accept: Optional[str] = Query(default="multipart/related; type=application/dicom"),
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS: Retrieve Series
    GET /dicomweb/studies/{study_uid}/series/{series_uid}
    """
    # Get series
    result = await db.execute(
        select(Series).where(Series.series_instance_uid == series_uid)
    )
    series = result.scalar_one_or_none()
    
    if not series:
        raise NotFoundException(f"Series not found: {series_uid}")
    
    # Get instances
    instances_result = await db.execute(
        select(Instance).where(Instance.series_id == series.id)
    )
    instances = instances_result.scalars().all()
    
    # Download instances
    orthanc = get_orthanc()
    dicom_files = []
    
    for instance in instances:
        if instance.orthanc_id:
            dicom_data = await orthanc.get_instance_file(instance.orthanc_id)
            if dicom_data:
                dicom_files.append(dicom_data)
    
    return _create_multipart_response(dicom_files, "application/dicom")


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{instance_uid}")
async def wado_retrieve_instance(
    study_uid: str,
    series_uid: str,
    instance_uid: str,
    accept: Optional[str] = Query(default="application/dicom"),
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS: Retrieve Instance
    GET /dicomweb/studies/{study_uid}/series/{series_uid}/instances/{instance_uid}
    """
    # Get instance
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_uid)
    )
    instance = result.scalar_one_or_none()
    
    if not instance or not instance.orthanc_id:
        raise NotFoundException(f"Instance not found: {instance_uid}")
    
    # Download from Orthanc
    orthanc = get_orthanc()
    dicom_data = await orthanc.get_instance_file(instance.orthanc_id)
    
    if not dicom_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve DICOM file"
        )
    
    # Return based on Accept header
    if "application/dicom" in accept:
        return Response(
            content=dicom_data,
            media_type="application/dicom",
            headers={
                "Content-Disposition": f'attachment; filename="{instance_uid}.dcm"'
            }
        )
    elif "image/jpeg" in accept or "image/png" in accept:
        # Return rendered image
        # TODO: Implement image rendering
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Image rendering not yet implemented"
        )
    else:
        return _create_multipart_response([dicom_data], "application/dicom")


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{instance_uid}/frames/{frame_number}")
async def wado_retrieve_frame(
    study_uid: str,
    series_uid: str,
    instance_uid: str,
    frame_number: int,
    accept: Optional[str] = Query(default="image/jpeg"),
    db: AsyncSession = Depends(get_db)
):
    """
    WADO-RS: Retrieve Frame
    GET /dicomweb/.../frames/{frame_number}
    """
    # Get instance
    result = await db.execute(
        select(Instance).where(Instance.sop_instance_uid == instance_uid)
    )
    instance = result.scalar_one_or_none()
    
    if not instance or not instance.orthanc_id:
        raise NotFoundException(f"Instance not found: {instance_uid}")
    
    # Get frame from Orthanc
    orthanc = get_orthanc()
    frame_data = await orthanc.get_instance_frame(
        instance.orthanc_id,
        frame_number - 1  # Orthanc uses 0-based indexing
    )
    
    if not frame_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve frame {frame_number}"
        )
    
    media_type = "image/jpeg" if "jpeg" in accept else "application/octet-stream"
    
    return Response(
        content=frame_data,
        media_type=media_type
    )


# ==================== QIDO-RS (Query) ====================

@router.get("/studies")
async def qido_search_studies(
    PatientID: Optional[str] = Query(default=None),
    PatientName: Optional[str] = Query(default=None),
    StudyInstanceUID: Optional[str] = Query(default=None),
    StudyDate: Optional[str] = Query(default=None),
    StudyTime: Optional[str] = Query(default=None),
    AccessionNumber: Optional[str] = Query(default=None),
    ModalitiesInStudy: Optional[str] = Query(default=None),
    StudyDescription: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS: Search for Studies
    GET /dicomweb/studies?[query parameters]
    
    Query parameters follow DICOM attribute names
    """
    # Build query
    query = select(Study)
    
    if PatientID:
        query = query.where(Study.patient_id.ilike(f"%{PatientID}%"))
    if PatientName:
        query = query.where(Study.patient_name.ilike(f"%{PatientName}%"))
    if StudyInstanceUID:
        query = query.where(Study.study_instance_uid == StudyInstanceUID)
    if AccessionNumber:
        query = query.where(Study.accession_number == AccessionNumber)
    if StudyDescription:
        query = query.where(Study.study_description.ilike(f"%{StudyDescription}%"))
    
    # Date range
    if StudyDate:
        # Handle DICOM date range format: YYYYMMDD-YYYYMMDD
        if '-' in StudyDate:
            start_date, end_date = StudyDate.split('-')
            query = query.where(
                and_(
                    Study.study_date >= datetime.strptime(start_date, "%Y%m%d").date(),
                    Study.study_date <= datetime.strptime(end_date, "%Y%m%d").date()
                )
            )
        else:
            query = query.where(Study.study_date == datetime.strptime(StudyDate, "%Y%m%d").date())
    
    # Pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    studies = result.scalars().all()
    
    # Convert to DICOM JSON format
    dicom_json = []
    for study in studies:
        dicom_json.append(_study_to_dicom_json(study))
    
    return Response(
        content=json.dumps(dicom_json),
        media_type="application/dicom+json"
    )


@router.get("/studies/{study_uid}/series")
async def qido_search_series(
    study_uid: str,
    Modality: Optional[str] = Query(default=None),
    SeriesInstanceUID: Optional[str] = Query(default=None),
    SeriesNumber: Optional[int] = Query(default=None),
    SeriesDescription: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS: Search for Series
    GET /dicomweb/studies/{study_uid}/series?[query parameters]
    """
    # Get study
    study_result = await db.execute(
        select(Study).where(Study.study_instance_uid == study_uid)
    )
    study = study_result.scalar_one_or_none()
    
    if not study:
        raise NotFoundException(f"Study not found: {study_uid}")
    
    # Build query
    query = select(Series).where(Series.study_id == study.id)
    
    if Modality:
        query = query.where(Series.modality == Modality)
    if SeriesInstanceUID:
        query = query.where(Series.series_instance_uid == SeriesInstanceUID)
    if SeriesNumber:
        query = query.where(Series.series_number == SeriesNumber)
    if SeriesDescription:
        query = query.where(Series.series_description.ilike(f"%{SeriesDescription}%"))
    
    # Pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    series_list = result.scalars().all()
    
    # Convert to DICOM JSON
    dicom_json = []
    for series in series_list:
        dicom_json.append(_series_to_dicom_json(series))
    
    return Response(
        content=json.dumps(dicom_json),
        media_type="application/dicom+json"
    )


@router.get("/studies/{study_uid}/series/{series_uid}/instances")
async def qido_search_instances(
    study_uid: str,
    series_uid: str,
    SOPInstanceUID: Optional[str] = Query(default=None),
    InstanceNumber: Optional[int] = Query(default=None),
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    QIDO-RS: Search for Instances
    GET /dicomweb/studies/{study_uid}/series/{series_uid}/instances?[query parameters]
    """
    # Get series
    series_result = await db.execute(
        select(Series).where(Series.series_instance_uid == series_uid)
    )
    series = series_result.scalar_one_or_none()
    
    if not series:
        raise NotFoundException(f"Series not found: {series_uid}")
    
    # Build query
    query = select(Instance).where(Instance.series_id == series.id)
    
    if SOPInstanceUID:
        query = query.where(Instance.sop_instance_uid == SOPInstanceUID)
    if InstanceNumber:
        query = query.where(Instance.instance_number == InstanceNumber)
    
    # Pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    instances = result.scalars().all()
    
    # Convert to DICOM JSON
    dicom_json = []
    for instance in instances:
        dicom_json.append(_instance_to_dicom_json(instance))
    
    return Response(
        content=json.dumps(dicom_json),
        media_type="application/dicom+json"
    )


# ==================== STOW-RS (Store) ====================

@router.post("/studies")
async def stow_store_instances(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    STOW-RS: Store Instances
    POST /dicomweb/studies
    
    Content-Type: multipart/related; type="application/dicom"
    """
    content_type = request.headers.get("content-type", "")
    
    if "multipart/related" not in content_type:
        raise BadRequestException("Content-Type must be multipart/related")
    
    # Parse multipart body
    body = await request.body()
    dicom_files = _parse_multipart_dicom(body, content_type)
    
    if not dicom_files:
        raise BadRequestException("No DICOM files found in request")
    
    # Store each DICOM file
    orthanc = get_orthanc()
    results = []
    
    for dicom_data in dicom_files:
        try:
            # Upload to Orthanc
            response = await orthanc.upload_dicom(dicom_data)
            
            if response:
                results.append({
                    "SOPInstanceUID": response.get("ID"),
                    "RetrieveURL": f"/dicomweb/studies/{response.get('ParentStudy')}/series/{response.get('ParentSeries')}/instances/{response.get('ID')}",
                    "Status": "Success"
                })
            else:
                results.append({
                    "Status": "Failed",
                    "FailureReason": "Upload to PACS failed"
                })
                
        except Exception as e:
            logger.error(f"STOW-RS upload failed: {e}")
            results.append({
                "Status": "Failed",
                "FailureReason": str(e)
            })
    
    # Return DICOM JSON response
    return Response(
        content=json.dumps({
            "00081199": {  # Referenced SOP Sequence
                "Value": results
            }
        }),
        media_type="application/dicom+json",
        status_code=status.HTTP_200_OK
    )


# ==================== Helper Functions ====================

def _create_multipart_response(dicom_files: List[bytes], content_type: str) -> Response:
    """Create multipart/related response"""
    import email.mime.multipart
    import email.mime.application
    
    # Create multipart message
    msg = email.mime.multipart.MIMEMultipart('related', type=content_type)
    
    for dicom_data in dicom_files:
        part = email.mime.application.MIMEApplication(
            dicom_data,
            'dicom',
            email.encoders.encode_base64
        )
        msg.attach(part)
    
    # Convert to bytes
    response_body = msg.as_bytes()
    
    return Response(
        content=response_body,
        media_type=f'multipart/related; type="{content_type}"; boundary={msg.get_boundary()}'
    )


def _parse_multipart_dicom(body: bytes, content_type: str) -> List[bytes]:
    """Parse multipart/related DICOM request"""
    import email
    from email import policy
    
    # Parse multipart message
    msg = email.message_from_bytes(
        b'Content-Type: ' + content_type.encode() + b'\r\n\r\n' + body,
        policy=policy.default
    )
    
    dicom_files = []
    
    for part in msg.iter_parts():
        if part.get_content_type() == 'application/dicom':
            dicom_files.append(part.get_payload(decode=True))
    
    return dicom_files


def _study_to_dicom_json(study: Study) -> dict:
    """Convert Study model to DICOM JSON format"""
    return {
        "00100020": {"vr": "LO", "Value": [study.patient_id or ""]},  # Patient ID
        "00100010": {"vr": "PN", "Value": [{"Alphabetic": study.patient_name or ""}]},  # Patient Name
        "0020000D": {"vr": "UI", "Value": [study.study_instance_uid]},  # Study Instance UID
        "00080020": {"vr": "DA", "Value": [study.study_date.strftime("%Y%m%d") if study.study_date else ""]},  # Study Date
        "00080030": {"vr": "TM", "Value": [study.study_time or ""]},  # Study Time
        "00080050": {"vr": "SH", "Value": [study.accession_number or ""]},  # Accession Number
        "00081030": {"vr": "LO", "Value": [study.study_description or ""]},  # Study Description
        "00080061": {"vr": "CS", "Value": study.modalities or []},  # Modalities in Study
        "00201206": {"vr": "IS", "Value": [str(study.number_of_series)]},  # Number of Series
        "00201208": {"vr": "IS", "Value": [str(study.number_of_instances)]},  # Number of Instances
    }


def _series_to_dicom_json(series: Series) -> dict:
    """Convert Series model to DICOM JSON format"""
    return {
        "0020000E": {"vr": "UI", "Value": [series.series_instance_uid]},  # Series Instance UID
        "00200011": {"vr": "IS", "Value": [str(series.series_number or 0)]},  # Series Number
        "0008103E": {"vr": "LO", "Value": [series.series_description or ""]},  # Series Description
        "00080060": {"vr": "CS", "Value": [series.modality or ""]},  # Modality
        "00201209": {"vr": "IS", "Value": [str(series.number_of_instances)]},  # Number of Instances
    }


def _instance_to_dicom_json(instance: Instance) -> dict:
    """Convert Instance model to DICOM JSON format"""
    return {
        "00080018": {"vr": "UI", "Value": [instance.sop_instance_uid]},  # SOP Instance UID
        "00080016": {"vr": "UI", "Value": [instance.sop_class_uid or ""]},  # SOP Class UID
        "00200013": {"vr": "IS", "Value": [str(instance.instance_number or 0)]},  # Instance Number
        "00280010": {"vr": "US", "Value": [instance.rows or 0]},  # Rows
        "00280011": {"vr": "US", "Value": [instance.columns or 0]},  # Columns
    }
