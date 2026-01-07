"""
Orthanc DICOM Server Client
Handles all communication with Orthanc server
"""
import logging
import httpx
from typing import Optional, List, Dict, Any
import base64

logger = logging.getLogger(__name__)


class OrthancClient:
    """Orthanc DICOM server client"""
    
    def __init__(self, url: str, username: str, password: str):
        self.url = url.rstrip('/')
        self.username = username
        self.password = password
        
        # Create basic auth header
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"Orthanc client initialized: {url}")
    
    async def check_connection(self) -> bool:
        """Check if Orthanc is accessible"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/system",
                    headers=self.headers,
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Orthanc connection failed: {e}")
            return False
    
    async def get_system_info(self) -> Optional[Dict[str, Any]]:
        """Get Orthanc system information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/system",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get system info: {e}")
            return None
    
    # Study Operations
    async def get_all_studies(self) -> List[str]:
        """Get list of all study IDs"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/studies",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Failed to get studies: {e}")
            return []
    
    async def get_study(self, study_id: str) -> Optional[Dict[str, Any]]:
        """Get study information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/studies/{study_id}",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get study {study_id}: {e}")
            return None
    
    async def get_study_tags(self, study_id: str) -> Optional[Dict[str, Any]]:
        """Get study DICOM tags"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/studies/{study_id}/simplified-tags",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get study tags {study_id}: {e}")
            return None
    
    async def delete_study(self, study_id: str) -> bool:
        """Delete a study from Orthanc"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.url}/studies/{study_id}",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to delete study {study_id}: {e}")
            return False
    
    # Series Operations
    async def get_series(self, series_id: str) -> Optional[Dict[str, Any]]:
        """Get series information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/series/{series_id}",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get series {series_id}: {e}")
            return None
    
    async def get_series_tags(self, series_id: str) -> Optional[Dict[str, Any]]:
        """Get series DICOM tags"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/series/{series_id}/simplified-tags",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get series tags {series_id}: {e}")
            return None
    
    # Instance Operations
    async def get_instance(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """Get instance information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/instances/{instance_id}",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get instance {instance_id}: {e}")
            return None
    
    async def get_instance_tags(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """Get instance DICOM tags"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/instances/{instance_id}/simplified-tags",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get instance tags {instance_id}: {e}")
            return None
    
    async def get_instance_file(self, instance_id: str) -> Optional[bytes]:
        """Download instance DICOM file"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/instances/{instance_id}/file",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.content
                return None
        except Exception as e:
            logger.error(f"Failed to download instance {instance_id}: {e}")
            return None
    
    async def get_instance_preview(
        self,
        instance_id: str,
        quality: int = 90
    ) -> Optional[bytes]:
        """Get instance preview image (JPEG)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/instances/{instance_id}/preview",
                    headers=self.headers,
                    params={"quality": quality}
                )
                if response.status_code == 200:
                    return response.content
                return None
        except Exception as e:
            logger.error(f"Failed to get preview for {instance_id}: {e}")
            return None
    
    # Upload Operations
    async def upload_dicom(self, file_content: bytes) -> Optional[Dict[str, Any]]:
        """Upload DICOM file to Orthanc"""
        try:
            async with httpx.AsyncClient() as client:
                headers = self.headers.copy()
                headers["Content-Type"] = "application/dicom"
                
                response = await client.post(
                    f"{self.url}/instances",
                    headers=headers,
                    content=file_content,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Upload failed: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Failed to upload DICOM: {e}")
            return None
    
    # Search Operations
    async def find_studies(
        self,
        patient_id: Optional[str] = None,
        patient_name: Optional[str] = None,
        study_date: Optional[str] = None,
        modality: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for studies"""
        try:
            query = {}
            if patient_id:
                query["PatientID"] = patient_id
            if patient_name:
                query["PatientName"] = patient_name
            if study_date:
                query["StudyDate"] = study_date
            if modality:
                query["ModalitiesInStudy"] = modality
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.url}/tools/find",
                    headers=self.headers,
                    json={
                        "Level": "Study",
                        "Query": query,
                        "Expand": True
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            logger.error(f"Study search failed: {e}")
            return []
    
    # Statistics
    async def get_statistics(self) -> Optional[Dict[str, Any]]:
        """Get Orthanc statistics"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/statistics",
                    headers=self.headers
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return None


# Global Orthanc client instance
orthanc_client: Optional[OrthancClient] = None


def init_orthanc(url: str, username: str, password: str):
    """Initialize Orthanc client"""
    global orthanc_client
    orthanc_client = OrthancClient(url, username, password)
    logger.info("Orthanc client initialized")


def get_orthanc() -> OrthancClient:
    """Get Orthanc client instance"""
    if orthanc_client is None:
        raise RuntimeError("Orthanc client not initialized")
    return orthanc_client