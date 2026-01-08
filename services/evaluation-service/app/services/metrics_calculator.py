"""
Metrics calculation service
Core evaluation metrics for medical image annotations
"""
import numpy as np
from scipy.spatial.distance import directed_hausdorff
from scipy.ndimage import distance_transform_edt
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class MetricsCalculator:
    """Calculate evaluation metrics for medical image segmentations"""
    
    @staticmethod
    def dice_coefficient(pred: np.ndarray, truth: np.ndarray) -> float:
        """
        Calculate Dice Coefficient (F1 Score)
        Dice = 2 * |A ∩ B| / (|A| + |B|)
        """
        try:
            pred = pred.astype(bool)
            truth = truth.astype(bool)
            
            intersection = np.logical_and(pred, truth).sum()
            
            if pred.sum() == 0 and truth.sum() == 0:
                return 1.0  # Both empty
            
            if pred.sum() == 0 or truth.sum() == 0:
                return 0.0  # One empty
            
            dice = (2.0 * intersection) / (pred.sum() + truth.sum())
            return float(dice)
            
        except Exception as e:
            logger.error(f"Error calculating Dice coefficient: {str(e)}")
            return 0.0
    
    @staticmethod
    def iou(pred: np.ndarray, truth: np.ndarray) -> float:
        """
        Calculate Intersection over Union (Jaccard Index)
        IoU = |A ∩ B| / |A ∪ B|
        """
        try:
            pred = pred.astype(bool)
            truth = truth.astype(bool)
            
            intersection = np.logical_and(pred, truth).sum()
            union = np.logical_or(pred, truth).sum()
            
            if union == 0:
                return 1.0 if intersection == 0 else 0.0
            
            iou_score = intersection / union
            return float(iou_score)
            
        except Exception as e:
            logger.error(f"Error calculating IoU: {str(e)}")
            return 0.0
    
    @staticmethod
    def hausdorff_distance(pred: np.ndarray, truth: np.ndarray, spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> Dict[str, float]:
        """
        Calculate Hausdorff Distance and 95th percentile
        Returns distance in mm based on voxel spacing
        """
        try:
            pred = pred.astype(bool)
            truth = truth.astype(bool)
            
            # Get surface points
            pred_surface = MetricsCalculator._get_surface_points(pred)
            truth_surface = MetricsCalculator._get_surface_points(truth)
            
            if len(pred_surface) == 0 or len(truth_surface) == 0:
                return {"hausdorff": 0.0, "hausdorff_95": 0.0}
            
            # Apply spacing
            pred_surface_scaled = pred_surface * np.array(spacing)
            truth_surface_scaled = truth_surface * np.array(spacing)
            
            # Calculate directed Hausdorff distances
            d1 = directed_hausdorff(pred_surface_scaled, truth_surface_scaled)[0]
            d2 = directed_hausdorff(truth_surface_scaled, pred_surface_scaled)[0]
            
            hausdorff = max(d1, d2)
            
            # Calculate 95th percentile Hausdorff
            distances = MetricsCalculator._surface_distances(pred_surface_scaled, truth_surface_scaled)
            hausdorff_95 = float(np.percentile(distances, 95)) if len(distances) > 0 else 0.0
            
            return {
                "hausdorff": float(hausdorff),
                "hausdorff_95": hausdorff_95
            }
            
        except Exception as e:
            logger.error(f"Error calculating Hausdorff distance: {str(e)}")
            return {"hausdorff": 0.0, "hausdorff_95": 0.0}
    
    @staticmethod
    def surface_distance(pred: np.ndarray, truth: np.ndarray, spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> Dict[str, float]:
        """
        Calculate mean and RMS surface distance
        """
        try:
            pred_surface = MetricsCalculator._get_surface_points(pred.astype(bool))
            truth_surface = MetricsCalculator._get_surface_points(truth.astype(bool))
            
            if len(pred_surface) == 0 or len(truth_surface) == 0:
                return {"mean": 0.0, "rms": 0.0}
            
            # Apply spacing
            pred_surface_scaled = pred_surface * np.array(spacing)
            truth_surface_scaled = truth_surface * np.array(spacing)
            
            distances = MetricsCalculator._surface_distances(pred_surface_scaled, truth_surface_scaled)
            
            return {
                "mean": float(np.mean(distances)),
                "rms": float(np.sqrt(np.mean(distances ** 2)))
            }
            
        except Exception as e:
            logger.error(f"Error calculating surface distance: {str(e)}")
            return {"mean": 0.0, "rms": 0.0}
    
    @staticmethod
    def volume_difference(pred: np.ndarray, truth: np.ndarray, spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> float:
        """
        Calculate volume difference as percentage
        """
        try:
            voxel_volume = spacing[0] * spacing[1] * spacing[2]  # mm³
            
            pred_volume = pred.sum() * voxel_volume
            truth_volume = truth.sum() * voxel_volume
            
            if truth_volume == 0:
                return 0.0 if pred_volume == 0 else 100.0
            
            diff_percent = ((pred_volume - truth_volume) / truth_volume) * 100
            return float(diff_percent)
            
        except Exception as e:
            logger.error(f"Error calculating volume difference: {str(e)}")
            return 0.0
    
    @staticmethod
    def centroid_distance(pred: np.ndarray, truth: np.ndarray, spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)) -> float:
        """
        Calculate distance between centroids in mm
        """
        try:
            pred_indices = np.argwhere(pred > 0)
            truth_indices = np.argwhere(truth > 0)
            
            if len(pred_indices) == 0 or len(truth_indices) == 0:
                return 0.0
            
            pred_centroid = pred_indices.mean(axis=0) * np.array(spacing)
            truth_centroid = truth_indices.mean(axis=0) * np.array(spacing)
            
            distance = np.linalg.norm(pred_centroid - truth_centroid)
            return float(distance)
            
        except Exception as e:
            logger.error(f"Error calculating centroid distance: {str(e)}")
            return 0.0
    
    @staticmethod
    def sensitivity_specificity(pred: np.ndarray, truth: np.ndarray) -> Dict[str, float]:
        """
        Calculate sensitivity (recall) and specificity
        """
        try:
            pred = pred.astype(bool)
            truth = truth.astype(bool)
            
            TP = np.logical_and(pred, truth).sum()
            TN = np.logical_and(~pred, ~truth).sum()
            FP = np.logical_and(pred, ~truth).sum()
            FN = np.logical_and(~pred, truth).sum()
            
            sensitivity = TP / (TP + FN) if (TP + FN) > 0 else 0.0
            specificity = TN / (TN + FP) if (TN + FP) > 0 else 0.0
            precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
            
            return {
                "sensitivity": float(sensitivity),
                "specificity": float(specificity),
                "precision": float(precision)
            }
            
        except Exception as e:
            logger.error(f"Error calculating sensitivity/specificity: {str(e)}")
            return {"sensitivity": 0.0, "specificity": 0.0, "precision": 0.0}
    
    @staticmethod
    def _get_surface_points(mask: np.ndarray) -> np.ndarray:
        """Extract surface points from binary mask"""
        from scipy.ndimage import binary_erosion
        
        eroded = binary_erosion(mask)
        surface = mask & ~eroded
        return np.argwhere(surface)
    
    @staticmethod
    def _surface_distances(surface1: np.ndarray, surface2: np.ndarray) -> np.ndarray:
        """Calculate distances from each point in surface1 to nearest in surface2"""
        from scipy.spatial import cKDTree
        
        tree = cKDTree(surface2)
        distances, _ = tree.query(surface1)
        return distances
    
    @staticmethod
    def calculate_all_metrics(
        pred: np.ndarray,
        truth: np.ndarray,
        spacing: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    ) -> Dict[str, Any]:
        """
        Calculate all available metrics
        """
        metrics = {}
        
        # Overlap metrics
        metrics['dice_score'] = MetricsCalculator.dice_coefficient(pred, truth)
        metrics['iou_score'] = MetricsCalculator.iou(pred, truth)
        
        # Distance metrics
        hausdorff = MetricsCalculator.hausdorff_distance(pred, truth, spacing)
        metrics.update({
            'hausdorff_distance': hausdorff['hausdorff'],
            'hausdorff_95': hausdorff['hausdorff_95']
        })
        
        # Surface distance
        surface_dist = MetricsCalculator.surface_distance(pred, truth, spacing)
        metrics.update({
            'surface_distance_mean': surface_dist['mean'],
            'surface_distance_rms': surface_dist['rms']
        })
        
        # Volume metrics
        metrics['volume_difference'] = MetricsCalculator.volume_difference(pred, truth, spacing)
        metrics['centroid_distance'] = MetricsCalculator.centroid_distance(pred, truth, spacing)
        
        # Classification metrics
        sens_spec = MetricsCalculator.sensitivity_specificity(pred, truth)
        metrics.update(sens_spec)
        
        return metrics