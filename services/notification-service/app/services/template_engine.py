"""
Template Engine for Notification Rendering
Supports variable substitution in templates
"""
import logging
import re
from typing import Dict, Any, Optional
from jinja2 import Template, Environment, BaseLoader

logger = logging.getLogger(__name__)


class TemplateEngine:
    """Template rendering engine"""
    
    def __init__(self):
        self.env = Environment(loader=BaseLoader())
        logger.info("Template engine initialized")
    
    def render(
        self,
        template: str,
        variables: Dict[str, Any]
    ) -> str:
        """
        Render template with variables
        
        Args:
            template: Template string with {{ variable }} placeholders
            variables: Dictionary of variable values
            
        Returns:
            Rendered string
        """
        try:
            tmpl = self.env.from_string(template)
            return tmpl.render(**variables)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            # Return template with error indication
            return template
    
    def extract_variables(self, template: str) -> list:
        """
        Extract variable names from template
        
        Args:
            template: Template string
            
        Returns:
            List of variable names
        """
        try:
            # Match {{ variable_name }}
            pattern = r'\{\{\s*(\w+)\s*\}\}'
            variables = re.findall(pattern, template)
            return list(set(variables))
        except Exception as e:
            logger.error(f"Variable extraction failed: {e}")
            return []
    
    def validate_variables(
        self,
        template: str,
        variables: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that all required variables are provided
        
        Args:
            template: Template string
            variables: Dictionary of variable values
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            required_vars = self.extract_variables(template)
            provided_vars = set(variables.keys())
            missing_vars = set(required_vars) - provided_vars
            
            if missing_vars:
                return False, f"Missing required variables: {', '.join(missing_vars)}"
            
            return True, None
        except Exception as e:
            logger.error(f"Variable validation failed: {e}")
            return False, str(e)


# Common template examples
COMMON_TEMPLATES = {
    "welcome_email": {
        "subject": "Welcome to {{ platform_name }}!",
        "message": """
Hi {{ user_name }},

Welcome to {{ platform_name }}! We're excited to have you join our medical imaging training platform.

Your account has been successfully created. You can now:
- Browse our courses
- Start your first annotation project
- Connect with other learners

Get started: {{ login_url }}

Best regards,
The {{ platform_name }} Team
        """,
        "variables": ["user_name", "platform_name", "login_url"]
    },
    "course_enrollment": {
        "subject": "You're enrolled in {{ course_name }}",
        "message": """
Hi {{ user_name }},

Great news! You've been enrolled in {{ course_name }}.

Course starts: {{ start_date }}
Duration: {{ duration }}

Access your course: {{ course_url }}

Happy learning!
{{ platform_name }}
        """,
        "variables": ["user_name", "course_name", "start_date", "duration", "course_url", "platform_name"]
    },
    "assignment_reminder": {
        "subject": "Reminder: Assignment due soon",
        "message": """
Hi {{ user_name }},

This is a reminder that your assignment "{{ assignment_name }}" is due on {{ due_date }}.

Complete it here: {{ assignment_url }}

Best regards,
{{ platform_name }}
        """,
        "variables": ["user_name", "assignment_name", "due_date", "assignment_url", "platform_name"]
    },
    "grade_notification": {
        "subject": "Your grade for {{ assessment_name }}",
        "message": """
Hi {{ user_name }},

Your grade for {{ assessment_name }} is now available.

Score: {{ score }}%
Status: {{ status }}

View details: {{ results_url }}

{{ platform_name }}
        """,
        "variables": ["user_name", "assessment_name", "score", "status", "results_url", "platform_name"]
    },
    "password_reset": {
        "subject": "Reset your password",
        "message": """
Hi {{ user_name }},

We received a request to reset your password. Click the link below to create a new password:

{{ reset_url }}

This link expires in {{ expiry_hours }} hours.

If you didn't request this, please ignore this email.

{{ platform_name }}
        """,
        "variables": ["user_name", "reset_url", "expiry_hours", "platform_name"]
    },
    "certificate_issued": {
        "subject": "Congratulations! Your certificate is ready",
        "message": """
Hi {{ user_name }},

Congratulations! You've successfully completed {{ course_name }} and earned your certificate.

Certificate ID: {{ certificate_id }}
Date Issued: {{ issue_date }}

Download your certificate: {{ certificate_url }}

Well done!
{{ platform_name }}
        """,
        "variables": ["user_name", "course_name", "certificate_id", "issue_date", "certificate_url", "platform_name"]
    },
    "sms_otp": {
        "message": "Your {{ platform_name }} verification code is: {{ otp_code }}. Valid for {{ validity_minutes }} minutes.",
        "variables": ["platform_name", "otp_code", "validity_minutes"]
    },
    "sms_reminder": {
        "message": "{{ user_name }}, reminder: {{ message }}. - {{ platform_name }}",
        "variables": ["user_name", "message", "platform_name"]
    }
}


# Global template engine instance
template_engine: Optional[TemplateEngine] = None


def init_template_engine():
    """Initialize template engine"""
    global template_engine
    template_engine = TemplateEngine()
    logger.info("Template engine initialized")


def get_template_engine() -> TemplateEngine:
    """Get template engine instance"""
    if template_engine is None:
        raise RuntimeError("Template engine not initialized")
    return template_engine