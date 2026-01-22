/**
 * useSmartTools Hook
 * Integrates smart tool algorithms with the DICOM viewer
 */

import { useCallback, useRef } from 'react';
import type { IStackViewport, IVolumeViewport } from '@cornerstonejs/core/types';
import type { Point3 } from '@cornerstonejs/core/types';
import {
  useSmartToolStore,
  magicWandSelect,
  regionGrow,
  interpolateSlices,
  canvasAnnotationsToSliceAnnotations,
  type MagicWandResult,
  type RegionGrowingResult,
  type SliceAnnotation,
} from '@/lib/smartTools';
import { useCanvasAnnotationStore } from '@/features/annotation';
import { useAnnotationToolsStore } from '@/lib/annotation';

interface UseSmartToolsOptions {
  viewport: IStackViewport | IVolumeViewport | null;
  imageIndex?: number;
  totalSlices?: number;
}

interface SmartToolsAPI {
  /** Execute Magic Wand at a click position */
  executeMagicWand: (canvasX: number, canvasY: number) => Promise<MagicWandResult | null>;
  /** Execute Region Growing at a click position */
  executeRegionGrowing: (canvasX: number, canvasY: number) => Promise<RegionGrowingResult | null>;
  /** Execute Interpolation on current annotations */
  executeInterpolation: () => Promise<SliceAnnotation[] | null>;
  /** Convert result mask to canvas annotation, with optional event modifiers for shift/alt click */
  resultToAnnotation: (result: MagicWandResult | RegionGrowingResult, eventModifiers?: { shiftKey?: boolean; altKey?: boolean }) => void;
  /** Check if a smart tool is active */
  isSmartToolActive: boolean;
}

/**
 * Hook for using smart tools with the DICOM viewer
 */
export function useSmartTools({
  viewport,
  imageIndex = 0,
  totalSlices = 1,
}: UseSmartToolsOptions): SmartToolsAPI {
  const {
    activeTool,
    magicWandConfig,
    regionGrowingConfig,
    interpolationConfig,
    setProcessing,
    setResult,
    setError,
  } = useSmartToolStore();

  const { annotations: canvasAnnotations, setAnnotations } = useCanvasAnnotationStore();
  
  const processingRef = useRef(false);

  /**
   * Get pixel data from viewport
   */
  const getImageData = useCallback((): {
    data: Float32Array | Int16Array | Uint8Array | Uint16Array;
    width: number;
    height: number;
  } | null => {
    if (!viewport) return null;

    try {
      const image = (viewport as IStackViewport).getImageData?.();
      if (!image) return null;

      const { dimensions, scalarData } = image;
      return {
        data: scalarData as Float32Array | Int16Array | Uint8Array | Uint16Array,
        width: dimensions[0],
        height: dimensions[1],
      };
    } catch (error) {
      console.error('[useSmartTools] Failed to get image data:', error);
      return null;
    }
  }, [viewport]);

  /**
   * Convert canvas coordinates to image coordinates
   */
  const canvasToImageCoords = useCallback((canvasX: number, canvasY: number): { x: number; y: number } | null => {
    if (!viewport) return null;

    try {
      // Get the canvas element
      const canvas = viewport.canvas;
      if (!canvas) return null;

      // Get viewport dimensions
      const { width: imageWidth, height: imageHeight } = getImageData() || { width: 0, height: 0 };
      if (imageWidth === 0 || imageHeight === 0) return null;

      // Map canvas coords to image coords
      // This is a simplified mapping - actual implementation may need to account for pan/zoom
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const x = (canvasX / canvasWidth) * imageWidth;
      const y = (canvasY / canvasHeight) * imageHeight;

      return { x: Math.floor(x), y: Math.floor(y) };
    } catch {
      return null;
    }
  }, [viewport, getImageData]);

  /**
   * Convert image pixel coordinates to world coordinates
   * Image coordinates are in the original image space (0 to width/height)
   * Canvas coordinates are in the canvas display space
   * World coordinates are in 3D DICOM space
   */
  const imageToWorld = useCallback((imageX: number, imageY: number): Point3 | null => {
    if (!viewport) return null;

    try {
      // First convert image coordinates to canvas coordinates
      const canvas = viewport.canvas;
      if (!canvas) return null;
      
      const imageData = getImageData();
      if (!imageData) return null;
      
      const { width: imageWidth, height: imageHeight } = imageData;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Map image coords to canvas coords
      const canvasX = (imageX / imageWidth) * canvasWidth;
      const canvasY = (imageY / imageHeight) * canvasHeight;
      
      // Now convert canvas coordinates to world coordinates
      const worldPoint = viewport.canvasToWorld([canvasX, canvasY]);
      return worldPoint as Point3;
    } catch {
      return null;
    }
  }, [viewport, getImageData]);

  /**
   * Execute Magic Wand tool
   */
  const executeMagicWand = useCallback(async (canvasX: number, canvasY: number): Promise<MagicWandResult | null> => {
    if (processingRef.current || !viewport) return null;

    processingRef.current = true;
    setProcessing(true);
    setError(null);

    try {
      const imageData = getImageData();
      if (!imageData) {
        throw new Error('Failed to get image data');
      }

      const imageCoords = canvasToImageCoords(canvasX, canvasY);
      if (!imageCoords) {
        throw new Error('Failed to convert coordinates');
      }

      // Execute magic wand algorithm
      const result = magicWandSelect(
        imageData.data,
        imageData.width,
        imageData.height,
        imageCoords.x,
        imageCoords.y,
        magicWandConfig,
        (x, y) => imageToWorld(x, y)
      );

      setResult(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Magic Wand failed';
      setError(message);
      return null;
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [viewport, magicWandConfig, getImageData, canvasToImageCoords, imageToWorld, setProcessing, setResult, setError]);

  /**
   * Execute Region Growing tool
   */
  const executeRegionGrowing = useCallback(async (canvasX: number, canvasY: number): Promise<RegionGrowingResult | null> => {
    if (processingRef.current || !viewport) return null;

    processingRef.current = true;
    setProcessing(true);
    setError(null);

    try {
      const imageData = getImageData();
      if (!imageData) {
        throw new Error('Failed to get image data');
      }

      const imageCoords = canvasToImageCoords(canvasX, canvasY);
      if (!imageCoords) {
        throw new Error('Failed to convert coordinates');
      }

      // Execute region growing algorithm
      const result = regionGrow(
        imageData.data,
        imageData.width,
        imageData.height,
        imageCoords.x,
        imageCoords.y,
        regionGrowingConfig,
        (x, y) => imageToWorld(x, y)
      );

      setResult(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Region Growing failed';
      setError(message);
      return null;
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [viewport, regionGrowingConfig, getImageData, canvasToImageCoords, imageToWorld, setProcessing, setResult, setError]);

  /**
   * Execute Interpolation
   */
  const executeInterpolation = useCallback(async (): Promise<SliceAnnotation[] | null> => {
    if (processingRef.current) return null;

    processingRef.current = true;
    setProcessing(true);
    setError(null);

    try {
      // Convert canvas annotations to slice annotations
      const annotationsMap = new Map<number, Array<{ pointsWorld: Point3[]; completed?: boolean }>>();
      
      // Get annotations from canvas store - guard against undefined
      if (canvasAnnotations && canvasAnnotations.size > 0) {
        canvasAnnotations.forEach((anns, key) => {
          // Guard against undefined anns
          if (!anns || !Array.isArray(anns)) return;
          
          const sliceIndex = typeof key === 'number' ? key : parseInt(String(key), 10);
          if (!isNaN(sliceIndex)) {
            const converted = anns
              .filter(ann => ann && 'pointsWorld' in ann && Array.isArray(ann.pointsWorld))
              .map(ann => ({
                pointsWorld: (ann as { pointsWorld: Point3[] }).pointsWorld,
                completed: 'completed' in ann ? (ann as { completed?: boolean }).completed : true,
            }));
          annotationsMap.set(sliceIndex, converted);
        }
        });
      }

      const sliceAnnotations = canvasAnnotationsToSliceAnnotations(annotationsMap);

      if (sliceAnnotations.length < 2) {
        throw new Error('Need at least 2 annotated slices for interpolation');
      }

      // Calculate Z coordinates for slices
      const sliceZCoords = new Map<number, number>();
      for (let i = 0; i < totalSlices; i++) {
        // Estimate Z based on slice index (actual implementation should use DICOM metadata)
        sliceZCoords.set(i, i);
      }

      // Execute interpolation
      const result = interpolateSlices(sliceAnnotations, interpolationConfig, sliceZCoords);

      setResult(result);

      // Return the interpolated annotations
      return result.sliceAnnotations;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Interpolation failed';
      setError(message);
      return null;
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [canvasAnnotations, totalSlices, interpolationConfig, setProcessing, setResult, setError]);

  // Get mask operation mode from store
  const { maskOperationMode } = useAnnotationToolsStore();

  /**
   * Convert result mask to canvas annotation
   * Respects maskOperationMode for combining with existing annotations
   */
  const resultToAnnotation = useCallback((result: MagicWandResult | RegionGrowingResult, eventModifiers?: { shiftKey?: boolean; altKey?: boolean }) => {
    console.log('[useSmartTools] resultToAnnotation called with:', {
      hasContourPoints: !!result.contourPoints,
      contourLength: result.contourPoints?.length,
      imageIndex,
      samplePoints: result.contourPoints?.slice(0, 3),
      maskOperationMode,
      eventModifiers,
    });
    
    if (!result.contourPoints || result.contourPoints.length < 3) {
      console.warn('[useSmartTools] No contour points in result');
      return;
    }

    // Determine effective mode from event modifiers or store
    let effectiveMode = maskOperationMode;
    if (eventModifiers?.shiftKey) {
      effectiveMode = 'add';
    } else if (eventModifiers?.altKey) {
      effectiveMode = 'subtract';
    }

    // Create a freehand annotation from the contour
    const annotation = {
      id: `smart-${Date.now()}`,
      type: 'freehand' as const,
      pointsWorld: result.contourPoints,
      completed: true,
      color: effectiveMode === 'subtract' ? 'rgba(255, 100, 100, 0.4)' : 'rgba(144, 238, 144, 0.4)',
    };

    console.log('[useSmartTools] Created annotation:', annotation.id, 'with', annotation.pointsWorld.length, 'points', 'mode:', effectiveMode);

    // Add to canvas annotations for current slice
    const key = String(imageIndex);
    const existing = canvasAnnotations.get(key) || [];
    console.log('[useSmartTools] Existing annotations for slice', key, ':', existing.length);
    
    // Handle different modes
    switch (effectiveMode) {
      case 'replace':
      case 'none':
        // Replace: Clear existing and add new
        setAnnotations(key, [annotation]);
        break;
      case 'add':
      case 'union':
        // Add: Append to existing
        setAnnotations(key, [...existing, annotation]);
        break;
      case 'subtract':
        // Subtract: Add as eraser-type annotation
        setAnnotations(key, [...existing, { ...annotation, type: 'eraser-freehand' as const }]);
        break;
      case 'intersect':
        // Intersect: For now, just add (proper intersection requires mask operations)
        console.log('[useSmartTools] Intersect mode - adding annotation (full implementation requires mask ops)');
        setAnnotations(key, [...existing, annotation]);
        break;
      case 'xor':
        // XOR: For now, just add (proper XOR requires mask operations)
        console.log('[useSmartTools] XOR mode - adding annotation (full implementation requires mask ops)');
        setAnnotations(key, [...existing, annotation]);
        break;
      default:
        // Default: Add
        setAnnotations(key, [...existing, annotation]);
    }
    
    console.log('[useSmartTools] Stored annotation for slice', key);
  }, [imageIndex, canvasAnnotations, setAnnotations, maskOperationMode]);

  return {
    executeMagicWand,
    executeRegionGrowing,
    executeInterpolation,
    resultToAnnotation,
    isSmartToolActive: activeTool !== 'none',
  };
}
