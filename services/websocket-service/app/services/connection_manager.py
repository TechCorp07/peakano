"""
WebSocket Connection Manager
Manages connections, rooms, and presence
"""
import logging
import json
from typing import Dict, Set, Optional
from datetime import datetime
from fastapi import WebSocket
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections and rooms"""
    
    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        
        # User connections: {user_id: Set[connection_id]}
        self.user_connections: Dict[str, Set[str]] = {}
        
        # Room connections: {room_id: Set[connection_id]}
        self.room_connections: Dict[str, Set[str]] = {}
        
        # Connection metadata: {connection_id: metadata}
        self.connection_metadata: Dict[str, dict] = {}
        
        logger.info("Connection manager initialized")
    
    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        user_id: str,
        metadata: Optional[dict] = None
    ):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        self.active_connections[connection_id] = websocket
        
        # Add to user connections
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        # Store metadata
        self.connection_metadata[connection_id] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_heartbeat": datetime.utcnow().isoformat(),
            **(metadata or {})
        }
        
        logger.info(f"Connection established: {connection_id} (user: {user_id})")
    
    def disconnect(self, connection_id: str):
        """Remove a connection"""
        if connection_id not in self.active_connections:
            return
        
        # Get metadata
        metadata = self.connection_metadata.get(connection_id, {})
        user_id = metadata.get("user_id")
        
        # Remove from active connections
        del self.active_connections[connection_id]
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from all rooms
        for room_id in list(self.room_connections.keys()):
            self.room_connections[room_id].discard(connection_id)
            if not self.room_connections[room_id]:
                del self.room_connections[room_id]
        
        # Remove metadata
        if connection_id in self.connection_metadata:
            del self.connection_metadata[connection_id]
        
        logger.info(f"Connection closed: {connection_id} (user: {user_id})")
    
    async def join_room(self, connection_id: str, room_id: str):
        """Add a connection to a room"""
        if connection_id not in self.active_connections:
            return False
        
        if room_id not in self.room_connections:
            self.room_connections[room_id] = set()
        
        self.room_connections[room_id].add(connection_id)
        logger.info(f"Connection {connection_id} joined room {room_id}")
        
        # Notify others in room
        await self.broadcast_to_room(
            room_id,
            {
                "type": "user.joined",
                "user_id": self.connection_metadata[connection_id].get("user_id"),
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude=[connection_id]
        )
        
        return True
    
    async def leave_room(self, connection_id: str, room_id: str):
        """Remove a connection from a room"""
        if room_id in self.room_connections:
            self.room_connections[room_id].discard(connection_id)
            
            # Notify others in room
            if connection_id in self.connection_metadata:
                await self.broadcast_to_room(
                    room_id,
                    {
                        "type": "user.left",
                        "user_id": self.connection_metadata[connection_id].get("user_id"),
                        "room_id": room_id,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    exclude=[connection_id]
                )
            
            if not self.room_connections[room_id]:
                del self.room_connections[room_id]
            
            logger.info(f"Connection {connection_id} left room {room_id}")
    
    async def send_personal_message(self, connection_id: str, message: dict):
        """Send message to a specific connection"""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a user"""
        if user_id in self.user_connections:
            for connection_id in list(self.user_connections[user_id]):
                await self.send_personal_message(connection_id, message)
    
    async def broadcast_to_room(
        self,
        room_id: str,
        message: dict,
        exclude: Optional[list] = None
    ):
        """Broadcast message to all connections in a room"""
        if room_id not in self.room_connections:
            return
        
        exclude = exclude or []
        disconnected = []
        
        for connection_id in list(self.room_connections[room_id]):
            if connection_id in exclude:
                continue
            
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    async def broadcast_to_all(self, message: dict, exclude: Optional[list] = None):
        """Broadcast message to all active connections"""
        exclude = exclude or []
        disconnected = []
        
        for connection_id in list(self.active_connections.keys()):
            if connection_id in exclude:
                continue
            
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    def get_room_users(self, room_id: str) -> Set[str]:
        """Get all user IDs in a room"""
        if room_id not in self.room_connections:
            return set()
        
        users = set()
        for connection_id in self.room_connections[room_id]:
            if connection_id in self.connection_metadata:
                user_id = self.connection_metadata[connection_id].get("user_id")
                if user_id:
                    users.add(user_id)
        
        return users
    
    def get_room_count(self, room_id: str) -> int:
        """Get number of connections in a room"""
        if room_id not in self.room_connections:
            return 0
        return len(self.room_connections[room_id])
    
    def get_connection_rooms(self, connection_id: str) -> Set[str]:
        """Get all rooms a connection is in"""
        rooms = set()
        for room_id, connections in self.room_connections.items():
            if connection_id in connections:
                rooms.add(room_id)
        return rooms
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "total_users": len(self.user_connections),
            "total_rooms": len(self.room_connections),
            "connections_per_user": {
                user_id: len(connections)
                for user_id, connections in self.user_connections.items()
            },
            "connections_per_room": {
                room_id: len(connections)
                for room_id, connections in self.room_connections.items()
            }
        }
    
    async def update_heartbeat(self, connection_id: str):
        """Update connection heartbeat timestamp"""
        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["last_heartbeat"] = datetime.utcnow().isoformat()


# Global connection manager instance
manager = ConnectionManager()


def get_connection_manager() -> ConnectionManager:
    """Get connection manager instance"""
    return manager