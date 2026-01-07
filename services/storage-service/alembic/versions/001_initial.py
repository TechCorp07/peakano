"""
Initial migration for Storage Service
Creates file_metadata table

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
    """Create file_metadata table"""
    op.create_table(
        'file_metadata',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_extension', sa.String(50), nullable=True),
        sa.Column('bucket_name', sa.String(100), nullable=False),
        sa.Column('object_name', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('content_type', sa.String(200), nullable=True),
        sa.Column('checksum', sa.String(64), nullable=True),
        sa.Column('category', sa.Enum(
            'dicom', 'annotation', 'export', 'ai_model', 
            'certificate', 'temp', 'other',
            name='filecategory'
        ), nullable=False),
        sa.Column('status', sa.Enum(
            'uploading', 'completed', 'failed', 'deleted',
            name='filestatus'
        ), nullable=False),
        sa.Column('uploaded_by', UUID(as_uuid=True), nullable=False),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('related_entity_id', sa.String(100), nullable=True),
        sa.Column('file_metadata', JSONB, nullable=True),
        sa.Column('tags', JSONB, nullable=True),
        sa.Column('version', sa.Integer(), default=1),
        sa.Column('parent_file_id', UUID(as_uuid=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('access_count', sa.Integer(), default=0),
    )
    
    # Create indexes
    op.create_index('ix_file_metadata_bucket_name', 'file_metadata', ['bucket_name'])
    op.create_index('ix_file_metadata_object_name', 'file_metadata', ['object_name'])
    op.create_index('ix_file_metadata_category', 'file_metadata', ['category'])
    op.create_index('ix_file_metadata_status', 'file_metadata', ['status'])
    op.create_index('ix_file_metadata_uploaded_by', 'file_metadata', ['uploaded_by'])
    op.create_index('ix_file_metadata_related_entity_id', 'file_metadata', ['related_entity_id'])
    op.create_index('ix_file_metadata_created_at', 'file_metadata', ['created_at'])


def downgrade() -> None:
    """Drop file_metadata table"""
    op.drop_index('ix_file_metadata_created_at', table_name='file_metadata')
    op.drop_index('ix_file_metadata_related_entity_id', table_name='file_metadata')
    op.drop_index('ix_file_metadata_uploaded_by', table_name='file_metadata')
    op.drop_index('ix_file_metadata_status', table_name='file_metadata')
    op.drop_index('ix_file_metadata_category', table_name='file_metadata')
    op.drop_index('ix_file_metadata_object_name', table_name='file_metadata')
    op.drop_index('ix_file_metadata_bucket_name', table_name='file_metadata')
    op.drop_table('file_metadata')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS filestatus')
    op.execute('DROP TYPE IF EXISTS filecategory')