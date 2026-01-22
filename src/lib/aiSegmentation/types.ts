/**
 * AI Segmentation Types
 * Types for MedSAM/SAM interactive segmentation
 */

// Prompt types matching backend schema
export type PromptType = 'point' | 'box';

// AI model options
export type AISegmentationModel = 'medsam2' | 'sam' | 'nnunet';

// Output format options
export type OutputFormat = 'rle' | 'mask' | 'dicom_seg';

/**
 * Point prompt - positive (foreground) or negative (background) point
 */
export interface PointPrompt {
  type: 'point';
  x: number;
  y: number;
  label: 0 | 1; // 1 = foreground, 0 = background
  sliceIndex?: number;
}

/**
 * Box prompt - bounding box for region of interest
 */
export interface BoxPrompt {
  type: 'box';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sliceIndex?: number;
}

/**
 * Union type for all prompt types
 */
export type Prompt = PointPrompt | BoxPrompt;

/**
 * Request for interactive segmentation
 */
export interface InteractiveSegmentRequest {
  studyUid: string;
  seriesUid: string;
  instanceUid?: string;
  model: AISegmentationModel;
  prompts: Prompt[];
  outputFormat?: OutputFormat;
  saveToAnnotation?: boolean;
  annotationLabel?: string;
}

/**
 * Request for auto segmentation
 */
export interface AutoSegmentRequest {
  studyUid: string;
  seriesUid: string;
  model: AISegmentationModel;
  outputFormat?: OutputFormat;
  saveToAnnotation?: boolean;
  annotationLabel?: string;
}

/**
 * Job status from backend
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Inference job response
 */
export interface InferenceJobResponse {
  id: string;
  modelId: string;
  modelName: string;
  studyUid: string;
  seriesUid?: string;
  instanceUid?: string;
  status: JobStatus;
  priority: number;
  outputPath?: string;
  outputFormat?: string;
  annotationId?: string;
  executionTimeSeconds?: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Segmentation result mask
 */
export interface SegmentationMask {
  width: number;
  height: number;
  sliceIndex?: number;
  rle?: number[]; // Run-length encoded mask
  mask?: Uint8Array; // Raw mask data
  contour?: [number, number][]; // Direct contour points from AI
  confidence?: number;
}

/**
 * State for drawing prompts
 */
export interface DrawingState {
  isDrawingBox: boolean;
  boxStart: { x: number; y: number } | null;
  currentBox: BoxPrompt | null;
  pointMode: 'foreground' | 'background';
}

/**
 * AI Segmentation tool state
 */
export interface AISegmentationState {
  // Tool activation
  isActive: boolean;
  
  // Model selection
  selectedModel: AISegmentationModel;
  
  // Current prompts
  prompts: Prompt[];
  
  // Drawing state
  drawingState: DrawingState;
  
  // Processing state
  isProcessing: boolean;
  currentJobId: string | null;
  jobStatus: JobStatus | null;
  
  // Results
  resultMask: SegmentationMask | null;
  
  // Error state
  error: string | null;
}
