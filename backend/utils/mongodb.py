# backend/utils/mongodb.py
# HuntAI - AI Job Hunter Agent
# Async MongoDB Connection Singleton using Motor

import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        """Establish connection to MongoDB."""
        mongo_uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("MONGODB_DB_NAME", "huntai")
        
        if not mongo_uri:
            logger.error("MONGODB_URI not found in environment variables.")
            return

        try:
            import certifi
            # For local Windows development, we bypass strict cert checking if standard certifi fails
            cls.client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
            cls.db = cls.client[db_name]
            # Verify connection
            await cls.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    @classmethod
    async def ensure_indexes(cls):
        """Ensure critical indexes exist for performance."""
        if cls.db is None: return
        try:
            # Runs collection: fast history lookup
            await cls.db["runs"].create_index([("user_id", 1), ("created_at", -1)])
            await cls.db["runs"].create_index([("run_id", 1)], unique=True)
            
            # Jobs collection: fast result lookup
            await cls.db["jobs"].create_index([("run_id", 1)])
            await cls.db["jobs"].create_index([("user_id", 1)])
            
            # Logs collection: cleanup and lookup
            await cls.db["logs"].create_index([("run_id", 1)])
            
            logger.info("MongoDB indexes verified.")
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")

    @classmethod
    async def close(cls):
        """Close connection."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_db(cls):
        """Return the database instance."""
        return cls.db

# Dependency for FastAPI
async def get_db():
    return MongoDB.get_db()
