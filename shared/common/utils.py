"""
Common utility functions
"""
import uuid
import hashlib
import secrets
from typing import Any, Optional
from datetime import datetime, timedelta
import pytz


def generate_uuid() -> str:
    """Generate a UUID4 string"""
    return str(uuid.uuid4())


def generate_short_id(length: int = 8) -> str:
    """Generate a short random ID"""
    return secrets.token_urlsafe(length)[:length]


def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(pytz.UTC)


def datetime_to_str(dt: datetime, format: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Convert datetime to string"""
    return dt.strftime(format)


def str_to_datetime(dt_str: str, format: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """Convert string to datetime"""
    return datetime.strptime(dt_str, format)


def add_days(dt: datetime, days: int) -> datetime:
    """Add days to datetime"""
    return dt + timedelta(days=days)


def add_hours(dt: datetime, hours: int) -> datetime:
    """Add hours to datetime"""
    return dt + timedelta(hours=hours)


def add_minutes(dt: datetime, minutes: int) -> datetime:
    """Add minutes to datetime"""
    return dt + timedelta(minutes=minutes)


def is_expired(dt: datetime) -> bool:
    """Check if datetime is in the past"""
    return dt < utc_now()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove path separators and other dangerous characters
    dangerous_chars = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    return filename


def calculate_dice_coefficient(pred: set, truth: set) -> float:
    """
    Calculate Dice coefficient between two sets
    Dice = 2 * |A ∩ B| / (|A| + |B|)
    """
    if len(pred) == 0 and len(truth) == 0:
        return 1.0
    if len(pred) == 0 or len(truth) == 0:
        return 0.0
    
    intersection = len(pred.intersection(truth))
    return 2.0 * intersection / (len(pred) + len(truth))


def calculate_iou(pred: set, truth: set) -> float:
    """
    Calculate Intersection over Union (IoU)
    IoU = |A ∩ B| / |A âˆª B|
    """
    if len(pred) == 0 and len(truth) == 0:
        return 1.0
    if len(pred) == 0 or len(truth) == 0:
        return 0.0
    
    intersection = len(pred.intersection(truth))
    union = len(pred.union(truth))
    return intersection / union


def truncate_string(text: str, max_length: int = 100) -> str:
    """Truncate string to max length with ellipsis"""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def parse_boolean(value: Any) -> bool:
    """Parse various boolean representations"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    if isinstance(value, int):
        return value != 0
    return False


def bytes_to_human_readable(bytes_size: int) -> str:
    """Convert bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} PB"
