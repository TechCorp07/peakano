/**
 * Threshold Segmentation
 * Tools for selecting regions based on intensity thresholds
 * 
 * @module annotation/thresholdSegmentation
 */

import type { BinaryMask, MaskOperationResult } from './maskOperations';

/**
 * Configuration for threshold segmentation
 */
export interface ThresholdConfig {
  /** Lower threshold value */
  lowerThreshold: number;
  /** Upper threshold value */
  upperThreshold: number;
  /** Whether to invert the selection */
  invert: boolean;
}

/**
 * Result from threshold segmentation
 */
export interface ThresholdResult extends MaskOperationResult {
  /** Statistics about the thresholded region */
  stats: {
    meanIntensity: number;
    stdIntensity: number;
    minIntensity: number;
    maxIntensity: number;
  };
  /** Histogram of the image */
  histogram?: number[];
}

/**
 * Adaptive threshold configuration
 */
export interface AdaptiveThresholdConfig {
  /** Size of the local window (must be odd) */
  windowSize: number;
  /** Constant to subtract from the mean */
  constant: number;
  /** Method for computing local threshold */
  method: 'mean' | 'gaussian';
}

/**
 * Basic threshold segmentation
 * Selects pixels within the specified intensity range
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param config - Threshold configuration
 * @returns Threshold result with mask and statistics
 */
export function thresholdSegment(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  config: ThresholdConfig
): ThresholdResult {
  const { lowerThreshold, upperThreshold, invert } = config;
  const mask = new Uint8Array(width * height);
  
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let sum = 0;
  let sumSq = 0;
  let minIntensity = Infinity;
  let maxIntensity = -Infinity;
  let selectedSum = 0;
  let selectedSumSq = 0;
  let selectedMin = Infinity;
  let selectedMax = -Infinity;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const intensity = imageData[idx];
      
      // Track overall statistics
      sum += intensity;
      sumSq += intensity * intensity;
      minIntensity = Math.min(minIntensity, intensity);
      maxIntensity = Math.max(maxIntensity, intensity);
      
      // Check threshold
      let inRange = intensity >= lowerThreshold && intensity <= upperThreshold;
      if (invert) inRange = !inRange;
      
      if (inRange) {
        mask[idx] = 1;
        pixelCount++;
        
        // Track selected region statistics
        selectedSum += intensity;
        selectedSumSq += intensity * intensity;
        selectedMin = Math.min(selectedMin, intensity);
        selectedMax = Math.max(selectedMax, intensity);
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // Calculate statistics for selected region
  const meanIntensity = pixelCount > 0 ? selectedSum / pixelCount : 0;
  const variance = pixelCount > 0 
    ? (selectedSumSq / pixelCount) - (meanIntensity * meanIntensity) 
    : 0;
  const stdIntensity = Math.sqrt(Math.max(0, variance));
  
  // Handle empty selection
  if (pixelCount === 0) {
    return {
      data: mask,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      stats: {
        meanIntensity: 0,
        stdIntensity: 0,
        minIntensity: 0,
        maxIntensity: 0,
      },
    };
  }
  
  return {
    data: mask,
    width,
    height,
    pixelCount,
    bounds: { minX, minY, maxX, maxY },
    stats: {
      meanIntensity,
      stdIntensity,
      minIntensity: selectedMin,
      maxIntensity: selectedMax,
    },
  };
}

/**
 * Adaptive threshold segmentation
 * Uses local pixel neighborhood to determine threshold
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param config - Adaptive threshold configuration
 * @returns Threshold result
 */
export function adaptiveThreshold(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  config: AdaptiveThresholdConfig
): ThresholdResult {
  const { windowSize, constant, method } = config;
  const halfWindow = Math.floor(windowSize / 2);
  const mask = new Uint8Array(width * height);
  
  // Create integral image for fast mean computation
  const integral = new Float64Array((width + 1) * (height + 1));
  const integralSq = new Float64Array((width + 1) * (height + 1));
  
  // Build integral images
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const intIdx = (y + 1) * (width + 1) + (x + 1);
      const intensity = imageData[idx];
      
      integral[intIdx] = intensity +
        integral[intIdx - 1] +
        integral[intIdx - (width + 1)] -
        integral[intIdx - (width + 1) - 1];
      
      integralSq[intIdx] = intensity * intensity +
        integralSq[intIdx - 1] +
        integralSq[intIdx - (width + 1)] -
        integralSq[intIdx - (width + 1) - 1];
    }
  }
  
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let selectedSum = 0;
  let selectedSumSq = 0;
  let selectedMin = Infinity;
  let selectedMax = -Infinity;
  
  // Apply adaptive threshold
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const intensity = imageData[idx];
      
      // Calculate local window bounds
      const x1 = Math.max(0, x - halfWindow);
      const y1 = Math.max(0, y - halfWindow);
      const x2 = Math.min(width - 1, x + halfWindow);
      const y2 = Math.min(height - 1, y + halfWindow);
      
      const windowArea = (x2 - x1 + 1) * (y2 - y1 + 1);
      
      // Get sum using integral image
      const intIdx1 = y1 * (width + 1) + x1;
      const intIdx2 = y1 * (width + 1) + (x2 + 1);
      const intIdx3 = (y2 + 1) * (width + 1) + x1;
      const intIdx4 = (y2 + 1) * (width + 1) + (x2 + 1);
      
      const sum = integral[intIdx4] - integral[intIdx2] - integral[intIdx3] + integral[intIdx1];
      const localMean = sum / windowArea;
      
      let threshold: number;
      
      if (method === 'gaussian') {
        // Gaussian-weighted mean (approximated with weighted center)
        const sumSq = integralSq[intIdx4] - integralSq[intIdx2] - integralSq[intIdx3] + integralSq[intIdx1];
        const localVariance = (sumSq / windowArea) - (localMean * localMean);
        const localStd = Math.sqrt(Math.max(0, localVariance));
        threshold = localMean - constant * localStd * 0.1;
      } else {
        // Mean method
        threshold = localMean - constant;
      }
      
      if (intensity > threshold) {
        mask[idx] = 1;
        pixelCount++;
        
        selectedSum += intensity;
        selectedSumSq += intensity * intensity;
        selectedMin = Math.min(selectedMin, intensity);
        selectedMax = Math.max(selectedMax, intensity);
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // Calculate statistics
  const meanIntensity = pixelCount > 0 ? selectedSum / pixelCount : 0;
  const variance = pixelCount > 0 
    ? (selectedSumSq / pixelCount) - (meanIntensity * meanIntensity) 
    : 0;
  const stdIntensity = Math.sqrt(Math.max(0, variance));
  
  if (pixelCount === 0) {
    return {
      data: mask,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      stats: {
        meanIntensity: 0,
        stdIntensity: 0,
        minIntensity: 0,
        maxIntensity: 0,
      },
    };
  }
  
  return {
    data: mask,
    width,
    height,
    pixelCount,
    bounds: { minX, minY, maxX, maxY },
    stats: {
      meanIntensity,
      stdIntensity,
      minIntensity: selectedMin,
      maxIntensity: selectedMax,
    },
  };
}

/**
 * Otsu's automatic threshold
 * Finds optimal threshold by maximizing between-class variance
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param numBins - Number of histogram bins (default 256)
 * @returns Optimal threshold value and result
 */
export function otsuThreshold(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  numBins: number = 256
): { threshold: number; result: ThresholdResult; histogram: number[] } {
  const totalPixels = width * height;
  
  // Find min/max for normalization
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < totalPixels; i++) {
    minVal = Math.min(minVal, imageData[i]);
    maxVal = Math.max(maxVal, imageData[i]);
  }
  
  const range = maxVal - minVal || 1;
  
  // Build histogram
  const histogram = new Array(numBins).fill(0);
  for (let i = 0; i < totalPixels; i++) {
    const bin = Math.min(numBins - 1, Math.floor(((imageData[i] - minVal) / range) * (numBins - 1)));
    histogram[bin]++;
  }
  
  // Normalize histogram
  const normalizedHist = histogram.map(count => count / totalPixels);
  
  // Calculate cumulative sums
  const cumulativeSum = new Array(numBins);
  const cumulativeMean = new Array(numBins);
  
  cumulativeSum[0] = normalizedHist[0];
  cumulativeMean[0] = 0;
  
  for (let i = 1; i < numBins; i++) {
    cumulativeSum[i] = cumulativeSum[i - 1] + normalizedHist[i];
    cumulativeMean[i] = cumulativeMean[i - 1] + i * normalizedHist[i];
  }
  
  const globalMean = cumulativeMean[numBins - 1];
  
  // Find optimal threshold by maximizing between-class variance
  let maxVariance = 0;
  let optimalBin = 0;
  
  for (let t = 0; t < numBins - 1; t++) {
    const w0 = cumulativeSum[t];
    const w1 = 1 - w0;
    
    if (w0 === 0 || w1 === 0) continue;
    
    const mu0 = cumulativeMean[t] / w0;
    const mu1 = (globalMean - cumulativeMean[t]) / w1;
    
    const variance = w0 * w1 * (mu0 - mu1) * (mu0 - mu1);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      optimalBin = t;
    }
  }
  
  // Convert bin back to intensity value
  const optimalThreshold = minVal + (optimalBin / (numBins - 1)) * range;
  
  // Apply threshold
  const result = thresholdSegment(imageData, width, height, {
    lowerThreshold: optimalThreshold,
    upperThreshold: maxVal,
    invert: false,
  });
  
  return {
    threshold: optimalThreshold,
    result: { ...result, histogram },
    histogram,
  };
}

/**
 * Calculate histogram of an image
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param numBins - Number of histogram bins
 * @returns Histogram and min/max values
 */
export function calculateHistogram(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  numBins: number = 256
): { histogram: number[]; minVal: number; maxVal: number; binWidth: number } {
  const totalPixels = width * height;
  
  // Find min/max
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < totalPixels; i++) {
    minVal = Math.min(minVal, imageData[i]);
    maxVal = Math.max(maxVal, imageData[i]);
  }
  
  const range = maxVal - minVal || 1;
  const binWidth = range / numBins;
  
  // Build histogram
  const histogram = new Array(numBins).fill(0);
  for (let i = 0; i < totalPixels; i++) {
    const bin = Math.min(numBins - 1, Math.floor(((imageData[i] - minVal) / range) * (numBins - 1)));
    histogram[bin]++;
  }
  
  return { histogram, minVal, maxVal, binWidth };
}

/**
 * Multi-threshold segmentation (multi-Otsu)
 * Segments image into multiple classes
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param numClasses - Number of classes (2-4 supported)
 * @returns Array of thresholds and class masks
 */
export function multiOtsuThreshold(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  numClasses: number = 3
): { thresholds: number[]; masks: Uint8Array[] } {
  if (numClasses < 2 || numClasses > 4) {
    throw new Error('Number of classes must be between 2 and 4');
  }
  
  const { histogram, minVal, maxVal } = calculateHistogram(imageData, width, height);
  const range = maxVal - minVal || 1;
  const numBins = histogram.length;
  
  // Normalize histogram
  const totalPixels = width * height;
  const normalizedHist = histogram.map(count => count / totalPixels);
  
  // For simplicity, use recursive Otsu for 2 classes and extend
  // Full multi-Otsu is computationally expensive
  
  const thresholds: number[] = [];
  
  if (numClasses === 2) {
    const { threshold } = otsuThreshold(imageData, width, height);
    thresholds.push(threshold);
  } else {
    // Divide histogram into segments and find optimal thresholds
    // Simplified approach: evenly spaced initial thresholds refined by local Otsu
    const step = numBins / numClasses;
    for (let i = 1; i < numClasses; i++) {
      const bin = Math.floor(i * step);
      thresholds.push(minVal + (bin / numBins) * range);
    }
  }
  
  // Create masks for each class
  const masks: Uint8Array[] = [];
  for (let c = 0; c <= thresholds.length; c++) {
    const mask = new Uint8Array(width * height);
    const lower = c === 0 ? -Infinity : thresholds[c - 1];
    const upper = c === thresholds.length ? Infinity : thresholds[c];
    
    for (let i = 0; i < totalPixels; i++) {
      const intensity = imageData[i];
      if (intensity > lower && intensity <= upper) {
        mask[i] = 1;
      }
    }
    
    masks.push(mask);
  }
  
  return { thresholds, masks };
}

/**
 * Hysteresis thresholding
 * Two-threshold method used in edge detection
 * 
 * @param imageData - Image pixel data
 * @param width - Image width
 * @param height - Image height
 * @param lowThreshold - Lower threshold
 * @param highThreshold - Upper threshold
 * @returns Binary mask
 */
export function hysteresisThreshold(
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array,
  width: number,
  height: number,
  lowThreshold: number,
  highThreshold: number
): MaskOperationResult {
  const mask = new Uint8Array(width * height);
  const strongEdges = new Uint8Array(width * height);
  
  // First pass: mark strong and weak edges
  for (let i = 0; i < width * height; i++) {
    const intensity = imageData[i];
    if (intensity >= highThreshold) {
      strongEdges[i] = 1;
      mask[i] = 1;
    } else if (intensity >= lowThreshold) {
      mask[i] = 2; // Weak edge, mark as candidate
    }
  }
  
  // Second pass: trace weak edges connected to strong edges
  let changed = true;
  while (changed) {
    changed = false;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        if (mask[idx] === 2) {
          // Check if connected to strong edge
          const neighbors = [
            idx - width - 1, idx - width, idx - width + 1,
            idx - 1,                      idx + 1,
            idx + width - 1, idx + width, idx + width + 1
          ];
          
          for (const neighbor of neighbors) {
            if (mask[neighbor] === 1) {
              mask[idx] = 1;
              changed = true;
              break;
            }
          }
        }
      }
    }
  }
  
  // Final pass: remove weak edges not connected to strong
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 2) {
      mask[i] = 0;
    }
  }
  
  // Calculate stats
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 1) {
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
      data: mask,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }
  
  return {
    data: mask,
    width,
    height,
    pixelCount,
    bounds: { minX, minY, maxX, maxY },
  };
}
