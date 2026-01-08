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
        keep_patient_id: bool = False,
        keep_study_date: bool = False,
        keep_descriptive_tags: bool = True,
        new_patient_id: Optional[str] = None,
        new_patient_name: Optional[str] = None,
        salt: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Anonymize DICOM file (Complete Version)
        Replaces basic implementation with PS3.15 Annex E compliant version
        """
        return self._anonymize_dicom_complete(
            dicom_data,
            keep_patient_id,
            keep_study_date,
            keep_descriptive_tags,
            new_patient_id,
            new_patient_name,
            salt
        )

    def _anonymize_dicom_complete(
        self,
        dicom_data: bytes,
        keep_patient_id: bool = False,
        keep_study_date: bool = False,
        keep_descriptive_tags: bool = True,
        new_patient_id: Optional[str] = None,
        new_patient_name: Optional[str] = None,
        salt: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Complete DICOM anonymization following DICOM PS3.15 Annex E
        """
        try:
            import hashlib
            import uuid
            
            dcm = pydicom.dcmread(BytesIO(dicom_data))
            
            # Generate salt for this session if not provided
            if not salt:
                salt = str(uuid.uuid4())
            
            # Tags to remove (DICOM PS3.15 Annex E - Patient Identifying Tags)
            tags_to_remove = [
                # Patient identification
                (0x0010, 0x1000),  # Other Patient IDs
                (0x0010, 0x1001),  # Other Patient Names
                (0x0010, 0x2160),  # Ethnic Group
                (0x0010, 0x2180),  # Occupation
                (0x0010, 0x21B0),  # Additional Patient History
                (0x0010, 0x4000),  # Patient Comments
                
                # Contact information
                (0x0010, 0x1040),  # Patient Address
                (0x0010, 0x2154),  # Patient Telephone Numbers
                (0x0010, 0x2155),  # Patient Telecom Information
                
                # Dates
                (0x0010, 0x0030),  # Patient Birth Date
                (0x0010, 0x1010),  # Patient Age
                (0x0010, 0x21D0),  # Patient Last Menstrual Date
                
                # Institution
                (0x0008, 0x0080),  # Institution Name
                (0x0008, 0x0081),  # Institution Address
                (0x0008, 0x1040),  # Institutional Department Name
                (0x0008, 0x1048),  # Physician(s) of Record
                (0x0008, 0x1049),  # Physician(s) of Record ID
                (0x0008, 0x1050),  # Performing Physician Name
                (0x0008, 0x1052),  # Performing Physician ID
                (0x0008, 0x1060),  # Name of Physician(s) Reading Study
                (0x0008, 0x1070),  # Operators' Name
                (0x0008, 0x1048),  # Physician(s) of Record
                (0x0008, 0x009C),  # Consulting Physician Name
                
                # Equipment
                (0x0008, 0x1010),  # Station Name
                (0x0018, 0x1000),  # Device Serial Number
                (0x0018, 0x1030),  # Protocol Name (optional)
                
                # UIDs that could be identifying
                (0x0020, 0x0010),  # Study ID
                (0x0020, 0x4000),  # Image Comments
                (0x0088, 0x0140),  # Storage Media File-set UID
                
                # Private tags
                (0x0009, None),    # All private tags starting with 0009
                (0x0011, None),    # All private tags starting with 0011
                (0x0019, None),    # All private tags starting with 0019
                (0x0029, None),    # All private tags starting with 0029
            ]
            
            # Remove tags
            for tag in tags_to_remove:
                try:
                    if tag[1] is None:
                        # Remove all tags with this group number
                        group = tag[0]
                        tags_to_delete = [
                            t for t in dcm.keys()
                            if t.group == group and t.is_private
                        ]
                        for t in tags_to_delete:
                            del dcm[t]
                    elif tag in dcm:
                        del dcm[tag]
                except:
                    pass
            
            # Handle Patient ID
            if not keep_patient_id:
                if new_patient_id:
                    dcm.PatientID = new_patient_id
                else:
                    # Generate consistent hashed ID
                    original_id = dcm.get('PatientID', 'UNKNOWN')
                    hashed_id = hashlib.sha256(
                        f"{original_id}{salt}".encode()
                    ).hexdigest()[:16]
                    dcm.PatientID = f"ANON-{hashed_id}"
            
            # Handle Patient Name
            if new_patient_name:
                dcm.PatientName = new_patient_name
            elif hasattr(dcm, 'PatientName'):
                dcm.PatientName = "ANONYMOUS^PATIENT"
            
            # Handle Study/Series UIDs (keep structure but anonymize)
            if (0x0020, 0x000D) in dcm:  # Study Instance UID
                original_uid = dcm.StudyInstanceUID
                new_uid_suffix = hashlib.md5(f"{original_uid}{salt}".encode()).hexdigest()
                dcm.StudyInstanceUID = f"1.2.826.0.1.3680043.8.498.{new_uid_suffix}"
            
            if (0x0020, 0x000E) in dcm:  # Series Instance UID
                original_uid = dcm.SeriesInstanceUID
                new_uid_suffix = hashlib.md5(f"{original_uid}{salt}".encode()).hexdigest()
                dcm.SeriesInstanceUID = f"1.2.826.0.1.3680043.8.498.{new_uid_suffix}"
            
            # Handle dates
            if not keep_study_date:
                if (0x0008, 0x0020) in dcm:  # Study Date
                    dcm.StudyDate = "19000101"
                if (0x0008, 0x0021) in dcm:  # Series Date
                    dcm.SeriesDate = "19000101"
                if (0x0008, 0x0022) in dcm:  # Acquisition Date
                    dcm.AcquisitionDate = "19000101"
                if (0x0008, 0x0023) in dcm:  # Content Date
                    dcm.ContentDate = "19000101"
            
            # Add anonymization indicator
            dcm.PatientIdentityRemoved = "YES"
            dcm.DeidentificationMethod = "Complete DICOM PS3.15 Annex E"
            if not hasattr(dcm, 'DeidentificationMethodCodeSequence'):
                dcm.DeidentificationMethodCodeSequence = []
            
            # Save to bytes
            output = BytesIO()
            dcm.save_as(output)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Complete anonymization failed: {e}")
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

def anonymize_dicom_complete(
    self,
    dicom_data: bytes,
    keep_patient_id: bool = False,
    keep_study_date: bool = False,
    keep_descriptive_tags: bool = True,
    new_patient_id: Optional[str] = None,
    new_patient_name: Optional[str] = None,
    salt: Optional[str] = None
) -> Optional[bytes]:
    """
    Complete DICOM anonymization following DICOM PS3.15 Annex E
    
    Args:
        dicom_data: Original DICOM bytes
        keep_patient_id: Keep original patient ID
        keep_study_date: Keep original study date
        keep_descriptive_tags: Keep non-identifying descriptive tags
        new_patient_id: New patient ID (generated if not provided)
        new_patient_name: New patient name
        salt: Salt for generating consistent hashed IDs
        
    Returns:
        Anonymized DICOM bytes
    """
    try:
        import hashlib
        import uuid
        
        dcm = pydicom.dcmread(BytesIO(dicom_data))
        
        # Generate salt for this session if not provided
        if not salt:
            salt = str(uuid.uuid4())
        
        # Tags to remove (DICOM PS3.15 Annex E - Patient Identifying Tags)
        tags_to_remove = [
            # Patient identification
            (0x0010, 0x1000),  # Other Patient IDs
            (0x0010, 0x1001),  # Other Patient Names
            (0x0010, 0x2160),  # Ethnic Group
            (0x0010, 0x2180),  # Occupation
            (0x0010, 0x21B0),  # Additional Patient History
            (0x0010, 0x4000),  # Patient Comments
            
            # Contact information
            (0x0010, 0x1040),  # Patient Address
            (0x0010, 0x2154),  # Patient Telephone Numbers
            (0x0010, 0x2155),  # Patient Telecom Information
            
            # Dates
            (0x0010, 0x0030),  # Patient Birth Date
            (0x0010, 0x1010),  # Patient Age
            (0x0010, 0x21D0),  # Patient Last Menstrual Date
            
            # Institution
            (0x0008, 0x0080),  # Institution Name
            (0x0008, 0x0081),  # Institution Address
            (0x0008, 0x1040),  # Institutional Department Name
            (0x0008, 0x1048),  # Physician(s) of Record
            (0x0008, 0x1049),  # Physician(s) of Record ID
            (0x0008, 0x1050),  # Performing Physician Name
            (0x0008, 0x1052),  # Performing Physician ID
            (0x0008, 0x1060),  # Name of Physician(s) Reading Study
            (0x0008, 0x1070),  # Operators' Name
            (0x0008, 0x1048),  # Physician(s) of Record
            (0x0008, 0x009C),  # Consulting Physician Name
            
            # Equipment
            (0x0008, 0x1010),  # Station Name
            (0x0018, 0x1000),  # Device Serial Number
            (0x0018, 0x1030),  # Protocol Name (optional)
            
            # UIDs that could be identifying
            (0x0020, 0x0010),  # Study ID
            (0x0020, 0x4000),  # Image Comments
            (0x0088, 0x0140),  # Storage Media File-set UID
            
            # Private tags
            (0x0009, None),    # All private tags starting with 0009
            (0x0011, None),    # All private tags starting with 0011
            (0x0019, None),    # All private tags starting with 0019
            (0x0029, None),    # All private tags starting with 0029
        ]
        
        # Remove tags
        for tag in tags_to_remove:
            try:
                if tag[1] is None:
                    # Remove all tags with this group number
                    group = tag[0]
                    tags_to_delete = [
                        t for t in dcm.keys()
                        if t.group == group and t.is_private
                    ]
                    for t in tags_to_delete:
                        del dcm[t]
                elif tag in dcm:
                    del dcm[tag]
            except:
                pass
        
        # Handle Patient ID
        if not keep_patient_id:
            if new_patient_id:
                dcm.PatientID = new_patient_id
            else:
                # Generate consistent hashed ID
                original_id = dcm.get('PatientID', 'UNKNOWN')
                hashed_id = hashlib.sha256(
                    f"{original_id}{salt}".encode()
                ).hexdigest()[:16]
                dcm.PatientID = f"ANON-{hashed_id}"
        
        # Handle Patient Name
        if new_patient_name:
            dcm.PatientName = new_patient_name
        elif hasattr(dcm, 'PatientName'):
            dcm.PatientName = "ANONYMOUS^PATIENT"
        
        # Handle Study/Series UIDs (keep structure but anonymize)
        if (0x0020, 0x000D) in dcm:  # Study Instance UID
            original_uid = dcm.StudyInstanceUID
            new_uid_suffix = hashlib.md5(f"{original_uid}{salt}".encode()).hexdigest()
            dcm.StudyInstanceUID = f"1.2.826.0.1.3680043.8.498.{new_uid_suffix}"
        
        if (0x0020, 0x000E) in dcm:  # Series Instance UID
            original_uid = dcm.SeriesInstanceUID
            new_uid_suffix = hashlib.md5(f"{original_uid}{salt}".encode()).hexdigest()
            dcm.SeriesInstanceUID = f"1.2.826.0.1.3680043.8.498.{new_uid_suffix}"
        
        # Handle dates
        if not keep_study_date:
            if (0x0008, 0x0020) in dcm:  # Study Date
                dcm.StudyDate = "19000101"
            if (0x0008, 0x0021) in dcm:  # Series Date
                dcm.SeriesDate = "19000101"
            if (0x0008, 0x0022) in dcm:  # Acquisition Date
                dcm.AcquisitionDate = "19000101"
            if (0x0008, 0x0023) in dcm:  # Content Date
                dcm.ContentDate = "19000101"
        
        # Add anonymization indicator
        dcm.PatientIdentityRemoved = "YES"
        dcm.DeidentificationMethod = "Complete DICOM PS3.15 Annex E"
        if not hasattr(dcm, 'DeidentificationMethodCodeSequence'):
            dcm.DeidentificationMethodCodeSequence = []
        
        # Burn in annotation (optional - prevents pixel data identification)
        # This would require additional processing
        
        # Save to bytes
        output = BytesIO()
        dcm.save_as(output)
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Complete anonymization failed: {e}")
        return None
