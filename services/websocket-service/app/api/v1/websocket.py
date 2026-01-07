"""
WebSocket Endpoint
"""
import logging
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from app.services.connection_manager import get_connection_manager
from app.services.presence_manager import get_presence_manager
from app.services.event_handler import get_event_handler
from app.schemas.websocket import ConnectionResponse
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time communication
    
    Query Parameters:
    - token: JWT authentication token (optional for now)
    - user_id: User ID (required)
    """
    connection_id = str(uuid.uuid4())
    manager = get_connection_manager()
    event_handler = get_event_handler()
    
    # TODO: Validate token with Auth Service
    # For now, require user_id
    if not user_id:
        await websocket.close(code=1008, reason="Missing user_id")
        return
    
    try:
        # Accept connection
        await manager.connect(
            websocket=websocket,
            connection_id=connection_id,
            user_id=user_id,
            metadata={
                "token": token,
                "username": f"User_{user_id[:8]}"  # TODO: Get from Auth Service
            }
        )
        
        # Update presence in Redis
        try:
            presence_manager = get_presence_manager()
            await presence_manager.set_user_online(
                user_id=user_id,
                connection_id=connection_id,
                metadata={"connected_at": datetime.utcnow().isoformat()}
            )
        except Exception as e:
            logger.warning(f"Failed to set presence: {e}")
        
        # Send connection confirmation
        response = ConnectionResponse(
            connection_id=connection_id,
            user_id=user_id,
            timestamp=datetime.utcnow().isoformat()
        )
        await websocket.send_json(response.dict())
        
        # Listen for messages
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle message
                await event_handler.handle_message(connection_id, message)
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from {connection_id}")
                await manager.send_personal_message(
                    connection_id,
                    {
                        "type": "error",
                        "error": "Invalid JSON format",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await manager.send_personal_message(
                    connection_id,
                    {
                        "type": "error",
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        # Clean up connection
        manager.disconnect(connection_id)
        
        # Update presence
        try:
            presence_manager = get_presence_manager()
            await presence_manager.set_user_offline(user_id)
        except Exception as e:
            logger.warning(f"Failed to update presence on disconnect: {e}")
        
        logger.info(f"Connection closed: {connection_id}")


@router.get("/stats")
async def get_stats():
    """Get WebSocket connection statistics"""
    manager = get_connection_manager()
    stats = manager.get_stats()
    
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        **stats
    }


@router.get("/rooms/{room_id}/users")
async def get_room_users(room_id: str):
    """Get users in a specific room"""
    manager = get_connection_manager()
    users = manager.get_room_users(room_id)
    
    return {
        "room_id": room_id,
        "user_count": len(users),
        "users": list(users),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/presence/{user_id}")
async def get_user_presence(user_id: str):
    """Get user presence status"""
    try:
        presence_manager = get_presence_manager()
        presence = await presence_manager.get_user_presence(user_id)
        
        if presence:
            return {
                "user_id": user_id,
                "online": True,
                "presence": presence,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "user_id": user_id,
                "online": False,
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error getting presence: {e}")
        return {
            "user_id": user_id,
            "online": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }