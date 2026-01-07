"""
File metadata model for Storage Service
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Enum, Boolean, BigInteger, Text, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from shared.models.base import Base


class FileCategory(str, enum.Enum):
    """File category types"""
    DICOM = "dicom"
    ANNOTATION = "annotation"
    EXPORT = "export"
    AI_MODEL = "ai_model"
    CERTIFICATE = "certificate"
    TEMP = "temp"
    OTHER = "other"
    
    def __str__(self):
        return self.value


class FileStatus(str, enum.Enum):
    """File status"""
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"
    
    def __str__(self):
        return self.value


# Custom type decorator for PostgreSQL enums
class PgEnum(TypeDecorator):
    """Custom type to handle PostgreSQL enum columns"""
    impl = String
    cache_ok = True
    
    def __init__(self, enum_class, name):
        self.enum_class = enum_class
        self.name = name
        super().__init__()
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import ENUM
            return dialect.type_descriptor(ENUM(self.enum_class, name=self.name, create_type=False))
        else:
            return dialect.type_descriptor(String(50))


class FileMetadata(Base):
    """File metadata model"""
    __tablename__ = "file_metadata"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # File identification
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_extension = Column(String(50), nullable=True)
    
    # Storage location
    bucket_name = Column(String(100), nullable=False, index=True)
    object_name = Column(String(500), nullable=False, index=True)
    
    # File properties
    file_size = Column(BigInteger, nullable=False)  # bytes
    content_type = Column(String(200), nullable=True)
    checksum = Column(String(64), nullable=True)  # MD5 or SHA256
    
    # Classification  
    category = Column(Enum(FileCategory, name='filecategory', create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=FileCategory.OTHER, index=True)
    status = Column(Enum(FileStatus, name='filestatus', create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=FileStatus.UPLOADING, index=True)
    
    # Ownership and access
    uploaded_by = Column(UUID(as_uuid=True), nullable=False, index=True)  # User ID
    is_public = Column(Boolean, default=False)
    
    # Associations (optional)
    related_entity_type = Column(String(50), nullable=True)  # e.g., "study", "annotation", "course"
    related_entity_id = Column(String(100), nullable=True, index=True)
    
    # Additional metadata
    file_metadata = Column(JSONB, nullable=True)  # Flexible JSON storage
    tags = Column(JSONB, nullable=True)  # Array of tags
    
    # Versioning
    version = Column(Integer, default=1)
    parent_file_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Expiration (for temporary files)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)
    access_count = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<FileMetadata {self.filename} ({self.file_size} bytes)>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_extension": self.file_extension,
            "bucket_name": self.bucket_name,
            "object_name": self.object_name,
            "file_size": self.file_size,
            "content_type": self.content_type,
            "checksum": self.checksum,
            "category": self.category.value if self.category else None,
            "status": self.status.value if self.status else None,
            "uploaded_by": str(self.uploaded_by),
            "is_public": self.is_public,
            "related_entity_type": self.related_entity_type,
            "related_entity_id": self.related_entity_id,
            "metadata": self.file_metadata,
            "tags": self.tags,
            "version": self.version,
            "parent_file_id": str(self.parent_file_id) if self.parent_file_id else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "access_count": self.access_count,
        }