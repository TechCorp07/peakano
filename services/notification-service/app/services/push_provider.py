"""
Push Notification Provider Service using Firebase Cloud Messaging
"""
import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)


class PushProvider:
    """Firebase Cloud Messaging (FCM) push notification provider"""
    
    def __init__(
        self,
        server_key: str,
        project_id: Optional[str] = None
    ):
        self.server_key = server_key
        self.project_id = project_id
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"
        
        logger.info("FCM push provider initialized")
    
    async def send_push(
        self,
        device_token: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> dict:
        """
        Send push notification via FCM
        
        Args:
            device_token: FCM device registration token
            title: Notification title
            message: Notification message
            data: Additional data payload
            
        Returns:
            dict with success status and provider response
        """
        try:
            headers = {
                "Authorization": f"key={self.server_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "to": device_token,
                "notification": {
                    "title": title,
                    "body": message,
                    "sound": "default"
                },
                "priority": "high"
            }
            
            # Add custom data if provided
            if data:
                payload["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.fcm_url,
                    json=payload,
                    headers=headers,
                    timeout=10.0
                )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success") == 1:
                    message_id = result.get("results", [{}])[0].get("message_id")
                    logger.info(f"Push notification sent (ID: {message_id})")
                    return {
                        "success": True,
                        "provider": "fcm",
                        "message_id": message_id,
                        "response": result
                    }
                else:
                    error = result.get("results", [{}])[0].get("error", "Unknown error")
                    logger.error(f"FCM push failed: {error}")
                    return {
                        "success": False,
                        "provider": "fcm",
                        "error": error,
                        "response": result
                    }
            else:
                error_msg = f"FCM API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "provider": "fcm",
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"FCM push failed: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "provider": "fcm",
                "error": error_msg
            }
    
    async def send_batch_push(
        self,
        device_tokens: list,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> dict:
        """
        Send push notification to multiple devices
        
        Args:
            device_tokens: List of FCM device registration tokens
            title: Notification title
            message: Notification message
            data: Additional data payload
            
        Returns:
            dict with success status and results
        """
        try:
            headers = {
                "Authorization": f"key={self.server_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "registration_ids": device_tokens,
                "notification": {
                    "title": title,
                    "body": message,
                    "sound": "default"
                },
                "priority": "high"
            }
            
            # Add custom data if provided
            if data:
                payload["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.fcm_url,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
            
            if response.status_code == 200:
                result = response.json()
                success_count = result.get("success", 0)
                failure_count = result.get("failure", 0)
                
                logger.info(f"Batch push sent: {success_count} success, {failure_count} failures")
                
                return {
                    "success": success_count > 0,
                    "provider": "fcm",
                    "success_count": success_count,
                    "failure_count": failure_count,
                    "response": result
                }
            else:
                error_msg = f"FCM API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "provider": "fcm",
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"FCM batch push failed: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "provider": "fcm",
                "error": error_msg
            }


# Global push provider instance
push_provider: Optional[PushProvider] = None


def init_push_provider(
    server_key: str,
    project_id: Optional[str] = None
):
    """Initialize push notification provider"""
    global push_provider
    if server_key:
        push_provider = PushProvider(
            server_key=server_key,
            project_id=project_id
        )
        logger.info("Push provider initialized")
    else:
        logger.warning("Push provider not initialized: No FCM server key provided")


def get_push_provider() -> Optional[PushProvider]:
    """Get push provider instance"""
    return push_provider