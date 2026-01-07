"""
Initial migration for Notification Service
Creates notifications, notification_preferences, and notification_templates tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-12-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create notification tables"""
    
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('recipient_id', UUID(as_uuid=True), nullable=False),
        sa.Column('recipient_email', sa.String(255), nullable=True),
        sa.Column('recipient_phone', sa.String(50), nullable=True),
        sa.Column('recipient_device_token', sa.String(500), nullable=True),
        sa.Column('channel', sa.Enum('email', 'sms', 'push', name='notificationchannel'), nullable=False),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'urgent', name='notificationpriority'), nullable=False),
        sa.Column('subject', sa.String(500), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('template_id', sa.String(100), nullable=True),
        sa.Column('template_data', JSON, nullable=True),
        sa.Column('status', sa.Enum('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', name='notificationstatus'), nullable=False),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('max_retries', sa.Integer(), default=3),
        sa.Column('metadata', JSON, nullable=True),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('related_entity_id', sa.String(100), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('provider', sa.String(50), nullable=True),
        sa.Column('provider_message_id', sa.String(255), nullable=True),
        sa.Column('provider_response', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create indexes for notifications
    op.create_index('ix_notifications_recipient_id', 'notifications', ['recipient_id'])
    op.create_index('ix_notifications_channel', 'notifications', ['channel'])
    op.create_index('ix_notifications_status', 'notifications', ['status'])
    op.create_index('ix_notifications_template_id', 'notifications', ['template_id'])
    op.create_index('ix_notifications_related_entity_id', 'notifications', ['related_entity_id'])
    op.create_index('ix_notifications_scheduled_for', 'notifications', ['scheduled_for'])
    
    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), unique=True, nullable=False),
        sa.Column('email_enabled', sa.Boolean(), default=True),
        sa.Column('sms_enabled', sa.Boolean(), default=True),
        sa.Column('push_enabled', sa.Boolean(), default=True),
        sa.Column('course_updates', sa.Boolean(), default=True),
        sa.Column('assignment_reminders', sa.Boolean(), default=True),
        sa.Column('grade_notifications', sa.Boolean(), default=True),
        sa.Column('system_announcements', sa.Boolean(), default=True),
        sa.Column('marketing_emails', sa.Boolean(), default=False),
        sa.Column('quiet_hours_enabled', sa.Boolean(), default=False),
        sa.Column('quiet_hours_start', sa.String(5), nullable=True),
        sa.Column('quiet_hours_end', sa.String(5), nullable=True),
        sa.Column('digest_enabled', sa.Boolean(), default=False),
        sa.Column('digest_frequency', sa.String(20), default='daily'),
        sa.Column('preferred_language', sa.String(5), default='en'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes for notification_preferences
    op.create_index('ix_notification_preferences_user_id', 'notification_preferences', ['user_id'])
    
    # Create notification_templates table
    op.create_table(
        'notification_templates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('template_id', sa.String(100), unique=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subject_template', sa.String(500), nullable=True),
        sa.Column('message_template', sa.Text(), nullable=False),
        sa.Column('channel', sa.Enum('email', 'sms', 'push', name='notificationchannel'), nullable=False),
        sa.Column('language', sa.String(5), default='en'),
        sa.Column('variables', JSON, nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes for notification_templates
    op.create_index('ix_notification_templates_template_id', 'notification_templates', ['template_id'])


def downgrade() -> None:
    """Drop notification tables"""
    op.drop_index('ix_notification_templates_template_id', table_name='notification_templates')
    op.drop_table('notification_templates')
    
    op.drop_index('ix_notification_preferences_user_id', table_name='notification_preferences')
    op.drop_table('notification_preferences')
    
    op.drop_index('ix_notifications_scheduled_for', table_name='notifications')
    op.drop_index('ix_notifications_related_entity_id', table_name='notifications')
    op.drop_index('ix_notifications_template_id', table_name='notifications')
    op.drop_index('ix_notifications_status', table_name='notifications')
    op.drop_index('ix_notifications_channel', table_name='notifications')
    op.drop_index('ix_notifications_recipient_id', table_name='notifications')
    op.drop_table('notifications')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS notificationstatus')
    op.execute('DROP TYPE IF EXISTS notificationpriority')
    op.execute('DROP TYPE IF EXISTS notificationchannel')