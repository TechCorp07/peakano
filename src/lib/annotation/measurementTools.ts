/**
 * Measurement Tools
 * Area, volume, perimeter calculations and export functionality
 * 
 * @module annotation/measurementTools
 */

import type { BinaryMask } from './maskOperations';

/**
 * Measurement result with all calculated metrics
 */
export interface MeasurementResult {
  /** Area in pixels */
  areaPixels: number;
  /** Area in physical units (mm²) */
  areaMm2: number;
  /** Perimeter in pixels */
  perimeterPixels: number;
  /** Perimeter in physical units (mm) */
  perimeterMm: number;
  /** Centroid coordinates */
  centroid: { x: number; y: number };
  /** Bounding box */
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  /** Circularity (1 = perfect circle) */
  circularity: number;
  /** Aspect ratio (width/height) */
  aspectRatio: number;
  /** Solidity (area / convex hull area) */
  solidity: number;
  /** Mean intensity (if image data provided) */
  meanIntensity?: number;
  /** Standard deviation of intensity */
  stdIntensity?: number;
  /** Min intensity */
  minIntensity?: number;
  /** Max intensity */
  maxIntensity?: number;
}

/**
 * Volume result for 3D measurements
 */
export interface VolumeResult {
  /** Volume in voxels */
  volumeVoxels: number;
  /** Volume in physical units (mm³) */
  volumeMm3: number;
  /** Volume in mL (same as cm³) */
  volumeMl: number;
  /** Surface area in mm² */
  surfaceAreaMm2: number;
  /** Per-slice areas */
  sliceAreas: Array<{ sliceIndex: number; areaMm2: number }>;
  /** Number of slices with annotations */
  annotatedSlices: number;
}

/**
 * Pixel spacing for physical measurements
 */
export interface PixelSpacing {
  /** Pixel spacing in X direction (mm) */
  x: number;
  /** Pixel spacing in Y direction (mm) */
  y: number;
  /** Slice thickness (mm) - for 3D measurements */
  sliceThickness?: number;
  /** Spacing between slices (mm) - for 3D measurements */
  sliceSpacing?: number;
}

/**
 * Distance measurement
 */
export interface DistanceMeasurement {
  /** Start point */
  start: { x: number; y: number };
  /** End point */
  end: { x: number; y: number };
  /** Distance in pixels */
  distancePixels: number;
  /** Distance in mm */
  distanceMm: number;
}

/**
 * Angle measurement
 */
export interface AngleMeasurement {
  /** Vertex point */
  vertex: { x: number; y: number };
  /** First arm endpoint */
  point1: { x: number; y: number };
  /** Second arm endpoint */
  point2: { x: number; y: number };
  /** Angle in degrees */
  angleDegrees: number;
  /** Angle in radians */
  angleRadians: number;
}

/**
 * Calculate area of a mask
 * 
 * @param mask - Binary mask
 * @param pixelSpacing - Pixel spacing for physical units
 * @returns Area in pixels and mm²
 */
export function calculateArea(
  mask: BinaryMask,
  pixelSpacing?: PixelSpacing
): { areaPixels: number; areaMm2: number } {
  const { data, width, height } = mask;
  let areaPixels = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 1) {
      areaPixels++;
    }
  }
  
  const pixelAreaMm2 = pixelSpacing 
    ? pixelSpacing.x * pixelSpacing.y 
    : 1;
  
  return {
    areaPixels,
    areaMm2: areaPixels * pixelAreaMm2,
  };
}

/**
 * Calculate perimeter of a mask using 4-connectivity
 * 
 * @param mask - Binary mask
 * @param pixelSpacing - Pixel spacing for physical units
 * @returns Perimeter in pixels and mm
 */
export function calculatePerimeter(
  mask: BinaryMask,
  pixelSpacing?: PixelSpacing
): { perimeterPixels: number; perimeterMm: number } {
  const { data, width, height } = mask;
  let perimeterPixels = 0;
  
  const px = pixelSpacing?.x ?? 1;
  const py = pixelSpacing?.y ?? 1;
  let perimeterMm = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx] !== 1) continue;
      
      // Check each neighbor
      // Left
      if (x === 0 || data[idx - 1] === 0) {
        perimeterPixels++;
        perimeterMm += py;
      }
      // Right
      if (x === width - 1 || data[idx + 1] === 0) {
        perimeterPixels++;
        perimeterMm += py;
      }
      // Top
      if (y === 0 || data[idx - width] === 0) {
        perimeterPixels++;
        perimeterMm += px;
      }
      // Bottom
      if (y === height - 1 || data[idx + width] === 0) {
        perimeterPixels++;
        perimeterMm += px;
      }
    }
  }
  
  return { perimeterPixels, perimeterMm };
}

/**
 * Calculate centroid of a mask
 * 
 * @param mask - Binary mask
 * @returns Centroid coordinates
 */
export function calculateCentroid(mask: BinaryMask): { x: number; y: number } {
  const { data, width, height } = mask;
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 1) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }
  
  if (count === 0) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: sumX / count,
    y: sumY / count,
  };
}

/**
 * Calculate bounding box of a mask
 * 
 * @param mask - Binary mask
 * @returns Bounding box
 */
export function calculateBoundingBox(mask: BinaryMask): MeasurementResult['boundingBox'] {
  const { data, width, height } = mask;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasPixels = false;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 1) {
        hasPixels = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (!hasPixels) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Calculate all measurements for a mask
 * 
 * @param mask - Binary mask
 * @param pixelSpacing - Pixel spacing for physical units
 * @param imageData - Optional image data for intensity statistics
 * @returns Complete measurement result
 */
export function calculateMeasurements(
  mask: BinaryMask,
  pixelSpacing?: PixelSpacing,
  imageData?: Float32Array | Int16Array | Uint8Array | Uint16Array
): MeasurementResult {
  const { areaPixels, areaMm2 } = calculateArea(mask, pixelSpacing);
  const { perimeterPixels, perimeterMm } = calculatePerimeter(mask, pixelSpacing);
  const centroid = calculateCentroid(mask);
  const boundingBox = calculateBoundingBox(mask);
  
  // Calculate circularity: 4π × area / perimeter²
  const circularity = perimeterPixels > 0 
    ? (4 * Math.PI * areaPixels) / (perimeterPixels * perimeterPixels)
    : 0;
  
  // Aspect ratio
  const aspectRatio = boundingBox.height > 0 
    ? boundingBox.width / boundingBox.height 
    : 1;
  
  // Calculate convex hull area for solidity
  const convexHullArea = calculateConvexHullArea(mask);
  const solidity = convexHullArea > 0 ? areaPixels / convexHullArea : 1;
  
  const result: MeasurementResult = {
    areaPixels,
    areaMm2,
    perimeterPixels,
    perimeterMm,
    centroid,
    boundingBox,
    circularity,
    aspectRatio,
    solidity,
  };
  
  // Calculate intensity statistics if image data provided
  if (imageData) {
    const intensityStats = calculateIntensityStats(mask, imageData);
    result.meanIntensity = intensityStats.mean;
    result.stdIntensity = intensityStats.std;
    result.minIntensity = intensityStats.min;
    result.maxIntensity = intensityStats.max;
  }
  
  return result;
}

/**
 * Calculate convex hull area using Graham scan
 * 
 * @param mask - Binary mask
 * @returns Convex hull area in pixels
 */
function calculateConvexHullArea(mask: BinaryMask): number {
  const { data, width, height } = mask;
  const points: Array<{ x: number; y: number }> = [];
  
  // Collect boundary points
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx] === 1) {
        // Check if boundary point
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
            data[idx - 1] === 0 || data[idx + 1] === 0 ||
            data[idx - width] === 0 || data[idx + width] === 0) {
          points.push({ x, y });
        }
      }
    }
  }
  
  if (points.length < 3) {
    return points.length;
  }
  
  // Graham scan for convex hull
  const hull = grahamScan(points);
  
  // Calculate area using shoelace formula
  return polygonArea(hull);
}

/**
 * Graham scan algorithm for convex hull
 */
function grahamScan(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 3) return points;
  
  // Find lowest point (break ties by x)
  let lowest = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y < points[lowest].y ||
        (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
      lowest = i;
    }
  }
  
  // Swap lowest to first position
  [points[0], points[lowest]] = [points[lowest], points[0]];
  const pivot = points[0];
  
  // Sort by polar angle
  const sorted = points.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
    const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
    if (angleA !== angleB) return angleA - angleB;
    // Same angle - sort by distance
    const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
    const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
    return distA - distB;
  });
  
  const hull: Array<{ x: number; y: number }> = [pivot];
  
  for (const point of sorted) {
    while (hull.length > 1) {
      const top = hull[hull.length - 1];
      const second = hull[hull.length - 2];
      const cross = (top.x - second.x) * (point.y - second.y) -
                    (top.y - second.y) * (point.x - second.x);
      if (cross <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(point);
  }
  
  return hull;
}

/**
 * Calculate polygon area using shoelace formula
 */
function polygonArea(vertices: Array<{ x: number; y: number }>): number {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  const n = vertices.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate intensity statistics for masked region
 */
function calculateIntensityStats(
  mask: BinaryMask,
  imageData: Float32Array | Int16Array | Uint8Array | Uint16Array
): { mean: number; std: number; min: number; max: number } {
  const { data, width, height } = mask;
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 1 && i < imageData.length) {
      const intensity = imageData[i];
      sum += intensity;
      sumSq += intensity * intensity;
      count++;
      min = Math.min(min, intensity);
      max = Math.max(max, intensity);
    }
  }
  
  if (count === 0) {
    return { mean: 0, std: 0, min: 0, max: 0 };
  }
  
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  const std = Math.sqrt(Math.max(0, variance));
  
  return { mean, std, min, max };
}

/**
 * Calculate volume from multiple slice masks
 * 
 * @param masks - Array of masks, one per slice
 * @param pixelSpacing - Pixel spacing including slice thickness
 * @returns Volume result
 */
export function calculateVolume(
  masks: BinaryMask[],
  pixelSpacing: PixelSpacing
): VolumeResult {
  const sliceThickness = pixelSpacing.sliceThickness ?? 1;
  const sliceSpacing = pixelSpacing.sliceSpacing ?? sliceThickness;
  const pixelAreaMm2 = pixelSpacing.x * pixelSpacing.y;
  
  let volumeVoxels = 0;
  let surfaceAreaMm2 = 0;
  const sliceAreas: VolumeResult['sliceAreas'] = [];
  let annotatedSlices = 0;
  
  for (let i = 0; i < masks.length; i++) {
    const { areaPixels, areaMm2 } = calculateArea(masks[i], pixelSpacing);
    
    if (areaPixels > 0) {
      volumeVoxels += areaPixels;
      annotatedSlices++;
      sliceAreas.push({ sliceIndex: i, areaMm2 });
      
      // Calculate perimeter contribution to surface area
      const { perimeterMm } = calculatePerimeter(masks[i], pixelSpacing);
      surfaceAreaMm2 += perimeterMm * sliceSpacing;
      
      // Add top/bottom surface area
      surfaceAreaMm2 += areaMm2 * 2;
    }
  }
  
  const volumeMm3 = volumeVoxels * pixelAreaMm2 * sliceSpacing;
  const volumeMl = volumeMm3 / 1000; // 1 mL = 1 cm³ = 1000 mm³
  
  return {
    volumeVoxels,
    volumeMm3,
    volumeMl,
    surfaceAreaMm2,
    sliceAreas,
    annotatedSlices,
  };
}

/**
 * Calculate distance between two points
 * 
 * @param start - Start point
 * @param end - End point
 * @param pixelSpacing - Pixel spacing for physical units
 * @returns Distance measurement
 */
export function calculateDistance(
  start: { x: number; y: number },
  end: { x: number; y: number },
  pixelSpacing?: PixelSpacing
): DistanceMeasurement {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distancePixels = Math.sqrt(dx * dx + dy * dy);
  
  let distanceMm = distancePixels;
  if (pixelSpacing) {
    const dxMm = dx * pixelSpacing.x;
    const dyMm = dy * pixelSpacing.y;
    distanceMm = Math.sqrt(dxMm * dxMm + dyMm * dyMm);
  }
  
  return {
    start,
    end,
    distancePixels,
    distanceMm,
  };
}

/**
 * Calculate angle between three points
 * 
 * @param vertex - Vertex point (center of angle)
 * @param point1 - First arm endpoint
 * @param point2 - Second arm endpoint
 * @returns Angle measurement
 */
export function calculateAngle(
  vertex: { x: number; y: number },
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): AngleMeasurement {
  const v1x = point1.x - vertex.x;
  const v1y = point1.y - vertex.y;
  const v2x = point2.x - vertex.x;
  const v2y = point2.y - vertex.y;
  
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  let angleRadians = 0;
  if (mag1 > 0 && mag2 > 0) {
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    angleRadians = Math.acos(cosAngle);
  }
  
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  return {
    vertex,
    point1,
    point2,
    angleDegrees,
    angleRadians,
  };
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'tsv';

/**
 * Measurement export entry
 */
export interface MeasurementExportEntry {
  /** Measurement ID */
  id: string;
  /** Measurement type */
  type: 'area' | 'volume' | 'distance' | 'angle' | 'region';
  /** Associated series/image ID */
  imageId?: string;
  /** Slice index (for 2D measurements) */
  sliceIndex?: number;
  /** Label name */
  label?: string;
  /** Measurement values */
  values: Record<string, number | string>;
  /** Timestamp */
  timestamp: number;
}

/**
 * Export measurements to various formats
 * 
 * @param measurements - Array of measurements to export
 * @param format - Export format
 * @returns Formatted string
 */
export function exportMeasurements(
  measurements: MeasurementExportEntry[],
  format: ExportFormat = 'json'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(measurements, null, 2);
    
    case 'csv':
    case 'tsv': {
      const separator = format === 'csv' ? ',' : '\t';
      
      // Collect all unique value keys
      const allKeys = new Set<string>();
      for (const m of measurements) {
        Object.keys(m.values).forEach(key => allKeys.add(key));
      }
      
      // Build header
      const headers = ['id', 'type', 'imageId', 'sliceIndex', 'label', ...allKeys, 'timestamp'];
      const rows: string[] = [headers.join(separator)];
      
      // Build rows
      for (const m of measurements) {
        const row = [
          m.id,
          m.type,
          m.imageId ?? '',
          m.sliceIndex?.toString() ?? '',
          m.label ?? '',
          ...Array.from(allKeys).map(key => m.values[key]?.toString() ?? ''),
          m.timestamp.toString(),
        ];
        rows.push(row.map(v => `"${v.replace(/"/g, '""')}"`).join(separator));
      }
      
      return rows.join('\n');
    }
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Create a download link for measurement export
 * 
 * @param measurements - Measurements to export
 * @param format - Export format
 * @param filename - Filename without extension
 * @returns Data URL for download
 */
export function createMeasurementDownload(
  measurements: MeasurementExportEntry[],
  format: ExportFormat,
  filename: string
): { url: string; filename: string } {
  const content = exportMeasurements(measurements, format);
  const mimeType = format === 'json' ? 'application/json' :
                   format === 'csv' ? 'text/csv' :
                   'text/tab-separated-values';
  const extension = format === 'json' ? '.json' :
                    format === 'csv' ? '.csv' : '.tsv';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    filename: `${filename}${extension}`,
  };
}

/**
 * Format measurement value with units
 * 
 * @param value - Numeric value
 * @param unit - Unit string
 * @param precision - Decimal precision
 * @returns Formatted string
 */
export function formatMeasurement(
  value: number,
  unit: string,
  precision: number = 2
): string {
  return `${value.toFixed(precision)} ${unit}`;
}

/**
 * Format area with automatic unit selection
 * 
 * @param areaMm2 - Area in mm²
 * @returns Formatted string with appropriate units
 */
export function formatArea(areaMm2: number): string {
  if (areaMm2 >= 100) {
    return formatMeasurement(areaMm2 / 100, 'cm²');
  }
  return formatMeasurement(areaMm2, 'mm²');
}

/**
 * Format volume with automatic unit selection
 * 
 * @param volumeMm3 - Volume in mm³
 * @returns Formatted string with appropriate units
 */
export function formatVolume(volumeMm3: number): string {
  if (volumeMm3 >= 1000) {
    return formatMeasurement(volumeMm3 / 1000, 'mL');
  }
  return formatMeasurement(volumeMm3, 'mm³');
}
