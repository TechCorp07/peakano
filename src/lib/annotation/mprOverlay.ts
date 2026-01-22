/**
 * MPR (Multiplanar Reconstruction) Overlay
 * Provides utilities for displaying annotations in MPR views
 * 
 * Phase 4: 3D Visualization
 * - MPR slice extraction from labelmaps
 * - Overlay rendering utilities
 * - Cross-reference visualization
 * 
 * @module annotation/mprOverlay
 */

import type { Labelmap3D } from './labelmap3D';
import { getLabelColor } from './volumeRendering';

// ============================================================================
// Types
// ============================================================================

/**
 * MPR view orientation
 */
export type MPROrientation = 'axial' | 'sagittal' | 'coronal' | 'oblique';

/**
 * MPR slice information
 */
export interface MPRSlice {
  /** Orientation of the slice */
  orientation: MPROrientation;
  
  /** Slice index in the source volume */
  index: number;
  
  /** Dimensions [width, height] */
  dimensions: [number, number];
  
  /** Slice data */
  data: Uint8Array;
  
  /** World position of slice center */
  position: [number, number, number];
  
  /** Pixel spacing [x, y] */
  spacing: [number, number];
}

/**
 * Cross-reference line for MPR views
 */
export interface CrossReferenceLine {
  /** Start point in image coordinates */
  start: [number, number];
  
  /** End point in image coordinates */
  end: [number, number];
  
  /** Color */
  color: string;
  
  /** Associated orientation */
  orientation: MPROrientation;
  
  /** Slice index it represents */
  sliceIndex: number;
}

/**
 * MPR overlay configuration
 */
export interface MPROverlayConfig {
  /** Show cross-reference lines */
  showCrossReference: boolean;
  
  /** Cross-reference line thickness */
  crossReferenceWidth: number;
  
  /** Cross-reference colors by orientation */
  crossReferenceColors: Record<MPROrientation, string>;
  
  /** Overlay opacity */
  overlayOpacity: number;
  
  /** Show slice position indicator */
  showSlicePosition: boolean;
  
  /** Show orientation labels */
  showOrientationLabels: boolean;
  
  /** Blend mode for overlay */
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default MPR overlay configuration
 */
export const DEFAULT_MPR_CONFIG: MPROverlayConfig = {
  showCrossReference: true,
  crossReferenceWidth: 1,
  crossReferenceColors: {
    axial: '#FF6B6B',
    sagittal: '#4ECDC4',
    coronal: '#45B7D1',
    oblique: '#96CEB4',
  },
  overlayOpacity: 0.6,
  showSlicePosition: true,
  showOrientationLabels: true,
  blendMode: 'normal',
};

/**
 * Orientation labels
 */
export const ORIENTATION_LABELS: Record<MPROrientation, { left: string; right: string; top: string; bottom: string }> = {
  axial: { left: 'R', right: 'L', top: 'A', bottom: 'P' },
  sagittal: { left: 'A', right: 'P', top: 'S', bottom: 'I' },
  coronal: { left: 'R', right: 'L', top: 'S', bottom: 'I' },
  oblique: { left: '', right: '', top: '', bottom: '' },
};

// ============================================================================
// MPR Slice Extraction
// ============================================================================

/**
 * Extract an axial slice from labelmap
 */
export function extractAxialSlice(
  labelmap: Labelmap3D,
  sliceIndex: number
): MPRSlice {
  const [width, height, depth] = labelmap.dimensions;
  const sliceSize = width * height;
  const offset = sliceIndex * sliceSize;
  
  const data = new Uint8Array(sliceSize);
  for (let i = 0; i < sliceSize; i++) {
    data[i] = labelmap.data[offset + i];
  }
  
  return {
    orientation: 'axial',
    index: sliceIndex,
    dimensions: [width, height],
    data,
    position: [
      labelmap.origin[0] + (width * labelmap.spacing[0]) / 2,
      labelmap.origin[1] + (height * labelmap.spacing[1]) / 2,
      labelmap.origin[2] + sliceIndex * labelmap.spacing[2],
    ],
    spacing: [labelmap.spacing[0], labelmap.spacing[1]],
  };
}

/**
 * Extract a sagittal slice from labelmap
 */
export function extractSagittalSlice(
  labelmap: Labelmap3D,
  sliceIndex: number
): MPRSlice {
  const [width, height, depth] = labelmap.dimensions;
  const sliceSize = height * depth;
  
  const data = new Uint8Array(sliceSize);
  
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      const srcIdx = z * width * height + y * width + sliceIndex;
      const dstIdx = z * height + y;
      data[dstIdx] = labelmap.data[srcIdx];
    }
  }
  
  return {
    orientation: 'sagittal',
    index: sliceIndex,
    dimensions: [height, depth],
    data,
    position: [
      labelmap.origin[0] + sliceIndex * labelmap.spacing[0],
      labelmap.origin[1] + (height * labelmap.spacing[1]) / 2,
      labelmap.origin[2] + (depth * labelmap.spacing[2]) / 2,
    ],
    spacing: [labelmap.spacing[1], labelmap.spacing[2]],
  };
}

/**
 * Extract a coronal slice from labelmap
 */
export function extractCoronalSlice(
  labelmap: Labelmap3D,
  sliceIndex: number
): MPRSlice {
  const [width, height, depth] = labelmap.dimensions;
  const sliceSize = width * depth;
  
  const data = new Uint8Array(sliceSize);
  
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = z * width * height + sliceIndex * width + x;
      const dstIdx = z * width + x;
      data[dstIdx] = labelmap.data[srcIdx];
    }
  }
  
  return {
    orientation: 'coronal',
    index: sliceIndex,
    dimensions: [width, depth],
    data,
    position: [
      labelmap.origin[0] + (width * labelmap.spacing[0]) / 2,
      labelmap.origin[1] + sliceIndex * labelmap.spacing[1],
      labelmap.origin[2] + (depth * labelmap.spacing[2]) / 2,
    ],
    spacing: [labelmap.spacing[0], labelmap.spacing[2]],
  };
}

/**
 * Extract MPR slice by orientation
 */
export function extractMPRSlice(
  labelmap: Labelmap3D,
  orientation: MPROrientation,
  sliceIndex: number
): MPRSlice {
  switch (orientation) {
    case 'axial':
      return extractAxialSlice(labelmap, sliceIndex);
    case 'sagittal':
      return extractSagittalSlice(labelmap, sliceIndex);
    case 'coronal':
      return extractCoronalSlice(labelmap, sliceIndex);
    default:
      return extractAxialSlice(labelmap, sliceIndex);
  }
}

// ============================================================================
// Cross-Reference Lines
// ============================================================================

/**
 * Calculate cross-reference lines for MPR views
 */
export function calculateCrossReferenceLines(
  currentOrientation: MPROrientation,
  dimensions: [number, number, number],
  axialIndex: number,
  sagittalIndex: number,
  coronalIndex: number,
  config: MPROverlayConfig = DEFAULT_MPR_CONFIG
): CrossReferenceLine[] {
  const [width, height, depth] = dimensions;
  const lines: CrossReferenceLine[] = [];
  
  switch (currentOrientation) {
    case 'axial':
      // Sagittal line (vertical)
      lines.push({
        start: [sagittalIndex, 0],
        end: [sagittalIndex, height],
        color: config.crossReferenceColors.sagittal,
        orientation: 'sagittal',
        sliceIndex: sagittalIndex,
      });
      // Coronal line (horizontal)
      lines.push({
        start: [0, coronalIndex],
        end: [width, coronalIndex],
        color: config.crossReferenceColors.coronal,
        orientation: 'coronal',
        sliceIndex: coronalIndex,
      });
      break;
      
    case 'sagittal':
      // Axial line (horizontal)
      lines.push({
        start: [0, axialIndex],
        end: [height, axialIndex],
        color: config.crossReferenceColors.axial,
        orientation: 'axial',
        sliceIndex: axialIndex,
      });
      // Coronal line (vertical)
      lines.push({
        start: [coronalIndex, 0],
        end: [coronalIndex, depth],
        color: config.crossReferenceColors.coronal,
        orientation: 'coronal',
        sliceIndex: coronalIndex,
      });
      break;
      
    case 'coronal':
      // Axial line (horizontal)
      lines.push({
        start: [0, axialIndex],
        end: [width, axialIndex],
        color: config.crossReferenceColors.axial,
        orientation: 'axial',
        sliceIndex: axialIndex,
      });
      // Sagittal line (vertical)
      lines.push({
        start: [sagittalIndex, 0],
        end: [sagittalIndex, depth],
        color: config.crossReferenceColors.sagittal,
        orientation: 'sagittal',
        sliceIndex: sagittalIndex,
      });
      break;
  }
  
  return lines;
}

// ============================================================================
// Overlay Rendering
// ============================================================================

/**
 * Create RGBA overlay image from MPR slice
 */
export function createMPROverlayImage(
  slice: MPRSlice,
  labelmap: Labelmap3D,
  config: MPROverlayConfig = DEFAULT_MPR_CONFIG
): ImageData {
  const [width, height] = slice.dimensions;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  
  const opacity = Math.round(config.overlayOpacity * 255);
  
  for (let i = 0; i < slice.data.length; i++) {
    const label = slice.data[i];
    const pixelIdx = i * 4;
    
    if (label > 0) {
      const labelInfo = labelmap.labels.get(label);
      const color = labelInfo ? labelInfo.color : getLabelColor(label);
      
      data[pixelIdx] = color[0];
      data[pixelIdx + 1] = color[1];
      data[pixelIdx + 2] = color[2];
      data[pixelIdx + 3] = opacity;
    } else {
      data[pixelIdx] = 0;
      data[pixelIdx + 1] = 0;
      data[pixelIdx + 2] = 0;
      data[pixelIdx + 3] = 0;
    }
  }
  
  return imageData;
}

/**
 * Draw overlay on canvas
 */
export function drawMPROverlay(
  ctx: CanvasRenderingContext2D,
  slice: MPRSlice,
  labelmap: Labelmap3D,
  config: MPROverlayConfig = DEFAULT_MPR_CONFIG
): void {
  const imageData = createMPROverlayImage(slice, labelmap, config);
  
  // Create temp canvas for overlay
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = slice.dimensions[0];
  tempCanvas.height = slice.dimensions[1];
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  tempCtx.putImageData(imageData, 0, 0);
  
  // Apply blend mode
  ctx.save();
  ctx.globalCompositeOperation = config.blendMode === 'normal' 
    ? 'source-over' 
    : config.blendMode;
  ctx.globalAlpha = config.overlayOpacity;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();
}

/**
 * Draw cross-reference lines on canvas
 */
export function drawCrossReferenceLines(
  ctx: CanvasRenderingContext2D,
  lines: CrossReferenceLine[],
  config: MPROverlayConfig = DEFAULT_MPR_CONFIG
): void {
  if (!config.showCrossReference) return;
  
  ctx.save();
  ctx.lineWidth = config.crossReferenceWidth;
  
  for (const line of lines) {
    ctx.strokeStyle = line.color;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(line.start[0], line.start[1]);
    ctx.lineTo(line.end[0], line.end[1]);
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Draw orientation labels
 */
export function drawOrientationLabels(
  ctx: CanvasRenderingContext2D,
  orientation: MPROrientation,
  width: number,
  height: number,
  config: MPROverlayConfig = DEFAULT_MPR_CONFIG
): void {
  if (!config.showOrientationLabels) return;
  
  const labels = ORIENTATION_LABELS[orientation];
  const padding = 10;
  
  ctx.save();
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Left label
  if (labels.left) {
    ctx.fillText(labels.left, padding + 10, height / 2);
  }
  
  // Right label
  if (labels.right) {
    ctx.fillText(labels.right, width - padding - 10, height / 2);
  }
  
  // Top label
  if (labels.top) {
    ctx.fillText(labels.top, width / 2, padding + 10);
  }
  
  // Bottom label
  if (labels.bottom) {
    ctx.fillText(labels.bottom, width / 2, height - padding - 10);
  }
  
  ctx.restore();
}

// ============================================================================
// MPR View State
// ============================================================================

/**
 * MPR view state
 */
export interface MPRViewState {
  axialIndex: number;
  sagittalIndex: number;
  coronalIndex: number;
  zoom: number;
  pan: [number, number];
}

/**
 * Create default MPR view state
 */
export function createDefaultMPRState(
  dimensions: [number, number, number]
): MPRViewState {
  return {
    axialIndex: Math.floor(dimensions[2] / 2),
    sagittalIndex: Math.floor(dimensions[0] / 2),
    coronalIndex: Math.floor(dimensions[1] / 2),
    zoom: 1,
    pan: [0, 0],
  };
}

/**
 * Get slice range for orientation
 */
export function getSliceRange(
  dimensions: [number, number, number],
  orientation: MPROrientation
): { min: number; max: number } {
  switch (orientation) {
    case 'axial':
      return { min: 0, max: dimensions[2] - 1 };
    case 'sagittal':
      return { min: 0, max: dimensions[0] - 1 };
    case 'coronal':
      return { min: 0, max: dimensions[1] - 1 };
    default:
      return { min: 0, max: 0 };
  }
}

/**
 * Update slice index for orientation
 */
export function updateSliceIndex(
  state: MPRViewState,
  orientation: MPROrientation,
  index: number
): MPRViewState {
  const newState = { ...state };
  
  switch (orientation) {
    case 'axial':
      newState.axialIndex = index;
      break;
    case 'sagittal':
      newState.sagittalIndex = index;
      break;
    case 'coronal':
      newState.coronalIndex = index;
      break;
  }
  
  return newState;
}

// ============================================================================
// Coordinate Conversion
// ============================================================================

/**
 * Convert image coordinates to world coordinates
 */
export function imageToWorld(
  imagePoint: [number, number],
  slice: MPRSlice,
  labelmap: Labelmap3D
): [number, number, number] {
  const [ix, iy] = imagePoint;
  const [sx, sy] = slice.spacing;
  
  switch (slice.orientation) {
    case 'axial':
      return [
        labelmap.origin[0] + ix * sx,
        labelmap.origin[1] + iy * sy,
        slice.position[2],
      ];
    case 'sagittal':
      return [
        slice.position[0],
        labelmap.origin[1] + ix * sx,
        labelmap.origin[2] + iy * sy,
      ];
    case 'coronal':
      return [
        labelmap.origin[0] + ix * sx,
        slice.position[1],
        labelmap.origin[2] + iy * sy,
      ];
    default:
      return [0, 0, 0];
  }
}

/**
 * Convert world coordinates to image coordinates
 */
export function worldToImage(
  worldPoint: [number, number, number],
  slice: MPRSlice,
  labelmap: Labelmap3D
): [number, number] {
  const [wx, wy, wz] = worldPoint;
  const [sx, sy] = slice.spacing;
  
  switch (slice.orientation) {
    case 'axial':
      return [
        (wx - labelmap.origin[0]) / sx,
        (wy - labelmap.origin[1]) / sy,
      ];
    case 'sagittal':
      return [
        (wy - labelmap.origin[1]) / sx,
        (wz - labelmap.origin[2]) / sy,
      ];
    case 'coronal':
      return [
        (wx - labelmap.origin[0]) / sx,
        (wz - labelmap.origin[2]) / sy,
      ];
    default:
      return [0, 0];
  }
}
