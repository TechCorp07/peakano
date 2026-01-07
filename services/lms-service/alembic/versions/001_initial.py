"""Initial migration for LMS Service
Creates courses, modules, lessons, enrollments, assessments, and certificates tables

Revision ID: 001_initial
Create Date: 2024-12-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create LMS tables"""
    
    # Create courses table
    op.create_table(
        'courses',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('short_description', sa.String(500)),
        sa.Column('organ_system', sa.String(100)),
        sa.Column('modality', sa.String(50)),
        sa.Column('difficulty', sa.Enum('beginner', 'intermediate', 'advanced', name='coursedifficulty'), nullable=False),
        sa.Column('status', sa.Enum('draft', 'published', 'archived', name='coursestatus'), nullable=False),
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('estimated_hours', sa.Integer()),
        sa.Column('total_modules', sa.Integer(), default=0),
        sa.Column('total_lessons', sa.Integer(), default=0),
        sa.Column('prerequisites', JSONB),
        sa.Column('learning_objectives', JSONB),
        sa.Column('thumbnail_url', sa.String(500)),
        sa.Column('video_intro_url', sa.String(500)),
        sa.Column('is_free', sa.Boolean(), default=True),
        sa.Column('price', sa.Float()),
        sa.Column('passing_score', sa.Integer(), default=70),
        sa.Column('certificate_enabled', sa.Boolean(), default=True),
        sa.Column('enrollment_count', sa.Integer(), default=0),
        sa.Column('completion_count', sa.Integer(), default=0),
        sa.Column('average_rating', sa.Float()),
        sa.Column('created_by', UUID(as_uuid=True), nullable=False),
        sa.Column('instructor_ids', JSONB),
        sa.Column('organization_id', UUID(as_uuid=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('published_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_courses_status', 'courses', ['status'])
    op.create_index('ix_courses_created_by', 'courses', ['created_by'])
    op.create_index('ix_courses_organization_id', 'courses', ['organization_id'])
    
    # Create modules table
    op.create_table(
        'modules',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('estimated_hours', sa.Integer()),
        sa.Column('is_locked', sa.Boolean(), default=False),
        sa.Column('total_lessons', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_modules_course_id', 'modules', ['course_id'])
    
    # Create lessons table
    op.create_table(
        'lessons',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('module_id', UUID(as_uuid=True), sa.ForeignKey('modules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.Enum('video', 'text', 'pdf', 'dicom', 'quiz', 'practical', name='contenttype'), nullable=False),
        sa.Column('content', sa.Text()),
        sa.Column('video_url', sa.String(500)),
        sa.Column('video_duration', sa.Integer()),
        sa.Column('file_url', sa.String(500)),
        sa.Column('dicom_case_id', sa.String(255)),
        sa.Column('annotation_project_id', UUID(as_uuid=True)),
        sa.Column('estimated_minutes', sa.Integer()),
        sa.Column('is_required', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_lessons_module_id', 'lessons', ['module_id'])
    
    # Create enrollments table
    op.create_table(
        'enrollments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'active', 'completed', 'withdrawn', 'expired', name='enrollmentstatus'), nullable=False),
        sa.Column('progress_percentage', sa.Integer(), default=0),
        sa.Column('completed_lessons', sa.Integer(), default=0),
        sa.Column('total_lessons', sa.Integer(), default=0),
        sa.Column('time_spent_minutes', sa.Integer(), default=0),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('certificate_issued', sa.Boolean(), default=False),
        sa.Column('certificate_id', UUID(as_uuid=True)),
        sa.Column('overall_score', sa.Integer()),
        sa.Column('assessment_attempts', sa.Integer(), default=0),
        sa.Column('enrollment_source', sa.String(100)),
        sa.Column('enrollment_metadata', JSONB),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_enrollments_course_id', 'enrollments', ['course_id'])
    op.create_index('ix_enrollments_user_id', 'enrollments', ['user_id'])
    op.create_index('ix_enrollments_status', 'enrollments', ['status'])
    
    # Create lesson_progress table
    op.create_table(
        'lesson_progress',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('enrollment_id', UUID(as_uuid=True), sa.ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', UUID(as_uuid=True), sa.ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('not_started', 'in_progress', 'completed', name='lessonstatus'), nullable=False),
        sa.Column('completion_percentage', sa.Integer(), default=0),
        sa.Column('time_spent_minutes', sa.Integer(), default=0),
        sa.Column('video_position_seconds', sa.Integer()),
        sa.Column('video_watched_percentage', sa.Integer()),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('score', sa.Integer()),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_lesson_progress_enrollment_id', 'lesson_progress', ['enrollment_id'])
    op.create_index('ix_lesson_progress_lesson_id', 'lesson_progress', ['lesson_id'])
    op.create_index('ix_lesson_progress_user_id', 'lesson_progress', ['user_id'])
    
    # Create assessments table
    op.create_table(
        'assessments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('module_id', UUID(as_uuid=True), sa.ForeignKey('modules.id', ondelete='CASCADE')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('assessment_type', sa.Enum('quiz', 'exam', 'practical', 'assignment', name='assessmenttype'), nullable=False),
        sa.Column('passing_score', sa.Integer(), default=70),
        sa.Column('max_attempts', sa.Integer(), default=3),
        sa.Column('time_limit_minutes', sa.Integer()),
        sa.Column('randomize_questions', sa.Boolean(), default=False),
        sa.Column('show_correct_answers', sa.Boolean(), default=True),
        sa.Column('questions', JSONB, nullable=False),
        sa.Column('total_points', sa.Integer(), default=0),
        sa.Column('is_required', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_assessments_course_id', 'assessments', ['course_id'])
    op.create_index('ix_assessments_module_id', 'assessments', ['module_id'])
    
    # Create assessment_attempts table
    op.create_table(
        'assessment_attempts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('assessment_id', UUID(as_uuid=True), sa.ForeignKey('assessments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('enrollment_id', UUID(as_uuid=True), sa.ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('in_progress', 'submitted', 'graded', name='attemptstatus'), nullable=False),
        sa.Column('answers', JSONB),
        sa.Column('score', sa.Integer()),
        sa.Column('points_earned', sa.Integer()),
        sa.Column('points_possible', sa.Integer()),
        sa.Column('passed', sa.Boolean()),
        sa.Column('feedback', sa.Text()),
        sa.Column('graded_by', UUID(as_uuid=True)),
        sa.Column('time_spent_minutes', sa.Integer()),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True)),
        sa.Column('graded_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_assessment_attempts_assessment_id', 'assessment_attempts', ['assessment_id'])
    op.create_index('ix_assessment_attempts_enrollment_id', 'assessment_attempts', ['enrollment_id'])
    op.create_index('ix_assessment_attempts_user_id', 'assessment_attempts', ['user_id'])
    
    # Create certificates table
    op.create_table(
        'certificates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('enrollment_id', UUID(as_uuid=True), sa.ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('certificate_number', sa.String(100), unique=True, nullable=False),
        sa.Column('recipient_name', sa.String(255), nullable=False),
        sa.Column('recipient_email', sa.String(255)),
        sa.Column('course_title', sa.String(255), nullable=False),
        sa.Column('completion_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('final_score', sa.Integer()),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True)),
        sa.Column('is_revoked', sa.Boolean(), default=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True)),
        sa.Column('revocation_reason', sa.Text()),
        sa.Column('pdf_url', sa.String(500)),
        sa.Column('verification_code', sa.String(100), unique=True, nullable=False),
    )
    op.create_index('ix_certificates_user_id', 'certificates', ['user_id'])
    op.create_index('ix_certificates_certificate_number', 'certificates', ['certificate_number'])
    op.create_index('ix_certificates_verification_code', 'certificates', ['verification_code'])


def downgrade() -> None:
    """Drop LMS tables"""
    op.drop_table('certificates')
    op.drop_table('assessment_attempts')
    op.drop_table('assessments')
    op.drop_table('lesson_progress')
    op.drop_table('enrollments')
    op.drop_table('lessons')
    op.drop_table('modules')
    op.drop_table('courses')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS attemptstatus')
    op.execute('DROP TYPE IF EXISTS assessmenttype')
    op.execute('DROP TYPE IF EXISTS lessonstatus')
    op.execute('DROP TYPE IF EXISTS enrollmentstatus')
    op.execute('DROP TYPE IF EXISTS contenttype')
    op.execute('DROP TYPE IF EXISTS coursestatus')
    op.execute('DROP TYPE IF EXISTS coursedifficulty')
