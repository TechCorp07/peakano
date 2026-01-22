/**
 * Region Growing Algorithm
 * Seeded region growing for medical image segmentation
 */

import type { RegionGrowingConfig, RegionGrowingResult } from './types';
import type { Point3 } from '@cornerstonejs/core/types';

/**
 * Calculate local statistics for adaptive thresholding
 */
function calculateLocalStats(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number
): { mean: number; std: number } {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  
  const startX = Math.max(0, centerX - radius);
  const endX = Math.min(width - 1, centerX + radius);
  const startY = Math.max(0, centerY - radius);
  const endY = Math.min(height - 1, centerY + radius);
  
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const idx = y * width + x;
      const val = imageData[idx] ?? 0;
      sum += val;
      sumSq += val * val;
      count++;
    }
  }
  
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  const std = Math.sqrt(Math.max(0, variance));
  
  return { mean, std };
}

/**
 * Calculate gradient magnitude at a pixel
 */
function calculateGradient(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) {
    return 255; // Edge of image, high gradient
  }
  
  const idx = y * width + x;
  
  // Sobel operator
  const gx = 
    -1 * (imageData[(y - 1) * width + (x - 1)] ?? 0) +
    1 * (imageData[(y - 1) * width + (x + 1)] ?? 0) +
    -2 * (imageData[y * width + (x - 1)] ?? 0) +
    2 * (imageData[y * width + (x + 1)] ?? 0) +
    -1 * (imageData[(y + 1) * width + (x - 1)] ?? 0) +
    1 * (imageData[(y + 1) * width + (x + 1)] ?? 0);
  
  const gy = 
    -1 * (imageData[(y - 1) * width + (x - 1)] ?? 0) +
    -2 * (imageData[(y - 1) * width + x] ?? 0) +
    -1 * (imageData[(y - 1) * width + (x + 1)] ?? 0) +
    1 * (imageData[(y + 1) * width + (x - 1)] ?? 0) +
    2 * (imageData[(y + 1) * width + x] ?? 0) +
    1 * (imageData[(y + 1) * width + (x + 1)] ?? 0);
  
  return Math.sqrt(gx * gx + gy * gy);
}

/**
 * Extract contour points from mask
 */
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
  
  // Step 5: Simplify if too many points (for performance)
  if (contour.length > 200) {
    const simplified: Point3[] = [];
    const step = Math.max(1, Math.floor(contour.length / 200));
    for (let i = 0; i < contour.length; i += step) {
      simplified.push(contour[i]);
    }
    return simplified;
  }
  
  return contour;
}

/**
 * Perform seeded region growing segmentation
 * 
 * @param imageData - The pixel data from the DICOM image
 * @param width - Image width
 * @param height - Image height
 * @param seedX - X coordinate of seed point
 * @param seedY - Y coordinate of seed point
 * @param config - Region growing configuration
 * @param canvasToWorld - Function to convert canvas to world coordinates
 * @returns Region growing result with mask and statistics
 */
export function regionGrow(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  seedX: number,
  seedY: number,
  config: RegionGrowingConfig,
  canvasToWorld?: (x: number, y: number) => Point3 | null
): RegionGrowingResult {
  const {
    intensityTolerance,
    gradientThreshold,
    maxIterations,
    minRegionSize,
    useAdaptiveThreshold,
  } = config;
  
  // Validate seed point
  const seedIdx = Math.floor(seedY) * width + Math.floor(seedX);
  if (seedX < 0 || seedX >= width || seedY < 0 || seedY >= height) {
    return {
      mask: new Uint8Array(width * height),
      width,
      height,
      stats: { meanIntensity: 0, stdIntensity: 0, minIntensity: 0, maxIntensity: 0, area: 0 },
    };
  }
  
  const mask = new Uint8Array(width * height);
  const visited = new Set<number>();
  
  // Priority queue using array (simple implementation)
  // Higher priority = more similar to region mean
  const candidates: Array<{ idx: number; priority: number }> = [];
  
  // Region statistics
  let regionSum = 0;
  let regionSumSq = 0;
  let regionMin = Infinity;
  let regionMax = -Infinity;
  let regionCount = 0;
  
  // Calculate initial local statistics if adaptive
  let threshold = intensityTolerance;
  if (useAdaptiveThreshold) {
    const localStats = calculateLocalStats(imageData, width, height, Math.floor(seedX), Math.floor(seedY), 10);
    threshold = Math.max(intensityTolerance, localStats.std * 2);
  }
  
  // Initialize with seed
  const seedIntensity = imageData[seedIdx] ?? 0;
  mask[seedIdx] = 1;
  visited.add(seedIdx);
  regionSum = seedIntensity;
  regionSumSq = seedIntensity * seedIntensity;
  regionMin = seedIntensity;
  regionMax = seedIntensity;
  regionCount = 1;
  
  // Add seed neighbors to candidates
  const neighborOffsets = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];
  for (const offset of neighborOffsets) {
    const neighborIdx = seedIdx + offset;
    const nx = neighborIdx % width;
    const ny = Math.floor(neighborIdx / width);
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const neighborIntensity = imageData[neighborIdx] ?? 0;
      const diff = Math.abs(neighborIntensity - seedIntensity);
      candidates.push({ idx: neighborIdx, priority: -diff });
    }
  }
  
  // Sort candidates by priority (descending)
  candidates.sort((a, b) => b.priority - a.priority);
  
  let iterations = 0;
  
  // Region growing loop
  while (candidates.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Get highest priority candidate
    const candidate = candidates.shift()!;
    const idx = candidate.idx;
    
    if (visited.has(idx)) continue;
    visited.add(idx);
    
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    // Bounds check
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const intensity = imageData[idx] ?? 0;
    const regionMean = regionSum / regionCount;
    
    // Check intensity similarity to region mean
    const intensityDiff = Math.abs(intensity - regionMean);
    if (intensityDiff > threshold) continue;
    
    // Check gradient (edge detection)
    const gradient = calculateGradient(imageData, width, height, x, y);
    if (gradient > gradientThreshold) continue;
    
    // Add to region
    mask[idx] = 1;
    regionSum += intensity;
    regionSumSq += intensity * intensity;
    regionMin = Math.min(regionMin, intensity);
    regionMax = Math.max(regionMax, intensity);
    regionCount++;
    
    // Update adaptive threshold based on region statistics
    if (useAdaptiveThreshold && regionCount > 10) {
      const variance = (regionSumSq / regionCount) - (regionMean * regionMean);
      const std = Math.sqrt(Math.max(0, variance));
      threshold = Math.max(intensityTolerance, std * 2.5);
    }
    
    // Add neighbors to candidates
    for (const offset of neighborOffsets) {
      const neighborIdx = idx + offset;
      const nx = neighborIdx % width;
      const ny = Math.floor(neighborIdx / width);
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(neighborIdx)) {
        const neighborIntensity = imageData[neighborIdx] ?? 0;
        const diff = Math.abs(neighborIntensity - regionMean);
        candidates.push({ idx: neighborIdx, priority: -diff });
      }
    }
    
    // Re-sort candidates periodically
    if (iterations % 100 === 0) {
      candidates.sort((a, b) => b.priority - a.priority);
    }
  }
  
  // Check minimum region size
  if (regionCount < minRegionSize) {
    return {
      mask: new Uint8Array(width * height),
      width,
      height,
      stats: { meanIntensity: 0, stdIntensity: 0, minIntensity: 0, maxIntensity: 0, area: 0 },
    };
  }
  
  // Calculate final statistics
  const meanIntensity = regionSum / regionCount;
  const variance = (regionSumSq / regionCount) - (meanIntensity * meanIntensity);
  const stdIntensity = Math.sqrt(Math.max(0, variance));
  
  // Extract contour if conversion function provided
  let contourPoints: Point3[] | undefined;
  if (canvasToWorld && regionCount > 0) {
    contourPoints = extractContour(mask, width, height, canvasToWorld);
  }
  
  return {
    mask,
    width,
    height,
    stats: {
      meanIntensity,
      stdIntensity,
      minIntensity: regionMin === Infinity ? 0 : regionMin,
      maxIntensity: regionMax === -Infinity ? 0 : regionMax,
      area: regionCount,
    },
    contourPoints,
  };
}

/**
 * Perform multi-seed region growing
 */
export function multiSeedRegionGrow(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  seeds: Array<{ x: number; y: number }>,
  config: RegionGrowingConfig,
  canvasToWorld?: (x: number, y: number) => Point3 | null
): RegionGrowingResult {
  // Start from first seed, then merge results
  if (seeds.length === 0) {
    return {
      mask: new Uint8Array(width * height),
      width,
      height,
      stats: { meanIntensity: 0, stdIntensity: 0, minIntensity: 0, maxIntensity: 0, area: 0 },
    };
  }
  
  const combinedMask = new Uint8Array(width * height);
  let totalStats = { sum: 0, sumSq: 0, min: Infinity, max: -Infinity, count: 0 };
  
  for (const seed of seeds) {
    const result = regionGrow(imageData, width, height, seed.x, seed.y, config);
    
    // Merge masks
    for (let i = 0; i < result.mask.length; i++) {
      if (result.mask[i] === 1 && combinedMask[i] === 0) {
        combinedMask[i] = 1;
        const intensity = imageData[i] ?? 0;
        totalStats.sum += intensity;
        totalStats.sumSq += intensity * intensity;
        totalStats.min = Math.min(totalStats.min, intensity);
        totalStats.max = Math.max(totalStats.max, intensity);
        totalStats.count++;
      }
    }
  }
  
  const meanIntensity = totalStats.count > 0 ? totalStats.sum / totalStats.count : 0;
  const variance = totalStats.count > 0 ? (totalStats.sumSq / totalStats.count) - (meanIntensity * meanIntensity) : 0;
  
  let contourPoints: Point3[] | undefined;
  if (canvasToWorld && totalStats.count > 0) {
    contourPoints = extractContour(combinedMask, width, height, canvasToWorld);
  }
  
  return {
    mask: combinedMask,
    width,
    height,
    stats: {
      meanIntensity,
      stdIntensity: Math.sqrt(Math.max(0, variance)),
      minIntensity: totalStats.min === Infinity ? 0 : totalStats.min,
      maxIntensity: totalStats.max === -Infinity ? 0 : totalStats.max,
      area: totalStats.count,
    },
    contourPoints,
  };
}
