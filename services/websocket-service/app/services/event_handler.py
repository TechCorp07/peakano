"""
WebSocket Event Handler
Processes different types of WebSocket events
"""
import logging
import json
from typing import Dict, Any
from datetime import datetime

from app.services.connection_manager import get_connection_manager
from app.services.presence_manager import get_presence_manager
from app.schemas.websocket import (
    JoinRoomRequest,
    LeaveRoomRequest,
    PresenceHeartbeatRequest,
    CursorMoveRequest,
    AnnotationEventRequest,
    AnnotationCreatedEvent,
    AnnotationUpdatedEvent,
    AnnotationDeletedEvent,
    CursorMoveEvent,
    PresenceUpdateEvent,
    ErrorResponse
)

logger = logging.getLogger(__name__)


class EventHandler:
    """Handle WebSocket events"""
    
    def __init__(self):
        self.manager = get_connection_manager()
        logger.info("Event handler initialized")
    
    async def handle_message(
        self,
        connection_id: str,
        message: Dict[str, Any]
    ):
        """Route message to appropriate handler"""
        msg_type = message.get("type")
        
        if not msg_type:
            await self._send_error(connection_id, "Missing message type")
            return
        
        try:
            # Route to handler
            if msg_type == "join_room":
                await self.handle_join_room(connection_id, message)
            elif msg_type == "leave_room":
                await self.handle_leave_room(connection_id, message)
            elif msg_type == "heartbeat" or msg_type == "presence.heartbeat":
                await self.handle_heartbeat(connection_id, message)
            elif msg_type == "cursor.move":
                await self.handle_cursor_move(connection_id, message)
            elif msg_type == "annotation.created":
                await self.handle_annotation_created(connection_id, message)
            elif msg_type == "annotation.updated":
                await self.handle_annotation_updated(connection_id, message)
            elif msg_type == "annotation.deleted":
                await self.handle_annotation_deleted(connection_id, message)
            else:
                await self._send_error(connection_id, f"Unknown message type: {msg_type}")
        
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self._send_error(connection_id, str(e))
    
    async def handle_join_room(self, connection_id: str, message: Dict[str, Any]):
        """Handle join room request"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            
            if not room_id:
                await self._send_error(connection_id, "Missing room_id")
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            # Join room in connection manager
            await self.manager.join_room(connection_id, room_id)
            
            # Update presence in Redis
            try:
                presence_manager = get_presence_manager()
                await presence_manager.add_user_to_room(user_id, room_id)
            except Exception as e:
                logger.warning(f"Failed to update presence: {e}")
            
            # Send confirmation to user
            await self.manager.send_personal_message(
                connection_id,
                {
                    "type": "room_joined",
                    "room_id": room_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Broadcast presence update
            online_users = list(self.manager.get_room_users(room_id))
            await self.manager.broadcast_to_room(
                room_id,
                {
                    "type": "presence.update",
                    "room_id": room_id,
                    "online_users": online_users,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error joining room: {e}")
            await self._send_error(connection_id, str(e))
    
    async def handle_leave_room(self, connection_id: str, message: Dict[str, Any]):
        """Handle leave room request"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            
            if not room_id:
                await self._send_error(connection_id, "Missing room_id")
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            # Leave room
            await self.manager.leave_room(connection_id, room_id)
            
            # Update presence in Redis
            try:
                presence_manager = get_presence_manager()
                await presence_manager.remove_user_from_room(user_id, room_id)
            except Exception as e:
                logger.warning(f"Failed to update presence: {e}")
            
            # Send confirmation
            await self.manager.send_personal_message(
                connection_id,
                {
                    "type": "room_left",
                    "room_id": room_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error leaving room: {e}")
            await self._send_error(connection_id, str(e))
    
    async def handle_heartbeat(self, connection_id: str, message: Dict[str, Any]):
        """Handle heartbeat/presence update"""
        try:
            # Update connection heartbeat
            await self.manager.update_heartbeat(connection_id)
            
            # Update presence in Redis
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            if user_id:
                try:
                    presence_manager = get_presence_manager()
                    await presence_manager.refresh_presence(user_id)
                except Exception as e:
                    logger.warning(f"Failed to refresh presence: {e}")
            
            # Send ack
            await self.manager.send_personal_message(
                connection_id,
                {
                    "type": "ack",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error handling heartbeat: {e}")
    
    async def handle_cursor_move(self, connection_id: str, message: Dict[str, Any]):
        """Handle cursor move event"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            position = data.get("position")
            
            if not room_id or not position:
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            username = metadata.get("username", user_id)
            
            # Broadcast cursor position to room (excluding sender)
            event = CursorMoveEvent(
                user_id=user_id,
                username=username,
                room_id=room_id,
                position=position,
                timestamp=datetime.utcnow().isoformat()
            )
            
            await self.manager.broadcast_to_room(
                room_id,
                event.dict(),
                exclude=[connection_id]
            )
            
        except Exception as e:
            logger.error(f"Error handling cursor move: {e}")
    
    async def handle_annotation_created(self, connection_id: str, message: Dict[str, Any]):
        """Handle annotation created event"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            annotation_id = data.get("annotation_id")
            annotation_data = data.get("annotation_data", {})
            
            if not room_id or not annotation_id:
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            # Broadcast to room (excluding sender)
            event = AnnotationCreatedEvent(
                user_id=user_id,
                room_id=room_id,
                annotation_id=annotation_id,
                annotation_data=annotation_data,
                timestamp=datetime.utcnow().isoformat()
            )
            
            await self.manager.broadcast_to_room(
                room_id,
                event.dict(),
                exclude=[connection_id]
            )
            
        except Exception as e:
            logger.error(f"Error handling annotation created: {e}")
    
    async def handle_annotation_updated(self, connection_id: str, message: Dict[str, Any]):
        """Handle annotation updated event"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            annotation_id = data.get("annotation_id")
            annotation_data = data.get("annotation_data", {})
            
            if not room_id or not annotation_id:
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            # Broadcast to room (excluding sender)
            event = AnnotationUpdatedEvent(
                user_id=user_id,
                room_id=room_id,
                annotation_id=annotation_id,
                annotation_data=annotation_data,
                timestamp=datetime.utcnow().isoformat()
            )
            
            await self.manager.broadcast_to_room(
                room_id,
                event.dict(),
                exclude=[connection_id]
            )
            
        except Exception as e:
            logger.error(f"Error handling annotation updated: {e}")
    
    async def handle_annotation_deleted(self, connection_id: str, message: Dict[str, Any]):
        """Handle annotation deleted event"""
        try:
            data = message.get("data", {})
            room_id = data.get("room_id")
            annotation_id = data.get("annotation_id")
            
            if not room_id or not annotation_id:
                return
            
            # Get user info
            metadata = self.manager.connection_metadata.get(connection_id, {})
            user_id = metadata.get("user_id")
            
            # Broadcast to room (excluding sender)
            event = AnnotationDeletedEvent(
                user_id=user_id,
                room_id=room_id,
                annotation_id=annotation_id,
                timestamp=datetime.utcnow().isoformat()
            )
            
            await self.manager.broadcast_to_room(
                room_id,
                event.dict(),
                exclude=[connection_id]
            )
            
        except Exception as e:
            logger.error(f"Error handling annotation deleted: {e}")
    
    async def _send_error(self, connection_id: str, error: str):
        """Send error message to connection"""
        error_response = ErrorResponse(
            error=error,
            timestamp=datetime.utcnow().isoformat()
        )
        
        await self.manager.send_personal_message(
            connection_id,
            error_response.dict()
        )


# Global event handler instance
event_handler: EventHandler = None


def init_event_handler():
    """Initialize event handler"""
    global event_handler
    event_handler = EventHandler()
    logger.info("Event handler initialized")


def get_event_handler() -> EventHandler:
    """Get event handler instance"""
    if event_handler is None:
        raise RuntimeError("Event handler not initialized")
    return event_handler