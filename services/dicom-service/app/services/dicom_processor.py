"""
DICOM Processing Service
Handles DICOM file processing, metadata extraction, and storage
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime, date
import pydicom
from io import BytesIO
import httpx

logger = logging.getLogger(__name__)


class DicomProcessor:
    """DICOM file processor"""
    
    def __init__(self, storage_service_url: str):
        self.storage_service_url = storage_service_url.rstrip('/')
    
    def extract_metadata(self, dicom_data: bytes) -> Optional[Dict[str, Any]]:
        """Extract metadata from DICOM file"""
        try:
            # Parse DICOM file
            dcm = pydicom.dcmread(BytesIO(dicom_data))
            
            metadata = {
                # Study Level
                "study_instance_uid": self._get_tag(dcm, "StudyInstanceUID"),
                "study_date": self._parse_date(self._get_tag(dcm, "StudyDate")),
                "study_time": self._get_tag(dcm, "StudyTime"),
                "study_description": self._get_tag(dcm, "StudyDescription"),
                "accession_number": self._get_tag(dcm, "AccessionNumber"),
                
                # Patient Level
                "patient_id": self._get_tag(dcm, "PatientID"),
                "patient_name": self._format_name(self._get_tag(dcm, "PatientName")),
                "patient_birth_date": self._parse_date(self._get_tag(dcm, "PatientBirthDate")),
                "patient_sex": self._get_tag(dcm, "PatientSex"),
                "patient_age": self._get_tag(dcm, "PatientAge"),
                
                # Series Level
                "series_instance_uid": self._get_tag(dcm, "SeriesInstanceUID"),
                "series_number": self._get_int(dcm, "SeriesNumber"),
                "series_description": self._get_tag(dcm, "SeriesDescription"),
                "modality": self._get_tag(dcm, "Modality"),
                "body_part_examined": self._get_tag(dcm, "BodyPartExamined"),
                "protocol_name": self._get_tag(dcm, "ProtocolName"),
                
                # Instance Level
                "sop_instance_uid": self._get_tag(dcm, "SOPInstanceUID"),
                "instance_number": self._get_int(dcm, "InstanceNumber"),
                "sop_class_uid": self._get_tag(dcm, "SOPClassUID"),
                
                # Image Information
                "rows": self._get_int(dcm, "Rows"),
                "columns": self._get_int(dcm, "Columns"),
                "bits_allocated": self._get_int(dcm, "BitsAllocated"),
                "bits_stored": self._get_int(dcm, "BitsStored"),
                "slice_thickness": self._get_tag(dcm, "SliceThickness"),
                "pixel_spacing": self._get_tag(dcm, "PixelSpacing"),
                "image_position_patient": self._get_tag(dcm, "ImagePositionPatient"),
                "image_orientation_patient": self._get_tag(dcm, "ImageOrientationPatient"),
                "slice_location": self._get_tag(dcm, "SliceLocation"),
                
                # Institution
                "institution_name": self._get_tag(dcm, "InstitutionName"),
                "referring_physician_name": self._format_name(self._get_tag(dcm, "ReferringPhysicianName")),
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to extract DICOM metadata: {e}")
            return None
    
    def _get_tag(self, dcm, tag_name: str) -> Optional[str]:
        """Safely get DICOM tag value"""
        try:
            if hasattr(dcm, tag_name):
                value = getattr(dcm, tag_name)
                if value is not None:
                    return str(value)
            return None
        except:
            return None
    
    def _get_int(self, dcm, tag_name: str) -> Optional[int]:
        """Safely get integer DICOM tag value"""
        try:
            if hasattr(dcm, tag_name):
                value = getattr(dcm, tag_name)
                if value is not None:
                    return int(value)
            return None
        except:
            return None
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse DICOM date string (YYYYMMDD)"""
        if not date_str or len(date_str) < 8:
            return None
        try:
            year = int(date_str[0:4])
            month = int(date_str[4:6])
            day = int(date_str[6:8])
            return date(year, month, day)
        except:
            return None
    
    def _format_name(self, name: Optional[str]) -> Optional[str]:
        """Format DICOM person name"""
        if not name:
            return None
        # DICOM names are typically: LastName^FirstName^MiddleName
        parts = str(name).split('^')
        if len(parts) > 1:
            return f"{parts[1]} {parts[0]}".strip()
        return str(name).strip()
    
    def get_all_tags(self, dicom_data: bytes) -> Optional[Dict[str, Any]]:
        """Extract all DICOM tags"""
        try:
            dcm = pydicom.dcmread(BytesIO(dicom_data))
            tags = {}
            
            for elem in dcm:
                if elem.VR != 'SQ':  # Skip sequences
                    tag_name = elem.name
                    try:
                        tags[tag_name] = str(elem.value)
                    except:
                        tags[tag_name] = None
            
            return tags
        except Exception as e:
            logger.error(f"Failed to extract all tags: {e}")
            return None
    
    async def upload_to_storage(
        self,
        file_content: bytes,
        filename: str,
        study_uid: str
    ) -> Optional[str]:
        """Upload DICOM file to Storage Service"""
        try:
            async with httpx.AsyncClient() as client:
                files = {'file': (filename, BytesIO(file_content), 'application/dicom')}
                data = {
                    'category': 'dicom',
                    'related_entity_type': 'study',
                    'related_entity_id': study_uid
                }
                
                response = await client.post(
                    f"{self.storage_service_url}/api/v1/storage/upload",
                    files=files,
                    data=data,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if 'file_id' in result:
                        return result['file_id']
                    if result.get('success') and 'data' in result:
                        return result['data']['file_id']
                
                logger.error(f"Storage upload failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to upload to storage: {e}")
            return None
    
    def anonymize_dicom(
        self,
        dicom_data: bytes,
        keep_patient_id: bool = True,
        keep_study_date: bool = True,
        new_patient_id: Optional[str] = None,
        new_patient_name: Optional[str] = None
    ) -> Optional[bytes]:
        """Anonymize DICOM file"""
        try:
            dcm = pydicom.dcmread(BytesIO(dicom_data))
            
            # Remove patient identifiable information
            if not keep_patient_id:
                if new_patient_id:
                    dcm.PatientID = new_patient_id
                else:
                    dcm.PatientID = "ANONYMOUS"
            
            if new_patient_name:
                dcm.PatientName = new_patient_name
            elif hasattr(dcm, 'PatientName'):
                dcm.PatientName = "ANONYMOUS"
            
            if not keep_study_date:
                if hasattr(dcm, 'StudyDate'):
                    dcm.StudyDate = ""
                if hasattr(dcm, 'StudyTime'):
                    dcm.StudyTime = ""
            
            # Remove other identifiable tags
            tags_to_remove = [
                'PatientBirthDate',
                'PatientAddress',
                'PatientTelephoneNumbers',
                'InstitutionAddress',
                'ReferringPhysicianAddress',
                'ReferringPhysicianTelephoneNumbers',
            ]
            
            for tag in tags_to_remove:
                if hasattr(dcm, tag):
                    delattr(dcm, tag)
            
            # Save to bytes
            output = BytesIO()
            dcm.save_as(output)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Failed to anonymize DICOM: {e}")
            return None


# Global processor instance
dicom_processor: Optional[DicomProcessor] = None


def init_dicom_processor(storage_service_url: str):
    """Initialize DICOM processor"""
    global dicom_processor
    dicom_processor = DicomProcessor(storage_service_url)
    logger.info("DICOM processor initialized")


def get_dicom_processor() -> DicomProcessor:
    """Get DICOM processor instance"""
    if dicom_processor is None:
        raise RuntimeError("DICOM processor not initialized")
    return dicom_processor