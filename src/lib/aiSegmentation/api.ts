/**
 * AI Segmentation API Client
 * Handles communication with AI backend for segmentation
 */

import type {
  InteractiveSegmentRequest,
  AutoSegmentRequest,
  InferenceJobResponse,
  Prompt,
  SegmentationMask,
} from './types';

// Base URL for AI service - uses localhost:8006 for local development
// Set NEXT_PUBLIC_AI_SERVICE_URL in .env for production
const AI_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8006';

/**
 * Check if AI service is available
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_BASE_URL}/api/v1/health/`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Helper to make API requests with better error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  try {
    // Ensure endpoint starts with /api for backend compatibility
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
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to AI service at ${AI_SERVICE_BASE_URL}. ` +
        `Make sure the AI backend is running (docker-compose up -d in peakano folder).`
      );
    }
    throw err;
  }
}

/**
 * Convert frontend prompt format to backend format
 */
function convertPromptsToBackend(prompts: Prompt[]): object[] {
  return prompts.map((prompt) => {
    if (prompt.type === 'point') {
      return {
        type: 'point',
        x: Math.round(prompt.x),
        y: Math.round(prompt.y),
        label: prompt.label,
        slice_index: prompt.sliceIndex,
      };
    } else {
      return {
        type: 'box',
        x1: Math.round(prompt.x1),
        y1: Math.round(prompt.y1),
        x2: Math.round(prompt.x2),
        y2: Math.round(prompt.y2),
        slice_index: prompt.sliceIndex,
      };
    }
  });
}

/**
 * Request interactive segmentation with user prompts
 */
export async function requestInteractiveSegmentation(
  request: InteractiveSegmentRequest
): Promise<InferenceJobResponse> {
  return apiRequest<InferenceJobResponse>('/v1/inference/segment/interactive', {
    method: 'POST',
    body: JSON.stringify({
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      instance_uid: request.instanceUid,
      model: request.model,
      prompts: convertPromptsToBackend(request.prompts),
      output_format: request.outputFormat || 'rle',
      save_to_annotation: request.saveToAnnotation ?? true,
      annotation_label: request.annotationLabel || 'AI Assisted',
    }),
  });
}

/**
 * Request automatic segmentation
 */
export async function requestAutoSegmentation(
  request: AutoSegmentRequest
): Promise<InferenceJobResponse> {
  return apiRequest<InferenceJobResponse>('/v1/inference/segment/auto', {
    method: 'POST',
    body: JSON.stringify({
      study_uid: request.studyUid,
      series_uid: request.seriesUid,
      model: request.model,
      output_format: request.outputFormat || 'rle',
      save_to_annotation: request.saveToAnnotation ?? true,
      annotation_label: request.annotationLabel || 'AI Generated',
    }),
  });
}

/**
 * Poll for job status
 */
export async function getJobStatus(jobId: string): Promise<InferenceJobResponse> {
  return apiRequest<InferenceJobResponse>(`/v1/inference/jobs/${jobId}`, {
    method: 'GET',
  });
}

/**
 * Get segmentation result mask
 */
export async function getSegmentationResult(jobId: string): Promise<SegmentationMask> {
  const result = await apiRequest<{
    job_id: string;
    status: string;
    contour?: [number, number][];
    mask_rle?: string;
    mask_shape?: [number, number];
    confidence?: number;
  }>(`/v1/inference/jobs/${jobId}/result`, {
    method: 'GET',
  });
  
  // Convert backend response to frontend format
  return {
    width: result.mask_shape?.[1] ?? 512,
    height: result.mask_shape?.[0] ?? 512,
    contour: result.contour,
    confidence: result.confidence,
    rle: result.mask_rle ? result.mask_rle.split(' ').map(Number) : undefined,
  };
}

/**
 * Cancel an in-progress job
 */
export async function cancelJob(jobId: string): Promise<void> {
  await apiRequest<void>(`/v1/inference/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
}

/**
 * Get available AI models
 */
export async function getAvailableModels(): Promise<{ name: string; displayName: string; type: string }[]> {
  try {
    return await apiRequest<{ models: { name: string; displayName: string; type: string }[] }>(
      '/v1/models',
      { method: 'GET' }
    ).then(data => data.models || []);
  } catch {
    // Return default models if endpoint fails or AI service is not available
    return [
      { name: 'medsam2', displayName: 'MedSAM 2', type: 'interactive' },
      { name: 'sam', displayName: 'SAM', type: 'interactive' },
      { name: 'nnunet', displayName: 'nnU-Net', type: 'segmentation' },
    ];
  }
}

/**
 * Decode RLE mask to binary array
 */
export function decodeRLEMask(
  rle: number[],
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  let pos = 0;
  let value = 0; // Start with 0 (background)
  
  for (const count of rle) {
    for (let i = 0; i < count; i++) {
      if (pos < mask.length) {
        mask[pos++] = value;
      }
    }
    value = value === 0 ? 1 : 0; // Toggle between 0 and 1
  }
  
  return mask;
}

/**
 * Convert mask to contour points
 */
export function maskToContour(
  mask: Uint8Array,
  width: number,
  height: number
): { x: number; y: number }[] {
  const contour: { x: number; y: number }[] = [];
  
  // Simple edge detection - find pixels on the boundary
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 0) continue;
      
      // Check if this is a boundary pixel
      const isEdge =
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        mask[idx - 1] === 0 || // left
        mask[idx + 1] === 0 || // right
        mask[idx - width] === 0 || // top
        mask[idx + width] === 0; // bottom
      
      if (isEdge) {
        contour.push({ x, y });
      }
    }
  }
  
  return contour;
}
