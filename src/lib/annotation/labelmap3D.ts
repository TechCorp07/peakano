/**
 * 3D Labelmap Generator
 * Converts 2D slice annotations to 3D volumetric labelmaps
 * 
 * Phase 4: 3D Visualization
 * - 2D annotations to 3D labelmap
 * - Volume data structure for Cornerstone3D
 * - Segmentation volume creation
 * 
 * @module annotation/labelmap3D
 */

import type { CanvasAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';

// ============================================================================
// Types
// ============================================================================

/**
 * 3D Labelmap structure
 */
export interface Labelmap3D {
  /** Unique identifier */
  id: string;
  
  /** Volume dimensions [width, height, depth] */
  dimensions: [number, number, number];
  
  /** Voxel spacing [x, y, z] in mm */
  spacing: [number, number, number];
  
  /** Origin point [x, y, z] */
  origin: [number, number, number];
  
  /** Direction cosines (3x3 matrix flattened) */
  direction: number[];
  
  /** Label data as typed array (0 = background) */
  data: Uint8Array;
  
  /** Number of unique labels */
  numLabels: number;
  
  /** Label metadata */
  labels: Map<number, LabelInfo>;
  
  /** Source annotations */
  sourceSlices: Set<number>;
  
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Label information
 */
export interface LabelInfo {
  id: number;
  name: string;
  color: [number, number, number, number]; // RGBA
  visible: boolean;
}

/**
 * Labelmap generation options
 */
export interface LabelmapOptions {
  /** Volume dimensions [width, height, depth] */
  dimensions: [number, number, number];
  
  /** Voxel spacing in mm */
  spacing?: [number, number, number];
  
  /** Volume origin */
  origin?: [number, number, number];
  
  /** Default label ID for annotations */
  labelId?: number;
  
  /** Label color (RGBA 0-255) */
  labelColor?: [number, number, number, number];
  
  /** Fill method for annotations */
  fillMethod?: 'scanline' | 'floodfill' | 'boundary';
  
  /** Interpolate between annotated slices */
  interpolate?: boolean;
  
  /** Maximum gap for interpolation */
  maxInterpolationGap?: number;
}

/**
 * Segment definition
 */
export interface Segment {
  id: number;
  name: string;
  color: [number, number, number, number];
  annotations: Map<number, CanvasAnnotation[]>;
}

// ============================================================================
// Labelmap Creation
// ============================================================================

/**
 * Create an empty labelmap
 */
export function createEmptyLabelmap(options: LabelmapOptions): Labelmap3D {
  const {
    dimensions,
    spacing = [1, 1, 1],
    origin = [0, 0, 0],
  } = options;

  const [width, height, depth] = dimensions;
  const totalVoxels = width * height * depth;

  return {
    id: `labelmap-${Date.now()}`,
    dimensions,
    spacing,
    origin,
    direction: [1, 0, 0, 0, 1, 0, 0, 0, 1], // Identity matrix
    data: new Uint8Array(totalVoxels),
    numLabels: 0,
    labels: new Map(),
    sourceSlices: new Set(),
    createdAt: new Date(),
  };
}

/**
 * Convert annotations map to labelmap
 */
export function annotationsToLabelmap(
  annotationsMap: Map<string, CanvasAnnotation[]>,
  options: LabelmapOptions
): Labelmap3D {
  const {
    dimensions,
    spacing = [1, 1, 1],
    origin = [0, 0, 0],
    labelId = 1,
    labelColor = [255, 0, 0, 255],
    fillMethod = 'scanline',
    interpolate = false,
    maxInterpolationGap = 5,
  } = options;

  const [width, height, depth] = dimensions;
  const labelmap = createEmptyLabelmap({ dimensions, spacing, origin });
  
  // Add default label
  labelmap.labels.set(labelId, {
    id: labelId,
    name: 'Annotation',
    color: labelColor,
    visible: true,
  });
  labelmap.numLabels = 1;

  // Process each slice's annotations
  const processedSlices: number[] = [];
  
  annotationsMap.forEach((annotations, key) => {
    // Extract slice index from key (format: studyUid_seriesUid_sliceIndex)
    const parts = key.split('_');
    const sliceIndex = parseInt(parts[parts.length - 1], 10);
    
    if (isNaN(sliceIndex) || sliceIndex < 0 || sliceIndex >= depth) return;
    
    // Fill slice with annotations
    fillSliceWithAnnotations(
      labelmap.data,
      annotations,
      sliceIndex,
      width,
      height,
      labelId,
      fillMethod
    );
    
    labelmap.sourceSlices.add(sliceIndex);
    processedSlices.push(sliceIndex);
  });

  // Interpolate between slices if enabled
  if (interpolate && processedSlices.length > 1) {
    processedSlices.sort((a, b) => a - b);
    interpolateSlices(
      labelmap.data,
      processedSlices,
      width,
      height,
      labelId,
      maxInterpolationGap
    );
  }

  return labelmap;
}

/**
 * Fill a slice with annotation data
 */
function fillSliceWithAnnotations(
  data: Uint8Array,
  annotations: CanvasAnnotation[],
  sliceIndex: number,
  width: number,
  height: number,
  labelId: number,
  fillMethod: 'scanline' | 'floodfill' | 'boundary'
): void {
  const sliceOffset = sliceIndex * width * height;

  for (const annotation of annotations) {
    const points = annotation.points || [];
    if (points.length < 3) continue;

    if (annotation.type === 'brush' || annotation.type === 'freehand') {
      // For brush strokes, just fill the stroke path with radius
      const radius = annotation.radius || 5;
      fillBrushStroke(data, points, sliceOffset, width, height, labelId, radius);
    } else if (annotation.completed || annotation.type === 'polygon') {
      // For completed polygons, use scanline fill
      if (fillMethod === 'scanline') {
        scanlineFillPolygon(data, points, sliceOffset, width, height, labelId);
      } else if (fillMethod === 'boundary') {
        fillPolygonBoundary(data, points, sliceOffset, width, height, labelId);
      }
    }
  }
}

/**
 * Fill brush stroke points with given radius
 */
function fillBrushStroke(
  data: Uint8Array,
  points: Array<{ x: number; y: number }>,
  sliceOffset: number,
  width: number,
  height: number,
  labelId: number,
  radius: number
): void {
  for (const point of points) {
    const cx = Math.round(point.x);
    const cy = Math.round(point.y);
    
    // Fill a circle around each point
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = cx + dx;
          const py = cy + dy;
          
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const index = sliceOffset + py * width + px;
            data[index] = labelId;
          }
        }
      }
    }
  }
}

/**
 * Scanline fill algorithm for polygons
 */
function scanlineFillPolygon(
  data: Uint8Array,
  points: Array<{ x: number; y: number }>,
  sliceOffset: number,
  width: number,
  height: number,
  labelId: number
): void {
  if (points.length < 3) return;

  // Find bounding box
  let minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(height - 1, Math.ceil(maxY));

  // For each scanline
  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];
    
    // Find intersections with polygon edges
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const x = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
        intersections.push(x);
      }
    }
    
    // Sort intersections
    intersections.sort((a, b) => a - b);
    
    // Fill between pairs of intersections
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.floor(intersections[i]));
      const x2 = Math.min(width - 1, Math.ceil(intersections[i + 1]));
      
      for (let x = x1; x <= x2; x++) {
        const index = sliceOffset + y * width + x;
        data[index] = labelId;
      }
    }
  }
}

/**
 * Fill only polygon boundary
 */
function fillPolygonBoundary(
  data: Uint8Array,
  points: Array<{ x: number; y: number }>,
  sliceOffset: number,
  width: number,
  height: number,
  labelId: number
): void {
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    // Bresenham's line algorithm
    let x0 = Math.round(p1.x);
    let y0 = Math.round(p1.y);
    const x1 = Math.round(p2.x);
    const y1 = Math.round(p2.y);
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
        const index = sliceOffset + y0 * width + x0;
        data[index] = labelId;
      }
      
      if (x0 === x1 && y0 === y1) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
}

/**
 * Interpolate between annotated slices
 */
function interpolateSlices(
  data: Uint8Array,
  sliceIndices: number[],
  width: number,
  height: number,
  labelId: number,
  maxGap: number
): void {
  for (let i = 0; i < sliceIndices.length - 1; i++) {
    const slice1 = sliceIndices[i];
    const slice2 = sliceIndices[i + 1];
    const gap = slice2 - slice1;
    
    if (gap <= 1 || gap > maxGap) continue;
    
    // Linear interpolation between slices
    for (let z = slice1 + 1; z < slice2; z++) {
      const t = (z - slice1) / gap;
      const sliceOffset = z * width * height;
      const slice1Offset = slice1 * width * height;
      const slice2Offset = slice2 * width * height;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const v1 = data[slice1Offset + idx];
          const v2 = data[slice2Offset + idx];
          
          // If either source slice has the label, interpolate
          if (v1 === labelId || v2 === labelId) {
            // Simple weighted interpolation
            if (v1 === labelId && v2 === labelId) {
              data[sliceOffset + idx] = labelId;
            } else if (v1 === labelId && t < 0.5) {
              data[sliceOffset + idx] = labelId;
            } else if (v2 === labelId && t >= 0.5) {
              data[sliceOffset + idx] = labelId;
            }
          }
        }
      }
    }
  }
}

// ============================================================================
// Labelmap Operations
// ============================================================================

/**
 * Get statistics for a labelmap
 */
export interface LabelmapStats {
  totalVoxels: number;
  labeledVoxels: number;
  volumeMm3: number;
  surfaceAreaMm2: number;
  labelCounts: Map<number, number>;
}

export function getLabelmapStats(labelmap: Labelmap3D): LabelmapStats {
  const [width, height, depth] = labelmap.dimensions;
  const [sx, sy, sz] = labelmap.spacing;
  const voxelVolume = sx * sy * sz;
  
  let labeledVoxels = 0;
  const labelCounts = new Map<number, number>();
  
  for (let i = 0; i < labelmap.data.length; i++) {
    const label = labelmap.data[i];
    if (label > 0) {
      labeledVoxels++;
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    }
  }
  
  // Estimate surface area (simplified - count boundary voxels)
  let surfaceVoxels = 0;
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = z * width * height + y * width + x;
        if (labelmap.data[idx] > 0) {
          // Check if on boundary
          const neighbors = [
            x > 0 ? labelmap.data[idx - 1] : 0,
            x < width - 1 ? labelmap.data[idx + 1] : 0,
            y > 0 ? labelmap.data[idx - width] : 0,
            y < height - 1 ? labelmap.data[idx + width] : 0,
            z > 0 ? labelmap.data[idx - width * height] : 0,
            z < depth - 1 ? labelmap.data[idx + width * height] : 0,
          ];
          if (neighbors.some(n => n === 0)) {
            surfaceVoxels++;
          }
        }
      }
    }
  }
  
  const avgSpacing = (sx + sy + sz) / 3;
  
  return {
    totalVoxels: labelmap.data.length,
    labeledVoxels,
    volumeMm3: labeledVoxels * voxelVolume,
    surfaceAreaMm2: surfaceVoxels * avgSpacing * avgSpacing,
    labelCounts,
  };
}

/**
 * Extract a label as a separate labelmap
 */
export function extractLabel(labelmap: Labelmap3D, labelId: number): Labelmap3D {
  const extracted = createEmptyLabelmap({
    dimensions: labelmap.dimensions,
    spacing: labelmap.spacing,
    origin: labelmap.origin,
  });
  
  for (let i = 0; i < labelmap.data.length; i++) {
    if (labelmap.data[i] === labelId) {
      extracted.data[i] = 1;
    }
  }
  
  const labelInfo = labelmap.labels.get(labelId);
  if (labelInfo) {
    extracted.labels.set(1, { ...labelInfo, id: 1 });
    extracted.numLabels = 1;
  }
  
  return extracted;
}

/**
 * Merge multiple labelmaps
 */
export function mergeLabelmaps(labelmaps: Labelmap3D[]): Labelmap3D {
  if (labelmaps.length === 0) {
    throw new Error('No labelmaps to merge');
  }
  
  const first = labelmaps[0];
  const merged = createEmptyLabelmap({
    dimensions: first.dimensions,
    spacing: first.spacing,
    origin: first.origin,
  });
  
  let nextLabelId = 1;
  
  for (const lm of labelmaps) {
    const labelMapping = new Map<number, number>();
    
    // Create label mapping
    lm.labels.forEach((info, oldId) => {
      labelMapping.set(oldId, nextLabelId);
      merged.labels.set(nextLabelId, { ...info, id: nextLabelId });
      nextLabelId++;
    });
    
    // Copy data with remapped labels
    for (let i = 0; i < lm.data.length; i++) {
      if (lm.data[i] > 0) {
        const newLabel = labelMapping.get(lm.data[i]);
        if (newLabel !== undefined) {
          merged.data[i] = newLabel;
        }
      }
    }
    
    lm.sourceSlices.forEach(s => merged.sourceSlices.add(s));
  }
  
  merged.numLabels = nextLabelId - 1;
  return merged;
}

/**
 * Get slice data from labelmap
 */
export function getLabelmapSlice(
  labelmap: Labelmap3D, 
  sliceIndex: number
): Uint8Array {
  const [width, height] = labelmap.dimensions;
  const sliceSize = width * height;
  const offset = sliceIndex * sliceSize;
  
  return labelmap.data.slice(offset, offset + sliceSize);
}

/**
 * Set slice data in labelmap
 */
export function setLabelmapSlice(
  labelmap: Labelmap3D,
  sliceIndex: number,
  sliceData: Uint8Array
): void {
  const [width, height] = labelmap.dimensions;
  const sliceSize = width * height;
  const offset = sliceIndex * sliceSize;
  
  for (let i = 0; i < Math.min(sliceSize, sliceData.length); i++) {
    labelmap.data[offset + i] = sliceData[i];
  }
}

// ============================================================================
// Cornerstone3D Integration
// ============================================================================

/**
 * Convert labelmap to Cornerstone3D segmentation format
 */
export interface CornerstoneSegmentationData {
  scalarData: Uint8Array;
  dimensions: [number, number, number];
  spacing: [number, number, number];
  origin: [number, number, number];
  direction: number[];
}

export function toCornerstoneSegmentation(
  labelmap: Labelmap3D
): CornerstoneSegmentationData {
  return {
    scalarData: labelmap.data,
    dimensions: labelmap.dimensions,
    spacing: labelmap.spacing,
    origin: labelmap.origin,
    direction: labelmap.direction,
  };
}

/**
 * Create labelmap from Cornerstone3D volume
 */
export function fromCornerstoneVolume(
  volumeData: {
    scalarData: Uint8Array;
    dimensions: [number, number, number];
    spacing: [number, number, number];
    origin: [number, number, number];
    direction?: number[];
  }
): Labelmap3D {
  return {
    id: `labelmap-${Date.now()}`,
    dimensions: volumeData.dimensions,
    spacing: volumeData.spacing,
    origin: volumeData.origin,
    direction: volumeData.direction || [1, 0, 0, 0, 1, 0, 0, 0, 1],
    data: volumeData.scalarData,
    numLabels: 0,
    labels: new Map(),
    sourceSlices: new Set(),
    createdAt: new Date(),
  };
}
