"""
Notification Queue Processor
Processes notifications from RabbitMQ queue
"""
import logging
import asyncio
import json
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.notification import Notification, NotificationChannel, NotificationStatus
from app.services.email_provider import get_email_provider
from app.services.sms_provider import get_sms_provider
from app.services.push_provider import get_push_provider
from app.services.template_engine import get_template_engine
from shared.common.database import get_db

logger = logging.getLogger(__name__)


class NotificationProcessor:
    """Process notifications from queue"""
    
    def __init__(self):
        self.running = False
        logger.info("Notification processor initialized")
    
    async def process_notification(
        self,
        notification_id: str,
        db: AsyncSession
    ) -> bool:
        """
        Process a single notification
        
        Args:
            notification_id: Notification ID
            db: Database session
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get notification
            result = await db.execute(
                select(Notification).where(Notification.id == notification_id)
            )
            notification = result.scalar_one_or_none()
            
            if not notification:
                logger.error(f"Notification not found: {notification_id}")
                return False
            
            # Skip if already sent
            if notification.status in [NotificationStatus.SENT, NotificationStatus.DELIVERED]:
                logger.info(f"Notification {notification_id} already sent")
                return True
            
            # Check retry limit
            if notification.retry_count >= notification.max_retries:
                logger.warning(f"Notification {notification_id} exceeded max retries")
                notification.status = NotificationStatus.FAILED
                notification.error_message = "Max retries exceeded"
                notification.failed_at = datetime.utcnow()
                await db.commit()
                return False
            
            # Render template if needed
            message = notification.message
            subject = notification.subject
            
            if notification.template_id and notification.template_data:
                template_engine = get_template_engine()
                message = template_engine.render(message, notification.template_data)
                if subject:
                    subject = template_engine.render(subject, notification.template_data)
            
            # Send based on channel
            success = False
            response = {}
            
            if notification.channel == NotificationChannel.EMAIL:
                success, response = await self._send_email(
                    notification.recipient_email,
                    subject or "Notification",
                    message
                )
            elif notification.channel == NotificationChannel.SMS:
                success, response = await self._send_sms(
                    notification.recipient_phone,
                    message
                )
            elif notification.channel == NotificationChannel.PUSH:
                success, response = await self._send_push(
                    notification.recipient_device_token,
                    subject or "Notification",
                    message
                )
            
            # Update notification status
            if success:
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                notification.provider = response.get("provider")
                notification.provider_message_id = response.get("message_id")
                notification.provider_response = response
                logger.info(f"Notification {notification_id} sent successfully")
            else:
                notification.retry_count += 1
                notification.error_message = response.get("error", "Unknown error")
                notification.provider_response = response
                
                if notification.retry_count >= notification.max_retries:
                    notification.status = NotificationStatus.FAILED
                    notification.failed_at = datetime.utcnow()
                    logger.error(f"Notification {notification_id} failed permanently")
                else:
                    logger.warning(f"Notification {notification_id} failed, will retry ({notification.retry_count}/{notification.max_retries})")
            
            await db.commit()
            return success
            
        except Exception as e:
            logger.error(f"Error processing notification {notification_id}: {e}")
            return False
    
    async def _send_email(
        self,
        to_email: str,
        subject: str,
        message: str
    ) -> tuple[bool, dict]:
        """Send email notification"""
        try:
            email_provider = get_email_provider()
            response = await email_provider.send_email(
                to_email=to_email,
                subject=subject,
                message=message,
                html=False
            )
            return response.get("success", False), response
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False, {"error": str(e)}
    
    async def _send_sms(
        self,
        to_phone: str,
        message: str
    ) -> tuple[bool, dict]:
        """Send SMS notification"""
        try:
            sms_provider = get_sms_provider()
            response = await sms_provider.send_sms(
                to_phone=to_phone,
                message=message
            )
            return response.get("success", False), response
        except Exception as e:
            logger.error(f"SMS send failed: {e}")
            return False, {"error": str(e)}
    
    async def _send_push(
        self,
        device_token: str,
        title: str,
        message: str
    ) -> tuple[bool, dict]:
        """Send push notification"""
        try:
            push_provider = get_push_provider()
            if not push_provider:
                return False, {"error": "Push provider not configured"}
            
            response = await push_provider.send_push(
                device_token=device_token,
                title=title,
                message=message
            )
            return response.get("success", False), response
        except Exception as e:
            logger.error(f"Push send failed: {e}")
            return False, {"error": str(e)}
    
    async def start_worker(self):
        """Start processing notifications from queue"""
        from shared.common.rabbitmq_client import get_rabbitmq
        
        self.running = True
        logger.info("Notification worker started")
        
        rabbitmq = get_rabbitmq()
        
        async def callback(message_body: bytes):
            """Process message from queue"""
            try:
                data = json.loads(message_body.decode())
                notification_id = data.get("notification_id")
                
                if notification_id:
                    async with get_db() as db:
                        await self.process_notification(notification_id, db)
                
            except Exception as e:
                logger.error(f"Error processing queue message: {e}")
        
        # Start consuming from queue
        await rabbitmq.consume(
            queue_name="notifications",
            callback=callback
        )
    
    def stop_worker(self):
        """Stop processing notifications"""
        self.running = False
        logger.info("Notification worker stopped")


# Global processor instance
notification_processor: Optional[NotificationProcessor] = None


def init_notification_processor():
    """Initialize notification processor"""
    global notification_processor
    notification_processor = NotificationProcessor()
    logger.info("Notification processor initialized")


def get_notification_processor() -> NotificationProcessor:
    """Get notification processor instance"""
    if notification_processor is None:
        raise RuntimeError("Notification processor not initialized")
    return notification_processor