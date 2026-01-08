"""initial_migration

Revision ID: 001
Revises: 
Create Date: 2025-01-07

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
    # Create evaluation_results table
    op.create_table(
        'evaluation_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('annotation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ground_truth_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('dice_score', sa.Float(), nullable=True),
        sa.Column('iou_score', sa.Float(), nullable=True),
        sa.Column('hausdorff_distance', sa.Float(), nullable=True),
        sa.Column('hausdorff_95', sa.Float(), nullable=True),
        sa.Column('surface_distance_mean', sa.Float(), nullable=True),
        sa.Column('surface_distance_rms', sa.Float(), nullable=True),
        sa.Column('volume_difference', sa.Float(), nullable=True),
        sa.Column('centroid_distance', sa.Float(), nullable=True),
        sa.Column('sensitivity', sa.Float(), nullable=True),
        sa.Column('specificity', sa.Float(), nullable=True),
        sa.Column('precision', sa.Float(), nullable=True),
        sa.Column('overall_quality', sa.String(length=50), nullable=True),
        sa.Column('pass_threshold', sa.Boolean(), nullable=True),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('feedback_items', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('error_regions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('evaluation_time_ms', sa.Integer(), nullable=True),
        sa.Column('eval_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evaluation_results_annotation_id'), 'evaluation_results', ['annotation_id'], unique=False)
    op.create_index(op.f('ix_evaluation_results_ground_truth_id'), 'evaluation_results', ['ground_truth_id'], unique=False)
    op.create_index(op.f('ix_evaluation_results_user_id'), 'evaluation_results', ['user_id'], unique=False)
    op.create_index(op.f('ix_evaluation_results_case_id'), 'evaluation_results', ['case_id'], unique=False)
    op.create_index(op.f('ix_evaluation_results_assessment_id'), 'evaluation_results', ['assessment_id'], unique=False)
    op.create_index(op.f('ix_evaluation_results_created_at'), 'evaluation_results', ['created_at'], unique=False)

    # Create evaluation_sessions table
    op.create_table(
        'evaluation_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_start', sa.DateTime(), nullable=False),
        sa.Column('session_end', sa.DateTime(), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=True),
        sa.Column('best_score', sa.Float(), nullable=True),
        sa.Column('latest_score', sa.Float(), nullable=True),
        sa.Column('total_time_seconds', sa.Integer(), nullable=True),
        sa.Column('average_time_per_attempt', sa.Integer(), nullable=True),
        sa.Column('improvement_rate', sa.Float(), nullable=True),
        sa.Column('learning_curve_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_complete', sa.Boolean(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('session_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evaluation_sessions_user_id'), 'evaluation_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_evaluation_sessions_case_id'), 'evaluation_sessions', ['case_id'], unique=False)

    # Create ground_truth_cache table
    op.create_table(
        'ground_truth_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('annotation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('cache_key', sa.String(length=255), nullable=False),
        sa.Column('cache_size_bytes', sa.Integer(), nullable=True),
        sa.Column('dimensions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('voxel_spacing', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('hit_count', sa.Integer(), nullable=True),
        sa.Column('last_accessed', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ground_truth_cache_annotation_id'), 'ground_truth_cache', ['annotation_id'], unique=True)
    op.create_index(op.f('ix_ground_truth_cache_case_id'), 'ground_truth_cache', ['case_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ground_truth_cache_case_id'), table_name='ground_truth_cache')
    op.drop_index(op.f('ix_ground_truth_cache_annotation_id'), table_name='ground_truth_cache')
    op.drop_table('ground_truth_cache')
    
    op.drop_index(op.f('ix_evaluation_sessions_case_id'), table_name='evaluation_sessions')
    op.drop_index(op.f('ix_evaluation_sessions_user_id'), table_name='evaluation_sessions')
    op.drop_table('evaluation_sessions')
    
    op.drop_index(op.f('ix_evaluation_results_created_at'), table_name='evaluation_results')
    op.drop_index(op.f('ix_evaluation_results_assessment_id'), table_name='evaluation_results')
    op.drop_index(op.f('ix_evaluation_results_case_id'), table_name='evaluation_results')
    op.drop_index(op.f('ix_evaluation_results_user_id'), table_name='evaluation_results')
    op.drop_index(op.f('ix_evaluation_results_ground_truth_id'), table_name='evaluation_results')
    op.drop_index(op.f('ix_evaluation_results_annotation_id'), table_name='evaluation_results')
    op.drop_table('evaluation_results')