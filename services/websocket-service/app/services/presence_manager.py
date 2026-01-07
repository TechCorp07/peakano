"""
Redis Presence Manager
Tracks user presence across service instances
"""
import logging
import json
from typing import Optional, Set, Dict
from datetime import datetime, timedelta
from shared.common.redis_client import get_redis

logger = logging.getLogger(__name__)


class PresenceManager:
    """Manage user presence in Redis"""
    
    def __init__(self, redis_client, ttl: int = 60):
        self.redis = redis_client
        self.ttl = ttl
        self.prefix = "presence:"
        self.room_prefix = "room:"
        logger.info("Presence manager initialized")
    
    async def set_user_online(
        self,
        user_id: str,
        connection_id: str,
        metadata: Optional[Dict] = None
    ):
        """Mark user as online"""
        key = f"{self.prefix}{user_id}"
        
        data = {
            "user_id": user_id,
            "connection_id": connection_id,
            "status": "online",
            "last_seen": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        
        await self.redis.setex(
            key,
            self.ttl,
            json.dumps(data)
        )
        
        logger.debug(f"User {user_id} set online")
    
    async def set_user_offline(self, user_id: str):
        """Mark user as offline"""
        key = f"{self.prefix}{user_id}"
        await self.redis.delete(key)
        logger.debug(f"User {user_id} set offline")
    
    async def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        key = f"{self.prefix}{user_id}"
        return await self.redis.exists(key)
    
    async def get_user_presence(self, user_id: str) -> Optional[Dict]:
        """Get user presence data"""
        key = f"{self.prefix}{user_id}"
        data = await self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    async def refresh_presence(self, user_id: str):
        """Refresh user presence TTL"""
        key = f"{self.prefix}{user_id}"
        
        if await self.redis.exists(key):
            await self.redis.expire(key, self.ttl)
            
            # Update last_seen
            data = await self.get_user_presence(user_id)
            if data:
                data["last_seen"] = datetime.utcnow().isoformat()
                await self.redis.setex(key, self.ttl, json.dumps(data))
    
    async def add_user_to_room(self, user_id: str, room_id: str):
        """Add user to a room"""
        key = f"{self.room_prefix}{room_id}"
        await self.redis.sadd(key, user_id)
        await self.redis.expire(key, 3600)  # 1 hour TTL for rooms
        logger.debug(f"User {user_id} added to room {room_id}")
    
    async def remove_user_from_room(self, user_id: str, room_id: str):
        """Remove user from a room"""
        key = f"{self.room_prefix}{room_id}"
        await self.redis.srem(key, user_id)
        logger.debug(f"User {user_id} removed from room {room_id}")
    
    async def get_room_users(self, room_id: str) -> Set[str]:
        """Get all users in a room"""
        key = f"{self.room_prefix}{room_id}"
        members = await self.redis.smembers(key)
        return {m.decode() if isinstance(m, bytes) else m for m in members}
    
    async def get_online_room_users(self, room_id: str) -> Set[str]:
        """Get only online users in a room"""
        users = await self.get_room_users(room_id)
        online_users = set()
        
        for user_id in users:
            if await self.is_user_online(user_id):
                online_users.add(user_id)
        
        return online_users
    
    async def get_room_count(self, room_id: str) -> int:
        """Get number of users in a room"""
        key = f"{self.room_prefix}{room_id}"
        return await self.redis.scard(key)
    
    async def get_all_online_users(self) -> Set[str]:
        """Get all online users"""
        pattern = f"{self.prefix}*"
        keys = await self.redis.keys(pattern)
        
        online_users = set()
        for key in keys:
            user_id = key.decode().replace(self.prefix, "") if isinstance(key, bytes) else key.replace(self.prefix, "")
            online_users.add(user_id)
        
        return online_users
    
    async def cleanup_stale_rooms(self):
        """Clean up empty rooms"""
        pattern = f"{self.room_prefix}*"
        keys = await self.redis.keys(pattern)
        
        for key in keys:
            count = await self.redis.scard(key)
            if count == 0:
                await self.redis.delete(key)


# Global presence manager instance
presence_manager: Optional[PresenceManager] = None


def init_presence_manager(redis_client, ttl: int = 60):
    """Initialize presence manager"""
    global presence_manager
    presence_manager = PresenceManager(redis_client, ttl)
    logger.info("Presence manager initialized")


def get_presence_manager() -> PresenceManager:
    """Get presence manager instance"""
    if presence_manager is None:
        raise RuntimeError("Presence manager not initialized")
    return presence_manager