"""initial_migration_with_timescaledb

Revision ID: 001
Revises: 
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure TimescaleDB extension is installed
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")
    
    # Create system_metrics table
    op.create_table(
        'system_metrics',
        sa.Column('time', sa.DateTime(), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_name', sa.String(length=100), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=50), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('hostname', sa.String(length=255), nullable=True),
        sa.Column('environment', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('time', 'id')
    )
    
    # Convert to hypertable (TimescaleDB specific)
    op.execute(
        "SELECT create_hypertable('system_metrics', 'time', if_not_exists => TRUE)"
    )
    
    # Create indexes
    op.create_index('idx_system_metrics_time_service', 'system_metrics', ['time', 'service_name'])
    op.create_index('idx_system_metrics_time_metric', 'system_metrics', ['time', 'metric_name'])
    op.create_index(op.f('ix_system_metrics_service_name'), 'system_metrics', ['service_name'])
    op.create_index(op.f('ix_system_metrics_metric_name'), 'system_metrics', ['metric_name'])
    
    # Create user_activity table
    op.create_table(
        'user_activity',
        sa.Column('time', sa.DateTime(), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_type', sa.String(length=100), nullable=False),
        sa.Column('activity_category', sa.String(length=50), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resource_type', sa.String(length=50), nullable=True),
        sa.Column('activity_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('country', sa.String(length=2), nullable=True),
        sa.PrimaryKeyConstraint('time', 'id')
    )
    
    # Convert to hypertable
    op.execute(
        "SELECT create_hypertable('user_activity', 'time', if_not_exists => TRUE)"
    )
    
    # Create indexes
    op.create_index('idx_user_activity_time_user', 'user_activity', ['time', 'user_id'])
    op.create_index('idx_user_activity_time_type', 'user_activity', ['time', 'activity_type'])
    op.create_index('idx_user_activity_session', 'user_activity', ['session_id'])
    op.create_index(op.f('ix_user_activity_user_id'), 'user_activity', ['user_id'])
    op.create_index(op.f('ix_user_activity_activity_type'), 'user_activity', ['activity_type'])
    
    # Create course_analytics table (regular table, not hypertable)
    op.create_table(
        'course_analytics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrollment_count', sa.Integer(), nullable=True),
        sa.Column('active_enrollment_count', sa.Integer(), nullable=True),
        sa.Column('completion_count', sa.Integer(), nullable=True),
        sa.Column('dropout_count', sa.Integer(), nullable=True),
        sa.Column('average_score', sa.Float(), nullable=True),
        sa.Column('median_score', sa.Float(), nullable=True),
        sa.Column('pass_rate', sa.Float(), nullable=True),
        sa.Column('average_completion_time_hours', sa.Float(), nullable=True),
        sa.Column('median_completion_time_hours', sa.Float(), nullable=True),
        sa.Column('average_time_spent_hours', sa.Float(), nullable=True),
        sa.Column('total_time_spent_hours', sa.Float(), nullable=True),
        sa.Column('average_sessions_per_user', sa.Float(), nullable=True),
        sa.Column('total_assessments_taken', sa.Integer(), nullable=True),
        sa.Column('average_attempts_per_assessment', sa.Float(), nullable=True),
        sa.Column('enrollment_trend', sa.String(length=50), nullable=True),
        sa.Column('completion_trend', sa.String(length=50), nullable=True),
        sa.Column('score_trend', sa.String(length=50), nullable=True),
        sa.Column('analytics_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_course_analytics_course_id'), 'course_analytics', ['course_id'], unique=True)
    
    # Create service_health table
    op.create_table(
        'service_health',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('last_check_time', sa.DateTime(), nullable=False),
        sa.Column('response_time_ms', sa.Float(), nullable=True),
        sa.Column('dependencies_status', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('consecutive_failures', sa.Integer(), nullable=True),
        sa.Column('uptime_percentage_24h', sa.Float(), nullable=True),
        sa.Column('uptime_percentage_7d', sa.Float(), nullable=True),
        sa.Column('uptime_percentage_30d', sa.Float(), nullable=True),
        sa.Column('last_healthy_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_health_service_name'), 'service_health', ['service_name'])
    
    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('service_name', sa.String(length=100), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=True),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('acknowledged_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('notification_sent', sa.Boolean(), nullable=True),
        sa.Column('notification_channels', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alerts_service_status', 'alerts', ['service_name', 'status'])
    op.create_index('idx_alerts_triggered', 'alerts', [sa.text('triggered_at DESC')])
    op.create_index(op.f('ix_alerts_service_name'), 'alerts', ['service_name'])
    op.create_index(op.f('ix_alerts_triggered_at'), 'alerts', ['triggered_at'])
    
    # Set retention policies for hypertables (30 days for raw data)
    op.execute("""
        SELECT add_retention_policy('system_metrics', INTERVAL '30 days', if_not_exists => TRUE);
    """)
    
    op.execute("""
        SELECT add_retention_policy('user_activity', INTERVAL '30 days', if_not_exists => TRUE);
    """)


def downgrade() -> None:
    # Drop tables
    op.drop_index('idx_alerts_triggered', table_name='alerts')
    op.drop_index('idx_alerts_service_status', table_name='alerts')
    op.drop_index(op.f('ix_alerts_triggered_at'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_service_name'), table_name='alerts')
    op.drop_table('alerts')
    
    op.drop_index(op.f('ix_service_health_service_name'), table_name='service_health')
    op.drop_table('service_health')
    
    op.drop_index(op.f('ix_course_analytics_course_id'), table_name='course_analytics')
    op.drop_table('course_analytics')
    
    op.drop_index(op.f('ix_user_activity_activity_type'), table_name='user_activity')
    op.drop_index(op.f('ix_user_activity_user_id'), table_name='user_activity')
    op.drop_index('idx_user_activity_session', table_name='user_activity')
    op.drop_index('idx_user_activity_time_type', table_name='user_activity')
    op.drop_index('idx_user_activity_time_user', table_name='user_activity')
    op.drop_table('user_activity')
    
    op.drop_index(op.f('ix_system_metrics_metric_name'), table_name='system_metrics')
    op.drop_index(op.f('ix_system_metrics_service_name'), table_name='system_metrics')
    op.drop_index('idx_system_metrics_time_metric', table_name='system_metrics')
    op.drop_index('idx_system_metrics_time_service', table_name='system_metrics')
    op.drop_table('system_metrics')