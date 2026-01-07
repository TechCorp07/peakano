"""
MongoDB Client for Annotation Service
Handles annotation data storage
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB client wrapper"""
    
    def __init__(self, url: str, db_name: str):
        self.client = AsyncIOMotorClient(url)
        self.db = self.client[db_name]
        
        # Collections
        self.annotations = self.db.annotations
        self.sessions = self.db.sessions
        self.versions = self.db.annotation_versions
        
        logger.info(f"MongoDB client initialized: {db_name}")
    
    async def create_indexes(self):
        """Create database indexes"""
        # Annotation indexes
        await self.annotations.create_index("case_id")
        await self.annotations.create_index("session_id")
        await self.annotations.create_index("user_id")
        await self.annotations.create_index("created_at")
        await self.annotations.create_index([("case_id", 1), ("status", 1)])
        
        # Session indexes
        await self.sessions.create_index("case_id")
        await self.sessions.create_index("user_id")
        await self.sessions.create_index("status")
        await self.sessions.create_index("started_at")
        
        # Version indexes
        await self.versions.create_index("annotation_id")
        await self.versions.create_index("created_at")
        
        logger.info("MongoDB indexes created")
    
    async def close(self):
        """Close MongoDB connection"""
        self.client.close()
        logger.info("MongoDB connection closed")


# Global MongoDB client instance
mongodb_client: Optional[MongoDBClient] = None


async def init_mongodb(url: str, db_name: str):
    """Initialize MongoDB client"""
    global mongodb_client
    mongodb_client = MongoDBClient(url, db_name)
    await mongodb_client.create_indexes()
    logger.info("MongoDB initialized")


def get_mongodb() -> MongoDBClient:
    """Get MongoDB client instance"""
    if mongodb_client is None:
        raise RuntimeError("MongoDB client not initialized")
    return mongodb_client


async def close_mongodb():
    """Close MongoDB connection"""
    if mongodb_client:
        await mongodb_client.close()