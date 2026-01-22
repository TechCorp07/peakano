/**
 * useMaskOperations Hook
 * Provides mask operation functionality for the annotation canvas
 * 
 * @module annotation/useMaskOperations
 */

import { useCallback, useState } from 'react';
import { useCanvasAnnotationStore } from '@/features/annotation';
import { useAnnotationToolsStore, type MaskOperationType } from './store';
import {
  maskDilate,
  maskErode,
  maskOpen,
  maskClose,
  maskFillHoles,
  maskInvert,
  type BinaryMask,
} from './maskOperations';

interface UseMaskOperationsOptions {
  /** Current slice index */
  sliceIndex: number;
  /** Image width */
  imageWidth: number;
  /** Image height */
  imageHeight: number;
}

interface UseMaskOperationsReturn {
  /** Current morphological radius */
  morphRadius: number;
  /** Set morphological radius */
  setMorphRadius: (radius: number) => void;
  /** Whether there are annotations on current slice */
  hasAnnotations: boolean;
  /** Execute a morphological operation */
  executeMorphOperation: (operation: 'dilate' | 'erode' | 'open' | 'close' | 'fill-holes') => void;
  /** Invert the current mask */
  invertMask: () => void;
  /** Clear all annotations on current slice */
  clearAll: () => void;
  /** Get current mask operation mode (for shift/alt click handling) */
  getMaskModeFromEvent: (event: MouseEvent | React.MouseEvent) => MaskOperationType;
}

/**
 * Hook for mask operations on annotations
 */
export function useMaskOperations({
  sliceIndex,
  imageWidth,
  imageHeight,
}: UseMaskOperationsOptions): UseMaskOperationsReturn {
  const [morphRadius, setMorphRadius] = useState(1);
  
  const { annotations, setAnnotations, clearAnnotations } = useCanvasAnnotationStore();
  const { maskOperationMode } = useAnnotationToolsStore();
  
  const sliceKey = String(sliceIndex);
  const sliceAnnotations = annotations.get(sliceKey) || [];
  const hasAnnotations = sliceAnnotations.length > 0;
  
  /**
   * Convert annotations to a binary mask
   */
  const annotationsToMask = useCallback((): BinaryMask | null => {
    if (!hasAnnotations || imageWidth <= 0 || imageHeight <= 0) return null;
    
    const data = new Uint8Array(imageWidth * imageHeight);
    
    // Fill mask from annotations
    for (const ann of sliceAnnotations) {
      if ('pointsWorld' in ann && Array.isArray(ann.pointsWorld)) {
        // For contour-based annotations, we'd need to fill the polygon
        // This is a simplified version - in production, use proper polygon fill
        const points = ann.pointsWorld as Array<[number, number, number]>;
        if (points.length < 3) continue;
        
        // Simple scanline fill algorithm
        const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
        const maxY = Math.min(imageHeight - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
        
        for (let y = minY; y <= maxY; y++) {
          const intersections: number[] = [];
          
          for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            
            if ((p1[1] <= y && p2[1] > y) || (p2[1] <= y && p1[1] > y)) {
              const x = p1[0] + ((y - p1[1]) / (p2[1] - p1[1])) * (p2[0] - p1[0]);
              intersections.push(x);
            }
          }
          
          intersections.sort((a, b) => a - b);
          
          for (let i = 0; i < intersections.length - 1; i += 2) {
            const xStart = Math.max(0, Math.ceil(intersections[i]));
            const xEnd = Math.min(imageWidth - 1, Math.floor(intersections[i + 1]));
            
            for (let x = xStart; x <= xEnd; x++) {
              data[y * imageWidth + x] = 1;
            }
          }
        }
      }
    }
    
    return { data, width: imageWidth, height: imageHeight };
  }, [sliceAnnotations, hasAnnotations, imageWidth, imageHeight]);
  
  /**
   * Convert a mask back to annotation contour
   */
  const maskToAnnotation = useCallback((mask: BinaryMask) => {
    // For now, just update existing annotations with the mask
    // In a full implementation, this would extract contours from the mask
    console.log('[useMaskOperations] maskToAnnotation called, pixels:', 
      Array.from(mask.data).filter(v => v === 1).length);
    
    // TODO: Implement proper mask to contour conversion
    // For now, this is a placeholder
  }, []);
  
  /**
   * Execute a morphological operation
   */
  const executeMorphOperation = useCallback((operation: 'dilate' | 'erode' | 'open' | 'close' | 'fill-holes') => {
    const mask = annotationsToMask();
    if (!mask) {
      console.warn('[useMaskOperations] No mask to operate on');
      return;
    }
    
    console.log(`[useMaskOperations] Executing ${operation} with radius ${morphRadius}`);
    
    let result: BinaryMask;
    switch (operation) {
      case 'dilate':
        result = maskDilate(mask, morphRadius);
        break;
      case 'erode':
        result = maskErode(mask, morphRadius);
        break;
      case 'open':
        result = maskOpen(mask, morphRadius);
        break;
      case 'close':
        result = maskClose(mask, morphRadius);
        break;
      case 'fill-holes':
        result = maskFillHoles(mask);
        break;
    }
    
    maskToAnnotation(result);
  }, [annotationsToMask, maskToAnnotation, morphRadius]);
  
  /**
   * Invert the current mask
   */
  const invertMask = useCallback(() => {
    const mask = annotationsToMask();
    if (!mask) {
      console.warn('[useMaskOperations] No mask to invert');
      return;
    }
    
    console.log('[useMaskOperations] Inverting mask');
    const result = maskInvert(mask);
    maskToAnnotation(result);
  }, [annotationsToMask, maskToAnnotation]);
  
  /**
   * Clear all annotations on current slice
   */
  const clearAll = useCallback(() => {
    console.log('[useMaskOperations] Clearing all annotations on slice', sliceIndex);
    clearAnnotations(sliceKey);
  }, [clearAnnotations, sliceKey, sliceIndex]);
  
  /**
   * Get mask operation mode based on keyboard modifiers
   */
  const getMaskModeFromEvent = useCallback((event: MouseEvent | React.MouseEvent): MaskOperationType => {
    // Shift+Click = Add
    if (event.shiftKey) {
      return 'add';
    }
    // Alt+Click = Subtract
    if (event.altKey) {
      return 'subtract';
    }
    // Use the current mode from store
    return maskOperationMode;
  }, [maskOperationMode]);
  
  return {
    morphRadius,
    setMorphRadius,
    hasAnnotations,
    executeMorphOperation,
    invertMask,
    clearAll,
    getMaskModeFromEvent,
  };
}

export default useMaskOperations;
