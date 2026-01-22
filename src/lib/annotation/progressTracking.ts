/**
 * Annotation Progress Tracking
 * Tracks annotation progress across slices and provides statistics
 * 
 * Phase 3: Progress Tracking
 * - Slice progress indicator
 * - Annotation statistics (area, count, coverage)
 * - Progress state management
 * 
 * @module annotation/progress
 */

import type { CanvasAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';
import { calculateArea, calculatePerimeter, calculateCentroid } from './measurementTools';

// ============================================================================
// Types
// ============================================================================

/**
 * Progress state for a single slice
 */
export interface SliceProgress {
  sliceIndex: number;
  annotationCount: number;
  totalPoints: number;
  hasAnnotations: boolean;
  isComplete: boolean; // User-marked as complete
  lastModified: Date | null;
}

/**
 * Statistics for a single annotation
 */
export interface AnnotationStats {
  id: string;
  type: string;
  pointCount: number;
  area: number; // in pixels squared
  perimeter: number; // in pixels
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
}

/**
 * Statistics for a single slice
 */
export interface SliceStats {
  sliceIndex: number;
  annotationCount: number;
  totalArea: number;
  totalPerimeter: number;
  annotations: AnnotationStats[];
  coverage: number; // percentage of image covered (0-100)
}

/**
 * Overall study progress
 */
export interface StudyProgress {
  studyUid: string;
  seriesUid: string;
  totalSlices: number;
  annotatedSlices: number;
  completedSlices: number;
  totalAnnotations: number;
  progressPercent: number;
  completionPercent: number;
  sliceProgress: Map<number, SliceProgress>;
  lastModified: Date | null;
}

/**
 * Progress update event
 */
export interface ProgressUpdateEvent {
  type: 'annotation-added' | 'annotation-removed' | 'slice-completed' | 'slice-cleared';
  sliceIndex: number;
  timestamp: Date;
}

// ============================================================================
// Progress Calculation Functions
// ============================================================================

/**
 * Calculate progress for a single slice
 */
export function calculateSliceProgress(
  sliceIndex: number,
  annotations: CanvasAnnotation[],
  isComplete: boolean = false
): SliceProgress {
  const totalPoints = annotations.reduce((sum, ann) => {
    return sum + (ann.points?.length || 0);
  }, 0);

  return {
    sliceIndex,
    annotationCount: annotations.length,
    totalPoints,
    hasAnnotations: annotations.length > 0,
    isComplete,
    lastModified: annotations.length > 0 ? new Date() : null,
  };
}

/**
 * Calculate statistics for a single annotation
 */
export function calculateAnnotationStats(
  annotation: CanvasAnnotation,
  imageWidth: number = 512,
  imageHeight: number = 512
): AnnotationStats {
  const points = annotation.points || [];
  
  // Create a simple mask from points for area calculation
  let area = 0;
  let perimeter = 0;
  let centroid = { x: 0, y: 0 };
  let boundingBox = { x: 0, y: 0, width: 0, height: 0 };

  if (points.length > 2) {
    // Calculate bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Calculate centroid
    centroid = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };

    // Calculate perimeter (sum of distances between consecutive points)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      perimeter += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    // Calculate area using Shoelace formula (for closed polygons)
    if (annotation.completed || annotation.type === 'polygon') {
      let signedArea = 0;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        signedArea += (p1.x * p2.y - p2.x * p1.y);
      }
      area = Math.abs(signedArea) / 2;
    } else {
      // For brush strokes, estimate area from bounding box
      area = boundingBox.width * boundingBox.height * 0.7; // Approximate
    }
  }

  return {
    id: annotation.id,
    type: annotation.type,
    pointCount: points.length,
    area,
    perimeter,
    centroid,
    boundingBox,
  };
}

/**
 * Calculate statistics for a slice
 */
export function calculateSliceStats(
  sliceIndex: number,
  annotations: CanvasAnnotation[],
  imageWidth: number = 512,
  imageHeight: number = 512
): SliceStats {
  const annotationStats = annotations.map(ann => 
    calculateAnnotationStats(ann, imageWidth, imageHeight)
  );

  const totalArea = annotationStats.reduce((sum, s) => sum + s.area, 0);
  const totalPerimeter = annotationStats.reduce((sum, s) => sum + s.perimeter, 0);
  const imageArea = imageWidth * imageHeight;
  const coverage = (totalArea / imageArea) * 100;

  return {
    sliceIndex,
    annotationCount: annotations.length,
    totalArea,
    totalPerimeter,
    annotations: annotationStats,
    coverage: Math.min(coverage, 100), // Cap at 100%
  };
}

/**
 * Calculate overall study progress
 */
export function calculateStudyProgress(
  studyUid: string,
  seriesUid: string,
  totalSlices: number,
  annotationsMap: Map<string, CanvasAnnotation[]>,
  completedSlices: Set<number> = new Set()
): StudyProgress {
  const sliceProgress = new Map<number, SliceProgress>();
  let totalAnnotations = 0;
  let annotatedSliceCount = 0;
  let lastModified: Date | null = null;

  // Parse annotations map to extract slice indices
  annotationsMap.forEach((annotations, key) => {
    const parts = key.split('_');
    const sliceIndex = parseInt(parts[parts.length - 1], 10);
    
    if (!isNaN(sliceIndex)) {
      const progress = calculateSliceProgress(
        sliceIndex,
        annotations,
        completedSlices.has(sliceIndex)
      );
      
      sliceProgress.set(sliceIndex, progress);
      
      if (progress.hasAnnotations) {
        annotatedSliceCount++;
        totalAnnotations += progress.annotationCount;
        
        if (progress.lastModified && (!lastModified || progress.lastModified > lastModified)) {
          lastModified = progress.lastModified;
        }
      }
    }
  });

  const progressPercent = totalSlices > 0 
    ? (annotatedSliceCount / totalSlices) * 100 
    : 0;

  const completionPercent = totalSlices > 0 
    ? (completedSlices.size / totalSlices) * 100 
    : 0;

  return {
    studyUid,
    seriesUid,
    totalSlices,
    annotatedSlices: annotatedSliceCount,
    completedSlices: completedSlices.size,
    totalAnnotations,
    progressPercent,
    completionPercent,
    sliceProgress,
    lastModified,
  };
}

// ============================================================================
// Progress Visualization Helpers
// ============================================================================

/**
 * Generate slice indicator data for visualization
 */
export interface SliceIndicator {
  index: number;
  status: 'empty' | 'annotated' | 'complete';
  annotationCount: number;
}

export function generateSliceIndicators(
  totalSlices: number,
  sliceProgress: Map<number, SliceProgress>
): SliceIndicator[] {
  const indicators: SliceIndicator[] = [];

  for (let i = 0; i < totalSlices; i++) {
    const progress = sliceProgress.get(i);
    
    let status: SliceIndicator['status'] = 'empty';
    let annotationCount = 0;

    if (progress) {
      annotationCount = progress.annotationCount;
      if (progress.isComplete) {
        status = 'complete';
      } else if (progress.hasAnnotations) {
        status = 'annotated';
      }
    }

    indicators.push({ index: i, status, annotationCount });
  }

  return indicators;
}

/**
 * Get color for slice indicator based on status
 */
export function getSliceIndicatorColor(status: SliceIndicator['status']): string {
  switch (status) {
    case 'complete':
      return '#22C55E'; // Green
    case 'annotated':
      return '#3B82F6'; // Blue
    case 'empty':
    default:
      return '#374151'; // Gray
  }
}

/**
 * Format progress percentage for display
 */
export function formatProgress(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Format annotation count for display
 */
export function formatAnnotationCount(count: number): string {
  if (count === 0) return 'No annotations';
  if (count === 1) return '1 annotation';
  return `${count} annotations`;
}

/**
 * Format area for display
 */
export function formatAreaDisplay(area: number, pixelSpacing?: [number, number]): string {
  if (pixelSpacing) {
    const areaInMm = area * pixelSpacing[0] * pixelSpacing[1];
    if (areaInMm < 100) {
      return `${areaInMm.toFixed(2)} mm²`;
    }
    return `${(areaInMm / 100).toFixed(2)} cm²`;
  }
  return `${Math.round(area)} px²`;
}

// ============================================================================
// Progress Summary
// ============================================================================

/**
 * Generate a text summary of progress
 */
export function generateProgressSummary(progress: StudyProgress): string {
  const lines: string[] = [
    `Study Progress Summary`,
    `─────────────────────`,
    `Total Slices: ${progress.totalSlices}`,
    `Annotated: ${progress.annotatedSlices} (${formatProgress(progress.progressPercent)})`,
    `Completed: ${progress.completedSlices} (${formatProgress(progress.completionPercent)})`,
    `Total Annotations: ${progress.totalAnnotations}`,
  ];

  if (progress.lastModified) {
    lines.push(`Last Modified: ${progress.lastModified.toLocaleString()}`);
  }

  return lines.join('\n');
}

/**
 * Check if study meets minimum annotation requirements
 */
export interface AnnotationRequirements {
  minAnnotatedSlices?: number;
  minAnnotationsPerSlice?: number;
  minTotalAnnotations?: number;
  minCoverage?: number; // percentage
}

export function checkRequirements(
  progress: StudyProgress,
  requirements: AnnotationRequirements
): { met: boolean; missing: string[] } {
  const missing: string[] = [];

  if (requirements.minAnnotatedSlices && progress.annotatedSlices < requirements.minAnnotatedSlices) {
    missing.push(`Need ${requirements.minAnnotatedSlices - progress.annotatedSlices} more annotated slices`);
  }

  if (requirements.minTotalAnnotations && progress.totalAnnotations < requirements.minTotalAnnotations) {
    missing.push(`Need ${requirements.minTotalAnnotations - progress.totalAnnotations} more annotations`);
  }

  return {
    met: missing.length === 0,
    missing,
  };
}
