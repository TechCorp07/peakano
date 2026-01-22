/**
 * AI Segmentation Store
 * Zustand store for AI-powered segmentation state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  AISegmentationState,
  AISegmentationModel,
  Prompt,
  PointPrompt,
  BoxPrompt,
  DrawingState,
  JobStatus,
  SegmentationMask,
} from './types';

const initialDrawingState: DrawingState = {
  isDrawingBox: false,
  boxStart: null,
  currentBox: null,
  pointMode: 'foreground',
};

const initialState: AISegmentationState = {
  isActive: false,
  selectedModel: 'medsam2',
  prompts: [],
  drawingState: initialDrawingState,
  isProcessing: false,
  currentJobId: null,
  jobStatus: null,
  resultMask: null,
  error: null,
};

interface AISegmentationActions {
  // Activation
  setActive: (active: boolean) => void;
  toggle: () => void;
  
  // Model selection
  setModel: (model: AISegmentationModel) => void;
  
  // Prompt management
  addPointPrompt: (x: number, y: number, label: 0 | 1, sliceIndex?: number) => void;
  addBoxPrompt: (x1: number, y1: number, x2: number, y2: number, sliceIndex?: number) => void;
  removePrompt: (index: number) => void;
  clearPrompts: () => void;
  undoLastPrompt: () => void;
  
  // Drawing state
  startBoxDrawing: (x: number, y: number) => void;
  updateBoxDrawing: (x: number, y: number) => void;
  endBoxDrawing: () => void;
  cancelBoxDrawing: () => void;
  setPointMode: (mode: 'foreground' | 'background') => void;
  
  // Processing state
  setProcessing: (processing: boolean) => void;
  setJobId: (jobId: string | null) => void;
  setJobStatus: (status: JobStatus | null) => void;
  
  // Results
  setResultMask: (mask: SegmentationMask | null) => void;
  acceptResult: () => void;
  rejectResult: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

type AISegmentationStore = AISegmentationState & AISegmentationActions;

export const useAISegmentationStore = create<AISegmentationStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      
      // Activation
      setActive: (active) =>
        set((state) => {
          state.isActive = active;
          if (!active) {
            // Reset drawing state when deactivating
            state.drawingState = initialDrawingState;
          }
        }),
      
      toggle: () =>
        set((state) => {
          state.isActive = !state.isActive;
          if (!state.isActive) {
            state.drawingState = initialDrawingState;
          }
        }),
      
      // Model selection
      setModel: (model) =>
        set((state) => {
          state.selectedModel = model;
        }),
      
      // Prompt management
      addPointPrompt: (x, y, label, sliceIndex) =>
        set((state) => {
          const prompt: PointPrompt = {
            type: 'point',
            x,
            y,
            label,
            sliceIndex,
          };
          state.prompts.push(prompt);
        }),
      
      addBoxPrompt: (x1, y1, x2, y2, sliceIndex) =>
        set((state) => {
          // Normalize coordinates (ensure x1 < x2, y1 < y2)
          const prompt: BoxPrompt = {
            type: 'box',
            x1: Math.min(x1, x2),
            y1: Math.min(y1, y2),
            x2: Math.max(x1, x2),
            y2: Math.max(y1, y2),
            sliceIndex,
          };
          state.prompts.push(prompt);
        }),
      
      removePrompt: (index) =>
        set((state) => {
          state.prompts.splice(index, 1);
        }),
      
      clearPrompts: () =>
        set((state) => {
          state.prompts = [];
          state.resultMask = null;
        }),
      
      undoLastPrompt: () =>
        set((state) => {
          if (state.prompts.length > 0) {
            state.prompts.pop();
          }
        }),
      
      // Drawing state
      startBoxDrawing: (x, y) =>
        set((state) => {
          state.drawingState.isDrawingBox = true;
          state.drawingState.boxStart = { x, y };
          state.drawingState.currentBox = {
            type: 'box',
            x1: x,
            y1: y,
            x2: x,
            y2: y,
          };
        }),
      
      updateBoxDrawing: (x, y) =>
        set((state) => {
          if (state.drawingState.isDrawingBox && state.drawingState.boxStart) {
            state.drawingState.currentBox = {
              type: 'box',
              x1: state.drawingState.boxStart.x,
              y1: state.drawingState.boxStart.y,
              x2: x,
              y2: y,
            };
          }
        }),
      
      endBoxDrawing: () =>
        set((state) => {
          if (state.drawingState.currentBox) {
            const box = state.drawingState.currentBox;
            // Only add if box has some size
            if (Math.abs(box.x2 - box.x1) > 5 && Math.abs(box.y2 - box.y1) > 5) {
              state.prompts.push({
                ...box,
                x1: Math.min(box.x1, box.x2),
                y1: Math.min(box.y1, box.y2),
                x2: Math.max(box.x1, box.x2),
                y2: Math.max(box.y1, box.y2),
              });
            }
          }
          state.drawingState.isDrawingBox = false;
          state.drawingState.boxStart = null;
          state.drawingState.currentBox = null;
        }),
      
      cancelBoxDrawing: () =>
        set((state) => {
          state.drawingState.isDrawingBox = false;
          state.drawingState.boxStart = null;
          state.drawingState.currentBox = null;
        }),
      
      setPointMode: (mode) =>
        set((state) => {
          state.drawingState.pointMode = mode;
        }),
      
      // Processing state
      setProcessing: (processing) =>
        set((state) => {
          state.isProcessing = processing;
        }),
      
      setJobId: (jobId) =>
        set((state) => {
          state.currentJobId = jobId;
        }),
      
      setJobStatus: (status) =>
        set((state) => {
          state.jobStatus = status;
        }),
      
      // Results
      setResultMask: (mask) =>
        set((state) => {
          state.resultMask = mask;
        }),
      
      acceptResult: () =>
        set((state) => {
          // Clear prompts and result after accepting
          state.prompts = [];
          state.resultMask = null;
          state.error = null;
        }),
      
      rejectResult: () =>
        set((state) => {
          // Just clear the result, keep prompts for refinement
          state.resultMask = null;
        }),
      
      // Error handling
      setError: (error) =>
        set((state) => {
          state.error = error;
          state.isProcessing = false;
        }),
      
      // Reset
      reset: () => set(() => initialState),
    })),
    { name: 'ai-segmentation-store' }
  )
);

export default useAISegmentationStore;
