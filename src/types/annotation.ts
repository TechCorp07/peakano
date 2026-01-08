/**
 * Annotation Type Definitions
 * Types for medical image annotations and labeling
 */

/**
 * Annotation tool types
 */
export type AnnotationToolType =
  | 'length'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'freehand'
  | 'angle'
  | 'probe'
  | 'bidirectional'
  | 'circleROI'
  | 'arrowAnnotate';

/**
 * Segmentation tool types
 */
export type SegmentationToolType =
  | 'brush'
  | 'eraser'
  | 'scissors'
  | 'threshold'
  | 'regionGrowing';

/**
 * All tool types combined
 */
export type AllToolType = AnnotationToolType | SegmentationToolType;

/**
 * Point coordinate in 2D space
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Point coordinate in 3D space
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Annotation handle (control point)
 */
export interface AnnotationHandle {
  x: number;
  y: number;
  z?: number;
  active?: boolean;
  highlight?: boolean;
}

/**
 * Text box position for annotation labels
 */
export interface TextBox {
  x: number;
  y: number;
  worldPosition?: Point3D;
  hasMoved?: boolean;
}

/**
 * Cached statistics for annotations (measurements)
 */
export interface AnnotationStats {
  length?: number;
  area?: number;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  angle?: number;
  unit?: string;
}

/**
 * Annotation data structure
 */
export interface AnnotationData {
  handles: {
    points: AnnotationHandle[];
    activeHandleIndex?: number;
    textBox?: TextBox;
  };
  cachedStats?: AnnotationStats;
  label?: string;
  isLocked?: boolean;
  isVisible?: boolean;
}

/**
 * Core annotation interface
 */
export interface Annotation {
  id: string;
  type: AnnotationToolType;
  data: AnnotationData;

  // Reference information
  sopInstanceUID: string;
  seriesInstanceUID: string;
  studyInstanceUID: string;
  frameOfReferenceUID?: string;

  // Image position
  imageIndex: number;
  sliceLocation?: number;

  // Label association
  labelId?: string;
  labelName?: string;
  labelColor?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Cornerstone internal reference
  cornerstoneAnnotationUID?: string;
}

/**
 * Label for annotation categorization
 */
export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  shortcut?: string;
  category?: string;
  isDefault?: boolean;
}

/**
 * Segmentation mask data
 */
export interface SegmentationMask {
  id: string;
  labelId: string;
  seriesInstanceUID: string;

  // Mask data (run-length encoded or raw)
  data: Uint8Array | number[];
  encoding: 'raw' | 'rle';

  // Dimensions
  width: number;
  height: number;
  sliceIndex: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Annotation session for grouping annotations
 */
export interface AnnotationSession {
  id: string;
  studyInstanceUID: string;
  seriesInstanceUID?: string;

  // User info
  userId: string;
  userName?: string;

  // Session data
  annotations: Annotation[];
  segmentations: SegmentationMask[];
  labels: Label[];

  // Status
  status: 'in_progress' | 'completed' | 'submitted' | 'reviewed';

  // Timestamps
  startedAt: string;
  lastSavedAt?: string;
  completedAt?: string;

  // Review info
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  score?: number;
}

/**
 * Annotation history entry for undo/redo
 */
export interface AnnotationHistoryEntry {
  timestamp: number;
  action: 'add' | 'update' | 'delete' | 'clear';
  annotationId?: string;
  previousState?: Annotation;
  newState?: Annotation;
}

/**
 * Annotation store state
 */
export interface AnnotationState {
  // Current annotations
  annotations: Annotation[];

  // Active annotation being edited
  activeAnnotationId: string | null;

  // Tool settings
  activeTool: AllToolType | null;
  brushSize: number;
  brushOpacity: number;

  // Label settings
  labels: Label[];
  selectedLabelId: string | null;

  // History for undo/redo
  history: AnnotationHistoryEntry[];
  historyIndex: number;

  // Session info
  sessionId: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;

  // Loading states
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial annotation state
 */
export const initialAnnotationState: AnnotationState = {
  annotations: [],
  activeAnnotationId: null,
  activeTool: null,
  brushSize: 10,
  brushOpacity: 1,
  labels: [],
  selectedLabelId: null,
  history: [],
  historyIndex: -1,
  sessionId: null,
  isDirty: false,
  lastSavedAt: null,
  isSaving: false,
  isLoading: false,
  error: null,
};

/**
 * Default labels for common anatomical structures
 */
export const DEFAULT_LABELS: Label[] = [
  { id: 'tumor', name: 'Tumor', color: '#FF0000', shortcut: '1', category: 'pathology' },
  { id: 'lesion', name: 'Lesion', color: '#FF6600', shortcut: '2', category: 'pathology' },
  { id: 'nodule', name: 'Nodule', color: '#FFCC00', shortcut: '3', category: 'pathology' },
  { id: 'cyst', name: 'Cyst', color: '#00CCFF', shortcut: '4', category: 'pathology' },
  { id: 'edema', name: 'Edema', color: '#00FF66', shortcut: '5', category: 'pathology' },
  { id: 'hemorrhage', name: 'Hemorrhage', color: '#CC0066', shortcut: '6', category: 'pathology' },
  { id: 'calcification', name: 'Calcification', color: '#FFFFFF', shortcut: '7', category: 'finding' },
  { id: 'artifact', name: 'Artifact', color: '#999999', shortcut: '8', category: 'quality' },
  { id: 'normal', name: 'Normal', color: '#00FF00', shortcut: '9', category: 'finding' },
  { id: 'other', name: 'Other', color: '#9966FF', shortcut: '0', category: 'other' },
];

/**
 * Annotation event types for callbacks
 */
export type AnnotationEventType =
  | 'annotation:added'
  | 'annotation:modified'
  | 'annotation:removed'
  | 'annotation:selected'
  | 'annotation:deselected'
  | 'annotation:locked'
  | 'annotation:unlocked';

/**
 * Annotation event payload
 */
export interface AnnotationEvent {
  type: AnnotationEventType;
  annotation: Annotation;
  previousState?: Annotation;
}

/**
 * Annotation change callback
 */
export type OnAnnotationChange = (event: AnnotationEvent) => void;
