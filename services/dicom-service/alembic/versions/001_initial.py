"""
Initial migration for DICOM Service
Creates studies, series, instances tables

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
    """Create DICOM tables"""
    
    # Create studies table
    op.create_table(
        'studies',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('study_instance_uid', sa.String(255), unique=True, nullable=False),
        sa.Column('orthanc_id', sa.String(255), unique=True, nullable=True),
        sa.Column('patient_id', sa.String(255), nullable=True),
        sa.Column('patient_name', sa.String(500), nullable=True),
        sa.Column('patient_birth_date', sa.Date(), nullable=True),
        sa.Column('patient_sex', sa.String(10), nullable=True),
        sa.Column('patient_age', sa.String(10), nullable=True),
        sa.Column('study_date', sa.Date(), nullable=True),
        sa.Column('study_time', sa.String(50), nullable=True),
        sa.Column('study_description', sa.Text(), nullable=True),
        sa.Column('accession_number', sa.String(255), nullable=True),
        sa.Column('institution_name', sa.String(500), nullable=True),
        sa.Column('referring_physician_name', sa.String(500), nullable=True),
        sa.Column('modalities', JSONB, nullable=True),
        sa.Column('number_of_series', sa.Integer(), default=0),
        sa.Column('number_of_instances', sa.Integer(), default=0),
        sa.Column('storage_file_id', UUID(as_uuid=True), nullable=True),
        sa.Column('total_size', sa.Integer(), default=0),
        sa.Column('is_processed', sa.Boolean(), default=False),
        sa.Column('is_anonymized', sa.Boolean(), default=False),
        sa.Column('dicom_tags', JSONB, nullable=True),
        sa.Column('uploaded_by', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes for studies
    op.create_index('ix_studies_study_instance_uid', 'studies', ['study_instance_uid'])
    op.create_index('ix_studies_orthanc_id', 'studies', ['orthanc_id'])
    op.create_index('ix_studies_patient_id', 'studies', ['patient_id'])
    op.create_index('ix_studies_study_date', 'studies', ['study_date'])
    op.create_index('ix_studies_accession_number', 'studies', ['accession_number'])
    op.create_index('ix_studies_uploaded_by', 'studies', ['uploaded_by'])
    
    # Create series table
    op.create_table(
        'series',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('series_instance_uid', sa.String(255), unique=True, nullable=False),
        sa.Column('orthanc_id', sa.String(255), unique=True, nullable=True),
        sa.Column('study_id', UUID(as_uuid=True), nullable=False),
        sa.Column('series_number', sa.Integer(), nullable=True),
        sa.Column('series_description', sa.Text(), nullable=True),
        sa.Column('modality', sa.String(50), nullable=True),
        sa.Column('body_part_examined', sa.String(255), nullable=True),
        sa.Column('protocol_name', sa.String(500), nullable=True),
        sa.Column('number_of_instances', sa.Integer(), default=0),
        sa.Column('rows', sa.Integer(), nullable=True),
        sa.Column('columns', sa.Integer(), nullable=True),
        sa.Column('slice_thickness', sa.String(50), nullable=True),
        sa.Column('pixel_spacing', sa.String(100), nullable=True),
        sa.Column('storage_file_id', UUID(as_uuid=True), nullable=True),
        sa.Column('total_size', sa.Integer(), default=0),
        sa.Column('dicom_tags', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['study_id'], ['studies.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for series
    op.create_index('ix_series_series_instance_uid', 'series', ['series_instance_uid'])
    op.create_index('ix_series_orthanc_id', 'series', ['orthanc_id'])
    op.create_index('ix_series_study_id', 'series', ['study_id'])
    op.create_index('ix_series_modality', 'series', ['modality'])
    
    # Create instances table
    op.create_table(
        'instances',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('sop_instance_uid', sa.String(255), unique=True, nullable=False),
        sa.Column('orthanc_id', sa.String(255), unique=True, nullable=True),
        sa.Column('series_id', UUID(as_uuid=True), nullable=False),
        sa.Column('instance_number', sa.Integer(), nullable=True),
        sa.Column('sop_class_uid', sa.String(255), nullable=True),
        sa.Column('rows', sa.Integer(), nullable=True),
        sa.Column('columns', sa.Integer(), nullable=True),
        sa.Column('bits_allocated', sa.Integer(), nullable=True),
        sa.Column('bits_stored', sa.Integer(), nullable=True),
        sa.Column('image_position_patient', sa.String(255), nullable=True),
        sa.Column('image_orientation_patient', sa.String(255), nullable=True),
        sa.Column('slice_location', sa.String(50), nullable=True),
        sa.Column('storage_file_id', UUID(as_uuid=True), nullable=True),
        sa.Column('file_size', sa.Integer(), default=0),
        sa.Column('dicom_tags', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['series_id'], ['series.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for instances
    op.create_index('ix_instances_sop_instance_uid', 'instances', ['sop_instance_uid'])
    op.create_index('ix_instances_orthanc_id', 'instances', ['orthanc_id'])
    op.create_index('ix_instances_series_id', 'instances', ['series_id'])


def downgrade() -> None:
    """Drop DICOM tables"""
    op.drop_index('ix_instances_series_id', table_name='instances')
    op.drop_index('ix_instances_orthanc_id', table_name='instances')
    op.drop_index('ix_instances_sop_instance_uid', table_name='instances')
    op.drop_table('instances')
    
    op.drop_index('ix_series_modality', table_name='series')
    op.drop_index('ix_series_study_id', table_name='series')
    op.drop_index('ix_series_orthanc_id', table_name='series')
    op.drop_index('ix_series_series_instance_uid', table_name='series')
    op.drop_table('series')
    
    op.drop_index('ix_studies_uploaded_by', table_name='studies')
    op.drop_index('ix_studies_accession_number', table_name='studies')
    op.drop_index('ix_studies_study_date', table_name='studies')
    op.drop_index('ix_studies_patient_id', table_name='studies')
    op.drop_index('ix_studies_orthanc_id', table_name='studies')
    op.drop_index('ix_studies_study_instance_uid', table_name='studies')
    op.drop_table('studies')