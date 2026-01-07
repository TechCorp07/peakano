"""
MinIO / S3 Client Service
Handles all object storage operations
"""
import logging
from typing import Optional, List, BinaryIO
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from io import BytesIO

logger = logging.getLogger(__name__)


class MinIOClient:
    """MinIO/S3 client wrapper"""
    
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        secure: bool = False,
        region: str = "us-east-1"
    ):
        self.client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
            region=region
        )
        self.region = region
        logger.info(f"MinIO client initialized: {endpoint}")
    
    def create_bucket(self, bucket_name: str) -> bool:
        """Create a bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Bucket created: {bucket_name}")
            return True
        except S3Error as e:
            logger.error(f"Error creating bucket {bucket_name}: {e}")
            return False
    
    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_data: BinaryIO,
        file_size: int,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> bool:
        """Upload a file to MinIO"""
        try:
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type,
                metadata=metadata or {}
            )
            logger.info(f"File uploaded: {bucket_name}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            return False
    
    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> bool:
        """Upload bytes data to MinIO"""
        try:
            data_stream = BytesIO(data)
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data_stream,
                length=len(data),
                content_type=content_type,
                metadata=metadata or {}
            )
            logger.info(f"Bytes uploaded: {bucket_name}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error uploading bytes: {e}")
            return False
    
    def download_file(
        self,
        bucket_name: str,
        object_name: str
    ) -> Optional[bytes]:
        """Download a file from MinIO"""
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            logger.info(f"File downloaded: {bucket_name}/{object_name}")
            return data
        except S3Error as e:
            logger.error(f"Error downloading file: {e}")
            return None
    
    def delete_file(
        self,
        bucket_name: str,
        object_name: str
    ) -> bool:
        """Delete a file from MinIO"""
        try:
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"File deleted: {bucket_name}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def delete_files(
        self,
        bucket_name: str,
        object_names: List[str]
    ) -> bool:
        """Delete multiple files from MinIO"""
        try:
            errors = self.client.remove_objects(
                bucket_name,
                [obj for obj in object_names]
            )
            for error in errors:
                logger.error(f"Error deleting {error.name}: {error}")
            logger.info(f"Bulk delete completed for {len(object_names)} files")
            return True
        except S3Error as e:
            logger.error(f"Error in bulk delete: {e}")
            return False
    
    def file_exists(
        self,
        bucket_name: str,
        object_name: str
    ) -> bool:
        """Check if a file exists"""
        try:
            self.client.stat_object(bucket_name, object_name)
            return True
        except S3Error:
            return False
    
    def get_file_info(
        self,
        bucket_name: str,
        object_name: str
    ) -> Optional[dict]:
        """Get file metadata"""
        try:
            stat = self.client.stat_object(bucket_name, object_name)
            return {
                "size": stat.size,
                "etag": stat.etag,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "metadata": stat.metadata
            }
        except S3Error as e:
            logger.error(f"Error getting file info: {e}")
            return None
    
    def list_files(
        self,
        bucket_name: str,
        prefix: str = "",
        recursive: bool = False
    ) -> List[dict]:
        """List files in a bucket"""
        try:
            objects = self.client.list_objects(
                bucket_name,
                prefix=prefix,
                recursive=recursive
            )
            
            files = []
            for obj in objects:
                files.append({
                    "name": obj.object_name,
                    "size": obj.size,
                    "etag": obj.etag,
                    "last_modified": obj.last_modified,
                    "is_dir": obj.is_dir
                })
            
            logger.info(f"Listed {len(files)} files from {bucket_name}/{prefix}")
            return files
        except S3Error as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def generate_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expiry: int = 3600,
        method: str = "GET"
    ) -> Optional[str]:
        """Generate a presigned URL for file access"""
        try:
            if method.upper() == "PUT":
                url = self.client.presigned_put_object(
                    bucket_name=bucket_name,
                    object_name=object_name,
                    expires=timedelta(seconds=expiry)
                )
            else:
                # Default to GET
                url = self.client.presigned_get_object(
                    bucket_name=bucket_name,
                    object_name=object_name,
                    expires=timedelta(seconds=expiry)
                )
            
            logger.info(f"Presigned URL generated: {bucket_name}/{object_name}")
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None
    
    def generate_upload_url(
        self,
        bucket_name: str,
        object_name: str,
        expiry: int = 3600
    ) -> Optional[str]:
        """Generate a presigned URL for file upload"""
        return self.generate_presigned_url(
            bucket_name,
            object_name,
            expiry,
            method="PUT"
        )
    
    def copy_file(
        self,
        source_bucket: str,
        source_object: str,
        dest_bucket: str,
        dest_object: str
    ) -> bool:
        """Copy a file within MinIO"""
        try:
            from minio.commonconfig import CopySource
            
            self.client.copy_object(
                bucket_name=dest_bucket,
                object_name=dest_object,
                source=CopySource(source_bucket, source_object)
            )
            logger.info(f"File copied: {source_bucket}/{source_object} -> {dest_bucket}/{dest_object}")
            return True
        except S3Error as e:
            logger.error(f"Error copying file: {e}")
            return False
    
    def get_bucket_size(self, bucket_name: str) -> int:
        """Get total size of all objects in a bucket"""
        try:
            objects = self.client.list_objects(bucket_name, recursive=True)
            total_size = sum(obj.size for obj in objects)
            logger.info(f"Bucket {bucket_name} total size: {total_size} bytes")
            return total_size
        except S3Error as e:
            logger.error(f"Error calculating bucket size: {e}")
            return 0


# Global MinIO client instance
minio_client: Optional[MinIOClient] = None


def init_minio(
    endpoint: str,
    access_key: str,
    secret_key: str,
    secure: bool = False,
    region: str = "us-east-1",
    buckets: List[str] = None
):
    """Initialize MinIO client and create buckets"""
    global minio_client
    minio_client = MinIOClient(endpoint, access_key, secret_key, secure, region)
    
    # Create buckets if specified
    if buckets:
        for bucket in buckets:
            minio_client.create_bucket(bucket)
    
    logger.info("MinIO client initialized with buckets")


def get_minio() -> MinIOClient:
    """Get MinIO client instance"""
    if minio_client is None:
        raise RuntimeError("MinIO client not initialized")
    return minio_client