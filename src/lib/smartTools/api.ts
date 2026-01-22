/**
 * Smart Tools AI API Client
 * Handles communication with AI backend for enhanced smart tools
 */

// Base URL for AI service
const AI_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8006';

/**
 * Smart tool result from AI backend
 */
export interface SmartToolResult {
  success: boolean;
  tool_type: 'magic-wand' | 'region-growing' | 'interpolation';
  contour?: [number, number][];
  mask_rle?: string;
  mask_shape?: [number, number];
  confidence?: number;
  processing_time_ms?: number;
  error_message?: string;
}

/**
 * Interpolation result from AI backend
 */
export interface InterpolationResult {
  success: boolean;
  slices_generated: number;
  contours: Record<number, [number, number][]>;
  confidence_scores?: Record<number, number>;
  processing_time_ms?: number;
  error_message?: string;
}

/**
 * Magic Wand request parameters
 */
export interface MagicWandRequest {
  studyUid: string;
  seriesUid: string;
  instanceUid: string;
  seedX: number;
  seedY: number;
  sliceIndex?: number;
  tolerance?: number;
  useEdges?: boolean;
  smoothResult?: boolean;
}

/**
 * Region Growing request parameters
 */
export interface RegionGrowingRequest {
  studyUid: string;
  seriesUid: string;
  instanceUid: string;
  seeds: { x: number; y: number }[];
  sliceIndex?: number;
  intensityRange?: [number, number];
  useGradient?: boolean;
  maxIterations?: number;
  useAiBoundaries?: boolean;
}

/**
 * Interpolation request parameters
 */
export interface InterpolationRequest {
  studyUid: string;
  seriesUid: string;
  annotationId: string;
  startSlice: number;
  endSlice: number;
  method?: 'linear' | 'shape-based' | 'ai';
  useContext?: boolean;
}

/**
 * Helper to make API requests
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  
  const response = await fetch(`${AI_SERVICE_BASE_URL}${fullEndpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if AI smart tools service is available
 */
export async function checkSmartToolsAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_BASE_URL}/api/v1/smart/`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Request AI-enhanced Magic Wand selection
 */
export async function requestAIMagicWand(
  request: MagicWandRequest
): Promise<SmartToolResult> {
  return apiRequest<SmartToolResult>('/v1/smart/magic-wand', {
    method: 'POST',
    body: JSON.stringify({
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      instance_uid: request.instanceUid,
      seed_x: Math.round(request.seedX),
      seed_y: Math.round(request.seedY),
      slice_index: request.sliceIndex ?? 0,
      tolerance: request.tolerance ?? 32,
      use_edges: request.useEdges ?? true,
      smooth_result: request.smoothResult ?? true,
    }),
  });
}

/**
 * Request AI-enhanced Region Growing
 */
export async function requestAIRegionGrowing(
  request: RegionGrowingRequest
): Promise<SmartToolResult> {
  return apiRequest<SmartToolResult>('/v1/smart/region-growing', {
    method: 'POST',
    body: JSON.stringify({
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      instance_uid: request.instanceUid,
      seeds: request.seeds.map(s => ({ x: Math.round(s.x), y: Math.round(s.y) })),
      slice_index: request.sliceIndex ?? 0,
      intensity_range: request.intensityRange,
      use_gradient: request.useGradient ?? true,
      max_iterations: request.maxIterations ?? 1000,
      use_ai_boundaries: request.useAiBoundaries ?? true,
    }),
  });
}

/**
 * Request AI-enhanced Interpolation
 */
export async function requestAIInterpolation(
  request: InterpolationRequest
): Promise<InterpolationResult> {
  return apiRequest<InterpolationResult>('/v1/smart/interpolation', {
    method: 'POST',
    body: JSON.stringify({
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      annotation_id: request.annotationId,
      start_slice: request.startSlice,
      end_slice: request.endSlice,
      method: request.method ?? 'ai',
      use_context: request.useContext ?? true,
    }),
  });
}

/**
 * Get list of available AI smart tools
 */
export async function getAvailableSmartTools(): Promise<{
  tools: { name: string; display_name: string; description: string; endpoint: string }[];
}> {
  try {
    return await apiRequest('/v1/smart/', { method: 'GET' });
  } catch {
    // Return empty list if AI service is unavailable
    return { tools: [] };
  }
}

/**
 * Decode RLE mask to binary array
 */
export function decodeRLE(rle: string, shape: [number, number]): Uint8Array {
  const [height, width] = shape;
  const mask = new Uint8Array(height * width);
  
  if (!rle) return mask;
  
  const runs = rle.split(' ').map(Number);
  let idx = 0;
  let value = 0;
  
  for (let i = 0; i < runs.length; i++) {
    const count = runs[i];
    if (value === 1) {
      for (let j = 0; j < count && idx + j < mask.length; j++) {
        mask[idx + j] = 1;
      }
    }
    idx += count;
    value = 1 - value;
  }
  
  return mask;
}
