
import asyncio
import sys
import os
# Add project root to sys.path to allow importing 'shared'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.file_metadata import FileMetadata, FileCategory, FileStatus

# Connection string from .env
DATABASE_URL = "postgresql+asyncpg://admin:admin123@localhost:5434/storage_db"

async def run_repro():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        async with session.begin():
            # Create a test file metadata
            file_category = FileCategory.DICOM  # This is what app does
            print(f"DEBUG: file_category object: {file_category}")
            print(f"DEBUG: file_category type: {type(file_category)}")
            print(f"DEBUG: file_category.value: {file_category.value}")
            print(f"DEBUG: file_category.name: {file_category.name}")
            
            metadata = FileMetadata(
                id=uuid.uuid4(),
                filename="repro_test.dcm",
                original_filename="repro_test.dcm",
                bucket_name="dicom-files",
                object_name=f"dicom/{uuid.uuid4()}.dcm",
                file_size=12345,
                content_type="application/dicom",
                uploaded_by=uuid.uuid4(),
                
                # The problematic fields
                category=file_category,
                status=FileStatus.COMPLETED
            )
            
            print("DEBUG: Adding to session...")
            session.add(metadata)
            print("DEBUG: Committing...")
            try:
                await session.commit()
                print("SUCCESS: Record inserted!")
            except Exception as e:
                print(f"FAILURE: {e}")
                raise

if __name__ == "__main__":
    asyncio.run(run_repro())
