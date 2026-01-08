"""
Feedback generation service
Generates intelligent feedback for annotation quality
"""
import numpy as np
from typing import List, Dict, Any, Tuple
from app.schemas.schemas import FeedbackItem, FeedbackResponse, QualityLevel
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class FeedbackGenerator:
    """Generate intelligent feedback for annotations"""
    
    @staticmethod
    def generate_feedback(
        metrics: Dict[str, float],
        pred: np.ndarray,
        truth: np.ndarray,
        spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    ) -> FeedbackResponse:
        """
        Generate comprehensive feedback based on metrics and masks
        """
        try:
            # Determine overall quality
            quality_level = FeedbackGenerator._determine_quality(metrics)
            
            # Generate overall assessment
            overall = FeedbackGenerator._generate_overall_assessment(metrics, quality_level)
            
            # Identify issues
            issues = FeedbackGenerator._identify_issues(metrics, pred, truth, spacing)
            
            # Generate suggestions
            suggestions = FeedbackGenerator._generate_suggestions(metrics, issues)
            
            # Identify strengths
            strengths = FeedbackGenerator._identify_strengths(metrics)
            
            return FeedbackResponse(
                overall=overall,
                quality_level=quality_level,
                issues=issues,
                suggestions=suggestions,
                strengths=strengths
            )
            
        except Exception as e:
            logger.error(f"Error generating feedback: {str(e)}")
            return FeedbackResponse(
                overall="Unable to generate feedback",
                quality_level=QualityLevel.POOR,
                issues=[],
                suggestions=[],
                strengths=[]
            )
    
    @staticmethod
    def _determine_quality(metrics: Dict[str, float]) -> QualityLevel:
        """Determine overall quality level"""
        dice = metrics.get('dice_score', 0.0)
        
        if dice >= settings.DICE_EXCELLENT:
            return QualityLevel.EXCELLENT
        elif dice >= settings.DICE_GOOD:
            return QualityLevel.GOOD
        elif dice >= settings.DICE_ACCEPTABLE:
            return QualityLevel.ACCEPTABLE
        else:
            return QualityLevel.POOR
    
    @staticmethod
    def _generate_overall_assessment(metrics: Dict[str, float], quality: QualityLevel) -> str:
        """Generate overall assessment text"""
        dice = metrics.get('dice_score', 0.0)
        iou = metrics.get('iou_score', 0.0)
        
        templates = {
            QualityLevel.EXCELLENT: f"Excellent segmentation! Dice score of {dice:.3f} indicates very high accuracy with minimal errors.",
            QualityLevel.GOOD: f"Good segmentation with Dice score of {dice:.3f}. Minor refinements could improve accuracy further.",
            QualityLevel.ACCEPTABLE: f"Acceptable segmentation (Dice: {dice:.3f}). Review the specific issues below to improve quality.",
            QualityLevel.POOR: f"Segmentation needs significant improvement (Dice: {dice:.3f}). Please review the identified issues carefully."
        }
        
        return templates.get(quality, "Unable to assess quality")
    
    @staticmethod
    def _identify_issues(
        metrics: Dict[str, float],
        pred: np.ndarray,
        truth: np.ndarray,
        spacing: Tuple[float, float, float]
    ) -> List[FeedbackItem]:
        """Identify specific issues with the annotation"""
        issues = []
        
        # Check boundary accuracy
        hausdorff = metrics.get('hausdorff_95', 0.0)
        if hausdorff > settings.HAUSDORFF_ACCEPTABLE:
            severity = "critical" if hausdorff > settings.HAUSDORFF_ACCEPTABLE * 2 else "major"
            issues.append(FeedbackItem(
                type="issue",
                category="boundary",
                message=f"Boundary inaccuracy detected. 95th percentile Hausdorff distance is {hausdorff:.2f}mm (threshold: {settings.HAUSDORFF_ACCEPTABLE}mm)",
                severity=severity
            ))
        
        # Check completeness (under/over segmentation)
        volume_diff = metrics.get('volume_difference', 0.0)
        if abs(volume_diff) > 20:
            if volume_diff > 0:
                issues.append(FeedbackItem(
                    type="issue",
                    category="completeness",
                    message=f"Over-segmentation detected. Volume is {volume_diff:.1f}% larger than reference",
                    severity="major" if volume_diff > 50 else "minor"
                ))
            else:
                issues.append(FeedbackItem(
                    type="issue",
                    category="completeness",
                    message=f"Under-segmentation detected. Volume is {abs(volume_diff):.1f}% smaller than reference",
                    severity="major" if abs(volume_diff) > 50 else "minor"
                ))
        
        # Check centroid alignment
        centroid_dist = metrics.get('centroid_distance', 0.0)
        if centroid_dist > 10.0:  # mm
            issues.append(FeedbackItem(
                type="issue",
                category="anatomical",
                message=f"Centroid misalignment of {centroid_dist:.2f}mm. Check anatomical positioning",
                severity="major" if centroid_dist > 20 else "minor"
            ))
        
        # Check sensitivity (missing regions)
        sensitivity = metrics.get('sensitivity', 1.0)
        if sensitivity < 0.85:
            issues.append(FeedbackItem(
                type="issue",
                category="completeness",
                message=f"Low sensitivity ({sensitivity:.3f}). Significant regions are missing from the segmentation",
                severity="critical" if sensitivity < 0.7 else "major"
            ))
        
        # Check specificity (false positives)
        specificity = metrics.get('specificity', 1.0)
        if specificity < 0.95:
            issues.append(FeedbackItem(
                type="issue",
                category="completeness",
                message=f"Low specificity ({specificity:.3f}). Extra regions incorrectly included",
                severity="major" if specificity < 0.90 else "minor"
            ))
        
        # Sort by severity
        severity_order = {"critical": 0, "major": 1, "minor": 2}
        issues.sort(key=lambda x: severity_order.get(x.severity, 3))
        
        return issues[:settings.MAX_FEEDBACK_ITEMS]
    
    @staticmethod
    def _generate_suggestions(metrics: Dict[str, float], issues: List[FeedbackItem]) -> List[FeedbackItem]:
        """Generate actionable suggestions"""
        suggestions = []
        
        # Suggestions based on issues
        issue_categories = {item.category for item in issues}
        
        if "boundary" in issue_categories:
            suggestions.append(FeedbackItem(
                type="suggestion",
                category="boundary",
                message="Use zoom view to refine boundaries more precisely. Focus on areas with high contrast",
                severity="minor"
            ))
        
        if "completeness" in issue_categories:
            volume_diff = metrics.get('volume_difference', 0.0)
            if volume_diff > 0:
                suggestions.append(FeedbackItem(
                    type="suggestion",
                    category="completeness",
                    message="Review segmented regions carefully. Remove any incorrectly included tissue",
                    severity="minor"
                ))
            else:
                suggestions.append(FeedbackItem(
                    type="suggestion",
                    category="completeness",
                    message="Check all slices for missing regions. Compare with reference anatomy",
                    severity="minor"
                ))
        
        if "anatomical" in issue_categories:
            suggestions.append(FeedbackItem(
                type="suggestion",
                category="anatomical",
                message="Review anatomical landmarks and reference images to ensure correct positioning",
                severity="minor"
            ))
        
        # General suggestions based on quality
        dice = metrics.get('dice_score', 0.0)
        if dice < settings.DICE_GOOD:
            suggestions.append(FeedbackItem(
                type="suggestion",
                category="general",
                message="Consider using AI-assisted segmentation as a starting point, then refine manually",
                severity="minor"
            ))
        
        return suggestions
    
    @staticmethod
    def _identify_strengths(metrics: Dict[str, float]) -> List[str]:
        """Identify strengths of the annotation"""
        strengths = []
        
        dice = metrics.get('dice_score', 0.0)
        if dice >= settings.DICE_EXCELLENT:
            strengths.append("Excellent overlap with reference annotation")
        
        hausdorff = metrics.get('hausdorff_95', 100.0)
        if hausdorff <= settings.HAUSDORFF_EXCELLENT:
            strengths.append("Very accurate boundary delineation")
        
        volume_diff = metrics.get('volume_difference', 100.0)
        if abs(volume_diff) <= 10:
            strengths.append("Accurate volume estimation")
        
        sensitivity = metrics.get('sensitivity', 0.0)
        if sensitivity >= 0.95:
            strengths.append("Excellent coverage of target region")
        
        specificity = metrics.get('specificity', 0.0)
        if specificity >= 0.98:
            strengths.append("Minimal false positive regions")
        
        return strengths
    
    @staticmethod
    def get_slice_feedback(
        pred_slice: np.ndarray,
        truth_slice: np.ndarray,
        slice_idx: int
    ) -> str:
        """Generate feedback for a specific slice"""
        try:
            from app.services.metrics_calculator import MetricsCalculator
            
            dice = MetricsCalculator.dice_coefficient(pred_slice, truth_slice)
            
            if dice < 0.5:
                return f"Slice {slice_idx}: Poor quality (Dice: {dice:.3f}) - needs significant correction"
            elif dice < 0.7:
                return f"Slice {slice_idx}: Needs improvement (Dice: {dice:.3f})"
            elif dice < 0.9:
                return f"Slice {slice_idx}: Good quality (Dice: {dice:.3f})"
            else:
                return f"Slice {slice_idx}: Excellent (Dice: {dice:.3f})"
                
        except Exception as e:
            logger.error(f"Error generating slice feedback: {str(e)}")
            return f"Slice {slice_idx}: Unable to evaluate"