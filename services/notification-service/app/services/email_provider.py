"""
Email Provider Service
Supports SMTP and SendGrid
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


class EmailProvider:
    """Email provider wrapper"""
    
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        from_email: str,
        from_name: str,
        use_tls: bool = True,
        sendgrid_api_key: Optional[str] = None
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.from_name = from_name
        self.use_tls = use_tls
        self.sendgrid_api_key = sendgrid_api_key
        
        logger.info("Email provider initialized")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        message: str,
        html: bool = False
    ) -> dict:
        """
        Send email using SMTP or SendGrid
        """
        try:
            # Use SendGrid if API key is available
            if self.sendgrid_api_key:
                return await self._send_via_sendgrid(to_email, subject, message, html)
            else:
                return await self._send_via_smtp(to_email, subject, message, html)
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        message: str,
        html: bool = False
    ) -> dict:
        """Send email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add message body
            if html:
                msg.attach(MIMEText(message, 'html'))
            else:
                msg.attach(MIMEText(message, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                
                server.send_message(msg)
            
            logger.info(f"Email sent via SMTP to {to_email}")
            
            return {
                "success": True,
                "provider": "smtp",
                "message_id": None
            }
            
        except Exception as e:
            logger.error(f"SMTP send failed: {e}")
            raise
    
    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        message: str,
        html: bool = False
    ) -> dict:
        """Send email via SendGrid API"""
        try:
            url = "https://api.sendgrid.com/v3/mail/send"
            
            payload = {
                "personalizations": [
                    {
                        "to": [{"email": to_email}],
                        "subject": subject
                    }
                ],
                "from": {
                    "email": self.from_email,
                    "name": self.from_name
                },
                "content": [
                    {
                        "type": "text/html" if html else "text/plain",
                        "value": message
                    }
                ]
            }
            
            headers = {
                "Authorization": f"Bearer {self.sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code in [200, 202]:
                logger.info(f"Email sent via SendGrid to {to_email}")
                return {
                    "success": True,
                    "provider": "sendgrid",
                    "message_id": response.headers.get("X-Message-Id")
                }
            else:
                error_msg = f"SendGrid API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise Exception(error_msg)
                
        except Exception as e:
            logger.error(f"SendGrid send failed: {e}")
            raise


# Global email provider instance
email_provider: Optional[EmailProvider] = None


def init_email_provider(
    smtp_host: str,
    smtp_port: int,
    smtp_username: str,
    smtp_password: str,
    from_email: str,
    from_name: str,
    use_tls: bool = True,
    sendgrid_api_key: Optional[str] = None
):
    """Initialize email provider"""
    global email_provider
    email_provider = EmailProvider(
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_username=smtp_username,
        smtp_password=smtp_password,
        from_email=from_email,
        from_name=from_name,
        use_tls=use_tls,
        sendgrid_api_key=sendgrid_api_key
    )
    logger.info("Email provider initialized")


def get_email_provider() -> EmailProvider:
    """Get email provider instance"""
    if email_provider is None:
        raise RuntimeError("Email provider not initialized")
    return email_provider