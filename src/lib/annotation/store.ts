/**
 * Annotation Tools Store
 * Zustand store for managing annotation tool state
 * 
 * @module annotation/store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BrushConfig, Brush3DConfig, AdaptiveBrushConfig, BrushPreset, DEFAULT_BRUSH_PRESETS } from './brushTools';
import type { ThresholdConfig } from './thresholdSegmentation';

// Re-export default presets
export { DEFAULT_BRUSH_PRESETS } from './brushTools';

/**
 * Active tool type
 */
export type AnnotationToolType = 
  | 'none'
  | 'brush'
  | 'brush-3d'
  | 'adaptive-brush'
  | 'eraser'
  | 'polygon'
  | 'freehand'
  | 'threshold'
  | 'magic-wand'
  | 'region-growing'
  | 'lasso'
  | 'scissors';

/**
 * Segment tool type (for toolbar dropdown)
 */
export type SegmentToolType = 
  | 'none'
  | 'threshold'
  | 'adaptive-threshold'
  | 'otsu'
  | 'hysteresis'
  | 'mask-union'
  | 'mask-subtract'
  | 'mask-intersect'
  | 'mask-xor'
  | 'morphology';

/**
 * Mask operation type
 */
export type MaskOperationType = 'replace' | 'add' | 'union' | 'subtract' | 'intersect' | 'xor' | 'none';

/**
 * Annotation tools state
 */
export interface AnnotationToolsState {
  // Active tool
  activeTool: AnnotationToolType;
  
  // Active segment tool (for toolbar dropdown tracking)
  activeSegmentTool: SegmentToolType;
  
  // Brush settings
  brushConfig: BrushConfig;
  brush3DConfig: Brush3DConfig;
  adaptiveBrushConfig: AdaptiveBrushConfig;
  activeBrushPreset: string | null;
  
  // Threshold settings
  thresholdConfig: ThresholdConfig;
  
  // Mask operation mode
  maskOperationMode: MaskOperationType;
  
  // Selection state
  hasSelection: boolean;
  selectionMask: Uint8Array | null;
  selectionWidth: number;
  selectionHeight: number;
  
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  
  // Processing state
  isProcessing: boolean;
  processingMessage: string | null;
}

/**
 * Annotation tools actions
 */
export interface AnnotationToolsActions {
  // Tool selection
  setActiveTool: (tool: AnnotationToolType) => void;
  setActiveSegmentTool: (tool: SegmentToolType) => void;
  
  // Brush settings
  setBrushConfig: (config: Partial<BrushConfig>) => void;
  setBrush3DConfig: (config: Partial<Brush3DConfig>) => void;
  setAdaptiveBrushConfig: (config: Partial<AdaptiveBrushConfig>) => void;
  setBrushRadius: (radius: number) => void;
  applyBrushPreset: (presetId: string) => void;
  
  // Threshold settings
  setThresholdConfig: (config: Partial<ThresholdConfig>) => void;
  
  // Mask operations
  setMaskOperationMode: (mode: MaskOperationType) => void;
  
  // Selection
  setSelection: (mask: Uint8Array | null, width: number, height: number) => void;
  clearSelection: () => void;
  
  // Undo/Redo
  setUndoState: (canUndo: boolean, canRedo: boolean) => void;
  
  // Processing
  setProcessing: (isProcessing: boolean, message?: string | null) => void;
  
  // Reset
  reset: () => void;
}

/**
 * Default brush configuration
 */
const defaultBrushConfig: BrushConfig = {
  radius: 10,
  shape: 'circle',
  hardness: 1,
  opacity: 1,
  isEraser: false,
  spacing: 0.25,
};

/**
 * Default 3D brush configuration
 */
const defaultBrush3DConfig: Brush3DConfig = {
  ...defaultBrushConfig,
  depth: 3,
  depthFalloff: 'gaussian',
  visibleSlicesOnly: false,
};

/**
 * Default adaptive brush configuration
 */
const defaultAdaptiveBrushConfig: AdaptiveBrushConfig = {
  ...defaultBrushConfig,
  intensityTolerance: 30,
  gradientThreshold: 50,
  edgeSnapping: true,
  edgeStrength: 0.5,
};

/**
 * Default threshold configuration
 */
const defaultThresholdConfig: ThresholdConfig = {
  lowerThreshold: 0,
  upperThreshold: 255,
  invert: false,
};

/**
 * Initial state
 */
const initialState: AnnotationToolsState = {
  activeTool: 'none',
  activeSegmentTool: 'none',
  brushConfig: defaultBrushConfig,
  brush3DConfig: defaultBrush3DConfig,
  adaptiveBrushConfig: defaultAdaptiveBrushConfig,
  activeBrushPreset: null,
  thresholdConfig: defaultThresholdConfig,
  maskOperationMode: 'add',  // Default to 'add' mode (append to existing annotations)
  hasSelection: false,
  selectionMask: null,
  selectionWidth: 0,
  selectionHeight: 0,
  canUndo: false,
  canRedo: false,
  isProcessing: false,
  processingMessage: null,
};

/**
 * Brush presets lookup
 */
const brushPresetsMap: Record<string, BrushConfig> = {
  fine: { radius: 1, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
  small: { radius: 5, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
  medium: { radius: 10, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
  large: { radius: 20, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
  xlarge: { radius: 40, shape: 'circle', hardness: 1, opacity: 1, isEraser: false, spacing: 0.25 },
  soft: { radius: 15, shape: 'circle', hardness: 0.5, opacity: 0.8, isEraser: false, spacing: 0.1 },
};

/**
 * Annotation tools store
 */
export const useAnnotationToolsStore = create<AnnotationToolsState & AnnotationToolsActions>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setActiveTool: (tool) => set({ activeTool: tool }),
      
      setActiveSegmentTool: (tool) => set({ activeSegmentTool: tool }),
      
      setBrushConfig: (config) => set((state) => ({
        brushConfig: { ...state.brushConfig, ...config },
        activeBrushPreset: null, // Clear preset when manually changing
      })),
      
      setBrush3DConfig: (config) => set((state) => ({
        brush3DConfig: { ...state.brush3DConfig, ...config },
      })),
      
      setAdaptiveBrushConfig: (config) => set((state) => ({
        adaptiveBrushConfig: { ...state.adaptiveBrushConfig, ...config },
      })),
      
      setBrushRadius: (radius) => set((state) => ({
        brushConfig: { ...state.brushConfig, radius },
        brush3DConfig: { ...state.brush3DConfig, radius },
        adaptiveBrushConfig: { ...state.adaptiveBrushConfig, radius },
        activeBrushPreset: null,
      })),
      
      applyBrushPreset: (presetId) => {
        const preset = brushPresetsMap[presetId];
        if (preset) {
          set((state) => ({
            brushConfig: { ...preset },
            activeBrushPreset: presetId,
          }));
        }
      },
      
      setThresholdConfig: (config) => set((state) => ({
        thresholdConfig: { ...state.thresholdConfig, ...config },
      })),
      
      setMaskOperationMode: (mode) => set({ maskOperationMode: mode }),
      
      setSelection: (mask, width, height) => set({
        hasSelection: mask !== null && mask.length > 0,
        selectionMask: mask,
        selectionWidth: width,
        selectionHeight: height,
      }),
      
      clearSelection: () => set({
        hasSelection: false,
        selectionMask: null,
        selectionWidth: 0,
        selectionHeight: 0,
      }),
      
      setUndoState: (canUndo, canRedo) => set({ canUndo, canRedo }),
      
      setProcessing: (isProcessing, message = null) => set({
        isProcessing,
        processingMessage: message,
      }),
      
      reset: () => set(initialState),
    }),
    { name: 'annotation-tools' }
  )
);

// Selector hooks for performance
export const useActiveTool = () => useAnnotationToolsStore((state) => state.activeTool);
export const useActiveSegmentTool = () => useAnnotationToolsStore((state) => state.activeSegmentTool);
export const useBrushConfig = () => useAnnotationToolsStore((state) => state.brushConfig);
export const useBrush3DConfig = () => useAnnotationToolsStore((state) => state.brush3DConfig);
export const useAdaptiveBrushConfig = () => useAnnotationToolsStore((state) => state.adaptiveBrushConfig);
export const useThresholdConfig = () => useAnnotationToolsStore((state) => state.thresholdConfig);
export const useMaskOperationMode = () => useAnnotationToolsStore((state) => state.maskOperationMode);
export const useHasSelection = () => useAnnotationToolsStore((state) => state.hasSelection);
export const useCanUndo = () => useAnnotationToolsStore((state) => state.canUndo);
export const useCanRedo = () => useAnnotationToolsStore((state) => state.canRedo);
export const useIsProcessing = () => useAnnotationToolsStore((state) => state.isProcessing);
