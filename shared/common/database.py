"""
Database connection management for PostgreSQL and MongoDB
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

# PostgreSQL
Base = declarative_base()

class DatabaseManager:
    """PostgreSQL database manager"""
    
    def __init__(self, database_url: str):
        self.engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        self.async_session_maker = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        async with self.async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.error(f"Database session error: {e}")
                raise
            finally:
                await session.close()
    
    async def close(self):
        """Close database connection"""
        await self.engine.dispose()


class MongoDBManager:
    """MongoDB database manager"""
    
    def __init__(self, mongodb_url: str, database_name: str):
        self.client = AsyncIOMotorClient(mongodb_url)
        self.database = self.client[database_name]
    
    def get_collection(self, collection_name: str):
        """Get MongoDB collection"""
        return self.database[collection_name]
    
    async def close(self):
        """Close MongoDB connection"""
        self.client.close()


# Global instances (to be initialized in main.py)
db_manager: DatabaseManager = None
mongo_manager: MongoDBManager = None


def init_postgres(database_url: str):
    """Initialize PostgreSQL connection"""
    global db_manager
    db_manager = DatabaseManager(database_url)
    logger.info("PostgreSQL connection initialized")


def init_mongodb(mongodb_url: str, database_name: str):
    """Initialize MongoDB connection"""
    global mongo_manager
    mongo_manager = MongoDBManager(mongodb_url, database_name)
    logger.info("MongoDB connection initialized")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async for session in db_manager.get_session():
        yield session


def get_mongo_collection(collection_name: str):
    """Dependency for getting MongoDB collection"""
    return mongo_manager.get_collection(collection_name)

