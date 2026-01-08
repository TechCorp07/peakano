/**
 * Annotation Store
 * Zustand-based state management for annotations
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Annotation,
  AnnotationState,
  Label,
  AllToolType,
  AnnotationHistoryEntry,
} from '@/types/annotation';
import { DEFAULT_LABELS, initialAnnotationState } from '@/types/annotation';

/**
 * Annotation store actions
 */
interface AnnotationActions {
  // Annotation CRUD
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAnnotations: () => void;

  // Annotation selection
  setActiveAnnotation: (id: string | null) => void;
  selectAnnotation: (id: string) => void;
  deselectAnnotation: () => void;

  // Tool management
  setActiveTool: (tool: AllToolType | null) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;

  // Label management
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  selectLabel: (id: string | null) => void;

  // Session management
  setSessionId: (sessionId: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setLastSaved: (timestamp: string) => void;

  // Bulk operations
  setAnnotations: (annotations: Annotation[]) => void;
  importAnnotations: (annotations: Annotation[]) => void;
  getAnnotationsForImage: (sopInstanceUID: string) => Annotation[];
  getAnnotationsForSeries: (seriesInstanceUID: string) => Annotation[];

  // History / Undo-Redo
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Loading states
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

/**
 * Combined store type
 */
type AnnotationStore = AnnotationState & AnnotationActions;

/**
 * Maximum history entries to keep
 */
const MAX_HISTORY_ENTRIES = 50;

/**
 * Create the annotation store with Zustand
 */
export const useAnnotationStore = create<AnnotationStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        ...initialAnnotationState,
        labels: DEFAULT_LABELS,

        // ========================================
        // Annotation CRUD
        // ========================================

        addAnnotation: (annotation) =>
          set((state) => {
            // Add to history
            const historyEntry: AnnotationHistoryEntry = {
              timestamp: Date.now(),
              action: 'add',
              annotationId: annotation.id,
              newState: annotation,
            };

            state.annotations.push(annotation);
            state.isDirty = true;

            // Manage history
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(historyEntry);
            if (state.history.length > MAX_HISTORY_ENTRIES) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
          }),

        updateAnnotation: (id, updates) =>
          set((state) => {
            const index = state.annotations.findIndex((a) => a.id === id);
            if (index === -1) return;

            const previousState = { ...state.annotations[index] };

            // Add to history
            const historyEntry: AnnotationHistoryEntry = {
              timestamp: Date.now(),
              action: 'update',
              annotationId: id,
              previousState,
              newState: { ...previousState, ...updates },
            };

            state.annotations[index] = {
              ...state.annotations[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            state.isDirty = true;

            // Manage history
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(historyEntry);
            if (state.history.length > MAX_HISTORY_ENTRIES) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
          }),

        deleteAnnotation: (id) =>
          set((state) => {
            const index = state.annotations.findIndex((a) => a.id === id);
            if (index === -1) return;

            const previousState = state.annotations[index];

            // Add to history
            const historyEntry: AnnotationHistoryEntry = {
              timestamp: Date.now(),
              action: 'delete',
              annotationId: id,
              previousState,
            };

            state.annotations.splice(index, 1);
            state.isDirty = true;

            if (state.activeAnnotationId === id) {
              state.activeAnnotationId = null;
            }

            // Manage history
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(historyEntry);
            if (state.history.length > MAX_HISTORY_ENTRIES) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
          }),

        clearAnnotations: () =>
          set((state) => {
            if (state.annotations.length === 0) return;

            // Add to history
            const historyEntry: AnnotationHistoryEntry = {
              timestamp: Date.now(),
              action: 'clear',
            };

            state.annotations = [];
            state.activeAnnotationId = null;
            state.isDirty = true;

            // Manage history
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(historyEntry);
            if (state.history.length > MAX_HISTORY_ENTRIES) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
          }),

        // ========================================
        // Annotation Selection
        // ========================================

        setActiveAnnotation: (id) =>
          set((state) => {
            state.activeAnnotationId = id;
          }),

        selectAnnotation: (id) =>
          set((state) => {
            state.activeAnnotationId = id;
          }),

        deselectAnnotation: () =>
          set((state) => {
            state.activeAnnotationId = null;
          }),

        // ========================================
        // Tool Management
        // ========================================

        setActiveTool: (tool) =>
          set((state) => {
            state.activeTool = tool;
          }),

        setBrushSize: (size) =>
          set((state) => {
            state.brushSize = Math.max(1, Math.min(100, size));
          }),

        setBrushOpacity: (opacity) =>
          set((state) => {
            state.brushOpacity = Math.max(0, Math.min(1, opacity));
          }),

        // ========================================
        // Label Management
        // ========================================

        setLabels: (labels) =>
          set((state) => {
            state.labels = labels;
          }),

        addLabel: (label) =>
          set((state) => {
            if (!state.labels.find((l) => l.id === label.id)) {
              state.labels.push(label);
            }
          }),

        updateLabel: (id, updates) =>
          set((state) => {
            const index = state.labels.findIndex((l) => l.id === id);
            if (index !== -1) {
              state.labels[index] = { ...state.labels[index], ...updates };
            }
          }),

        deleteLabel: (id) =>
          set((state) => {
            state.labels = state.labels.filter((l) => l.id !== id);
            if (state.selectedLabelId === id) {
              state.selectedLabelId = null;
            }
          }),

        selectLabel: (id) =>
          set((state) => {
            state.selectedLabelId = id;
          }),

        // ========================================
        // Session Management
        // ========================================

        setSessionId: (sessionId) =>
          set((state) => {
            state.sessionId = sessionId;
          }),

        markDirty: () =>
          set((state) => {
            state.isDirty = true;
          }),

        markClean: () =>
          set((state) => {
            state.isDirty = false;
          }),

        setLastSaved: (timestamp) =>
          set((state) => {
            state.lastSavedAt = timestamp;
            state.isDirty = false;
          }),

        // ========================================
        // Bulk Operations
        // ========================================

        setAnnotations: (annotations) =>
          set((state) => {
            state.annotations = annotations;
            state.activeAnnotationId = null;
          }),

        importAnnotations: (annotations) =>
          set((state) => {
            // Merge annotations, avoiding duplicates
            const existingIds = new Set(state.annotations.map((a) => a.id));
            const newAnnotations = annotations.filter((a) => !existingIds.has(a.id));
            state.annotations.push(...newAnnotations);
            state.isDirty = true;
          }),

        getAnnotationsForImage: (sopInstanceUID) => {
          return get().annotations.filter((a) => a.sopInstanceUID === sopInstanceUID);
        },

        getAnnotationsForSeries: (seriesInstanceUID) => {
          return get().annotations.filter((a) => a.seriesInstanceUID === seriesInstanceUID);
        },

        // ========================================
        // History / Undo-Redo
        // ========================================

        undo: () =>
          set((state) => {
            if (state.historyIndex < 0) return;

            const entry = state.history[state.historyIndex];

            switch (entry.action) {
              case 'add':
                // Remove the added annotation
                state.annotations = state.annotations.filter(
                  (a) => a.id !== entry.annotationId
                );
                break;

              case 'update':
                // Restore previous state
                if (entry.previousState) {
                  const index = state.annotations.findIndex(
                    (a) => a.id === entry.annotationId
                  );
                  if (index !== -1) {
                    state.annotations[index] = entry.previousState;
                  }
                }
                break;

              case 'delete':
                // Restore deleted annotation
                if (entry.previousState) {
                  state.annotations.push(entry.previousState);
                }
                break;

              case 'clear':
                // Cannot undo clear (would need to store all annotations)
                break;
            }

            state.historyIndex--;
            state.isDirty = true;
          }),

        redo: () =>
          set((state) => {
            if (state.historyIndex >= state.history.length - 1) return;

            state.historyIndex++;
            const entry = state.history[state.historyIndex];

            switch (entry.action) {
              case 'add':
                // Re-add the annotation
                if (entry.newState) {
                  state.annotations.push(entry.newState);
                }
                break;

              case 'update':
                // Apply the update again
                if (entry.newState) {
                  const index = state.annotations.findIndex(
                    (a) => a.id === entry.annotationId
                  );
                  if (index !== -1) {
                    state.annotations[index] = entry.newState;
                  }
                }
                break;

              case 'delete':
                // Re-delete the annotation
                state.annotations = state.annotations.filter(
                  (a) => a.id !== entry.annotationId
                );
                break;

              case 'clear':
                // Re-clear
                state.annotations = [];
                break;
            }

            state.isDirty = true;
          }),

        clearHistory: () =>
          set((state) => {
            state.history = [];
            state.historyIndex = -1;
          }),

        // ========================================
        // Loading States
        // ========================================

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setSaving: (isSaving) =>
          set((state) => {
            state.isSaving = isSaving;
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
            Object.assign(state, initialAnnotationState);
            state.labels = DEFAULT_LABELS;
          }),
      })),
      {
        name: 'annotation-store',
        // Only persist certain fields
        partialize: (state) => ({
          labels: state.labels,
          brushSize: state.brushSize,
          brushOpacity: state.brushOpacity,
        }),
      }
    ),
    { name: 'AnnotationStore' }
  )
);

/**
 * Selector hooks for common selections
 */
export const useAnnotations = () => useAnnotationStore((state) => state.annotations);
export const useActiveAnnotation = () => {
  const activeId = useAnnotationStore((state) => state.activeAnnotationId);
  const annotations = useAnnotationStore((state) => state.annotations);
  return annotations.find((a) => a.id === activeId) || null;
};
export const useLabels = () => useAnnotationStore((state) => state.labels);
export const useSelectedLabel = () => {
  const selectedId = useAnnotationStore((state) => state.selectedLabelId);
  const labels = useAnnotationStore((state) => state.labels);
  return labels.find((l) => l.id === selectedId) || null;
};
export const useAnnotationTool = () => useAnnotationStore((state) => state.activeTool);
export const useIsDirty = () => useAnnotationStore((state) => state.isDirty);
export const useCanUndo = () => useAnnotationStore((state) => state.historyIndex >= 0);
export const useCanRedo = () =>
  useAnnotationStore((state) => state.historyIndex < state.history.length - 1);
