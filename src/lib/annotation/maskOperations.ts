/**
 * Mask Operations Library
 * Boolean operations for annotation masks: Union, Subtract, Intersect, XOR
 * 
 * @module annotation/maskOperations
 */

/**
 * Represents a binary mask with dimensions
 */
export interface BinaryMask {
  /** The mask data (1 = selected, 0 = not selected) */
  data: Uint8Array;
  /** Width of the mask */
  width: number;
  /** Height of the mask */
  height: number;
}

/**
 * Result of a mask operation
 */
export interface MaskOperationResult extends BinaryMask {
  /** Number of pixels in the result */
  pixelCount: number;
  /** Bounding box of the result */
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

/**
 * Validate that two masks have the same dimensions
 */
function validateMaskDimensions(mask1: BinaryMask, mask2: BinaryMask): void {
  if (mask1.width !== mask2.width || mask1.height !== mask2.height) {
    throw new Error(
      `Mask dimensions do not match: ${mask1.width}x${mask1.height} vs ${mask2.width}x${mask2.height}`
    );
  }
}

/**
 * Calculate bounds and pixel count for a mask
 */
function calculateMaskStats(mask: BinaryMask): { pixelCount: number; bounds: MaskOperationResult['bounds'] } {
  const { data, width, height } = mask;
  let pixelCount = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx] === 1) {
        pixelCount++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Handle empty mask
  if (pixelCount === 0) {
    return {
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    };
  }

  return {
    pixelCount,
    bounds: { minX, minY, maxX, maxY }
  };
}

/**
 * Union (OR) of two masks
 * Combines all selected pixels from both masks
 * 
 * @param mask1 - First mask
 * @param mask2 - Second mask
 * @returns Combined mask with union of both
 */
export function maskUnion(mask1: BinaryMask, mask2: BinaryMask): MaskOperationResult {
  validateMaskDimensions(mask1, mask2);
  
  const { width, height } = mask1;
  const result = new Uint8Array(width * height);
  
  for (let i = 0; i < result.length; i++) {
    result[i] = (mask1.data[i] === 1 || mask2.data[i] === 1) ? 1 : 0;
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Subtract mask2 from mask1
 * Removes pixels in mask2 from mask1
 * 
 * @param mask1 - Base mask
 * @param mask2 - Mask to subtract
 * @returns mask1 with mask2 pixels removed
 */
export function maskSubtract(mask1: BinaryMask, mask2: BinaryMask): MaskOperationResult {
  validateMaskDimensions(mask1, mask2);
  
  const { width, height } = mask1;
  const result = new Uint8Array(width * height);
  
  for (let i = 0; i < result.length; i++) {
    result[i] = (mask1.data[i] === 1 && mask2.data[i] === 0) ? 1 : 0;
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Intersection (AND) of two masks
 * Keeps only pixels that are in both masks
 * 
 * @param mask1 - First mask
 * @param mask2 - Second mask
 * @returns Mask with only overlapping pixels
 */
export function maskIntersect(mask1: BinaryMask, mask2: BinaryMask): MaskOperationResult {
  validateMaskDimensions(mask1, mask2);
  
  const { width, height } = mask1;
  const result = new Uint8Array(width * height);
  
  for (let i = 0; i < result.length; i++) {
    result[i] = (mask1.data[i] === 1 && mask2.data[i] === 1) ? 1 : 0;
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * XOR of two masks
 * Keeps pixels that are in one mask but not both
 * 
 * @param mask1 - First mask
 * @param mask2 - Second mask
 * @returns Mask with non-overlapping pixels
 */
export function maskXor(mask1: BinaryMask, mask2: BinaryMask): MaskOperationResult {
  validateMaskDimensions(mask1, mask2);
  
  const { width, height } = mask1;
  const result = new Uint8Array(width * height);
  
  for (let i = 0; i < result.length; i++) {
    const a = mask1.data[i] === 1;
    const b = mask2.data[i] === 1;
    result[i] = (a !== b) ? 1 : 0;
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Invert a mask
 * Flips selected and unselected pixels
 * 
 * @param mask - Mask to invert
 * @returns Inverted mask
 */
export function maskInvert(mask: BinaryMask): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(width * height);
  
  for (let i = 0; i < result.length; i++) {
    result[i] = data[i] === 1 ? 0 : 1;
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Dilate a mask (expand selected regions)
 * 
 * @param mask - Mask to dilate
 * @param radius - Dilation radius in pixels
 * @returns Dilated mask
 */
export function maskDilate(mask: BinaryMask, radius: number = 1): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(width * height);
  
  // Create circular structuring element
  const structureSize = radius * 2 + 1;
  const structure: boolean[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      structure.push(dx * dx + dy * dy <= radius * radius);
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let anySet = false;
      
      // Check if any pixel in the structuring element is set
      for (let dy = -radius; dy <= radius && !anySet; dy++) {
        for (let dx = -radius; dx <= radius && !anySet; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const structIdx = (dy + radius) * structureSize + (dx + radius);
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && structure[structIdx]) {
            if (data[ny * width + nx] === 1) {
              anySet = true;
            }
          }
        }
      }
      
      result[idx] = anySet ? 1 : 0;
    }
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Erode a mask (shrink selected regions)
 * 
 * @param mask - Mask to erode
 * @param radius - Erosion radius in pixels
 * @returns Eroded mask
 */
export function maskErode(mask: BinaryMask, radius: number = 1): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(width * height);
  
  // Create circular structuring element
  const structureSize = radius * 2 + 1;
  const structure: boolean[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      structure.push(dx * dx + dy * dy <= radius * radius);
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let allSet = true;
      
      // Check if all pixels in the structuring element are set
      for (let dy = -radius; dy <= radius && allSet; dy++) {
        for (let dx = -radius; dx <= radius && allSet; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const structIdx = (dy + radius) * structureSize + (dx + radius);
          
          if (structure[structIdx]) {
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || data[ny * width + nx] === 0) {
              allSet = false;
            }
          }
        }
      }
      
      result[idx] = allSet ? 1 : 0;
    }
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Morphological opening (erode then dilate)
 * Removes small protrusions and fills small holes
 * 
 * @param mask - Mask to process
 * @param radius - Operation radius
 * @returns Opened mask
 */
export function maskOpen(mask: BinaryMask, radius: number = 1): MaskOperationResult {
  const eroded = maskErode(mask, radius);
  return maskDilate(eroded, radius);
}

/**
 * Morphological closing (dilate then erode)
 * Fills small holes and connects nearby regions
 * 
 * @param mask - Mask to process
 * @param radius - Operation radius
 * @returns Closed mask
 */
export function maskClose(mask: BinaryMask, radius: number = 1): MaskOperationResult {
  const dilated = maskDilate(mask, radius);
  return maskErode(dilated, radius);
}

/**
 * Fill holes in a mask using flood fill from edges
 * 
 * @param mask - Mask with potential holes
 * @returns Mask with holes filled
 */
export function maskFillHoles(mask: BinaryMask): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(data);
  const visited = new Uint8Array(width * height);
  
  // Flood fill from all edge pixels that are 0
  const stack: number[] = [];
  
  // Add all edge pixels that are 0
  for (let x = 0; x < width; x++) {
    if (data[x] === 0) stack.push(x);
    if (data[(height - 1) * width + x] === 0) stack.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    if (data[y * width] === 0) stack.push(y * width);
    if (data[y * width + width - 1] === 0) stack.push(y * width + width - 1);
  }
  
  // Mark all background pixels reachable from edges
  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (visited[idx]) continue;
    visited[idx] = 1;
    
    const x = idx % width;
    const y = Math.floor(idx / width);
    
    // Check 4-connected neighbors
    const neighbors = [
      idx - 1, idx + 1, idx - width, idx + width
    ];
    
    for (const neighbor of neighbors) {
      const nx = neighbor % width;
      const ny = Math.floor(neighbor / width);
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          !visited[neighbor] && data[neighbor] === 0) {
        stack.push(neighbor);
      }
    }
  }
  
  // Fill all unvisited 0 pixels (these are holes)
  for (let i = 0; i < result.length; i++) {
    if (result[i] === 0 && !visited[i]) {
      result[i] = 1;
    }
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Extract the boundary/contour of a mask
 * 
 * @param mask - Input mask
 * @param innerBoundary - If true, boundary is inside the mask; if false, outside
 * @returns Mask containing only boundary pixels
 */
export function maskBoundary(mask: BinaryMask, innerBoundary: boolean = true): MaskOperationResult {
  const { data, width, height } = mask;
  const result = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (innerBoundary) {
        // Inner boundary: mask pixel with at least one non-mask neighbor
        if (data[idx] === 1) {
          const hasNonMaskNeighbor =
            (x > 0 && data[idx - 1] === 0) ||
            (x < width - 1 && data[idx + 1] === 0) ||
            (y > 0 && data[idx - width] === 0) ||
            (y < height - 1 && data[idx + width] === 0);
          
          result[idx] = hasNonMaskNeighbor ? 1 : 0;
        }
      } else {
        // Outer boundary: non-mask pixel with at least one mask neighbor
        if (data[idx] === 0) {
          const hasMaskNeighbor =
            (x > 0 && data[idx - 1] === 1) ||
            (x < width - 1 && data[idx + 1] === 1) ||
            (y > 0 && data[idx - width] === 1) ||
            (y < height - 1 && data[idx + width] === 1);
          
          result[idx] = hasMaskNeighbor ? 1 : 0;
        }
      }
    }
  }
  
  const stats = calculateMaskStats({ data: result, width, height });
  
  return {
    data: result,
    width,
    height,
    ...stats
  };
}

/**
 * Apply multiple masks with a union operation
 * 
 * @param masks - Array of masks to combine
 * @returns Combined mask
 */
export function maskUnionMultiple(masks: BinaryMask[]): MaskOperationResult {
  if (masks.length === 0) {
    throw new Error('At least one mask is required');
  }
  
  if (masks.length === 1) {
    const stats = calculateMaskStats(masks[0]);
    return { ...masks[0], ...stats };
  }
  
  let result = masks[0];
  for (let i = 1; i < masks.length; i++) {
    result = maskUnion(result, masks[i]);
  }
  
  return result as MaskOperationResult;
}

/**
 * Create an empty mask
 * 
 * @param width - Mask width
 * @param height - Mask height
 * @returns Empty mask
 */
export function createEmptyMask(width: number, height: number): BinaryMask {
  return {
    data: new Uint8Array(width * height),
    width,
    height
  };
}

/**
 * Create a mask from polygon vertices
 * Uses scanline fill algorithm
 * 
 * @param width - Image width
 * @param height - Image height
 * @param vertices - Polygon vertices as [x, y] pairs
 * @returns Filled polygon mask
 */
export function createMaskFromPolygon(
  width: number,
  height: number,
  vertices: [number, number][]
): MaskOperationResult {
  const data = new Uint8Array(width * height);
  
  if (vertices.length < 3) {
    return {
      data,
      width,
      height,
      pixelCount: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    };
  }
  
  // Find bounding box
  let minY = height, maxY = 0;
  for (const [, y] of vertices) {
    minY = Math.min(minY, Math.floor(y));
    maxY = Math.max(maxY, Math.ceil(y));
  }
  
  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);
  
  // Scanline fill
  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];
    
    // Find intersections with polygon edges
    for (let i = 0; i < vertices.length; i++) {
      const [x1, y1] = vertices[i];
      const [x2, y2] = vertices[(i + 1) % vertices.length];
      
      // Check if edge crosses this scanline
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        // Calculate x intersection
        const t = (y - y1) / (y2 - y1);
        const x = x1 + t * (x2 - x1);
        intersections.push(x);
      }
    }
    
    // Sort intersections
    intersections.sort((a, b) => a - b);
    
    // Fill between pairs of intersections
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const xStart = Math.max(0, Math.ceil(intersections[i]));
      const xEnd = Math.min(width - 1, Math.floor(intersections[i + 1]));
      
      for (let x = xStart; x <= xEnd; x++) {
        data[y * width + x] = 1;
      }
    }
  }
  
  const stats = calculateMaskStats({ data, width, height });
  
  return {
    data,
    width,
    height,
    ...stats
  };
}

/**
 * Convert mask to contour points
 * Uses marching squares algorithm for smooth contours
 * 
 * @param mask - Input mask
 * @returns Array of contour point arrays (one per connected region)
 */
export function maskToContours(mask: BinaryMask): [number, number][][] {
  const { data, width, height } = mask;
  const visited = new Uint8Array(width * height);
  const contours: [number, number][][] = [];
  
  // Find edge pixels and trace contours
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (data[idx] === 1 && !visited[idx]) {
        // Check if this is an edge pixel
        const isEdge =
          x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
          data[idx - 1] === 0 || data[idx + 1] === 0 ||
          data[idx - width] === 0 || data[idx + width] === 0;
        
        if (isEdge) {
          const contour = traceContour(data, width, height, x, y, visited);
          if (contour.length >= 3) {
            contours.push(contour);
          }
        }
      }
    }
  }
  
  return contours;
}

/**
 * Trace a single contour starting from a point
 */
function traceContour(
  data: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: Uint8Array
): [number, number][] {
  const contour: [number, number][] = [];
  
  // Direction vectors for 8-connectivity (clockwise from right)
  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];
  
  let x = startX;
  let y = startY;
  let dir = 0; // Start looking right
  
  const maxIterations = width * height;
  let iterations = 0;
  
  do {
    const idx = y * width + x;
    
    if (!visited[idx]) {
      // Check if this is an edge pixel
      const isEdge =
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        data[idx - 1] === 0 || data[idx + 1] === 0 ||
        data[idx - width] === 0 || data[idx + width] === 0;
      
      if (isEdge) {
        contour.push([x, y]);
        visited[idx] = 1;
      }
    }
    
    // Find next edge pixel by rotating search direction
    let found = false;
    const startDir = (dir + 5) % 8; // Start 135 degrees back
    
    for (let i = 0; i < 8 && !found; i++) {
      const checkDir = (startDir + i) % 8;
      const nx = x + dx[checkDir];
      const ny = y + dy[checkDir];
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (data[nidx] === 1) {
          x = nx;
          y = ny;
          dir = checkDir;
          found = true;
        }
      }
    }
    
    if (!found) break;
    
    iterations++;
  } while ((x !== startX || y !== startY) && iterations < maxIterations);
  
  return contour;
}
