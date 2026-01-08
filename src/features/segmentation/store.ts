/**
 * Segmentation Store
 * Zustand-based state management for segmentation masks
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Label } from '@/types/annotation';
import { DEFAULT_LABELS } from '@/types/annotation';

/**
 * Segmentation layer data
 */
export interface SegmentationLayer {
  id: string;
  segmentationId: string; // Cornerstone segmentation ID
  labelId: string;
  labelName: string;
  labelColor: [number, number, number];
  visible: boolean;
  opacity: number;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Segmentation state
 */
interface SegmentationState {
  // Active layers per viewport
  layers: Record<string, SegmentationLayer[]>; // viewportId -> layers

  // Currently active layer for drawing
  activeLayerId: string | null;

  // Tool state
  isDrawing: boolean;
  brushSize: number;
  brushOpacity: number;
  isEraserMode: boolean;

  // Labels available for segmentation
  labels: Label[];
  selectedLabelId: string | null;

  // Loading/error states
  isLoading: boolean;
  error: string | null;
}

/**
 * Segmentation actions
 */
interface SegmentationActions {
  // Layer management
  addLayer: (viewportId: string, layer: SegmentationLayer) => void;
  removeLayer: (viewportId: string, layerId: string) => void;
  updateLayer: (viewportId: string, layerId: string, updates: Partial<SegmentationLayer>) => void;
  setActiveLayer: (layerId: string | null) => void;
  getLayersForViewport: (viewportId: string) => SegmentationLayer[];

  // Tool state
  setIsDrawing: (isDrawing: boolean) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setEraserMode: (isEraser: boolean) => void;

  // Label selection
  setSelectedLabel: (labelId: string | null) => void;
  getSelectedLabel: () => Label | null;

  // Visibility
  toggleLayerVisibility: (viewportId: string, layerId: string) => void;
  setLayerOpacity: (viewportId: string, layerId: string, opacity: number) => void;

  // Loading states
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
  clearViewport: (viewportId: string) => void;
}

type SegmentationStore = SegmentationState & SegmentationActions;

const initialState: SegmentationState = {
  layers: {},
  activeLayerId: null,
  isDrawing: false,
  brushSize: 10,
  brushOpacity: 1,
  isEraserMode: false,
  labels: DEFAULT_LABELS,
  selectedLabelId: null,
  isLoading: false,
  error: null,
};

/**
 * Segmentation store
 */
export const useSegmentationStore = create<SegmentationStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ========================================
      // Layer Management
      // ========================================

      addLayer: (viewportId, layer) =>
        set((state) => {
          if (!state.layers[viewportId]) {
            state.layers[viewportId] = [];
          }
          state.layers[viewportId].push(layer);
          state.activeLayerId = layer.id;
        }),

      removeLayer: (viewportId, layerId) =>
        set((state) => {
          if (state.layers[viewportId]) {
            state.layers[viewportId] = state.layers[viewportId].filter(
              (l) => l.id !== layerId
            );
          }
          if (state.activeLayerId === layerId) {
            state.activeLayerId = null;
          }
        }),

      updateLayer: (viewportId, layerId, updates) =>
        set((state) => {
          const layers = state.layers[viewportId];
          if (layers) {
            const index = layers.findIndex((l) => l.id === layerId);
            if (index !== -1) {
              layers[index] = {
                ...layers[index],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }),

      setActiveLayer: (layerId) =>
        set((state) => {
          state.activeLayerId = layerId;
        }),

      getLayersForViewport: (viewportId) => {
        return get().layers[viewportId] || [];
      },

      // ========================================
      // Tool State
      // ========================================

      setIsDrawing: (isDrawing) =>
        set((state) => {
          state.isDrawing = isDrawing;
        }),

      setBrushSize: (size) =>
        set((state) => {
          state.brushSize = Math.max(1, Math.min(100, size));
        }),

      setBrushOpacity: (opacity) =>
        set((state) => {
          state.brushOpacity = Math.max(0, Math.min(1, opacity));
        }),

      setEraserMode: (isEraser) =>
        set((state) => {
          state.isEraserMode = isEraser;
        }),

      // ========================================
      // Label Selection
      // ========================================

      setSelectedLabel: (labelId) =>
        set((state) => {
          state.selectedLabelId = labelId;
        }),

      getSelectedLabel: () => {
        const state = get();
        if (!state.selectedLabelId) return null;
        return state.labels.find((l) => l.id === state.selectedLabelId) || null;
      },

      // ========================================
      // Visibility
      // ========================================

      toggleLayerVisibility: (viewportId, layerId) =>
        set((state) => {
          const layers = state.layers[viewportId];
          if (layers) {
            const layer = layers.find((l) => l.id === layerId);
            if (layer) {
              layer.visible = !layer.visible;
            }
          }
        }),

      setLayerOpacity: (viewportId, layerId, opacity) =>
        set((state) => {
          const layers = state.layers[viewportId];
          if (layers) {
            const layer = layers.find((l) => l.id === layerId);
            if (layer) {
              layer.opacity = Math.max(0, Math.min(1, opacity));
            }
          }
        }),

      // ========================================
      // Loading States
      // ========================================

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // ========================================
      // Reset
      // ========================================

      reset: () =>
        set((state) => {
          Object.assign(state, initialState);
        }),

      clearViewport: (viewportId) =>
        set((state) => {
          delete state.layers[viewportId];
          state.activeLayerId = null;
        }),
    })),
    { name: 'SegmentationStore' }
  )
);

// Selector hooks
export const useBrushSize = () => useSegmentationStore((state) => state.brushSize);
export const useBrushOpacity = () => useSegmentationStore((state) => state.brushOpacity);
export const useIsEraserMode = () => useSegmentationStore((state) => state.isEraserMode);
export const useActiveLayerId = () => useSegmentationStore((state) => state.activeLayerId);
export const useSelectedLabelId = () => useSegmentationStore((state) => state.selectedLabelId);
