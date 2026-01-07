"""
WebSocket Message Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """WebSocket message types"""
    # Connection
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    HEARTBEAT = "heartbeat"
    
    # Room management
    JOIN_ROOM = "join_room"
    LEAVE_ROOM = "leave_room"
    ROOM_JOINED = "room_joined"
    ROOM_LEFT = "room_left"
    
    # User events
    USER_JOINED = "user.joined"
    USER_LEFT = "user.left"
    USER_TYPING = "user.typing"
    
    # Presence
    PRESENCE_UPDATE = "presence.update"
    PRESENCE_HEARTBEAT = "presence.heartbeat"
    USER_STATUS = "user.status"
    
    # Annotation events
    ANNOTATION_CREATED = "annotation.created"
    ANNOTATION_UPDATED = "annotation.updated"
    ANNOTATION_DELETED = "annotation.deleted"
    
    # Cursor events
    CURSOR_MOVE = "cursor.move"
    CURSOR_ENTER = "cursor.enter"
    CURSOR_LEAVE = "cursor.leave"
    
    # Session events
    SESSION_START = "session.start"
    SESSION_END = "session.end"
    
    # System
    ERROR = "error"
    ACK = "ack"


class WSMessage(BaseModel):
    """Base WebSocket message"""
    type: MessageType
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    data: Optional[Dict[str, Any]] = None


class JoinRoomRequest(BaseModel):
    """Join room request"""
    room_id: str


class LeaveRoomRequest(BaseModel):
    """Leave room request"""
    room_id: str


class PresenceHeartbeatRequest(BaseModel):
    """Presence heartbeat request"""
    status: str = "active"
    metadata: Optional[Dict[str, Any]] = None


class CursorPosition(BaseModel):
    """Cursor position data"""
    x: float
    y: float
    z: Optional[float] = None
    slice_index: Optional[int] = None


class CursorMoveRequest(BaseModel):
    """Cursor move request"""
    room_id: str
    position: CursorPosition


class AnnotationEventRequest(BaseModel):
    """Annotation event request"""
    room_id: str
    annotation_id: str
    annotation_data: Optional[Dict[str, Any]] = None
    action: str  # created, updated, deleted


class AnnotationCreatedEvent(BaseModel):
    """Annotation created event"""
    type: str = "annotation.created"
    user_id: str
    room_id: str
    annotation_id: str
    annotation_data: Dict[str, Any]
    timestamp: str


class AnnotationUpdatedEvent(BaseModel):
    """Annotation updated event"""
    type: str = "annotation.updated"
    user_id: str
    room_id: str
    annotation_id: str
    annotation_data: Dict[str, Any]
    timestamp: str


class AnnotationDeletedEvent(BaseModel):
    """Annotation deleted event"""
    type: str = "annotation.deleted"
    user_id: str
    room_id: str
    annotation_id: str
    timestamp: str


class CursorMoveEvent(BaseModel):
    """Cursor move event"""
    type: str = "cursor.move"
    user_id: str
    username: Optional[str] = None
    room_id: str
    position: CursorPosition
    timestamp: str


class UserJoinedEvent(BaseModel):
    """User joined room event"""
    type: str = "user.joined"
    user_id: str
    username: Optional[str] = None
    room_id: str
    timestamp: str


class UserLeftEvent(BaseModel):
    """User left room event"""
    type: str = "user.left"
    user_id: str
    username: Optional[str] = None
    room_id: str
    timestamp: str


class PresenceUpdateEvent(BaseModel):
    """Presence update event"""
    type: str = "presence.update"
    user_id: str
    status: str
    online_users: List[str]
    room_id: str
    timestamp: str


class ConnectionResponse(BaseModel):
    """Connection established response"""
    type: str = "connected"
    connection_id: str
    user_id: str
    timestamp: str
    message: str = "WebSocket connection established"


class ErrorResponse(BaseModel):
    """Error response"""
    type: str = "error"
    error: str
    details: Optional[str] = None
    timestamp: str


class AckResponse(BaseModel):
    """Acknowledgment response"""
    type: str = "ack"
    message_id: Optional[str] = None
    status: str = "success"
    timestamp: str