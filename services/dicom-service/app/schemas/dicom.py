"""
Pydantic schemas for DICOM Service
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# Study Schemas
class StudyResponse(BaseModel):
    """Study response"""
    id: str
    study_instance_uid: str
    orthanc_id: Optional[str]
    patient_id: Optional[str]
    patient_name: Optional[str]
    patient_birth_date: Optional[date]
    patient_sex: Optional[str]
    patient_age: Optional[str]
    study_date: Optional[date]
    study_time: Optional[str]
    study_description: Optional[str]
    accession_number: Optional[str]
    institution_name: Optional[str]
    referring_physician_name: Optional[str]
    modalities: Optional[List[str]]
    number_of_series: int
    number_of_instances: int
    total_size: int
    is_processed: bool
    is_anonymized: bool
    uploaded_by: Optional[str]
    created_at: datetime
    updated_at: datetime


class StudyListRequest(BaseModel):
    """Study list request"""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    study_date_from: Optional[date] = None
    study_date_to: Optional[date] = None
    modality: Optional[str] = None
    accession_number: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class StudyListResponse(BaseModel):
    """Study list response"""
    studies: List[StudyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Series Schemas
class SeriesResponse(BaseModel):
    """Series response"""
    id: str
    series_instance_uid: str
    orthanc_id: Optional[str]
    study_id: str
    series_number: Optional[int]
    series_description: Optional[str]
    modality: Optional[str]
    body_part_examined: Optional[str]
    protocol_name: Optional[str]
    number_of_instances: int
    rows: Optional[int]
    columns: Optional[int]
    slice_thickness: Optional[str]
    pixel_spacing: Optional[str]
    total_size: int
    created_at: datetime
    updated_at: datetime


class SeriesListResponse(BaseModel):
    """Series list response"""
    series: List[SeriesResponse]
    total: int


# Instance Schemas
class InstanceResponse(BaseModel):
    """Instance response"""
    id: str
    sop_instance_uid: str
    orthanc_id: Optional[str]
    series_id: str
    instance_number: Optional[int]
    sop_class_uid: Optional[str]
    rows: Optional[int]
    columns: Optional[int]
    bits_allocated: Optional[int]
    bits_stored: Optional[int]
    image_position_patient: Optional[str]
    image_orientation_patient: Optional[str]
    slice_location: Optional[str]
    file_size: int
    created_at: datetime
    updated_at: datetime


class InstanceListResponse(BaseModel):
    """Instance list response"""
    instances: List[InstanceResponse]
    total: int


# Upload Schemas
class DicomUploadResponse(BaseModel):
    """DICOM upload response"""
    success: bool
    study_instance_uid: str
    series_instance_uids: List[str]
    instance_count: int
    orthanc_id: Optional[str]
    message: str


# Statistics Schemas
class DicomStatisticsResponse(BaseModel):
    """DICOM statistics response"""
    total_studies: int
    total_series: int
    total_instances: int
    total_size: int
    studies_by_modality: Dict[str, int]
    storage_by_modality: Dict[str, int]


# Search Schemas
class DicomSearchRequest(BaseModel):
    """DICOM search request"""
    query: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    study_date_from: Optional[date] = None
    study_date_to: Optional[date] = None
    modality: Optional[str] = None
    body_part: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# Tag Schemas
class DicomTagsResponse(BaseModel):
    """DICOM tags response"""
    study_instance_uid: str
    tags: Dict[str, Any]


# Preview Schemas
class InstancePreviewRequest(BaseModel):
    """Instance preview request"""
    instance_id: str
    quality: int = Field(default=90, ge=1, le=100)


# Anonymization Schemas
class AnonymizeRequest(BaseModel):
    """Anonymization request"""
    study_id: str
    keep_patient_id: bool = True
    keep_study_date: bool = True
    new_patient_id: Optional[str] = None
    new_patient_name: Optional[str] = None


class AnonymizeResponse(BaseModel):
    """Anonymization response"""
    success: bool
    original_study_id: str
    new_study_id: Optional[str]
    message: str

class BatchAnonymizeRequest(BaseModel):
    """Batch anonymization request"""
    study_ids: List[str]
    keep_patient_id: bool = False
    keep_study_date: bool = False
    keep_descriptive_tags: bool = True
    new_patient_prefix: Optional[str] = "ANON"
    salt: Optional[str] = None