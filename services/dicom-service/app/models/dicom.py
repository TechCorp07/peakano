"""
DICOM Data Models
Study, Series, Instance hierarchy
"""
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from shared.models.base import Base


class Study(Base):
    """DICOM Study model"""
    __tablename__ = "studies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # DICOM Identifiers
    study_instance_uid = Column(String(255), unique=True, nullable=False, index=True)
    orthanc_id = Column(String(255), unique=True, nullable=True, index=True)
    
    # Patient Information
    patient_id = Column(String(255), nullable=True, index=True)
    patient_name = Column(String(500), nullable=True)
    patient_birth_date = Column(Date, nullable=True)
    patient_sex = Column(String(10), nullable=True)
    patient_age = Column(String(10), nullable=True)
    
    # Study Information
    study_date = Column(Date, nullable=True, index=True)
    study_time = Column(String(50), nullable=True)
    study_description = Column(Text, nullable=True)
    accession_number = Column(String(255), nullable=True, index=True)
    
    # Institution Information
    institution_name = Column(String(500), nullable=True)
    referring_physician_name = Column(String(500), nullable=True)
    
    # Modalities in study
    modalities = Column(JSONB, nullable=True)  # Array of modality strings
    
    # Study Statistics
    number_of_series = Column(Integer, default=0)
    number_of_instances = Column(Integer, default=0)
    
    # Storage Information
    storage_file_id = Column(UUID(as_uuid=True), nullable=True)  # Reference to Storage Service
    total_size = Column(Integer, default=0)  # bytes
    
    # Status
    is_processed = Column(Boolean, default=False)
    is_anonymized = Column(Boolean, default=False)
    
    # Metadata
    dicom_tags = Column(JSONB, nullable=True)  # Full DICOM tags
    
    # Ownership
    uploaded_by = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    series = relationship("Series", back_populates="study", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Study {self.study_instance_uid}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "study_instance_uid": self.study_instance_uid,
            "orthanc_id": self.orthanc_id,
            "patient_id": self.patient_id,
            "patient_name": self.patient_name,
            "patient_birth_date": self.patient_birth_date.isoformat() if self.patient_birth_date else None,
            "patient_sex": self.patient_sex,
            "patient_age": self.patient_age,
            "study_date": self.study_date.isoformat() if self.study_date else None,
            "study_time": self.study_time,
            "study_description": self.study_description,
            "accession_number": self.accession_number,
            "institution_name": self.institution_name,
            "referring_physician_name": self.referring_physician_name,
            "modalities": self.modalities,
            "number_of_series": self.number_of_series,
            "number_of_instances": self.number_of_instances,
            "total_size": self.total_size,
            "is_processed": self.is_processed,
            "is_anonymized": self.is_anonymized,
            "uploaded_by": str(self.uploaded_by) if self.uploaded_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Series(Base):
    """DICOM Series model"""
    __tablename__ = "series"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # DICOM Identifiers
    series_instance_uid = Column(String(255), unique=True, nullable=False, index=True)
    orthanc_id = Column(String(255), unique=True, nullable=True, index=True)
    study_id = Column(UUID(as_uuid=True), ForeignKey('studies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Series Information
    series_number = Column(Integer, nullable=True)
    series_description = Column(Text, nullable=True)
    modality = Column(String(50), nullable=True, index=True)
    
    # Body Part Information
    body_part_examined = Column(String(255), nullable=True)
    protocol_name = Column(String(500), nullable=True)
    
    # Series Statistics
    number_of_instances = Column(Integer, default=0)
    
    # Image Information
    rows = Column(Integer, nullable=True)
    columns = Column(Integer, nullable=True)
    slice_thickness = Column(String(50), nullable=True)
    pixel_spacing = Column(String(100), nullable=True)
    
    # Storage Information
    storage_file_id = Column(UUID(as_uuid=True), nullable=True)
    total_size = Column(Integer, default=0)
    
    # Metadata
    dicom_tags = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    study = relationship("Study", back_populates="series")
    instances = relationship("Instance", back_populates="series", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Series {self.series_instance_uid}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "series_instance_uid": self.series_instance_uid,
            "orthanc_id": self.orthanc_id,
            "study_id": str(self.study_id),
            "series_number": self.series_number,
            "series_description": self.series_description,
            "modality": self.modality,
            "body_part_examined": self.body_part_examined,
            "protocol_name": self.protocol_name,
            "number_of_instances": self.number_of_instances,
            "rows": self.rows,
            "columns": self.columns,
            "slice_thickness": self.slice_thickness,
            "pixel_spacing": self.pixel_spacing,
            "total_size": self.total_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Instance(Base):
    """DICOM Instance model"""
    __tablename__ = "instances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # DICOM Identifiers
    sop_instance_uid = Column(String(255), unique=True, nullable=False, index=True)
    orthanc_id = Column(String(255), unique=True, nullable=True, index=True)
    series_id = Column(UUID(as_uuid=True), ForeignKey('series.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Instance Information
    instance_number = Column(Integer, nullable=True)
    sop_class_uid = Column(String(255), nullable=True)
    
    # Image Information
    rows = Column(Integer, nullable=True)
    columns = Column(Integer, nullable=True)
    bits_allocated = Column(Integer, nullable=True)
    bits_stored = Column(Integer, nullable=True)
    
    # Position Information
    image_position_patient = Column(String(255), nullable=True)
    image_orientation_patient = Column(String(255), nullable=True)
    slice_location = Column(String(50), nullable=True)
    
    # Storage Information
    storage_file_id = Column(UUID(as_uuid=True), nullable=True)
    file_size = Column(Integer, default=0)
    
    # Metadata
    dicom_tags = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    series = relationship("Series", back_populates="instances")
    
    def __repr__(self):
        return f"<Instance {self.sop_instance_uid}>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "sop_instance_uid": self.sop_instance_uid,
            "orthanc_id": self.orthanc_id,
            "series_id": str(self.series_id),
            "instance_number": self.instance_number,
            "sop_class_uid": self.sop_class_uid,
            "rows": self.rows,
            "columns": self.columns,
            "bits_allocated": self.bits_allocated,
            "bits_stored": self.bits_stored,
            "image_position_patient": self.image_position_patient,
            "image_orientation_patient": self.image_orientation_patient,
            "slice_location": self.slice_location,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }