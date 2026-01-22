/**
 * Brush Tools
 * Advanced brush functionality including 3D brush, adaptive brush, and brush presets
 * 
 * @module annotation/brushTools
 */

import type { BinaryMask, MaskOperationResult } from './maskOperations';

/**
 * Brush configuration
 */
export interface BrushConfig {
  /** Brush radius in pixels */
  radius: number;
  /** Brush shape: 'circle' | 'square' | 'diamond' */
  shape: 'circle' | 'square' | 'diamond';
  /** Brush hardness (0-1, affects edge falloff) */
  hardness: number;
  /** Brush opacity (0-1) */
  opacity: number;
  /** Whether this is an eraser brush */
  isEraser: boolean;
  /** Spacing between brush stamps (as fraction of radius) */
  spacing: number;
}

/**
 * 3D Brush configuration
 */
export interface Brush3DConfig extends BrushConfig {
  /** Depth in slices (how many slices to affect) */
  depth: number;
  /** Falloff type for depth */
  depthFalloff: 'none' | 'linear' | 'gaussian';
  /** Whether to paint on visible slices only */
  visibleSlicesOnly: boolean;
}

/**
 * Adaptive brush configuration
 */
export interface AdaptiveBrushConfig extends BrushConfig {
  /** Intensity tolerance for edge detection */
  intensityTolerance: number;
  /** Gradient threshold for edge detection */
  gradientThreshold: number;
  /** Whether to use edge snapping */
  edgeSnapping: boolean;
  /** Edge snapping strength (0-1) */
  edgeStrength: number;
}

/**
 * A single brush stroke
 */
export interface BrushStroke {
  /** Stroke ID */
  id: string;
  /** Points along the stroke path (canvas coordinates) */
  points: Array<{ x: number; y: number }>;
  /** Brush configuration used */
  config: BrushConfig;
  /** Timestamp of the stroke */
  timestamp: number;
}

/**
 * Brush preset definition
 */
export interface BrushPreset {
  /** Preset ID */
  id: string;
  /** Display name */
  name: string;
  /** Preset configuration */
  config: BrushConfig;
  /** Keyboard shortcut */
  shortcut?: string;
}

/**
 * Default brush presets
 */
export const DEFAULT_BRUSH_PRESETS: BrushPreset[] = [
  {
    id: 'fine',
    name: 'Fine (1px)',
    config: { radius: 1, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
    shortcut: '1',
  },
  {
    id: 'small',
    name: 'Small (5px)',
    config: { radius: 5, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
    shortcut: '2',
  },
  {
    id: 'medium',
    name: 'Medium (10px)',
    config: { radius: 10, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
    shortcut: '3',
  },
  {
    id: 'large',
    name: 'Large (20px)',
    config: { radius: 20, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
    shortcut: '4',
  },
  {
    id: 'xlarge',
    name: 'X-Large (40px)',
    config: { radius: 40, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
    shortcut: '5',
  },
  {
    id: 'soft',
    name: 'Soft Brush',
    config: { radius: 15, shape: 'circle', hardness: 0.5, opacity: 0.8, isEraser: false, spacing: 0.1 },
    shortcut: '6',
  },
];

/**
 * Generate brush mask for a given configuration
 * 
 * @param config - Brush configuration
 * @returns 2D array representing brush shape with opacity values
 */
export function generateBrushMask(config: BrushConfig): Float32Array {
  const { radius, shape, hardness } = config;
  const size = radius * 2 + 1;
  const mask = new Float32Array(size * size);
  const center = radius;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const idx = y * size + x;
      
      let value = 0;
      
      switch (shape) {
        case 'circle': {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            // Apply hardness falloff
            if (hardness >= 1) {
              value = 1;
            } else {
              const normalizedDistance = distance / radius;
              const falloff = 1 - normalizedDistance;
              value = Math.pow(falloff, (1 - hardness) * 3);
            }
          }
          break;
        }
        
        case 'square': {
          if (Math.abs(dx) <= radius && Math.abs(dy) <= radius) {
            if (hardness >= 1) {
              value = 1;
            } else {
              const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
              const normalizedDistance = maxDist / radius;
              const falloff = 1 - normalizedDistance;
              value = Math.pow(falloff, (1 - hardness) * 3);
            }
          }
          break;
        }
        
        case 'diamond': {
          const manhattanDist = Math.abs(dx) + Math.abs(dy);
          if (manhattanDist <= radius) {
            if (hardness >= 1) {
              value = 1;
            } else {
              const normalizedDistance = manhattanDist / radius;
              const falloff = 1 - normalizedDistance;
              value = Math.pow(falloff, (1 - hardness) * 3);
            }
          }
          break;
        }
      }
      
      mask[idx] = value;
    }
  }
  
  return mask;
}

/**
 * Apply a brush stroke to a mask
 * 
 * @param mask - Target mask to modify
 * @param stroke - Brush stroke to apply
 * @returns Modified mask
 */
export function applyBrushStroke(
  mask: BinaryMask,
  stroke: BrushStroke
): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(data);
  const { config, points } = stroke;
  const { radius, isEraser, spacing, opacity } = config;
  
  // Generate brush mask
  const brushMask = generateBrushMask(config);
  const brushSize = radius * 2 + 1;
  
  // Apply brush at each point with spacing
  let lastX = -Infinity;
  let lastY = -Infinity;
  const minDistance = radius * spacing * 2;
  
  for (const point of points) {
    const { x: cx, y: cy } = point;
    
    // Check spacing
    const dist = Math.sqrt((cx - lastX) ** 2 + (cy - lastY) ** 2);
    if (dist < minDistance && lastX !== -Infinity) {
      continue;
    }
    lastX = cx;
    lastY = cy;
    
    // Stamp brush at this point
    for (let by = 0; by < brushSize; by++) {
      for (let bx = 0; bx < brushSize; bx++) {
        const brushOpacity = brushMask[by * brushSize + bx];
        if (brushOpacity === 0) continue;
        
        const px = Math.floor(cx - radius + bx);
        const py = Math.floor(cy - radius + by);
        
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        
        const idx = py * width + px;
        const effectiveOpacity = brushOpacity * opacity;
        
        if (isEraser) {
          // Eraser: reduce mask value
          if (effectiveOpacity >= 0.5) {
            result[idx] = 0;
          }
        } else {
          // Paint: set mask value
          if (effectiveOpacity >= 0.5) {
            result[idx] = 1;
          }
        }
      }
    }
  }
  
  // Calculate statistics
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (result[y * width + x] === 1) {
        pixelCount++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (pixelCount === 0) {
    return {
      data: result,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }
  
  return {
    data: result,
    width,
    height,
    pixelCount,
    bounds: { minX, minY, maxX, maxY },
  };
}

/**
 * Apply a 3D brush stroke across multiple slices
 * 
 * @param masks - Array of masks for each slice
 * @param stroke - Brush stroke to apply
 * @param currentSlice - Current slice index
 * @param config - 3D brush configuration
 * @returns Array of modified masks
 */
export function apply3DBrushStroke(
  masks: BinaryMask[],
  stroke: BrushStroke,
  currentSlice: number,
  config: Brush3DConfig
): MaskOperationResult[] {
  const { depth, depthFalloff } = config;
  const results: MaskOperationResult[] = [];
  
  // Calculate slice range
  const halfDepth = Math.floor(depth / 2);
  const startSlice = Math.max(0, currentSlice - halfDepth);
  const endSlice = Math.min(masks.length - 1, currentSlice + halfDepth);
  
  for (let sliceIdx = 0; sliceIdx < masks.length; sliceIdx++) {
    if (sliceIdx < startSlice || sliceIdx > endSlice) {
      // Outside range, keep original
      const mask = masks[sliceIdx];
      results.push({
        data: mask.data,
        width: mask.width,
        height: mask.height,
        pixelCount: 0,
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      });
      continue;
    }
    
    // Calculate depth opacity
    const distanceFromCenter = Math.abs(sliceIdx - currentSlice);
    let depthOpacity = 1;
    
    switch (depthFalloff) {
      case 'linear':
        depthOpacity = 1 - (distanceFromCenter / (halfDepth + 1));
        break;
      case 'gaussian':
        const sigma = halfDepth / 2;
        depthOpacity = Math.exp(-(distanceFromCenter * distanceFromCenter) / (2 * sigma * sigma));
        break;
      case 'none':
      default:
        depthOpacity = 1;
    }
    
    // Create modified stroke with depth opacity
    const modifiedStroke: BrushStroke = {
      ...stroke,
      config: {
        ...stroke.config,
        opacity: stroke.config.opacity * depthOpacity,
      },
    };
    
    results.push(applyBrushStroke(masks[sliceIdx], modifiedStroke));
  }
  
  return results;
}

/**
 * Create an adaptive brush that respects image edges
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param x - Brush center X
 * @param y - Brush center Y
 * @param config - Adaptive brush configuration
 * @returns Modified brush mask that respects edges
 */
export function createAdaptiveBrush(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  x: number,
  y: number,
  config: AdaptiveBrushConfig
): Float32Array {
  const { radius, intensityTolerance, gradientThreshold, edgeStrength } = config;
  const brushSize = radius * 2 + 1;
  const mask = new Float32Array(brushSize * brushSize);
  
  // Get seed intensity
  const seedIdx = Math.floor(y) * width + Math.floor(x);
  const seedIntensity = imageData[seedIdx] ?? 0;
  
  // Calculate gradient magnitude at each pixel
  const gradients = new Float32Array(brushSize * brushSize);
  
  for (let by = 0; by < brushSize; by++) {
    for (let bx = 0; bx < brushSize; bx++) {
      const px = Math.floor(x - radius + bx);
      const py = Math.floor(y - radius + by);
      
      if (px < 1 || px >= width - 1 || py < 1 || py >= height - 1) {
        gradients[by * brushSize + bx] = 0;
        continue;
      }
      
      // Sobel gradient
      const idx = py * width + px;
      const gx = (
        -imageData[idx - width - 1] + imageData[idx - width + 1] +
        -2 * imageData[idx - 1] + 2 * imageData[idx + 1] +
        -imageData[idx + width - 1] + imageData[idx + width + 1]
      ) / 4;
      
      const gy = (
        -imageData[idx - width - 1] - 2 * imageData[idx - width] - imageData[idx - width + 1] +
        imageData[idx + width - 1] + 2 * imageData[idx + width] + imageData[idx + width + 1]
      ) / 4;
      
      gradients[by * brushSize + bx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  // Generate adaptive mask
  for (let by = 0; by < brushSize; by++) {
    for (let bx = 0; bx < brushSize; bx++) {
      const dx = bx - radius;
      const dy = by - radius;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > radius) {
        mask[by * brushSize + bx] = 0;
        continue;
      }
      
      const px = Math.floor(x - radius + bx);
      const py = Math.floor(y - radius + by);
      
      if (px < 0 || px >= width || py < 0 || py >= height) {
        mask[by * brushSize + bx] = 0;
        continue;
      }
      
      const idx = py * width + px;
      const intensity = imageData[idx];
      const gradient = gradients[by * brushSize + bx];
      
      // Check intensity similarity
      const intensityDiff = Math.abs(intensity - seedIntensity);
      const intensityFactor = intensityDiff <= intensityTolerance ? 1 : 
        Math.max(0, 1 - (intensityDiff - intensityTolerance) / intensityTolerance);
      
      // Check gradient (edge detection)
      const edgeFactor = gradient < gradientThreshold ? 1 :
        Math.max(0, 1 - (gradient - gradientThreshold) / gradientThreshold);
      
      // Combine factors
      const adaptiveFactor = intensityFactor * (1 - edgeStrength) + edgeFactor * edgeStrength;
      
      // Apply distance falloff
      const distanceFactor = 1 - (distance / radius);
      
      mask[by * brushSize + bx] = adaptiveFactor * distanceFactor;
    }
  }
  
  return mask;
}

/**
 * Apply adaptive brush stroke that respects image edges
 * 
 * @param mask - Target mask
 * @param imageData - Image pixel data
 * @param imageWidth - Image width
 * @param imageHeight - Image height
 * @param stroke - Brush stroke
 * @param config - Adaptive brush configuration
 * @returns Modified mask
 */
export function applyAdaptiveBrushStroke(
  mask: BinaryMask,
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  imageWidth: number,
  imageHeight: number,
  stroke: BrushStroke,
  config: AdaptiveBrushConfig
): MaskOperationResult {
  const result = new Uint8Array(mask.data);
  const { width, height } = mask;
  const { points } = stroke;
  const { radius, isEraser, spacing, opacity } = config;
  
  let lastX = -Infinity;
  let lastY = -Infinity;
  const minDistance = radius * spacing * 2;
  const brushSize = radius * 2 + 1;
  
  for (const point of points) {
    const { x: cx, y: cy } = point;
    
    // Check spacing
    const dist = Math.sqrt((cx - lastX) ** 2 + (cy - lastY) ** 2);
    if (dist < minDistance && lastX !== -Infinity) {
      continue;
    }
    lastX = cx;
    lastY = cy;
    
    // Generate adaptive brush at this point
    const adaptiveMask = createAdaptiveBrush(
      imageData, imageWidth, imageHeight,
      cx, cy, config
    );
    
    // Apply brush
    for (let by = 0; by < brushSize; by++) {
      for (let bx = 0; bx < brushSize; bx++) {
        const brushOpacity = adaptiveMask[by * brushSize + bx];
        if (brushOpacity < 0.3) continue;
        
        const px = Math.floor(cx - radius + bx);
        const py = Math.floor(cy - radius + by);
        
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        
        const idx = py * width + px;
        const effectiveOpacity = brushOpacity * opacity;
        
        if (isEraser) {
          if (effectiveOpacity >= 0.5) {
            result[idx] = 0;
          }
        } else {
          if (effectiveOpacity >= 0.5) {
            result[idx] = 1;
          }
        }
      }
    }
  }
  
  // Calculate statistics
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (result[y * width + x] === 1) {
        pixelCount++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (pixelCount === 0) {
    return {
      data: result,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }
  
  return {
    data: result,
    width,
    height,
    pixelCount,
    bounds: { minX, minY, maxX, maxY },
  };
}

/**
 * Interpolate points along a stroke path for smooth drawing
 * 
 * @param points - Original stroke points
 * @param spacing - Desired spacing between points
 * @returns Interpolated points
 */
export function interpolateStrokePoints(
  points: Array<{ x: number; y: number }>,
  spacing: number = 1
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  
  const result: Array<{ x: number; y: number }> = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dist = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
    
    if (dist > spacing) {
      const numSteps = Math.ceil(dist / spacing);
      for (let j = 1; j <= numSteps; j++) {
        const t = j / numSteps;
        result.push({
          x: prev.x + (curr.x - prev.x) * t,
          y: prev.y + (curr.y - prev.y) * t,
        });
      }
    } else {
      result.push(curr);
    }
  }
  
  return result;
}

/**
 * Smooth a stroke path using Catmull-Rom spline interpolation
 * 
 * @param points - Original stroke points
 * @param tension - Spline tension (0-1)
 * @param numSegments - Number of segments between each pair of points
 * @returns Smoothed points
 */
export function smoothStrokePath(
  points: Array<{ x: number; y: number }>,
  tension: number = 0.5,
  numSegments: number = 10
): Array<{ x: number; y: number }> {
  if (points.length < 3) return points;
  
  const result: Array<{ x: number; y: number }> = [];
  
  // Catmull-Rom spline interpolation
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let j = 0; j < numSegments; j++) {
      const t = j / numSegments;
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      
      result.push({ x, y });
    }
  }
  
  // Add last point
  result.push(points[points.length - 1]);
  
  return result;
}

/**
 * Create a brush stamp (single application of brush at a point)
 * 
 * @param mask - Target mask
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param config - Brush configuration
 * @returns Modified mask
 */
export function brushStamp(
  mask: BinaryMask,
  x: number,
  y: number,
  config: BrushConfig
): MaskOperationResult {
  const stroke: BrushStroke = {
    id: 'stamp',
    points: [{ x, y }],
    config,
    timestamp: Date.now(),
  };
  
  return applyBrushStroke(mask, stroke);
}
