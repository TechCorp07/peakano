"""
Model management service
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID

from app.models.models import MLModel, ModelType, Framework
from app.schemas.schemas import MLModelCreate, MLModelUpdate
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.common.exceptions import AppException


class ModelService:
    """Service for ML model management"""
    
    @staticmethod
    async def create_model(db: AsyncSession, model_data: MLModelCreate) -> MLModel:
        """Create a new ML model"""
        # Check if model with same name exists
        existing = await ModelService.get_model_by_name(db, model_data.name)
        if existing:
            raise AppException(
                status_code=400,
                detail=f"Model with name '{model_data.name}' already exists"
            )
        
        model = MLModel(**model_data.model_dump())
        db.add(model)
        await db.commit()
        await db.refresh(model)
        return model
    
    @staticmethod
    async def get_model(db: AsyncSession, model_id: UUID) -> Optional[MLModel]:
        """Get model by ID"""
        result = await db.execute(select(MLModel).where(MLModel.id == model_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_model_by_name(db: AsyncSession, name: str) -> Optional[MLModel]:
        """Get model by name"""
        result = await db.execute(select(MLModel).where(MLModel.name == name))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_models(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        model_type: Optional[ModelType] = None,
        organ_system: Optional[str] = None,
        modality: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[MLModel], int]:
        """List models with filters"""
        query = select(MLModel)
        
        # Apply filters
        if model_type:
            query = query.where(MLModel.model_type == model_type)
        if organ_system:
            query = query.where(MLModel.organ_system == organ_system)
        if modality:
            query = query.where(MLModel.modality == modality)
        if is_active is not None:
            query = query.where(MLModel.is_active == is_active)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        models = result.scalars().all()
        
        return models, total
    
    @staticmethod
    async def update_model(
        db: AsyncSession,
        model_id: UUID,
        update_data: MLModelUpdate
    ) -> MLModel:
        """Update model"""
        model = await ModelService.get_model(db, model_id)
        if not model:
            raise AppException(message="Model not found")
        
        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(model, field, value)
        
        await db.commit()
        await db.refresh(model)
        return model
    
    @staticmethod
    async def delete_model(db: AsyncSession, model_id: UUID) -> bool:
        """Delete model (soft delete by setting is_active=False)"""
        model = await ModelService.get_model(db, model_id)
        if not model:
            raise AppException(message="Model not found")
        
        model.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def get_models_by_organ(
        db: AsyncSession,
        organ_system: str
    ) -> List[MLModel]:
        """Get all active models for an organ system"""
        result = await db.execute(
            select(MLModel)
            .where(MLModel.organ_system == organ_system)
            .where(MLModel.is_active == True)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_models_by_modality(
        db: AsyncSession,
        modality: str
    ) -> List[MLModel]:
        """Get all active models for a modality"""
        result = await db.execute(
            select(MLModel)
            .where(MLModel.modality == modality)
            .where(MLModel.is_active == True)
        )
        return result.scalars().all()
