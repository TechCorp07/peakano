"""
SMS Provider Service using Africa's Talking
"""
import logging
from typing import Optional
import africastalking

logger = logging.getLogger(__name__)


class SMSProvider:
    """Africa's Talking SMS provider"""
    
    def __init__(
        self,
        username: str,
        api_key: str,
        sender_id: str,
        environment: str = "sandbox"
    ):
        self.username = username
        self.api_key = api_key
        self.sender_id = sender_id
        self.environment = environment
        
        # Initialize Africa's Talking
        africastalking.initialize(username, api_key)
        self.sms = africastalking.SMS
        
        logger.info(f"Africa's Talking SMS provider initialized ({environment})")
    
    async def send_sms(
        self,
        to_phone: str,
        message: str
    ) -> dict:
        """
        Send SMS using Africa's Talking
        
        Args:
            to_phone: Recipient phone number (format: +254XXXXXXXXX for Kenya)
            message: SMS message content
            
        Returns:
            dict with success status and provider response
        """
        try:
            # Ensure phone number has country code
            if not to_phone.startswith('+'):
                logger.warning(f"Phone number {to_phone} missing country code")
                # Default to Kenya if no country code
                if not to_phone.startswith('254'):
                    to_phone = f"+254{to_phone.lstrip('0')}"
                else:
                    to_phone = f"+{to_phone}"
            
            # Send SMS
            response = self.sms.send(
                message=message,
                recipients=[to_phone],
                sender_id=self.sender_id
            )
            
            # Parse response
            if response and 'SMSMessageData' in response:
                recipients = response['SMSMessageData']['Recipients']
                
                if recipients and len(recipients) > 0:
                    recipient = recipients[0]
                    status = recipient.get('status')
                    message_id = recipient.get('messageId')
                    cost = recipient.get('cost')
                    
                    if status == 'Success':
                        logger.info(f"SMS sent to {to_phone} (ID: {message_id}, Cost: {cost})")
                        return {
                            "success": True,
                            "provider": "africastalking",
                            "message_id": message_id,
                            "status": status,
                            "cost": cost,
                            "response": recipient
                        }
                    else:
                        error_msg = f"SMS failed: {status}"
                        logger.error(f"SMS to {to_phone} failed: {status}")
                        return {
                            "success": False,
                            "provider": "africastalking",
                            "error": error_msg,
                            "response": recipient
                        }
                else:
                    error_msg = "No recipients in response"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "provider": "africastalking",
                        "error": error_msg
                    }
            else:
                error_msg = "Invalid response format"
                logger.error(f"Invalid Africa's Talking response: {response}")
                return {
                    "success": False,
                    "provider": "africastalking",
                    "error": error_msg
                }
                
        except Exception as e:
            error_msg = f"Africa's Talking SMS failed: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "provider": "africastalking",
                "error": error_msg
            }
    
    async def check_balance(self) -> dict:
        """Check Africa's Talking account balance"""
        try:
            application = africastalking.Application
            response = application.fetch_application_data()
            
            if response:
                return {
                    "success": True,
                    "balance": response.get('UserData', {}).get('balance')
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to fetch balance"
                }
        except Exception as e:
            logger.error(f"Failed to check balance: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global SMS provider instance
sms_provider: Optional[SMSProvider] = None


def init_sms_provider(
    username: str,
    api_key: str,
    sender_id: str,
    environment: str = "sandbox"
):
    """Initialize SMS provider"""
    global sms_provider
    sms_provider = SMSProvider(
        username=username,
        api_key=api_key,
        sender_id=sender_id,
        environment=environment
    )
    logger.info("SMS provider initialized")


def get_sms_provider() -> SMSProvider:
    """Get SMS provider instance"""
    if sms_provider is None:
        raise RuntimeError("SMS provider not initialized")
    return sms_provider