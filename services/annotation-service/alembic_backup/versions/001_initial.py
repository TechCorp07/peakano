"""
Initial migration for Annotation Service
Creates projects and cases tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-12-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create annotation tables"""
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('organ_system', sa.String(100), nullable=True),
        sa.Column('modality', sa.String(50), nullable=True),
        sa.Column('status', sa.Enum('active', 'completed', 'archived', name='projectstatus'), nullable=False),
        sa.Column('annotation_types', JSONB, nullable=True),
        sa.Column('labels', JSONB, nullable=True),
        sa.Column('guidelines', sa.Text(), nullable=True),
        sa.Column('total_cases', sa.Integer(), default=0),
        sa.Column('completed_cases', sa.Integer(), default=0),
        sa.Column('total_annotations', sa.Integer(), default=0),
        sa.Column('created_by', UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes for projects
    op.create_index('ix_projects_created_by', 'projects', ['created_by'])
    op.create_index('ix_projects_organization_id', 'projects', ['organization_id'])
    
    # Create cases table
    op.create_table(
        'cases',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('study_uid', sa.String(255), nullable=False),
        sa.Column('series_uid', sa.String(255), nullable=True),
        sa.Column('status', sa.Enum('pending', 'in_progress', 'completed', 'reviewed', 'rejected', name='casestatus'), nullable=False),
        sa.Column('assigned_to', UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_by', UUID(as_uuid=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', UUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_comments', sa.Text(), nullable=True),
        sa.Column('has_ground_truth', sa.Boolean(), default=False),
        sa.Column('ground_truth_annotation_id', sa.String(255), nullable=True),
        sa.Column('dice_score', sa.Integer(), nullable=True),
        sa.Column('iou_score', sa.Integer(), nullable=True),
        sa.Column('total_annotations', sa.Integer(), default=0),
        sa.Column('total_sessions', sa.Integer(), default=0),
        sa.Column('time_spent_seconds', sa.Integer(), default=0),
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for cases
    op.create_index('ix_cases_project_id', 'cases', ['project_id'])
    op.create_index('ix_cases_study_uid', 'cases', ['study_uid'])
    op.create_index('ix_cases_series_uid', 'cases', ['series_uid'])
    op.create_index('ix_cases_status', 'cases', ['status'])
    op.create_index('ix_cases_assigned_to', 'cases', ['assigned_to'])


def downgrade() -> None:
    """Drop annotation tables"""
    op.drop_index('ix_cases_assigned_to', table_name='cases')
    op.drop_index('ix_cases_status', table_name='cases')
    op.drop_index('ix_cases_series_uid', table_name='cases')
    op.drop_index('ix_cases_study_uid', table_name='cases')
    op.drop_index('ix_cases_project_id', table_name='cases')
    op.drop_table('cases')
    
    op.drop_index('ix_projects_organization_id', table_name='projects')
    op.drop_index('ix_projects_created_by', table_name='projects')
    op.drop_table('projects')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS casestatus')
    op.execute('DROP TYPE IF EXISTS projectstatus')