"""initial_migration

Revision ID: 001
Revises: 
Create Date: 2024-01-07

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
    # Create models table
    op.create_table(
        'models',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('model_type', sa.Enum('segmentation', 'classification', 'detection', 'interactive', name='modeltype'), nullable=False),
        sa.Column('framework', sa.Enum('pytorch', 'tensorflow', 'onnx', 'monai', name='framework'), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('organ_system', sa.String(length=100), nullable=True),
        sa.Column('modality', sa.String(length=50), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('input_shape', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('output_classes', sa.Integer(), nullable=True),
        sa.Column('preprocessing_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('postprocessing_config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('dice_score', sa.Float(), nullable=True),
        sa.Column('inference_time_ms', sa.Integer(), nullable=True),
        sa.Column('model_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_public', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_models_name'), 'models', ['name'], unique=True)
    op.create_index(op.f('ix_models_model_type'), 'models', ['model_type'], unique=False)
    op.create_index(op.f('ix_models_organ_system'), 'models', ['organ_system'], unique=False)
    op.create_index(op.f('ix_models_modality'), 'models', ['modality'], unique=False)

    # Create inference_jobs table
    op.create_table(
        'inference_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_name', sa.String(length=255), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('study_uid', sa.String(length=100), nullable=False),
        sa.Column('series_uid', sa.String(length=100), nullable=True),
        sa.Column('instance_uid', sa.String(length=100), nullable=True),
        sa.Column('input_params', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('job_type', sa.String(length=50), nullable=True),
        sa.Column('status', sa.Enum('pending', 'running', 'completed', 'failed', 'cancelled', name='jobstatus'), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=True),
        sa.Column('output_path', sa.String(length=500), nullable=True),
        sa.Column('output_format', sa.String(length=50), nullable=True),
        sa.Column('annotation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('execution_time_seconds', sa.Float(), nullable=True),
        sa.Column('gpu_memory_mb', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inference_jobs_model_id'), 'inference_jobs', ['model_id'], unique=False)
    op.create_index(op.f('ix_inference_jobs_user_id'), 'inference_jobs', ['user_id'], unique=False)
    op.create_index(op.f('ix_inference_jobs_study_uid'), 'inference_jobs', ['study_uid'], unique=False)
    op.create_index(op.f('ix_inference_jobs_series_uid'), 'inference_jobs', ['series_uid'], unique=False)
    op.create_index(op.f('ix_inference_jobs_status'), 'inference_jobs', ['status'], unique=False)
    op.create_index(op.f('ix_inference_jobs_created_at'), 'inference_jobs', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inference_jobs_created_at'), table_name='inference_jobs')
    op.drop_index(op.f('ix_inference_jobs_status'), table_name='inference_jobs')
    op.drop_index(op.f('ix_inference_jobs_series_uid'), table_name='inference_jobs')
    op.drop_index(op.f('ix_inference_jobs_study_uid'), table_name='inference_jobs')
    op.drop_index(op.f('ix_inference_jobs_user_id'), table_name='inference_jobs')
    op.drop_index(op.f('ix_inference_jobs_model_id'), table_name='inference_jobs')
    op.drop_table('inference_jobs')
    
    op.drop_index(op.f('ix_models_modality'), table_name='models')
    op.drop_index(op.f('ix_models_organ_system'), table_name='models')
    op.drop_index(op.f('ix_models_model_type'), table_name='models')
    op.drop_index(op.f('ix_models_name'), table_name='models')
    op.drop_table('models')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS jobstatus')
    op.execute('DROP TYPE IF EXISTS framework')
    op.execute('DROP TYPE IF EXISTS modeltype')