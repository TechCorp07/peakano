"""
ML Model management endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import AppException

from app.services.model_service import ModelService
from app.schemas.schemas import (
    MLModelCreate,
    MLModelUpdate,
    MLModelResponse,
    MLModelList,
    ModelTypeEnum
)

router = APIRouter(prefix="/models", tags=["models"])


@router.post("/", response_model=MLModelResponse, status_code=201)
async def create_model(
    model_data: MLModelCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new ML model"""
    try:
        model = await ModelService.create_model(db, model_data)
        return model
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/", response_model=MLModelList)
async def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    model_type: Optional[ModelTypeEnum] = None,
    organ_system: Optional[str] = None,
    modality: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List ML models with filters"""
    try:
        models, total = await ModelService.list_models(
            db,
            skip=skip,
            limit=limit,
            model_type=model_type,
            organ_system=organ_system,
            modality=modality,
            is_active=is_active
        )
        
        page = skip // limit + 1 if limit > 0 else 1
        
        return MLModelList(
            models=models,
            total=total,
            page=page,
            page_size=limit
        )
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/{model_id}", response_model=MLModelResponse)
async def get_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get model by ID"""
    try:
        model = await ModelService.get_model(db, model_id)
        if not model:
            raise AppException(message="Model not found")
        return model
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/name/{name}", response_model=MLModelResponse)
async def get_model_by_name(
    name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get model by name"""
    try:
        model = await ModelService.get_model_by_name(db, name)
        if not model:
            raise AppException(message=f"Model '{name}' not found")
        return model
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.put("/{model_id}", response_model=MLModelResponse)
async def update_model(
    model_id: UUID,
    update_data: MLModelUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update model"""
    try:
        model = await ModelService.update_model(db, model_id, update_data)
        return model
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.delete("/{model_id}")
async def delete_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete model (soft delete)"""
    try:
        await ModelService.delete_model(db, model_id)
        return success_response(message="Model deleted successfully")
    except AppException as e:
        raise e
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/organ/{organ_system}", response_model=List[MLModelResponse])
async def get_models_by_organ(
    organ_system: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all models for an organ system"""
    try:
        models = await ModelService.get_models_by_organ(db, organ_system)
        return models
    except Exception as e:
        raise AppException(message=str(e))


@router.get("/modality/{modality}", response_model=List[MLModelResponse])
async def get_models_by_modality(
    modality: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all models for a modality"""
    try:
        models = await ModelService.get_models_by_modality(db, modality)
        return models
    except Exception as e:
        raise AppException(message=str(e))
