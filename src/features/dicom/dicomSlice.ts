/**
 * DICOM Redux Slice
 * Manages DICOM viewer state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  DicomState,
  Study,
  Series,
  Instance,
  StudyFilters,
  ViewportDisplayState,
} from '@/types/dicom';
import { initialDicomState } from '@/types/dicom';

const dicomSlice = createSlice({
  name: 'dicom',
  initialState: initialDicomState,
  reducers: {
    // Study management
    setCurrentStudy: (state, action: PayloadAction<Study | null>) => {
      state.currentStudy = action.payload;
    },

    setCurrentSeries: (state, action: PayloadAction<Series | null>) => {
      state.currentSeries = action.payload;
    },

    setCurrentInstances: (state, action: PayloadAction<Instance[]>) => {
      state.currentInstances = action.payload;
    },

    // Studies list
    setStudies: (
      state,
      action: PayloadAction<{ studies: Study[]; total: number }>
    ) => {
      state.studies = action.payload.studies;
      state.totalStudies = action.payload.total;
      state.studiesLoading = false;
      state.studiesError = null;
    },

    setStudiesLoading: (state, action: PayloadAction<boolean>) => {
      state.studiesLoading = action.payload;
    },

    setStudiesError: (state, action: PayloadAction<string | null>) => {
      state.studiesError = action.payload;
      state.studiesLoading = false;
    },

    // Pagination
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 1; // Reset to first page when changing page size
    },

    // Filters
    setFilters: (state, action: PayloadAction<StudyFilters>) => {
      state.filters = action.payload;
      state.currentPage = 1; // Reset to first page when changing filters
    },

    updateFilter: (
      state,
      action: PayloadAction<{ key: keyof StudyFilters; value: any }>
    ) => {
      const { key, value } = action.payload;
      if (value === undefined || value === '' || value === null) {
        delete state.filters[key];
      } else {
        (state.filters as any)[key] = value;
      }
      state.currentPage = 1;
    },

    clearFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
    },

    // Viewport management
    setActiveViewport: (state, action: PayloadAction<string | null>) => {
      state.activeViewportId = action.payload;
    },

    setViewportState: (
      state,
      action: PayloadAction<{
        viewportId: string;
        state: Partial<ViewportDisplayState>;
      }>
    ) => {
      const { viewportId, state: viewportState } = action.payload;
      const existing = state.viewportStates[viewportId] || getDefaultViewportState();
      state.viewportStates[viewportId] = {
        ...existing,
        ...viewportState,
      };
    },

    resetViewportState: (state, action: PayloadAction<string>) => {
      const viewportId = action.payload;
      state.viewportStates[viewportId] = getDefaultViewportState();
    },

    removeViewportState: (state, action: PayloadAction<string>) => {
      const viewportId = action.payload;
      delete state.viewportStates[viewportId];
    },

    // Image loading
    setImageLoadingProgress: (state, action: PayloadAction<number>) => {
      state.imageLoadingProgress = action.payload;
      state.isLoadingImages = action.payload > 0 && action.payload < 100;
    },

    setIsLoadingImages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingImages = action.payload;
      if (!action.payload) {
        state.imageLoadingProgress = 0;
      }
    },

    // Reset state
    resetDicomState: () => initialDicomState,
  },
});

/**
 * Get default viewport display state
 */
function getDefaultViewportState(): ViewportDisplayState {
  return {
    windowCenter: 40,
    windowWidth: 400,
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    invert: false,
  };
}

export const {
  setCurrentStudy,
  setCurrentSeries,
  setCurrentInstances,
  setStudies,
  setStudiesLoading,
  setStudiesError,
  setCurrentPage,
  setPageSize,
  setFilters,
  updateFilter,
  clearFilters,
  setActiveViewport,
  setViewportState,
  resetViewportState,
  removeViewportState,
  setImageLoadingProgress,
  setIsLoadingImages,
  resetDicomState,
} = dicomSlice.actions;

export const dicomReducer = dicomSlice.reducer;
export default dicomSlice;
