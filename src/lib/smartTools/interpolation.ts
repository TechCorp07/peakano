/**
 * Slice Interpolation Algorithm
 * Interpolates annotations between key frames across slices
 */

import type { InterpolationConfig, InterpolationResult, SliceAnnotation } from './types';
import type { Point3 } from '@cornerstonejs/core/types';

/**
 * Calculate centroid of a contour
 */
function calculateCentroid(points: Point3[]): Point3 {
  if (points.length === 0) {
    return [0, 0, 0] as Point3;
  }
  
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const p of points) {
    sumX += p[0];
    sumY += p[1];
    sumZ += p[2];
  }
  
  return [
    sumX / points.length,
    sumY / points.length,
    sumZ / points.length,
  ] as Point3;
}

/**
 * Normalize contour points to be centered at origin
 */
function normalizeContour(points: Point3[], centroid: Point3): Point3[] {
  return points.map(p => [
    p[0] - centroid[0],
    p[1] - centroid[1],
    p[2] - centroid[2],
  ] as Point3);
}

/**
 * Denormalize contour points from origin to centroid
 */
function denormalizeContour(points: Point3[], centroid: Point3): Point3[] {
  return points.map(p => [
    p[0] + centroid[0],
    p[1] + centroid[1],
    p[2] + centroid[2],
  ] as Point3);
}

/**
 * Resample contour to have uniform number of points
 */
function resampleContour(points: Point3[], targetCount: number): Point3[] {
  if (points.length === 0) return [];
  if (points.length === targetCount) return [...points];
  
  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const curr = points[i];
    const length = Math.sqrt(
      Math.pow(next[0] - curr[0], 2) +
      Math.pow(next[1] - curr[1], 2) +
      Math.pow(next[2] - curr[2], 2)
    );
    segmentLengths.push(length);
    totalLength += length;
  }
  
  if (totalLength === 0) return [points[0]];
  
  const targetSpacing = totalLength / targetCount;
  const resampled: Point3[] = [];
  
  let currentPoint = [...points[0]] as Point3;
  let currentSegment = 0;
  let positionInSegment = 0;
  
  resampled.push([...currentPoint] as Point3);
  
  for (let i = 1; i < targetCount; i++) {
    let distanceToTravel = targetSpacing;
    
    while (distanceToTravel > 0 && currentSegment < points.length) {
      const segmentRemaining = segmentLengths[currentSegment] - positionInSegment;
      
      if (distanceToTravel <= segmentRemaining) {
        // Move within current segment
        const t = (positionInSegment + distanceToTravel) / segmentLengths[currentSegment];
        const start = points[currentSegment];
        const end = points[(currentSegment + 1) % points.length];
        
        currentPoint = [
          start[0] + t * (end[0] - start[0]),
          start[1] + t * (end[1] - start[1]),
          start[2] + t * (end[2] - start[2]),
        ] as Point3;
        
        positionInSegment += distanceToTravel;
        distanceToTravel = 0;
      } else {
        // Move to next segment
        distanceToTravel -= segmentRemaining;
        currentSegment++;
        positionInSegment = 0;
      }
    }
    
    resampled.push([...currentPoint] as Point3);
  }
  
  return resampled;
}

/**
 * Linear interpolation between two contours
 */
function linearInterpolateContours(
  contour1: Point3[],
  contour2: Point3[],
  t: number, // 0 = contour1, 1 = contour2
  targetZ: number
): Point3[] {
  const maxPoints = Math.max(contour1.length, contour2.length, 64);
  
  // Resample both contours to same number of points
  const resampled1 = resampleContour(contour1, maxPoints);
  const resampled2 = resampleContour(contour2, maxPoints);
  
  // Linear interpolation
  const result: Point3[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const p1 = resampled1[i] || resampled1[0];
    const p2 = resampled2[i] || resampled2[0];
    
    result.push([
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      targetZ, // Use target slice Z coordinate
    ] as Point3);
  }
  
  return result;
}

/**
 * Shape-based interpolation using distance transforms (simplified)
 * Uses centroid interpolation with shape blending
 */
function shapeBasedInterpolateContours(
  contour1: Point3[],
  contour2: Point3[],
  t: number,
  targetZ: number
): Point3[] {
  const centroid1 = calculateCentroid(contour1);
  const centroid2 = calculateCentroid(contour2);
  
  // Interpolate centroid
  const interpolatedCentroid: Point3 = [
    centroid1[0] + t * (centroid2[0] - centroid1[0]),
    centroid1[1] + t * (centroid2[1] - centroid1[1]),
    targetZ,
  ];
  
  // Normalize contours
  const normalized1 = normalizeContour(contour1, centroid1);
  const normalized2 = normalizeContour(contour2, centroid2);
  
  // Resample
  const maxPoints = Math.max(normalized1.length, normalized2.length, 64);
  const resampled1 = resampleContour(normalized1, maxPoints);
  const resampled2 = resampleContour(normalized2, maxPoints);
  
  // Interpolate normalized shapes
  const interpolatedNormalized: Point3[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const p1 = resampled1[i] || resampled1[0];
    const p2 = resampled2[i] || resampled2[0];
    
    interpolatedNormalized.push([
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      0, // Will be replaced
    ] as Point3);
  }
  
  // Denormalize to interpolated centroid
  return denormalizeContour(interpolatedNormalized, interpolatedCentroid);
}

/**
 * Morphological interpolation using erosion/dilation concept
 */
function morphologicalInterpolateContours(
  contour1: Point3[],
  contour2: Point3[],
  t: number,
  targetZ: number,
  smoothingFactor: number
): Point3[] {
  // For morphological interpolation, we blend based on "size" 
  // Smaller t = more like contour1, larger t = more like contour2
  
  const centroid1 = calculateCentroid(contour1);
  const centroid2 = calculateCentroid(contour2);
  
  // Calculate "radii" from centroid for each contour
  const radii1 = contour1.map(p => 
    Math.sqrt(Math.pow(p[0] - centroid1[0], 2) + Math.pow(p[1] - centroid1[1], 2))
  );
  const radii2 = contour2.map(p => 
    Math.sqrt(Math.pow(p[0] - centroid2[0], 2) + Math.pow(p[1] - centroid2[1], 2))
  );
  
  const avgRadius1 = radii1.reduce((a, b) => a + b, 0) / radii1.length || 1;
  const avgRadius2 = radii2.reduce((a, b) => a + b, 0) / radii2.length || 1;
  
  // Interpolated radius scale
  const interpolatedScale = avgRadius1 + t * (avgRadius2 - avgRadius1);
  
  // Interpolated centroid
  const interpolatedCentroid: Point3 = [
    centroid1[0] + t * (centroid2[0] - centroid1[0]),
    centroid1[1] + t * (centroid2[1] - centroid1[1]),
    targetZ,
  ];
  
  // Use shape-based for the contour shape, then scale
  const shapeBased = shapeBasedInterpolateContours(contour1, contour2, t, targetZ);
  
  // Apply smoothing
  if (smoothingFactor > 0) {
    return smoothContour(shapeBased, smoothingFactor);
  }
  
  return shapeBased;
}

/**
 * Apply Gaussian-like smoothing to contour
 */
function smoothContour(points: Point3[], factor: number): Point3[] {
  if (points.length < 3 || factor <= 0) return points;
  
  const smoothed: Point3[] = [];
  const windowSize = Math.max(1, Math.floor(factor * 5));
  
  for (let i = 0; i < points.length; i++) {
    let sumX = 0, sumY = 0, sumZ = 0;
    let weightSum = 0;
    
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = (i + j + points.length) % points.length;
      const weight = 1 / (1 + Math.abs(j));
      sumX += points[idx][0] * weight;
      sumY += points[idx][1] * weight;
      sumZ += points[idx][2] * weight;
      weightSum += weight;
    }
    
    smoothed.push([
      sumX / weightSum,
      sumY / weightSum,
      points[i][2], // Keep original Z
    ] as Point3);
  }
  
  return smoothed;
}

/**
 * Find key frames (user-annotated slices) from annotations
 */
function findKeyFrames(annotations: SliceAnnotation[]): SliceAnnotation[] {
  return annotations.filter(a => a.isKeyFrame && a.contourPoints.length > 2);
}

/**
 * Perform interpolation between key frames
 * 
 * @param keyFrameAnnotations - Array of user-annotated key frames
 * @param config - Interpolation configuration
 * @param sliceZCoordinates - Map of slice index to Z coordinate
 * @returns Interpolation result with all slice annotations
 */
export function interpolateSlices(
  keyFrameAnnotations: SliceAnnotation[],
  config: InterpolationConfig,
  sliceZCoordinates: Map<number, number>
): InterpolationResult {
  const { method, maxGapSlices, smoothingFactor } = config;
  
  const keyFrames = findKeyFrames(keyFrameAnnotations);
  
  if (keyFrames.length < 2) {
    return {
      sliceAnnotations: keyFrames,
      interpolatedCount: 0,
      sliceRange: {
        start: keyFrames[0]?.sliceIndex ?? 0,
        end: keyFrames[0]?.sliceIndex ?? 0,
      },
    };
  }
  
  // Sort key frames by slice index
  keyFrames.sort((a, b) => a.sliceIndex - b.sliceIndex);
  
  const allAnnotations: SliceAnnotation[] = [];
  let interpolatedCount = 0;
  
  // Process each pair of adjacent key frames
  for (let i = 0; i < keyFrames.length - 1; i++) {
    const frame1 = keyFrames[i];
    const frame2 = keyFrames[i + 1];
    
    // Add the first key frame
    if (i === 0) {
      allAnnotations.push(frame1);
    }
    
    const gap = frame2.sliceIndex - frame1.sliceIndex;
    
    // Skip if gap is too large
    if (gap > maxGapSlices + 1) {
      allAnnotations.push(frame2);
      continue;
    }
    
    // Interpolate between frames
    for (let sliceIdx = frame1.sliceIndex + 1; sliceIdx < frame2.sliceIndex; sliceIdx++) {
      const t = (sliceIdx - frame1.sliceIndex) / gap;
      const targetZ = sliceZCoordinates.get(sliceIdx) ?? frame1.contourPoints[0]?.[2] ?? 0;
      
      let interpolatedContour: Point3[];
      
      switch (method) {
        case 'shape-based':
          interpolatedContour = shapeBasedInterpolateContours(
            frame1.contourPoints,
            frame2.contourPoints,
            t,
            targetZ
          );
          break;
        case 'morphological':
          interpolatedContour = morphologicalInterpolateContours(
            frame1.contourPoints,
            frame2.contourPoints,
            t,
            targetZ,
            smoothingFactor
          );
          break;
        case 'linear':
        default:
          interpolatedContour = linearInterpolateContours(
            frame1.contourPoints,
            frame2.contourPoints,
            t,
            targetZ
          );
          break;
      }
      
      // Apply smoothing if needed
      if (smoothingFactor > 0 && method !== 'morphological') {
        interpolatedContour = smoothContour(interpolatedContour, smoothingFactor);
      }
      
      allAnnotations.push({
        sliceIndex: sliceIdx,
        contourPoints: interpolatedContour,
        isKeyFrame: false,
      });
      
      interpolatedCount++;
    }
    
    // Add the second key frame
    allAnnotations.push(frame2);
  }
  
  return {
    sliceAnnotations: allAnnotations,
    interpolatedCount,
    sliceRange: {
      start: keyFrames[0].sliceIndex,
      end: keyFrames[keyFrames.length - 1].sliceIndex,
    },
  };
}

/**
 * Convert canvas annotations to SliceAnnotation format
 */
export function canvasAnnotationsToSliceAnnotations(
  annotations: Map<number, Array<{ pointsWorld: Point3[]; completed?: boolean }>>,
): SliceAnnotation[] {
  const result: SliceAnnotation[] = [];
  
  annotations.forEach((anns, sliceIndex) => {
    for (const ann of anns) {
      if (ann.pointsWorld && ann.pointsWorld.length > 2) {
        result.push({
          sliceIndex,
          contourPoints: ann.pointsWorld,
          isKeyFrame: true, // User-drawn annotations are key frames
        });
      }
    }
  });
  
  return result;
}

/**
 * Calculate slice Z coordinates from viewport
 */
export function calculateSliceZCoordinates(
  totalSlices: number,
  sliceThickness: number,
  startZ: number
): Map<number, number> {
  const coords = new Map<number, number>();
  
  for (let i = 0; i < totalSlices; i++) {
    coords.set(i, startZ + i * sliceThickness);
  }
  
  return coords;
}
