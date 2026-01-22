/**
 * Progress Tracking React Hook
 * Provides progress tracking functionality for annotations
 * 
 * @module annotation/useProgressTracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCanvasAnnotationStore } from '@/features/annotation';
import {
  calculateSliceProgress,
  calculateSliceStats,
  calculateStudyProgress,
  generateSliceIndicators,
  type SliceProgress,
  type SliceStats,
  type StudyProgress,
  type SliceIndicator,
} from './progressTracking';
import type { CanvasAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseProgressTrackingOptions {
  studyUid?: string;
  seriesUid?: string;
  totalSlices?: number;
  imageWidth?: number;
  imageHeight?: number;
  autoUpdate?: boolean;
  updateInterval?: number; // ms
  currentSlice?: number; // Current slice index
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseProgressTrackingResult {
  // Current slice stats
  currentSliceStats: SliceStats | null;
  currentSliceProgress: SliceProgress | null;
  
  // Overall progress
  studyProgress: StudyProgress | null;
  sliceIndicators: SliceIndicator[];
  
  // Completion tracking
  completedSlices: Set<number>;
  markSliceComplete: (sliceIndex: number) => void;
  markSliceIncomplete: (sliceIndex: number) => void;
  toggleSliceComplete: (sliceIndex: number) => void;
  
  // Progress functions
  refreshProgress: () => void;
  getSliceStats: (sliceIndex: number) => SliceStats | null;
  
  // Summary
  progressSummary: {
    totalSlices: number;
    annotatedSlices: number;
    completedSlices: number;
    totalAnnotations: number;
    progressPercent: number;
    completionPercent: number;
  };
}

// ============================================================================
// Progress Tracking Hook
// ============================================================================

export function useProgressTracking(
  options: UseProgressTrackingOptions = {}
): UseProgressTrackingResult {
  const {
    studyUid = 'default',
    seriesUid = 'default',
    totalSlices = 100,
    imageWidth = 512,
    imageHeight = 512,
    autoUpdate = true,
    updateInterval = 1000,
    currentSlice: providedCurrentSlice = 0,
  } = options;

  // Get annotation state from store - using 'annotations' which is the actual property name
  const annotations = useCanvasAnnotationStore(
    (state) => state.annotations
  );
  
  // Use provided currentSlice since store doesn't have it
  const currentSlice = providedCurrentSlice;

  // Local state
  const [completedSlices, setCompletedSlices] = useState<Set<number>>(new Set());
  const [studyProgress, setStudyProgress] = useState<StudyProgress | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Calculate current slice annotations
  const currentSliceAnnotations = useMemo(() => {
    const key = `${studyUid}_${seriesUid}_${currentSlice}`;
    return annotations.get(key) || [];
  }, [annotations, studyUid, seriesUid, currentSlice]);

  // Calculate current slice stats
  const currentSliceStats = useMemo(() => {
    if (currentSliceAnnotations.length === 0) return null;
    return calculateSliceStats(
      currentSlice,
      currentSliceAnnotations,
      imageWidth,
      imageHeight
    );
  }, [currentSliceAnnotations, currentSlice, imageWidth, imageHeight]);

  // Calculate current slice progress
  const currentSliceProgress = useMemo(() => {
    return calculateSliceProgress(
      currentSlice,
      currentSliceAnnotations,
      completedSlices.has(currentSlice)
    );
  }, [currentSliceAnnotations, currentSlice, completedSlices]);

  // Refresh overall progress
  const refreshProgress = useCallback(() => {
    const progress = calculateStudyProgress(
      studyUid,
      seriesUid,
      totalSlices,
      annotations,
      completedSlices
    );
    setStudyProgress(progress);
    setLastUpdateTime(Date.now());
  }, [studyUid, seriesUid, totalSlices, annotations, completedSlices]);

  // Generate slice indicators
  const sliceIndicators = useMemo(() => {
    if (!studyProgress) return [];
    return generateSliceIndicators(totalSlices, studyProgress.sliceProgress);
  }, [studyProgress, totalSlices]);

  // Get stats for a specific slice
  const getSliceStats = useCallback((sliceIndex: number): SliceStats | null => {
    const key = `${studyUid}_${seriesUid}_${sliceIndex}`;
    const sliceAnnotations = annotations.get(key) || [];
    if (sliceAnnotations.length === 0) return null;
    return calculateSliceStats(sliceIndex, sliceAnnotations, imageWidth, imageHeight);
  }, [annotations, studyUid, seriesUid, imageWidth, imageHeight]);

  // Completion management
  const markSliceComplete = useCallback((sliceIndex: number) => {
    setCompletedSlices(prev => {
      const next = new Set(prev);
      next.add(sliceIndex);
      return next;
    });
  }, []);

  const markSliceIncomplete = useCallback((sliceIndex: number) => {
    setCompletedSlices(prev => {
      const next = new Set(prev);
      next.delete(sliceIndex);
      return next;
    });
  }, []);

  const toggleSliceComplete = useCallback((sliceIndex: number) => {
    setCompletedSlices(prev => {
      const next = new Set(prev);
      if (next.has(sliceIndex)) {
        next.delete(sliceIndex);
      } else {
        next.add(sliceIndex);
      }
      return next;
    });
  }, []);

  // Auto-update effect
  useEffect(() => {
    if (!autoUpdate) return;

    // Initial update
    refreshProgress();

    // Set up interval for periodic updates
    const interval = setInterval(refreshProgress, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval, refreshProgress]);

  // Update on annotation changes
  useEffect(() => {
    refreshProgress();
  }, [annotations, refreshProgress]);

  // Progress summary
  const progressSummary = useMemo(() => {
    if (!studyProgress) {
      return {
        totalSlices,
        annotatedSlices: 0,
        completedSlices: 0,
        totalAnnotations: 0,
        progressPercent: 0,
        completionPercent: 0,
      };
    }

    return {
      totalSlices: studyProgress.totalSlices,
      annotatedSlices: studyProgress.annotatedSlices,
      completedSlices: studyProgress.completedSlices,
      totalAnnotations: studyProgress.totalAnnotations,
      progressPercent: studyProgress.progressPercent,
      completionPercent: studyProgress.completionPercent,
    };
  }, [studyProgress, totalSlices]);

  return {
    currentSliceStats,
    currentSliceProgress,
    studyProgress,
    sliceIndicators,
    completedSlices,
    markSliceComplete,
    markSliceIncomplete,
    toggleSliceComplete,
    refreshProgress,
    getSliceStats,
    progressSummary,
  };
}

export default useProgressTracking;
