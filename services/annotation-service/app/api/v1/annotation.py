"""
Annotation API endpoints
Projects, Cases, Sessions, and Annotations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
import uuid
from datetime import datetime

from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import NotFoundException, BadRequestException
from app.models.annotation import Project, Case, ProjectStatus, CaseStatus
from app.services.mongodb_client import get_mongodb
from app.schemas.annotation import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseListResponse,
    SessionStartRequest,
    SessionResponse,
    AnnotationCreate,
    AnnotationUpdate,
    AnnotationResponse,
    AnnotationListResponse,
    ExportRequest,
    ExportResponse,
    AnnotationStatisticsResponse
)
from app.config import settings

router = APIRouter()


# ==================== PROJECTS ====================

@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new annotation project
    """
    # TODO: Get user_id from authentication
    user_id = "00000000-0000-0000-0000-000000000000"
    
    project = Project(
        name=project_data.name,
        description=project_data.description,
        organ_system=project_data.organ_system,
        modality=project_data.modality,
        annotation_types=project_data.annotation_types,
        labels=project_data.labels,
        guidelines=project_data.guidelines,
        created_by=uuid.UUID(user_id)
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse(**project.to_dict())


@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    status: Optional[str] = None,
    organ_system: Optional[str] = None,
    modality: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List annotation projects
    """
    # Build query
    query = select(Project)
    
    if status:
        query = query.where(Project.status == ProjectStatus(status))
    if organ_system:
        query = query.where(Project.organ_system == organ_system)
    if modality:
        query = query.where(Project.modality == modality)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Project.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return ProjectListResponse(
        projects=[ProjectResponse(**p.to_dict()) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get project by ID
    """
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise NotFoundException(f"Project not found: {project_id}")
    
    return ProjectResponse(**project.to_dict())


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update project
    """
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise NotFoundException(f"Project not found: {project_id}")
    
    # Update fields
    update_data = project_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse(**project.to_dict())


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete project (cascades to cases)
    """
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise NotFoundException(f"Project not found: {project_id}")
    
    await db.delete(project)
    await db.commit()
    
    return success_response(message="Project deleted successfully")


# ==================== CASES ====================

@router.post("/cases", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new annotation case
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(case_data.project_id))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise NotFoundException(f"Project not found: {case_data.project_id}")
    
    case = Case(
        project_id=project.id,
        name=case_data.name,
        description=case_data.description,
        study_uid=case_data.study_uid,
        series_uid=case_data.series_uid,
        has_ground_truth=case_data.has_ground_truth,
        ground_truth_annotation_id=case_data.ground_truth_annotation_id,
        metadata=case_data.metadata
    )
    
    db.add(case)
    
    # Update project statistics
    project.total_cases += 1
    
    await db.commit()
    await db.refresh(case)
    
    return CaseResponse(**case.to_dict())


@router.get("/projects/{project_id}/cases", response_model=CaseListResponse)
async def list_project_cases(
    project_id: str,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List cases in a project
    """
    # Build query
    query = select(Case).where(Case.project_id == uuid.UUID(project_id))
    
    if status:
        query = query.where(Case.status == CaseStatus(status))
    if assigned_to:
        query = query.where(Case.assigned_to == uuid.UUID(assigned_to))
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Case.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    cases = result.scalars().all()
    
    return CaseListResponse(
        cases=[CaseResponse(**c.to_dict()) for c in cases],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get case by ID
    """
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id))
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise NotFoundException(f"Case not found: {case_id}")
    
    return CaseResponse(**case.to_dict())


@router.put("/cases/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    case_data: CaseUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update case
    """
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id))
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise NotFoundException(f"Case not found: {case_id}")
    
    # Update fields
    update_data = case_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "assigned_to" and value:
            case.assigned_at = datetime.utcnow()
        setattr(case, field, value)
    
    await db.commit()
    await db.refresh(case)
    
    return CaseResponse(**case.to_dict())


@router.delete("/cases/{case_id}")
async def delete_case(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete case
    """
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id))
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise NotFoundException(f"Case not found: {case_id}")
    
    # Get project to update statistics
    result = await db.execute(
        select(Project).where(Project.id == case.project_id)
    )
    project = result.scalar_one_or_none()
    
    if project:
        project.total_cases -= 1
        if case.status == CaseStatus.COMPLETED:
            project.completed_cases -= 1
    
    await db.delete(case)
    await db.commit()
    
    return success_response(message="Case deleted successfully")


# ==================== SESSIONS ====================

@router.post("/sessions/start", response_model=SessionResponse)
async def start_session(
    request: SessionStartRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new annotation session
    """
    mongodb = get_mongodb()
    
    # TODO: Get user_id from authentication
    user_id = "00000000-0000-0000-0000-000000000000"
    
    # Verify case exists
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(request.case_id))
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise NotFoundException(f"Case not found: {request.case_id}")
    
    # Create session in MongoDB
    session_doc = {
        "case_id": request.case_id,
        "user_id": user_id,
        "status": "active",
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "time_spent_seconds": 0,
        "annotation_count": 0,
        "metadata": {}
    }
    
    result = await mongodb.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)
    
    # Update case status
    if case.status == CaseStatus.PENDING:
        case.status = CaseStatus.IN_PROGRESS
    case.total_sessions += 1
    await db.commit()
    
    return SessionResponse(
        id=session_id,
        **session_doc
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """
    Get session by ID
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    session = await mongodb.sessions.find_one({"_id": ObjectId(session_id)})
    
    if not session:
        raise NotFoundException(f"Session not found: {session_id}")
    
    return SessionResponse(
        id=str(session["_id"]),
        case_id=session["case_id"],
        user_id=session["user_id"],
        status=session["status"],
        started_at=session["started_at"],
        ended_at=session.get("ended_at"),
        time_spent_seconds=session.get("time_spent_seconds", 0),
        annotation_count=session.get("annotation_count", 0),
        metadata=session.get("metadata")
    )


@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    End an annotation session
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    # Get session
    session = await mongodb.sessions.find_one({"_id": ObjectId(session_id)})
    
    if not session:
        raise NotFoundException(f"Session not found: {session_id}")
    
    # Calculate time spent
    started_at = session["started_at"]
    ended_at = datetime.utcnow()
    time_spent = int((ended_at - started_at).total_seconds())
    
    # Update session
    await mongodb.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "completed",
                "ended_at": ended_at,
                "time_spent_seconds": time_spent
            }
        }
    )
    
    # Update case statistics
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(session["case_id"]))
    )
    case = result.scalar_one_or_none()
    
    if case:
        case.time_spent_seconds += time_spent
        await db.commit()
    
    # Get updated session
    updated_session = await mongodb.sessions.find_one({"_id": ObjectId(session_id)})
    
    return SessionResponse(
        id=session_id,
        case_id=updated_session["case_id"],
        user_id=updated_session["user_id"],
        status=updated_session["status"],
        started_at=updated_session["started_at"],
        ended_at=updated_session["ended_at"],
        time_spent_seconds=updated_session["time_spent_seconds"],
        annotation_count=updated_session["annotation_count"],
        metadata=updated_session.get("metadata")
    )


# ==================== ANNOTATIONS ====================

@router.post("/annotations", response_model=AnnotationResponse)
async def create_annotation(
    annotation_data: AnnotationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new annotation
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    # TODO: Get user_id from authentication
    user_id = "00000000-0000-0000-0000-000000000000"
    
    # Verify session exists
    session = await mongodb.sessions.find_one({"_id": ObjectId(annotation_data.session_id)})
    
    if not session:
        raise NotFoundException(f"Session not found: {annotation_data.session_id}")
    
    # Create annotation in MongoDB
    annotation_doc = {
        "session_id": annotation_data.session_id,
        "case_id": annotation_data.case_id,
        "user_id": user_id,
        "instance_uid": annotation_data.instance_uid,
        "slice_index": annotation_data.slice_index,
        "label": annotation_data.label,
        "data": annotation_data.data.dict(),
        "status": "active",
        "version": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "metadata": annotation_data.metadata or {}
    }
    
    result = await mongodb.annotations.insert_one(annotation_doc)
    annotation_id = str(result.inserted_id)
    
    # Update session annotation count
    await mongodb.sessions.update_one(
        {"_id": ObjectId(annotation_data.session_id)},
        {"$inc": {"annotation_count": 1}}
    )
    
    # Update case annotation count
    db_result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(annotation_data.case_id))
    )
    case = db_result.scalar_one_or_none()
    
    if case:
        case.total_annotations += 1
        await db.commit()
    
    return AnnotationResponse(
        id=annotation_id,
        session_id=annotation_doc["session_id"],
        case_id=annotation_doc["case_id"],
        user_id=annotation_doc["user_id"],
        instance_uid=annotation_doc["instance_uid"],
        slice_index=annotation_doc["slice_index"],
        label=annotation_doc["label"],
        data=annotation_data.data,
        status=annotation_doc["status"],
        version=annotation_doc["version"],
        created_at=annotation_doc["created_at"],
        updated_at=annotation_doc["updated_at"],
        metadata=annotation_doc["metadata"]
    )


@router.get("/cases/{case_id}/annotations", response_model=AnnotationListResponse)
async def list_case_annotations(
    case_id: str,
    session_id: Optional[str] = None
):
    """
    List annotations for a case
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    # Build query
    query = {
        "case_id": case_id,
        "status": {"$ne": "deleted"}
    }
    
    if session_id:
        query["session_id"] = session_id
    
    # Get annotations
    cursor = mongodb.annotations.find(query).sort("created_at", -1)
    annotations = await cursor.to_list(length=1000)
    
    annotation_responses = []
    for ann in annotations:
        annotation_responses.append(AnnotationResponse(
            id=str(ann["_id"]),
            session_id=ann["session_id"],
            case_id=ann["case_id"],
            user_id=ann["user_id"],
            instance_uid=ann.get("instance_uid"),
            slice_index=ann.get("slice_index"),
            label=ann["label"],
            data=ann["data"],
            status=ann["status"],
            version=ann["version"],
            created_at=ann["created_at"],
            updated_at=ann["updated_at"],
            metadata=ann.get("metadata")
        ))
    
    return AnnotationListResponse(
        annotations=annotation_responses,
        total=len(annotation_responses)
    )


@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: str,
    annotation_data: AnnotationUpdate
):
    """
    Update an annotation
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    # Get annotation
    annotation = await mongodb.annotations.find_one({"_id": ObjectId(annotation_id)})
    
    if not annotation:
        raise NotFoundException(f"Annotation not found: {annotation_id}")
    
    # Save version if version control enabled
    if settings.ENABLE_VERSION_CONTROL:
        version_doc = {
            "annotation_id": annotation_id,
            "version": annotation["version"],
            "data": annotation,
            "created_at": datetime.utcnow()
        }
        await mongodb.versions.insert_one(version_doc)
    
    # Update annotation
    update_data = annotation_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    update_data["version"] = annotation["version"] + 1
    
    await mongodb.annotations.update_one(
        {"_id": ObjectId(annotation_id)},
        {"$set": update_data}
    )
    
    # Get updated annotation
    updated_annotation = await mongodb.annotations.find_one({"_id": ObjectId(annotation_id)})
    
    return AnnotationResponse(
        id=annotation_id,
        session_id=updated_annotation["session_id"],
        case_id=updated_annotation["case_id"],
        user_id=updated_annotation["user_id"],
        instance_uid=updated_annotation.get("instance_uid"),
        slice_index=updated_annotation.get("slice_index"),
        label=updated_annotation["label"],
        data=updated_annotation["data"],
        status=updated_annotation["status"],
        version=updated_annotation["version"],
        created_at=updated_annotation["created_at"],
        updated_at=updated_annotation["updated_at"],
        metadata=updated_annotation.get("metadata")
    )


@router.delete("/annotations/{annotation_id}")
async def delete_annotation(
    annotation_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an annotation (soft delete)
    """
    from bson import ObjectId
    mongodb = get_mongodb()
    
    # Get annotation
    annotation = await mongodb.annotations.find_one({"_id": ObjectId(annotation_id)})
    
    if not annotation:
        raise NotFoundException(f"Annotation not found: {annotation_id}")
    
    # Soft delete
    await mongodb.annotations.update_one(
        {"_id": ObjectId(annotation_id)},
        {
            "$set": {
                "status": "deleted",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update counts
    await mongodb.sessions.update_one(
        {"_id": ObjectId(annotation["session_id"])},
        {"$inc": {"annotation_count": -1}}
    )
    
    # Update case count
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(annotation["case_id"]))
    )
    case = result.scalar_one_or_none()
    
    if case:
        case.total_annotations -= 1
        await db.commit()
    
    return success_response(message="Annotation deleted successfully")


# ==================== STATISTICS ====================

@router.get("/statistics", response_model=AnnotationStatisticsResponse)
async def get_statistics(db: AsyncSession = Depends(get_db)):
    """
    Get annotation statistics
    """
    mongodb = get_mongodb()
    
    # Count projects
    total_projects = await db.scalar(select(func.count(Project.id)))
    
    # Count cases
    total_cases = await db.scalar(select(func.count(Case.id)))
    
    # Count sessions
    total_sessions = await mongodb.sessions.count_documents({})
    
    # Count annotations
    total_annotations = await mongodb.annotations.count_documents({"status": {"$ne": "deleted"}})
    
    # Annotations by type
    pipeline = [
        {"$match": {"status": {"$ne": "deleted"}}},
        {"$group": {"_id": "$data.type", "count": {"$sum": 1}}}
    ]
    cursor = mongodb.annotations.aggregate(pipeline)
    annotations_by_type = {doc["_id"]: doc["count"] async for doc in cursor}
    
    # Annotations by label
    pipeline = [
        {"$match": {"status": {"$ne": "deleted"}}},
        {"$group": {"_id": "$label", "count": {"$sum": 1}}}
    ]
    cursor = mongodb.annotations.aggregate(pipeline)
    annotations_by_label = {doc["_id"]: doc["count"] async for doc in cursor}
    
    # Average scores
    avg_dice = await db.scalar(
        select(func.avg(Case.dice_score)).where(Case.dice_score.isnot(None))
    )
    avg_iou = await db.scalar(
        select(func.avg(Case.iou_score)).where(Case.iou_score.isnot(None))
    )
    
    return AnnotationStatisticsResponse(
        total_projects=total_projects or 0,
        total_cases=total_cases or 0,
        total_sessions=total_sessions,
        total_annotations=total_annotations,
        annotations_by_type=annotations_by_type,
        annotations_by_label=annotations_by_label,
        average_dice_score=float(avg_dice) if avg_dice else None,
        average_iou_score=float(avg_iou) if avg_iou else None
    )