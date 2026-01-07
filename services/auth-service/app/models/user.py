"""
User model for Auth Service
"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from shared.models.base import Base


class UserRole(str, enum.Enum):
    """User roles"""
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    ANNOTATOR = "annotator"
    REVIEWER = "reviewer"
    STUDENT = "student"


class UserStatus(str, enum.Enum):
    """User status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keycloak_id = Column(String(255), unique=True, nullable=True, index=True)
    
    # Basic info
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=True)  # Nullable if using Keycloak
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    
    # Status and role
    role = Column(Enum(UserRole), nullable=False, default=UserRole.ANNOTATOR)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.PENDING)
    
    # Verification
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    
    # Security
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_password_change = Column(DateTime(timezone=True), nullable=True)
    
    # Profile
    profile_image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "keycloak_id": self.keycloak_id,
            "email": self.email,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "phone_number": self.phone_number,
            "role": self.role.value if self.role else None,
            "status": self.status.value if self.status else None,
            "email_verified": self.email_verified,
            "phone_verified": self.phone_verified,
            "is_active": self.is_active,
            "profile_image_url": self.profile_image_url,
            "bio": self.bio,
            "country": self.country,
            "timezone": self.timezone,
            "language": self.language,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

