/**
 * Volume Rendering for Annotations
 * Provides volume rendering utilities for 3D annotation visualization
 * 
 * Phase 4: 3D Visualization
 * - Volume rendering configuration
 * - Color mapping and transfer functions
 * - Cornerstone3D volume integration
 * 
 * @module annotation/volumeRendering
 */

import type { Labelmap3D, LabelInfo } from './labelmap3D';

// ============================================================================
// Types
// ============================================================================

/**
 * Color transfer function point
 */
export interface ColorPoint {
  value: number;
  color: [number, number, number]; // RGB 0-1
}

/**
 * Opacity transfer function point
 */
export interface OpacityPoint {
  value: number;
  opacity: number; // 0-1
}

/**
 * Volume rendering configuration
 */
export interface VolumeRenderConfig {
  /** Rendering method */
  method: 'mip' | 'composite' | 'average';
  
  /** Ambient lighting coefficient */
  ambient: number;
  
  /** Diffuse lighting coefficient */
  diffuse: number;
  
  /** Specular lighting coefficient */
  specular: number;
  
  /** Specular power */
  specularPower: number;
  
  /** Shade enabled */
  shade: boolean;
  
  /** Color transfer function */
  colorTransferFunction: ColorPoint[];
  
  /** Opacity transfer function */
  opacityTransferFunction: OpacityPoint[];
  
  /** Gradient opacity enabled */
  gradientOpacity: boolean;
  
  /** Sample distance */
  sampleDistance: number;
}

/**
 * Segmentation display configuration
 */
export interface SegmentationDisplayConfig {
  /** Visibility */
  visible: boolean;
  
  /** Global opacity */
  opacity: number;
  
  /** Outline mode (vs filled) */
  outlineMode: boolean;
  
  /** Outline width in pixels */
  outlineWidth: number;
  
  /** Render inactive segments */
  renderInactiveSegments: boolean;
  
  /** Per-segment configurations */
  segments: Map<number, SegmentDisplayConfig>;
}

/**
 * Individual segment display configuration
 */
export interface SegmentDisplayConfig {
  id: number;
  visible: boolean;
  color: [number, number, number, number]; // RGBA 0-255
  opacity: number;
  locked: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default volume rendering configuration for labelmaps
 */
export const DEFAULT_LABELMAP_RENDER_CONFIG: VolumeRenderConfig = {
  method: 'composite',
  ambient: 0.2,
  diffuse: 0.7,
  specular: 0.3,
  specularPower: 10,
  shade: true,
  colorTransferFunction: [
    { value: 0, color: [0, 0, 0] },
    { value: 1, color: [1, 0, 0] },
    { value: 2, color: [0, 1, 0] },
    { value: 3, color: [0, 0, 1] },
    { value: 4, color: [1, 1, 0] },
    { value: 5, color: [1, 0, 1] },
  ],
  opacityTransferFunction: [
    { value: 0, opacity: 0 },
    { value: 0.5, opacity: 0.5 },
    { value: 1, opacity: 0.8 },
  ],
  gradientOpacity: false,
  sampleDistance: 1.0,
};

/**
 * Default segmentation display configuration
 */
export const DEFAULT_SEGMENTATION_DISPLAY: SegmentationDisplayConfig = {
  visible: true,
  opacity: 0.6,
  outlineMode: false,
  outlineWidth: 2,
  renderInactiveSegments: true,
  segments: new Map(),
};

// ============================================================================
// Predefined Color Palettes
// ============================================================================

/**
 * Predefined label colors for segmentation
 */
export const SEGMENTATION_COLORS: Array<[number, number, number, number]> = [
  [255, 0, 0, 255],      // Red
  [0, 255, 0, 255],      // Green
  [0, 0, 255, 255],      // Blue
  [255, 255, 0, 255],    // Yellow
  [255, 0, 255, 255],    // Magenta
  [0, 255, 255, 255],    // Cyan
  [255, 128, 0, 255],    // Orange
  [128, 0, 255, 255],    // Purple
  [255, 128, 128, 255],  // Light Red
  [128, 255, 128, 255],  // Light Green
  [128, 128, 255, 255],  // Light Blue
  [255, 255, 128, 255],  // Light Yellow
];

/**
 * Get color for a label ID
 */
export function getLabelColor(labelId: number): [number, number, number, number] {
  if (labelId <= 0) return [0, 0, 0, 0];
  return SEGMENTATION_COLORS[(labelId - 1) % SEGMENTATION_COLORS.length];
}

// ============================================================================
// Transfer Function Utilities
// ============================================================================

/**
 * Create color transfer function from labelmap
 */
export function createColorTransferFunction(
  labelmap: Labelmap3D
): ColorPoint[] {
  const points: ColorPoint[] = [{ value: 0, color: [0, 0, 0] }];
  
  labelmap.labels.forEach((info, labelId) => {
    const [r, g, b] = info.color;
    points.push({
      value: labelId,
      color: [r / 255, g / 255, b / 255],
    });
  });
  
  return points;
}

/**
 * Create opacity transfer function
 */
export function createOpacityTransferFunction(
  maxLabel: number,
  baseOpacity: number = 0.7
): OpacityPoint[] {
  const points: OpacityPoint[] = [{ value: 0, opacity: 0 }];
  
  for (let i = 1; i <= maxLabel; i++) {
    points.push({ value: i, opacity: baseOpacity });
  }
  
  return points;
}

/**
 * Interpolate color at a given value
 */
export function interpolateColor(
  colorTF: ColorPoint[],
  value: number
): [number, number, number] {
  if (colorTF.length === 0) return [0, 0, 0];
  if (value <= colorTF[0].value) return colorTF[0].color;
  if (value >= colorTF[colorTF.length - 1].value) {
    return colorTF[colorTF.length - 1].color;
  }
  
  for (let i = 0; i < colorTF.length - 1; i++) {
    const p1 = colorTF[i];
    const p2 = colorTF[i + 1];
    
    if (value >= p1.value && value <= p2.value) {
      const t = (value - p1.value) / (p2.value - p1.value);
      return [
        p1.color[0] + t * (p2.color[0] - p1.color[0]),
        p1.color[1] + t * (p2.color[1] - p1.color[1]),
        p1.color[2] + t * (p2.color[2] - p1.color[2]),
      ];
    }
  }
  
  return [0, 0, 0];
}

// ============================================================================
// Cornerstone3D Integration
// ============================================================================

/**
 * Configuration for Cornerstone3D segmentation representation
 */
export interface CornerstoneSegmentationRepresentationConfig {
  segmentationId: string;
  type: 'LABELMAP' | 'CONTOUR' | 'SURFACE';
  config: {
    renderOutline: boolean;
    outlineWidthActive: number;
    outlineWidthInactive: number;
    renderFill: boolean;
    fillAlpha: number;
    fillAlphaInactive: number;
  };
}

/**
 * Create Cornerstone3D segmentation representation config
 */
export function createCornerstoneSegmentationConfig(
  segmentationId: string,
  options: Partial<SegmentationDisplayConfig> = {}
): CornerstoneSegmentationRepresentationConfig {
  const config = { ...DEFAULT_SEGMENTATION_DISPLAY, ...options };
  
  return {
    segmentationId,
    type: 'LABELMAP',
    config: {
      renderOutline: config.outlineMode,
      outlineWidthActive: config.outlineWidth,
      outlineWidthInactive: config.outlineWidth * 0.5,
      renderFill: !config.outlineMode,
      fillAlpha: config.opacity,
      fillAlphaInactive: config.opacity * 0.5,
    },
  };
}

/**
 * Segment color lookup table for Cornerstone3D
 */
export interface SegmentColorLUT {
  [segmentIndex: number]: [number, number, number, number];
}

/**
 * Create segment color LUT from labelmap
 */
export function createSegmentColorLUT(labelmap: Labelmap3D): SegmentColorLUT {
  const lut: SegmentColorLUT = {};
  
  labelmap.labels.forEach((info, labelId) => {
    lut[labelId] = info.color;
  });
  
  return lut;
}

/**
 * Generate default segment color LUT
 */
export function generateDefaultColorLUT(numSegments: number): SegmentColorLUT {
  const lut: SegmentColorLUT = {};
  
  for (let i = 1; i <= numSegments; i++) {
    lut[i] = getLabelColor(i);
  }
  
  return lut;
}

// ============================================================================
// Volume Rendering Presets
// ============================================================================

/**
 * Volume rendering preset for CT soft tissue
 */
export const PRESET_CT_SOFT_TISSUE: VolumeRenderConfig = {
  ...DEFAULT_LABELMAP_RENDER_CONFIG,
  method: 'composite',
  ambient: 0.1,
  diffuse: 0.9,
  specular: 0.2,
  shade: true,
  sampleDistance: 1.0,
};

/**
 * Volume rendering preset for MRI brain
 */
export const PRESET_MRI_BRAIN: VolumeRenderConfig = {
  ...DEFAULT_LABELMAP_RENDER_CONFIG,
  method: 'composite',
  ambient: 0.2,
  diffuse: 0.8,
  specular: 0.1,
  shade: true,
  sampleDistance: 0.5,
};

/**
 * Volume rendering preset for maximum intensity projection
 */
export const PRESET_MIP: VolumeRenderConfig = {
  ...DEFAULT_LABELMAP_RENDER_CONFIG,
  method: 'mip',
  shade: false,
  sampleDistance: 1.0,
};

// ============================================================================
// 3D View Utilities
// ============================================================================

/**
 * Camera position preset
 */
export interface CameraPreset {
  name: string;
  position: [number, number, number];
  viewUp: [number, number, number];
  focalPoint?: [number, number, number];
}

/**
 * Standard camera presets
 */
export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  anterior: {
    name: 'Anterior',
    position: [0, -1, 0],
    viewUp: [0, 0, 1],
  },
  posterior: {
    name: 'Posterior',
    position: [0, 1, 0],
    viewUp: [0, 0, 1],
  },
  left: {
    name: 'Left',
    position: [-1, 0, 0],
    viewUp: [0, 0, 1],
  },
  right: {
    name: 'Right',
    position: [1, 0, 0],
    viewUp: [0, 0, 1],
  },
  superior: {
    name: 'Superior',
    position: [0, 0, 1],
    viewUp: [0, -1, 0],
  },
  inferior: {
    name: 'Inferior',
    position: [0, 0, -1],
    viewUp: [0, 1, 0],
  },
};

/**
 * Calculate bounding box center
 */
export function calculateVolumeCenter(
  dimensions: [number, number, number],
  spacing: [number, number, number],
  origin: [number, number, number]
): [number, number, number] {
  return [
    origin[0] + (dimensions[0] * spacing[0]) / 2,
    origin[1] + (dimensions[1] * spacing[1]) / 2,
    origin[2] + (dimensions[2] * spacing[2]) / 2,
  ];
}
