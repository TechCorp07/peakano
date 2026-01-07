"""
Notification API endpoints
Send notifications, manage preferences, and templates
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
import uuid
from datetime import datetime
import json

from shared.common.database import get_db
from shared.common.responses import success_response, error_response
from shared.common.exceptions import NotFoundException, BadRequestException
from shared.common.rabbitmq_client import get_rabbitmq
from app.models.notification import (
    Notification,
    NotificationPreference,
    NotificationTemplate,
    NotificationChannel,
    NotificationStatus,
    NotificationPriority
)
from app.schemas.notification import (
    NotificationSendRequest,
    NotificationResponse,
    NotificationListResponse,
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
    NotificationTemplateCreate,
    NotificationTemplateUpdate,
    NotificationTemplateResponse,
    NotificationTemplateListResponse,
    BatchNotificationRequest,
    BatchNotificationResponse,
    NotificationStatisticsResponse
)
from app.services.template_engine import get_template_engine
from app.config import settings

router = APIRouter()


# ==================== SEND NOTIFICATIONS ====================

@router.post("/send", response_model=NotificationResponse)
async def send_notification(
    request: NotificationSendRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send a notification
    Queue for asynchronous delivery
    """
    rabbitmq = get_rabbitmq()
    
    # TODO: Get user info from user service
    # For now, use dummy data
    recipient_email = "user@example.com"
    recipient_phone = "+254700000000"
    recipient_device_token = None
    
    # Get user preferences
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == uuid.UUID(request.recipient_id)
        )
    )
    preferences = result.scalar_one_or_none()
    
    # Check if channel is enabled
    if preferences:
        if request.channel == NotificationChannel.EMAIL and not preferences.email_enabled:
            raise BadRequestException("Email notifications disabled for this user")
        elif request.channel == NotificationChannel.SMS and not preferences.sms_enabled:
            raise BadRequestException("SMS notifications disabled for this user")
        elif request.channel == NotificationChannel.PUSH and not preferences.push_enabled:
            raise BadRequestException("Push notifications disabled for this user")
    
    # Get template if specified
    message = request.message
    subject = request.subject
    template_data = request.template_data
    
    if request.template_id:
        result = await db.execute(
            select(NotificationTemplate).where(
                and_(
                    NotificationTemplate.template_id == request.template_id,
                    NotificationTemplate.is_active == True
                )
            )
        )
        template = result.scalar_one_or_none()
        
        if not template:
            raise NotFoundException(f"Template not found: {request.template_id}")
        
        # Validate template variables
        if template_data:
            template_engine = get_template_engine()
            valid, error = template_engine.validate_variables(
                template.message_template,
                template_data
            )
            
            if not valid:
                raise BadRequestException(error)
        
        message = template.message_template
        subject = template.subject_template
    
    # Create notification
    notification = Notification(
        recipient_id=uuid.UUID(request.recipient_id),
        recipient_email=recipient_email if request.channel == NotificationChannel.EMAIL else None,
        recipient_phone=recipient_phone if request.channel == NotificationChannel.SMS else None,
        recipient_device_token=recipient_device_token if request.channel == NotificationChannel.PUSH else None,
        channel=request.channel,
        priority=request.priority,
        subject=subject,
        message=message,
        template_id=request.template_id,
        template_data=template_data,
        metadata=request.metadata,
        related_entity_type=request.related_entity_type,
        related_entity_id=request.related_entity_id,
        scheduled_for=request.scheduled_for,
        status=NotificationStatus.QUEUED
    )
    
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    # Queue notification for processing
    await rabbitmq.publish(
        exchange_name=settings.RABBITMQ_EXCHANGE_NAME,
        routing_key="notifications",
        message=json.dumps({"notification_id": str(notification.id)})
    )
    
    return NotificationResponse(**notification.to_dict())


@router.post("/send/batch", response_model=BatchNotificationResponse)
async def send_batch_notifications(
    request: BatchNotificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send notifications to multiple recipients
    """
    rabbitmq = get_rabbitmq()
    queued_count = 0
    
    for recipient_id in request.recipient_ids:
        try:
            # Create notification for each recipient
            notification = Notification(
                recipient_id=uuid.UUID(recipient_id),
                channel=request.channel,
                priority=request.priority,
                subject=request.subject,
                message=request.message or "",
                template_id=request.template_id,
                template_data=request.template_data,
                status=NotificationStatus.QUEUED
            )
            
            db.add(notification)
            await db.flush()
            
            # Queue for processing
            await rabbitmq.publish(
                exchange_name=settings.RABBITMQ_EXCHANGE_NAME,
                routing_key="notifications",
                message=json.dumps({"notification_id": str(notification.id)})
            )
            
            queued_count += 1
            
        except Exception as e:
            logger.error(f"Failed to queue notification for {recipient_id}: {e}")
    
    await db.commit()
    
    return BatchNotificationResponse(
        success=queued_count > 0,
        total_queued=queued_count,
        message=f"Queued {queued_count} notifications"
    )


# ==================== NOTIFICATION MANAGEMENT ====================

@router.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get notification by ID
    """
    result = await db.execute(
        select(Notification).where(Notification.id == uuid.UUID(notification_id))
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundException(f"Notification not found: {notification_id}")
    
    return NotificationResponse(**notification.to_dict())


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    recipient_id: Optional[str] = None,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List notifications with filtering
    """
    # Build query
    query = select(Notification)
    
    if recipient_id:
        query = query.where(Notification.recipient_id == uuid.UUID(recipient_id))
    if channel:
        query = query.where(Notification.channel == NotificationChannel(channel))
    if status:
        query = query.where(Notification.status == NotificationStatus(status))
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return NotificationListResponse(
        notifications=[NotificationResponse(**n.to_dict()) for n in notifications],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a notification
    """
    result = await db.execute(
        select(Notification).where(Notification.id == uuid.UUID(notification_id))
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundException(f"Notification not found: {notification_id}")
    
    await db.delete(notification)
    await db.commit()
    
    return success_response(message="Notification deleted successfully")


# ==================== USER PREFERENCES ====================

@router.get("/preferences/{user_id}", response_model=NotificationPreferenceResponse)
async def get_user_preferences(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user notification preferences
    """
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == uuid.UUID(user_id)
        )
    )
    preferences = result.scalar_one_or_none()
    
    # Create default preferences if not exists
    if not preferences:
        preferences = NotificationPreference(user_id=uuid.UUID(user_id))
        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)
    
    return NotificationPreferenceResponse(**preferences.to_dict())


@router.put("/preferences/{user_id}", response_model=NotificationPreferenceResponse)
async def update_user_preferences(
    user_id: str,
    preferences_data: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update user notification preferences
    """
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == uuid.UUID(user_id)
        )
    )
    preferences = result.scalar_one_or_none()
    
    if not preferences:
        preferences = NotificationPreference(user_id=uuid.UUID(user_id))
        db.add(preferences)
    
    # Update fields
    update_data = preferences_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    await db.commit()
    await db.refresh(preferences)
    
    return NotificationPreferenceResponse(**preferences.to_dict())


# ==================== TEMPLATES ====================

@router.post("/templates", response_model=NotificationTemplateResponse)
async def create_template(
    template_data: NotificationTemplateCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a notification template
    """
    # Check if template_id already exists
    result = await db.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.template_id == template_data.template_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise BadRequestException(f"Template ID already exists: {template_data.template_id}")
    
    # Extract variables from template
    template_engine = get_template_engine()
    variables = template_engine.extract_variables(template_data.message_template)
    if template_data.subject_template:
        variables.extend(template_engine.extract_variables(template_data.subject_template))
    variables = list(set(variables))
    
    template = NotificationTemplate(
        template_id=template_data.template_id,
        name=template_data.name,
        description=template_data.description,
        subject_template=template_data.subject_template,
        message_template=template_data.message_template,
        channel=template_data.channel,
        language=template_data.language,
        variables=variables
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return NotificationTemplateResponse(**template.to_dict())


@router.get("/templates", response_model=NotificationTemplateListResponse)
async def list_templates(
    channel: Optional[str] = None,
    language: Optional[str] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    List notification templates
    """
    query = select(NotificationTemplate)
    
    if channel:
        query = query.where(NotificationTemplate.channel == NotificationChannel(channel))
    if language:
        query = query.where(NotificationTemplate.language == language)
    if active_only:
        query = query.where(NotificationTemplate.is_active == True)
    
    query = query.order_by(NotificationTemplate.created_at.desc())
    
    result = await db.execute(query)
    templates = result.scalars().all()
    
    return NotificationTemplateListResponse(
        templates=[NotificationTemplateResponse(**t.to_dict()) for t in templates],
        total=len(templates)
    )


@router.get("/templates/{template_id}", response_model=NotificationTemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get template by ID
    """
    result = await db.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.template_id == template_id
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise NotFoundException(f"Template not found: {template_id}")
    
    return NotificationTemplateResponse(**template.to_dict())


@router.put("/templates/{template_id}", response_model=NotificationTemplateResponse)
async def update_template(
    template_id: str,
    template_data: NotificationTemplateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a notification template
    """
    result = await db.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.template_id == template_id
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise NotFoundException(f"Template not found: {template_id}")
    
    # Update fields
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    # Re-extract variables if message template changed
    if template_data.message_template:
        template_engine = get_template_engine()
        variables = template_engine.extract_variables(template.message_template)
        if template.subject_template:
            variables.extend(template_engine.extract_variables(template.subject_template))
        template.variables = list(set(variables))
    
    await db.commit()
    await db.refresh(template)
    
    return NotificationTemplateResponse(**template.to_dict())


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a notification template
    """
    result = await db.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.template_id == template_id
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        raise NotFoundException(f"Template not found: {template_id}")
    
    await db.delete(template)
    await db.commit()
    
    return success_response(message="Template deleted successfully")


# ==================== STATISTICS ====================

@router.get("/statistics", response_model=NotificationStatisticsResponse)
async def get_statistics(db: AsyncSession = Depends(get_db)):
    """
    Get notification statistics
    """
    # Count total notifications
    total = await db.scalar(select(func.count(Notification.id)))
    
    # Count by status
    sent = await db.scalar(
        select(func.count(Notification.id)).where(
            Notification.status == NotificationStatus.SENT
        )
    )
    
    failed = await db.scalar(
        select(func.count(Notification.id)).where(
            Notification.status == NotificationStatus.FAILED
        )
    )
    
    pending = await db.scalar(
        select(func.count(Notification.id)).where(
            Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.QUEUED])
        )
    )
    
    # Notifications by channel
    channel_result = await db.execute(
        select(Notification.channel, func.count(Notification.id))
        .group_by(Notification.channel)
    )
    notifications_by_channel = {row[0].value: row[1] for row in channel_result.all()}
    
    # Notifications by status
    status_result = await db.execute(
        select(Notification.status, func.count(Notification.id))
        .group_by(Notification.status)
    )
    notifications_by_status = {row[0].value: row[1] for row in status_result.all()}
    
    # Average delivery time (for sent notifications)
    avg_time_result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', Notification.sent_at) - 
                func.extract('epoch', Notification.created_at)
            )
        ).where(Notification.sent_at.isnot(None))
    )
    avg_time = avg_time_result.scalar()
    
    return NotificationStatisticsResponse(
        total_notifications=total or 0,
        sent_notifications=sent or 0,
        failed_notifications=failed or 0,
        pending_notifications=pending or 0,
        notifications_by_channel=notifications_by_channel,
        notifications_by_status=notifications_by_status,
        average_delivery_time_seconds=float(avg_time) if avg_time else None
    )


import logging
logger = logging.getLogger(__name__)