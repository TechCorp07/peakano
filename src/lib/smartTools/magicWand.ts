/**
 * Magic Wand Algorithm
 * Flood-fill based selection tool for selecting regions of similar intensity
 */

import type { MagicWandConfig, MagicWandResult } from './types';
import type { Point3 } from '@cornerstonejs/core/types';

/**
 * Get pixel intensity from image data at a given position
 */
function getPixelIntensity(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  index: number
): number {
  return imageData[index] ?? 0;
}

/**
 * Check if a pixel should be included based on tolerance
 */
function isWithinTolerance(
  currentIntensity: number,
  seedIntensity: number,
  tolerance: number
): boolean {
  return Math.abs(currentIntensity - seedIntensity) <= tolerance;
}

/**
 * Get neighbor offsets based on connectivity
 */
function getNeighborOffsets(width: number, eightConnected: boolean): number[] {
  const fourConnected = [-1, 1, -width, width];
  if (!eightConnected) return fourConnected;
  
  // 8-connected includes diagonals
  return [
    -1, 1, -width, width, // 4-connected
    -width - 1, -width + 1, width - 1, width + 1 // diagonals
  ];
}

/**
 * Apply edge smoothing to the mask using morphological operations
 */
function smoothMaskEdges(mask: Uint8Array, width: number, height: number): void {
  const temp = new Uint8Array(mask.length);
  
  // Erosion followed by dilation (opening) to smooth edges
  // Simple 3x3 structuring element
  
  // Erosion
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      let allSet = true;
      for (let dy = -1; dy <= 1 && allSet; dy++) {
        for (let dx = -1; dx <= 1 && allSet; dx++) {
          if (mask[(y + dy) * width + (x + dx)] === 0) {
            allSet = false;
          }
        }
      }
      temp[idx] = allSet ? 1 : 0;
    }
  }
  
  // Dilation
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      let anySet = false;
      for (let dy = -1; dy <= 1 && !anySet; dy++) {
        for (let dx = -1; dx <= 1 && !anySet; dx++) {
          if (temp[(y + dy) * width + (x + dx)] === 1) {
            anySet = true;
          }
        }
      }
      mask[idx] = anySet ? 1 : 0;
    }
  }
}

/**
 * Extract contour points from binary mask using centroid-based ordering
 * This produces an ordered list of boundary points that forms a proper polygon
 */
function extractContour(
  mask: Uint8Array,
  width: number,
  height: number,
  canvasToWorld: (x: number, y: number) => Point3 | null
): Point3[] {
  console.log('[extractContour] Starting contour extraction, mask size:', width, 'x', height);
  
  // Step 1: Find all boundary pixels (mask pixels with at least one non-mask neighbor)
  const boundaryPixels: Array<{x: number; y: number}> = [];
  let sumX = 0, sumY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 1) {
        // Check if this is a boundary pixel
        const hasNonMaskNeighbor = 
          (x === 0 || mask[idx - 1] === 0) ||
          (x === width - 1 || mask[idx + 1] === 0) ||
          (y === 0 || mask[idx - width] === 0) ||
          (y === height - 1 || mask[idx + width] === 0);
        
        if (hasNonMaskNeighbor) {
          boundaryPixels.push({ x, y });
          sumX += x;
          sumY += y;
        }
      }
    }
  }
  
  console.log('[extractContour] Found', boundaryPixels.length, 'boundary pixels');
  
  if (boundaryPixels.length === 0) {
    return [];
  }
  
  // Step 2: Calculate centroid
  const centroidX = sumX / boundaryPixels.length;
  const centroidY = sumY / boundaryPixels.length;
  
  // Step 3: Sort boundary pixels by angle from centroid (counter-clockwise)
  boundaryPixels.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
    const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
    return angleA - angleB;
  });
  
  // Step 4: Convert to world coordinates
  const contour: Point3[] = [];
  for (const pixel of boundaryPixels) {
    const worldPoint = canvasToWorld(pixel.x, pixel.y);
    if (worldPoint) {
      contour.push(worldPoint);
    }
  }
  
  console.log('[extractContour] Generated', contour.length, 'contour points');
  
  // Step 5: Simplify if too many points (for performance)
  if (contour.length > 200) {
    const simplified: Point3[] = [];
    const step = Math.max(1, Math.floor(contour.length / 200));
    for (let i = 0; i < contour.length; i += step) {
      simplified.push(contour[i]);
    }
    console.log('[extractContour] Simplified to', simplified.length, 'points');
    return simplified;
  }
  
  return contour;
}

/**
 * Perform Magic Wand selection using flood fill algorithm
 * 
 * @param imageData - The pixel data from the DICOM image
 * @param width - Image width
 * @param height - Image height
 * @param seedX - X coordinate of seed point (canvas coordinates)
 * @param seedY - Y coordinate of seed point (canvas coordinates)
 * @param config - Magic Wand configuration
 * @param canvasToWorld - Function to convert canvas coordinates to world coordinates
 * @returns Magic Wand result with mask and contour
 */
export function magicWandSelect(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  config: MagicWandConfig,
  canvasToWorld?: (x: number, y: number) => Point3 | null
): MagicWandResult {
  const { tolerance, eightConnected, maxPixels, smoothEdges } = config;
  
  // Validate seed point
  const seedIdx = Math.floor(seedY) * width + Math.floor(seedX);
  if (seedX < 0 || seedX >= width || seedY < 0 || seedY >= height) {
    return {
      mask: new Uint8Array(width * height),
      width,
      height,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      pixelCount: 0,
    };
  }
  
  const seedIntensity = getPixelIntensity(imageData, seedIdx);
  const mask = new Uint8Array(width * height);
  const visited = new Set<number>();
  const stack: number[] = [seedIdx];
  
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  const neighborOffsets = getNeighborOffsets(width, eightConnected);
  
  // Flood fill using stack-based DFS
  while (stack.length > 0 && pixelCount < maxPixels) {
    const idx = stack.pop()!;
    
    if (visited.has(idx)) continue;
    visited.add(idx);
    
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    // Bounds check
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const intensity = getPixelIntensity(imageData, idx);
    
    if (!isWithinTolerance(intensity, seedIntensity, tolerance)) continue;
    
    // Mark as selected
    mask[idx] = 1;
    pixelCount++;
    
    // Update bounds
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    
    // Add neighbors to stack
    for (const offset of neighborOffsets) {
      const neighborIdx = idx + offset;
      const nx = neighborIdx % width;
      const ny = Math.floor(neighborIdx / width);
      
      // Ensure neighbor is within bounds and not visited
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(neighborIdx)) {
        stack.push(neighborIdx);
      }
    }
  }
  
  // Apply edge smoothing if enabled
  if (smoothEdges && pixelCount > 0) {
    smoothMaskEdges(mask, width, height);
  }
  
  // Extract contour if conversion function provided
  let contourPoints: Point3[] | undefined;
  if (canvasToWorld && pixelCount > 0) {
    contourPoints = extractContour(mask, width, height, canvasToWorld);
  }
  
  return {
    mask,
    width,
    height,
    bounds: {
      minX: pixelCount > 0 ? minX : 0,
      minY: pixelCount > 0 ? minY : 0,
      maxX: pixelCount > 0 ? maxX : 0,
      maxY: pixelCount > 0 ? maxY : 0,
    },
    pixelCount,
    contourPoints,
  };
}

/**
 * Convert Magic Wand mask to canvas annotation format
 */
export function maskToAnnotationPath(
  mask: Uint8Array,
  width: number,
  height: number,
  canvasToWorld: (x: number, y: number) => Point3 | null
): Point3[] {
  return extractContour(mask, width, height, canvasToWorld);
}
