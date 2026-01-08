/**
 * Cornerstone3D type definitions
 * Types for DICOM viewer and medical imaging
 */

// Cornerstone types available if needed for future type extensions
// import type { Types as CornerstoneTypes } from '@cornerstonejs/core';

/**
 * Viewport orientation types
 */
export type ViewportOrientation = 'axial' | 'sagittal' | 'coronal' | 'oblique';

/**
 * Tool types available in the viewer
 */
export type ToolType =
  | 'WindowLevel'
  | 'Pan'
  | 'Zoom'
  | 'StackScroll'
  | 'Length'
  | 'RectangleROI'
  | 'EllipticalROI'
  | 'CircleROI'
  | 'Probe'
  | 'Angle'
  | 'Bidirectional'
  | 'Crosshairs'
  // Segmentation tools
  | 'Brush'
  | 'Eraser'
  | 'CircularBrush'
  | 'SphereBrush'
  | 'ThresholdBrush'
  | 'RectangleScissors'
  | 'CircleScissors'
  | 'SphereScissors'
  | 'PlanarFreehandROI';

/**
 * Mouse button bindings
 */
export type MouseButton = 'Primary' | 'Secondary' | 'Auxiliary';

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  viewportId: string;
  type: 'stack' | 'volume';
  orientation?: ViewportOrientation;
  element: HTMLDivElement;
  defaultOptions?: {
    background?: [number, number, number];
  };
}

/**
 * Tool configuration
 */
export interface ToolConfig {
  toolName: ToolType;
  bindings?: {
    mouseButton: MouseButton;
    modifierKey?: 'Shift' | 'Ctrl' | 'Alt';
  }[];
}

/**
 * Image loading state
 */
export interface ImageLoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
  loadedImages: number;
  totalImages: number;
}

/**
 * Window/Level preset
 */
export interface WindowLevelPreset {
  name: string;
  windowWidth: number;
  windowCenter: number;
}

/**
 * Common window/level presets for different modalities
 */
export const WINDOW_LEVEL_PRESETS: Record<string, WindowLevelPreset[]> = {
  CT: [
    { name: 'Abdomen', windowWidth: 400, windowCenter: 40 },
    { name: 'Lung', windowWidth: 1500, windowCenter: -600 },
    { name: 'Bone', windowWidth: 2000, windowCenter: 500 },
    { name: 'Brain', windowWidth: 80, windowCenter: 40 },
    { name: 'Mediastinum', windowWidth: 350, windowCenter: 50 },
    { name: 'Liver', windowWidth: 150, windowCenter: 30 },
  ],
  MR: [
    { name: 'Default', windowWidth: 400, windowCenter: 200 },
    { name: 'Brain T1', windowWidth: 600, windowCenter: 300 },
    { name: 'Brain T2', windowWidth: 800, windowCenter: 400 },
  ],
  XR: [
    { name: 'Chest', windowWidth: 2000, windowCenter: 0 },
    { name: 'Bone', windowWidth: 2500, windowCenter: 500 },
  ],
};

/**
 * DICOM Study representation
 */
export interface DicomStudy {
  studyInstanceUID: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  patientName?: string;
  patientID?: string;
  accessionNumber?: string;
  modality?: string;
  numberOfSeries: number;
  numberOfInstances: number;
  series: DicomSeries[];
}

/**
 * DICOM Series representation
 */
export interface DicomSeries {
  seriesInstanceUID: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality: string;
  numberOfInstances: number;
  instances: DicomInstance[];
}

/**
 * DICOM Instance representation
 */
export interface DicomInstance {
  sopInstanceUID: string;
  instanceNumber?: number;
  imageId: string;
  rows?: number;
  columns?: number;
  sliceThickness?: number;
  sliceLocation?: number;
}

/**
 * Viewport state for Redux
 */
export interface ViewportState {
  activeViewportId: string | null;
  viewports: Record<string, {
    studyInstanceUID: string;
    seriesInstanceUID: string;
    currentImageIndex: number;
    windowWidth: number;
    windowCenter: number;
    zoom: number;
    pan: { x: number; y: number };
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  }>;
}

/**
 * Cornerstone rendering engine ID
 */
export const RENDERING_ENGINE_ID = 'mriTrainingRenderingEngine';

/**
 * Default tool group ID
 */
export const TOOL_GROUP_ID = 'mriTrainingToolGroup';

/**
 * Viewport layout types
 */
export type ViewportLayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '1x3' | '3x1' | '2x3' | '3x3';

/**
 * Layout configuration
 */
export interface LayoutConfig {
  rows: number;
  cols: number;
  label: string;
}

/**
 * Available layout configurations
 */
export const LAYOUT_CONFIGS: Record<ViewportLayoutType, LayoutConfig> = {
  '1x1': { rows: 1, cols: 1, label: '1×1' },
  '1x2': { rows: 1, cols: 2, label: '1×2' },
  '2x1': { rows: 2, cols: 1, label: '2×1' },
  '2x2': { rows: 2, cols: 2, label: '2×2' },
  '1x3': { rows: 1, cols: 3, label: '1×3' },
  '3x1': { rows: 3, cols: 1, label: '3×1' },
  '2x3': { rows: 2, cols: 3, label: '2×3' },
  '3x3': { rows: 3, cols: 3, label: '3×3' },
};

/**
 * Viewport cell configuration (for multi-viewport grids)
 */
export interface ViewportCellConfig {
  viewportId: string;
  imageIds: string[];
  seriesInstanceUID?: string;
  label?: string;
}

/**
 * Grid state for multi-viewport layouts
 */
export interface ViewportGridState {
  layout: ViewportLayoutType;
  activeViewportId: string;
  cells: ViewportCellConfig[];
}
