"""
Redis client for caching, sessions, and pub/sub
"""
import json
import logging
from typing import Any, Optional
from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class RedisClient:
    """Async Redis client wrapper"""
    
    def __init__(self, redis_url: str):
        self.pool = ConnectionPool.from_url(
            redis_url,
            max_connections=50,
            decode_responses=True
        )
        self.redis = Redis(connection_pool=self.pool)
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        try:
            return await self.redis.get(key)
        except RedisError as e:
            logger.error(f"Redis GET error: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        expiration: Optional[int] = None
    ) -> bool:
        """Set value in Redis with optional expiration (seconds)"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            if expiration:
                await self.redis.setex(key, expiration, value)
            else:
                await self.redis.set(key, value)
            return True
        except RedisError as e:
            logger.error(f"Redis SET error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        try:
            await self.redis.delete(key)
            return True
        except RedisError as e:
            logger.error(f"Redis DELETE error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return await self.redis.exists(key) > 0
        except RedisError as e:
            logger.error(f"Redis EXISTS error: {e}")
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        try:
            return await self.redis.expire(key, seconds)
        except RedisError as e:
            logger.error(f"Redis EXPIRE error: {e}")
            return False
    
    async def publish(self, channel: str, message: Any) -> int:
        """Publish message to channel"""
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
            return await self.redis.publish(channel, message)
        except RedisError as e:
            logger.error(f"Redis PUBLISH error: {e}")
            return 0
    
    async def subscribe(self, *channels: str):
        """Subscribe to channels"""
        try:
            pubsub = self.redis.pubsub()
            await pubsub.subscribe(*channels)
            return pubsub
        except RedisError as e:
            logger.error(f"Redis SUBSCRIBE error: {e}")
            return None
    
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get field from hash"""
        try:
            return await self.redis.hget(name, key)
        except RedisError as e:
            logger.error(f"Redis HGET error: {e}")
            return None
    
    async def hset(self, name: str, key: str, value: Any) -> bool:
        """Set field in hash"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self.redis.hset(name, key, value)
            return True
        except RedisError as e:
            logger.error(f"Redis HSET error: {e}")
            return False
    
    async def hgetall(self, name: str) -> dict:
        """Get all fields from hash"""
        try:
            return await self.redis.hgetall(name)
        except RedisError as e:
            logger.error(f"Redis HGETALL error: {e}")
            return {}
    
    async def close(self):
        """Close Redis connection"""
        await self.redis.close()
        await self.pool.disconnect()
        logger.info("Redis connection closed")


# Global instance
redis_client: RedisClient = None


def init_redis(redis_url: str):
    """Initialize Redis client"""
    global redis_client
    redis_client = RedisClient(redis_url)
    logger.info("Redis client initialized")


def get_redis() -> RedisClient:
    """Dependency for getting Redis client"""
    return redis_client

