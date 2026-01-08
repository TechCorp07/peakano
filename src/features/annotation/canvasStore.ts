/**
 * Canvas Annotation Store
 * Zustand store for managing canvas-based annotation tool state
 *
 * Note: Annotations are now stored in world coordinates (Point3)
 * to ensure they stay aligned with DICOM images during zoom/pan.
 */

import { create } from 'zustand';
import type { CanvasToolType, CanvasAnnotation, WorldAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';

interface CanvasAnnotationState {
  // Active tool
  activeTool: CanvasToolType;
  setActiveTool: (tool: CanvasToolType) => void;

  // Brush settings
  brushRadius: number;
  setBrushRadius: (radius: number) => void;

  // Fill color (translucent light green by default)
  fillColor: string;
  setFillColor: (color: string) => void;

  // Annotations per viewport/slice
  annotations: Map<string, CanvasAnnotation[]>;
  setAnnotations: (key: string, annotations: CanvasAnnotation[]) => void;
  getAnnotations: (key: string) => CanvasAnnotation[];
  clearAnnotations: (key: string) => void;
  clearAllAnnotations: () => void;

  // Undo/redo history
  history: Map<string, CanvasAnnotation[]>[];
  historyIndex: number;
  undo: (key: string) => void;
  redo: (key: string) => void;
}

export const useCanvasAnnotationStore = create<CanvasAnnotationState>((set, get) => ({
  // Default tool is none
  activeTool: 'none',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Default brush radius
  brushRadius: 15,
  setBrushRadius: (radius) => set({ brushRadius: radius }),

  // Default fill color - translucent light green
  fillColor: 'rgba(144, 238, 144, 0.4)',
  setFillColor: (color) => set({ fillColor: color }),

  // Annotations storage
  annotations: new Map(),
  setAnnotations: (key, annotations) => {
    const newMap = new Map(get().annotations);
    newMap.set(key, annotations);
    set({ annotations: newMap });
  },
  getAnnotations: (key) => {
    return get().annotations.get(key) || [];
  },
  clearAnnotations: (key) => {
    const newMap = new Map(get().annotations);
    newMap.delete(key);
    set({ annotations: newMap });
  },
  clearAllAnnotations: () => {
    set({ annotations: new Map() });
  },

  // History for undo/redo
  history: [],
  historyIndex: -1,
  undo: (key) => {
    const { historyIndex, history, annotations } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      const prevAnnotations = prevState?.get(key) || [];
      const newMap = new Map(annotations);
      newMap.set(key, prevAnnotations);
      set({ annotations: newMap, historyIndex: historyIndex - 1 });
    }
  },
  redo: (key) => {
    const { historyIndex, history, annotations } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      const nextAnnotations = nextState?.get(key) || [];
      const newMap = new Map(annotations);
      newMap.set(key, nextAnnotations);
      set({ annotations: newMap, historyIndex: historyIndex + 1 });
    }
  },
}));

// Selector hooks for specific values
export const useCanvasTool = () => useCanvasAnnotationStore((state) => state.activeTool);
export const useSetCanvasTool = () => useCanvasAnnotationStore((state) => state.setActiveTool);
export const useBrushRadius = () => useCanvasAnnotationStore((state) => state.brushRadius);
export const useFillColor = () => useCanvasAnnotationStore((state) => state.fillColor);
