/**
 * Smart Tools Type Definitions
 * Types for Magic Wand, Region Growing, and Interpolation tools
 */

import type { Point3 } from '@cornerstonejs/core/types';

/**
 * Smart tool types available
 */
export type SmartToolType = 'magic-wand' | 'region-growing' | 'interpolation' | 'none';

/**
 * Magic Wand configuration
 */
export interface MagicWandConfig {
  /** Tolerance for pixel intensity matching (0-255) */
  tolerance: number;
  /** Whether to use 8-connected (true) or 4-connected (false) neighbors */
  eightConnected: boolean;
  /** Maximum number of pixels to process (performance limit) */
  maxPixels: number;
  /** Whether to apply edge smoothing */
  smoothEdges: boolean;
}

/**
 * Region Growing configuration
 */
export interface RegionGrowingConfig {
  /** Intensity tolerance for region expansion */
  intensityTolerance: number;
  /** Gradient threshold for edge detection */
  gradientThreshold: number;
  /** Maximum iterations for growth */
  maxIterations: number;
  /** Minimum region size to accept */
  minRegionSize: number;
  /** Whether to use adaptive thresholds based on local statistics */
  useAdaptiveThreshold: boolean;
}

/**
 * Interpolation configuration
 */
export interface InterpolationConfig {
  /** Method for interpolation */
  method: 'linear' | 'shape-based' | 'morphological';
  /** Maximum gap (in slices) to interpolate across */
  maxGapSlices: number;
  /** Whether to auto-apply after annotating key frames */
  autoApply: boolean;
  /** Smoothing factor for the interpolated contours */
  smoothingFactor: number;
}

/**
 * Result from Magic Wand selection
 */
export interface MagicWandResult {
  /** Mask of selected pixels (1 = selected, 0 = not selected) */
  mask: Uint8Array;
  /** Width of the mask */
  width: number;
  /** Height of the mask */
  height: number;
  /** Bounding box of selection */
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  /** Number of pixels selected */
  pixelCount: number;
  /** World coordinates of the contour points */
  contourPoints?: Point3[];
}

/**
 * Result from Region Growing
 */
export interface RegionGrowingResult {
  /** Mask of the grown region */
  mask: Uint8Array;
  /** Width of the mask */
  width: number;
  /** Height of the mask */
  height: number;
  /** Statistics of the region */
  stats: {
    meanIntensity: number;
    stdIntensity: number;
    minIntensity: number;
    maxIntensity: number;
    area: number;
  };
  /** Contour points in world coordinates */
  contourPoints?: Point3[];
}

/**
 * Slice annotation for interpolation
 */
export interface SliceAnnotation {
  /** Slice/image index */
  sliceIndex: number;
  /** Contour points in world coordinates */
  contourPoints: Point3[];
  /** Whether this is a key frame (user-annotated) */
  isKeyFrame: boolean;
}

/**
 * Result from Interpolation
 */
export interface InterpolationResult {
  /** Interpolated annotations per slice */
  sliceAnnotations: SliceAnnotation[];
  /** Number of slices interpolated */
  interpolatedCount: number;
  /** Range of slices covered */
  sliceRange: {
    start: number;
    end: number;
  };
}

/**
 * Smart tool state
 */
export interface SmartToolState {
  activeTool: SmartToolType;
  /** Whether to use AI-enhanced processing */
  aiModeEnabled: boolean;
  /** Whether AI service is available */
  aiServiceAvailable: boolean;
  magicWandConfig: MagicWandConfig;
  regionGrowingConfig: RegionGrowingConfig;
  interpolationConfig: InterpolationConfig;
  isProcessing: boolean;
  lastResult: MagicWandResult | RegionGrowingResult | InterpolationResult | null;
  error: string | null;
}

/**
 * Default configurations
 */
export const DEFAULT_MAGIC_WAND_CONFIG: MagicWandConfig = {
  tolerance: 32,
  eightConnected: true,
  maxPixels: 1000000,
  smoothEdges: true,
};

export const DEFAULT_REGION_GROWING_CONFIG: RegionGrowingConfig = {
  intensityTolerance: 25,
  gradientThreshold: 50,
  maxIterations: 10000,
  minRegionSize: 10,
  useAdaptiveThreshold: true,
};

export const DEFAULT_INTERPOLATION_CONFIG: InterpolationConfig = {
  method: 'linear',
  maxGapSlices: 10,
  autoApply: false,
  smoothingFactor: 0.5,
};
