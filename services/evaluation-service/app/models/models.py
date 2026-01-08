"""
Database models for Evaluation Service
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import os
import sys

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from shared.models.base import Base


class EvaluationResult(Base):
    """Evaluation results for individual annotations"""
    __tablename__ = "evaluation_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Annotation references
    annotation_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    ground_truth_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # User and case context
    user_id = Column(UUID(as_uuid=True), index=True)
    case_id = Column(UUID(as_uuid=True), index=True)
    assessment_id = Column(UUID(as_uuid=True), index=True)  # If part of assessment
    
    # Metric scores
    dice_score = Column(Float)  # Dice Coefficient
    iou_score = Column(Float)  # Intersection over Union
    hausdorff_distance = Column(Float)  # Hausdorff Distance (mm)
    hausdorff_95 = Column(Float)  # 95th percentile Hausdorff
    
    # Additional metrics
    surface_distance_mean = Column(Float)  # Mean surface distance
    surface_distance_rms = Column(Float)  # RMS surface distance
    volume_difference = Column(Float)  # Volume difference (%)
    centroid_distance = Column(Float)  # Centroid distance (mm)
    
    # Binary classification metrics
    sensitivity = Column(Float)  # True Positive Rate
    specificity = Column(Float)  # True Negative Rate
    precision = Column(Float)  # Positive Predictive Value
    
    # Quality assessment
    overall_quality = Column(String(50))  # "excellent", "good", "acceptable", "poor"
    pass_threshold = Column(Boolean)  # Met minimum requirements
    
    # Feedback
    feedback_text = Column(Text)  # Generated feedback
    feedback_items = Column(JSON)  # Structured feedback: {"issues": [...], "suggestions": [...]}
    error_regions = Column(JSON)  # Specific regions with errors
    
    # Performance
    evaluation_time_ms = Column(Integer)  # Time to compute metrics
    
    # Metadata
    eval_metadata = Column(JSON)  # Additional evaluation data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<EvaluationResult {self.id} - Dice: {self.dice_score}>"


class EvaluationSession(Base):
    """Tracking evaluation sessions for learning analytics"""
    __tablename__ = "evaluation_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User and case
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    case_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Session info
    session_start = Column(DateTime, nullable=False)
    session_end = Column(DateTime)
    
    # Attempts tracking
    attempts = Column(Integer, default=0)  # Number of attempts
    best_score = Column(Float)  # Best Dice score achieved
    latest_score = Column(Float)  # Most recent Dice score
    
    # Time tracking
    total_time_seconds = Column(Integer)  # Total time spent
    average_time_per_attempt = Column(Integer)  # Average per attempt
    
    # Progress tracking
    improvement_rate = Column(Float)  # Score improvement over attempts
    learning_curve_data = Column(JSON)  # Scores over time
    
    # Status
    is_complete = Column(Boolean, default=False)
    passed = Column(Boolean, default=False)
    
    # Metadata
    session_metadata = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<EvaluationSession {self.id} - User: {self.user_id}>"


class GroundTruthCache(Base):
    """Cache for ground truth annotations to improve performance"""
    __tablename__ = "ground_truth_cache"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Ground truth reference
    annotation_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    case_id = Column(UUID(as_uuid=True), index=True)
    
    # Cached data (stored in Redis, this is just metadata)
    cache_key = Column(String(255), nullable=False)
    cache_size_bytes = Column(Integer)
    
    # Mask properties
    dimensions = Column(JSON)  # {"width": 512, "height": 512, "depth": 128}
    voxel_spacing = Column(JSON)  # {"x": 1.0, "y": 1.0, "z": 1.0}
    
    # Statistics
    hit_count = Column(Integer, default=0)  # Number of times used
    last_accessed = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    def __repr__(self):
        return f"<GroundTruthCache {self.annotation_id}>"