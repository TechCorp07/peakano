/**
 * DICOM Custom Hooks
 * Provides convenient hooks for DICOM viewing functionality
 */

import { useCallback, useEffect, useRef, useState, useReducer } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentStudy,
  setCurrentSeries,
  setCurrentInstances,
  setActiveViewport,
  setViewportState,
  resetViewportState,
  setImageLoadingProgress,
  setIsLoadingImages,
  updateFilter,
  clearFilters,
  setCurrentPage,
} from './dicomSlice';
import {
  useGetStudyWithSeriesQuery,
  useGetSeriesDetailQuery,
  useGetStudiesQuery,
} from './dicomApi';
import type { Study, Series, Instance, StudyFilters, ViewportDisplayState, StudyWithSeries, SeriesWithInstances } from '@/types/dicom';
import type { ToolType } from '@/lib/cornerstone/types';
import {
  getStudy as getStoredStudy,
  getStudyFilesAsBlobUrls,
  type StoredStudy,
} from '@/lib/storage/dicomStorage';
import {
  isStaticStudy,
  getStaticStudyWithSeries,
  getStaticSeriesForStudy,
  getStaticInstancesForSeries,
} from '@/lib/mock/dicomData';

// Local storage key - kept for backwards compatibility/migration
const LOCAL_STUDIES_KEY = 'mri-platform-local-studies';

/**
 * Interface for local studies stored in localStorage
 */
interface LocalStudyData extends Study {
  isLocal: true;
  objectUrls: string[];
}

/**
 * Error thrown when local study data has expired (blob URLs invalidated after page reload)
 */
export class LocalStudyExpiredError extends Error {
  constructor(studyInstanceUID: string) {
    super(`Local study "${studyInstanceUID}" has expired. Blob URLs are invalidated after page reload. Please re-upload the DICOM files.`);
    this.name = 'LocalStudyExpiredError';
  }
}

/**
 * Get static study with series structure (for pre-loaded DICOM files in public/dicom/)
 */
function getStaticStudyData(studyInstanceUID: string): { study: StudyWithSeries; expired: boolean } | null {
  const studyWithSeries = getStaticStudyWithSeries(studyInstanceUID);
  if (!studyWithSeries) return null;

  // Convert series to SeriesWithInstances format
  const seriesWithInstances: SeriesWithInstances[] = studyWithSeries.series.map((s) => {
    const instances = getStaticInstancesForSeries(s.seriesInstanceUID);
    return {
      ...s,
      instances: instances.map((inst) => ({
        ...inst,
        _staticUrl: (inst as any)._staticUrl,
      })),
    };
  });

  return {
    study: {
      ...studyWithSeries,
      series: seriesWithInstances,
    },
    expired: false, // Static studies never expire
  };
}

/**
 * Retrieve a local study from IndexedDB and convert to StudyWithSeries format
 * Creates fresh blob URLs from stored ArrayBuffer data
 */
async function getLocalStudyWithSeries(studyInstanceUID: string): Promise<{ study: StudyWithSeries; expired: boolean } | null> {
  if (typeof window === 'undefined') return null;

  try {
    // First, check if this is a static study (pre-loaded files)
    if (isStaticStudy(studyInstanceUID)) {
      return getStaticStudyData(studyInstanceUID);
    }

    // Then, try to get from IndexedDB
    const storedStudy = await getStoredStudy(studyInstanceUID);

    if (storedStudy) {
      // Get fresh blob URLs from stored file data
      const urls = await getStudyFilesAsBlobUrls(studyInstanceUID);

      if (urls.length === 0) {
        return null;
      }

      // Create mock series and instances for the local study
      const seriesInstanceUID = `${studyInstanceUID}.1`;

      const instances: (Instance & { _localUrl?: string })[] = urls.map((url, index) => ({
        id: `${studyInstanceUID}-instance-${index + 1}`,
        sopInstanceUID: `${studyInstanceUID}.1.${index + 1}`,
        seriesInstanceUID,
        instanceNumber: index + 1,
        rows: 512,
        columns: 512,
        bitsAllocated: 16,
        bitsStored: 12,
        pixelRepresentation: 0,
        windowCenter: 40,
        windowWidth: 400,
        rescaleIntercept: 0,
        rescaleSlope: 1,
        sliceThickness: 3,
        sliceLocation: index * 3,
        imagePositionPatient: `0\\0\\${index * 3}`,
        imageOrientationPatient: '1\\0\\0\\0\\1\\0',
        pixelSpacing: '0.5\\0.5',
        createdAt: storedStudy.createdAt,
        _localUrl: url,
      }));

      const series: SeriesWithInstances = {
        id: `${studyInstanceUID}-series-1`,
        seriesInstanceUID,
        studyInstanceUID,
        seriesNumber: 1,
        seriesDescription: storedStudy.studyDescription || 'Local Upload',
        modality: storedStudy.modality as any,
        bodyPart: null,
        numberOfInstances: instances.length,
        createdAt: storedStudy.createdAt,
        instances,
      };

      const study: StudyWithSeries = {
        id: `local-${studyInstanceUID}`,
        studyInstanceUID,
        studyDate: storedStudy.studyDate || '',
        studyTime: '',
        studyDescription: storedStudy.studyDescription || 'Local Upload',
        accessionNumber: '',
        patientId: storedStudy.patientId || 'LOCAL',
        patientName: storedStudy.patientName || 'Uploaded Patient',
        patientBirthDate: '',
        patientSex: '',
        modality: storedStudy.modality as any,
        numberOfSeries: 1,
        numberOfInstances: instances.length,
        createdAt: storedStudy.createdAt,
        updatedAt: storedStudy.updatedAt,
        series: [series],
      };

      return { study, expired: false };
    }

    // Fallback: try localStorage for backwards compatibility
    // This handles studies uploaded before IndexedDB migration
    const stored = localStorage.getItem(LOCAL_STUDIES_KEY);
    if (stored) {
      const localStudies: LocalStudyData[] = JSON.parse(stored);
      const study = localStudies.find(s => s.studyInstanceUID === studyInstanceUID);

      if (study) {
        const urls = study.objectUrls || [];

        // Legacy localStorage studies have expired blob URLs after refresh
        if (urls.length === 0) {
          return { study: createEmptyStudy(studyInstanceUID, study), expired: true };
        }

        // Create study structure from legacy data
        const seriesInstanceUID = `${studyInstanceUID}.1`;
        const instances: (Instance & { _localUrl?: string })[] = urls.map((url, index) => ({
          id: `${studyInstanceUID}-instance-${index + 1}`,
          sopInstanceUID: `${studyInstanceUID}.1.${index + 1}`,
          seriesInstanceUID,
          instanceNumber: index + 1,
          rows: 512,
          columns: 512,
          bitsAllocated: 16,
          bitsStored: 12,
          pixelRepresentation: 0,
          windowCenter: 40,
          windowWidth: 400,
          rescaleIntercept: 0,
          rescaleSlope: 1,
          sliceThickness: 3,
          sliceLocation: index * 3,
          imagePositionPatient: `0\\0\\${index * 3}`,
          imageOrientationPatient: '1\\0\\0\\0\\1\\0',
          pixelSpacing: '0.5\\0.5',
          createdAt: study.createdAt,
          _localUrl: url,
        }));

        const series: SeriesWithInstances = {
          id: `${studyInstanceUID}-series-1`,
          seriesInstanceUID,
          studyInstanceUID,
          seriesNumber: 1,
          seriesDescription: study.studyDescription || 'Local Upload',
          modality: study.modality,
          bodyPart: null,
          numberOfInstances: instances.length,
          createdAt: study.createdAt,
          instances,
        };

        return {
          study: { ...study, series: [series] },
          expired: false,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[DicomHooks] Error retrieving local study:', error);
    return null;
  }
}

/**
 * Helper to create an empty study structure for expired studies
 */
function createEmptyStudy(studyInstanceUID: string, metadata: Partial<Study>): StudyWithSeries {
  const seriesInstanceUID = `${studyInstanceUID}.1`;
  return {
    id: `local-${studyInstanceUID}`,
    studyInstanceUID,
    studyDate: metadata.studyDate || '',
    studyTime: '',
    studyDescription: metadata.studyDescription || 'Expired Study',
    accessionNumber: '',
    patientId: metadata.patientId || 'LOCAL',
    patientName: metadata.patientName || 'Unknown',
    patientBirthDate: '',
    patientSex: '',
    modality: metadata.modality || 'OT' as any,
    numberOfSeries: 1,
    numberOfInstances: metadata.numberOfInstances || 0,
    createdAt: metadata.createdAt || new Date().toISOString(),
    updatedAt: metadata.updatedAt || new Date().toISOString(),
    series: [{
      id: `${studyInstanceUID}-series-1`,
      seriesInstanceUID,
      studyInstanceUID,
      seriesNumber: 1,
      seriesDescription: 'Expired',
      modality: metadata.modality || 'OT' as any,
      bodyPart: null,
      numberOfInstances: 0,
      createdAt: metadata.createdAt || new Date().toISOString(),
      instances: [],
    }],
  };
}

/**
 * Hook for managing DICOM state
 */
export function useDicom() {
  const dispatch = useAppDispatch();
  const dicomState = useAppSelector((state) => state.dicom);

  const selectStudy = useCallback(
    (study: Study | null) => {
      dispatch(setCurrentStudy(study));
    },
    [dispatch]
  );

  const selectSeries = useCallback(
    (series: Series | null) => {
      dispatch(setCurrentSeries(series));
    },
    [dispatch]
  );

  const setInstances = useCallback(
    (instances: Instance[]) => {
      dispatch(setCurrentInstances(instances));
    },
    [dispatch]
  );

  return {
    ...dicomState,
    selectStudy,
    selectSeries,
    setInstances,
  };
}

// Local study state type for reducer
interface LocalStudyState {
  study: StudyWithSeries | null;
  loading: boolean;
  error: string | null;
  expired: boolean;
  loadedUID: string | null;
}

type LocalStudyAction =
  | { type: 'START_LOADING'; uid: string }
  | { type: 'LOAD_SUCCESS'; study: StudyWithSeries; expired: boolean; error: string | null }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'RESET' };

function localStudyReducer(state: LocalStudyState, action: LocalStudyAction): LocalStudyState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, loading: true, error: null, expired: false, loadedUID: action.uid };
    case 'LOAD_SUCCESS':
      return { study: action.study, loading: false, error: action.error, expired: action.expired, loadedUID: state.loadedUID };
    case 'LOAD_ERROR':
      return { ...state, study: null, loading: false, error: action.error };
    case 'RESET':
      return { study: null, loading: false, error: null, expired: false, loadedUID: null };
    default:
      return state;
  }
}

const initialLocalStudyState: LocalStudyState = {
  study: null,
  loading: false,
  error: null,
  expired: false,
  loadedUID: null,
};

/**
 * Hook for loading a study with series
 * Supports both remote studies (via API) and local studies (via localStorage)
 */
export function useStudyLoader(studyInstanceUID: string | undefined) {
  const dispatch = useAppDispatch();

  // Memoize isLocal/isStatic check to prevent infinite loops
  // Both local (uploaded) and static (pre-loaded) studies are handled similarly
  const isLocal = studyInstanceUID?.startsWith('local-') ?? false;
  const isStatic = studyInstanceUID ? isStaticStudy(studyInstanceUID) : false;
  const needsLocalLoading = isLocal || isStatic;

  // Use reducer for atomic state updates
  const [localState, dispatchLocal] = useReducer(localStudyReducer, initialLocalStudyState);

  // Use ref to track loading to prevent duplicate loads (refs don't trigger re-renders)
  const loadingRef = useRef<string | null>(null);

  // Only use API query for non-local and non-static studies
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useGetStudyWithSeriesQuery(
    studyInstanceUID!,
    { skip: !studyInstanceUID || needsLocalLoading }
  );

  // Load local/static study (async for local, sync for static but kept async for consistency)
  useEffect(() => {
    // Skip if not local/static or no UID
    if (!needsLocalLoading || !studyInstanceUID) {
      return;
    }

    // Skip if we've already started loading this study
    if (loadingRef.current === studyInstanceUID) {
      return;
    }

    loadingRef.current = studyInstanceUID;
    dispatchLocal({ type: 'START_LOADING', uid: studyInstanceUID });

    // Track if this effect is still mounted
    let isMounted = true;

    // Load the study data asynchronously from IndexedDB
    const loadStudy = async () => {
      try {
        const result = await getLocalStudyWithSeries(studyInstanceUID);

        // Only update state if still mounted
        if (!isMounted) {
          return;
        }

        if (result) {
          dispatchLocal({
            type: 'LOAD_SUCCESS',
            study: result.study,
            expired: result.expired,
            error: result.expired
              ? 'This study has expired. The DICOM files were uploaded in a previous session and need to be re-uploaded to view.'
              : null,
          });
          dispatch(setCurrentStudy(result.study));
        } else {
          dispatchLocal({ type: 'LOAD_ERROR', error: 'Local study not found in IndexedDB or localStorage' });
        }
      } catch (error) {
        console.error('[DicomHooks] Error loading study:', error);
        if (isMounted) {
          dispatchLocal({ type: 'LOAD_ERROR', error: `Failed to load study: ${error}` });
        }
      }
    };

    loadStudy();

    // Cleanup function - reset loadingRef so remount will re-trigger load
    return () => {
      isMounted = false;
      // Reset loadingRef on unmount so the effect can re-run on remount
      // This handles React Strict Mode and HMR which unmount/remount components
      loadingRef.current = null;
    };
  }, [studyInstanceUID, needsLocalLoading, dispatch]);

  // Dispatch API data to Redux when loaded
  useEffect(() => {
    if (apiData && !needsLocalLoading) {
      dispatch(setCurrentStudy(apiData));
    }
  }, [apiData, needsLocalLoading, dispatch]);

  // Return appropriate data based on study type
  const study = needsLocalLoading ? localState.study : apiData;
  // For local/static studies, consider loading if:
  // 1. We're explicitly loading (localState.loading), OR
  // 2. We haven't loaded yet (no study) AND we haven't errored (no error) AND we have a UID to load
  // This prevents the brief flash where loading=false before the effect runs
  const isLoading = needsLocalLoading
    ? (localState.loading || (!localState.study && !localState.error && !!studyInstanceUID))
    : apiLoading;
  const error = needsLocalLoading ? (localState.error ? { message: localState.error } : null) : apiError;

  const refetch = useCallback(async () => {
    if (needsLocalLoading && studyInstanceUID) {
      loadingRef.current = null; // Reset the ref to allow re-loading
      dispatchLocal({ type: 'RESET' });

      // Use setTimeout to ensure the reset is processed before starting new load
      setTimeout(async () => {
        loadingRef.current = studyInstanceUID;
        try {
          const result = await getLocalStudyWithSeries(studyInstanceUID);
          if (result) {
            dispatchLocal({
              type: 'LOAD_SUCCESS',
              study: result.study,
              expired: result.expired,
              error: result.expired
                ? 'This study has expired. The DICOM files were uploaded in a previous session and need to be re-uploaded to view.'
                : null,
            });
            dispatch(setCurrentStudy(result.study));
          } else {
            dispatchLocal({ type: 'LOAD_ERROR', error: 'Local study not found in IndexedDB' });
          }
        } catch (error) {
          console.error('[DicomHooks] Refetch error:', error);
          dispatchLocal({ type: 'LOAD_ERROR', error: `Failed to reload study: ${error}` });
        }
      }, 0);
    } else {
      apiRefetch();
    }
  }, [needsLocalLoading, studyInstanceUID, dispatch, apiRefetch]);

  return {
    study,
    isLoading,
    error,
    refetch,
    isLocal: needsLocalLoading,
    isStatic,
    isExpired: localState.expired,
  };
}

/**
 * Hook for loading series with instances
 * Supports both remote series (via API) and local series (via localStorage)
 */
export function useSeriesLoader(
  studyInstanceUID: string | undefined,
  seriesInstanceUID: string | undefined
) {
  const dispatch = useAppDispatch();

  // Memoize isLocal/isStatic check to prevent infinite loops
  const isLocal = studyInstanceUID?.startsWith('local-') ?? false;
  const isStatic = studyInstanceUID ? isStaticStudy(studyInstanceUID) : false;
  const needsLocalLoading = isLocal || isStatic;

  // State for local series loading
  // Start with loading=true if we have both UIDs for local studies
  const [localSeries, setLocalSeries] = useState<SeriesWithInstances | null>(null);
  const [localLoading, setLocalLoading] = useState(() =>
    needsLocalLoading && !!studyInstanceUID && !!seriesInstanceUID
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Track if we've already loaded this series to prevent re-fetching
  const loadedSeriesRef = useRef<string | null>(null);

  // Only use API query for non-local/non-static studies
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useGetSeriesDetailQuery(
    { studyInstanceUID: studyInstanceUID!, seriesInstanceUID: seriesInstanceUID! },
    { skip: !studyInstanceUID || !seriesInstanceUID || needsLocalLoading }
  );

  // When series UID changes for local/static studies, set loading state
  useEffect(() => {
    if (needsLocalLoading && studyInstanceUID && seriesInstanceUID) {
      const seriesKey = `${studyInstanceUID}-${seriesInstanceUID}`;
      if (loadedSeriesRef.current !== seriesKey) {
        setLocalLoading(true);
      }
    }
  }, [needsLocalLoading, studyInstanceUID, seriesInstanceUID]);

  // Load local/static series (async for local, sync for static but kept async for consistency)
  useEffect(() => {
    const seriesKey = `${studyInstanceUID}-${seriesInstanceUID}`;
    if (needsLocalLoading && studyInstanceUID && seriesInstanceUID && loadedSeriesRef.current !== seriesKey) {
      loadedSeriesRef.current = seriesKey;
      setLocalError(null);
      setIsExpired(false);

      let isMounted = true;

      const loadSeries = async () => {
        try {
          const result = await getLocalStudyWithSeries(studyInstanceUID);
          if (!isMounted) return;

          if (result) {
            const series = result.study.series.find((s: SeriesWithInstances) => s.seriesInstanceUID === seriesInstanceUID);
            if (series) {
              setLocalSeries(series);
              setIsExpired(result.expired);
              dispatch(setCurrentSeries(series));
              dispatch(setCurrentInstances(series.instances));
              if (result.expired) {
                setLocalError('This study has expired. Please re-upload the DICOM files.');
              }
            } else {
              setLocalError('Series not found');
            }
          } else {
            setLocalError('Local study not found in IndexedDB');
          }
        } catch (error) {
          console.error('[DicomHooks] Error loading series:', error);
          if (isMounted) {
            setLocalError(`Failed to load series: ${error}`);
          }
        } finally {
          if (isMounted) {
            setLocalLoading(false);
          }
        }
      };

      // Small delay to ensure state updates are batched
      const timer = setTimeout(loadSeries, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [studyInstanceUID, seriesInstanceUID, needsLocalLoading, dispatch]);

  // Dispatch API data to Redux when loaded
  useEffect(() => {
    if (apiData && !needsLocalLoading) {
      dispatch(setCurrentSeries(apiData));
      dispatch(setCurrentInstances(apiData.instances));
    }
  }, [apiData, needsLocalLoading, dispatch]);

  // Return appropriate data based on study type
  const series = needsLocalLoading ? localSeries : apiData;
  // For local/static studies, show loading if we have params but haven't loaded yet
  // For API studies, use the API loading state
  const isLoading = needsLocalLoading
    ? (localLoading || (!!studyInstanceUID && !!seriesInstanceUID && !localSeries && !localError))
    : apiLoading;
  const error = needsLocalLoading ? (localError ? { message: localError } : null) : apiError;

  const refetch = useCallback(async () => {
    if (needsLocalLoading && studyInstanceUID && seriesInstanceUID) {
      loadedSeriesRef.current = null; // Allow re-fetch
      setLocalLoading(true);
      try {
        const result = await getLocalStudyWithSeries(studyInstanceUID);
        if (result) {
          const seriesData = result.study.series.find((s: SeriesWithInstances) => s.seriesInstanceUID === seriesInstanceUID);
          if (seriesData) {
            setLocalSeries(seriesData);
            setIsExpired(result.expired);
            dispatch(setCurrentSeries(seriesData));
            dispatch(setCurrentInstances(seriesData.instances));
          }
        }
      } catch (error) {
        console.error('[DicomHooks] Series refetch error:', error);
        setLocalError(`Failed to reload series: ${error}`);
      } finally {
        setLocalLoading(false);
        loadedSeriesRef.current = `${studyInstanceUID}-${seriesInstanceUID}`;
      }
    } else {
      apiRefetch();
    }
  }, [needsLocalLoading, studyInstanceUID, seriesInstanceUID, dispatch, apiRefetch]);

  return {
    series,
    instances: series?.instances || [],
    isLoading,
    error,
    refetch,
    isLocal: needsLocalLoading,
    isStatic,
    isExpired,
  };
}

/**
 * Hook for viewport management
 */
export function useViewport(viewportId: string) {
  const dispatch = useAppDispatch();
  const activeViewportId = useAppSelector((state) => state.dicom.activeViewportId);
  const viewportState = useAppSelector(
    (state) => state.dicom.viewportStates[viewportId]
  );

  const isActive = activeViewportId === viewportId;

  const setActive = useCallback(() => {
    dispatch(setActiveViewport(viewportId));
  }, [dispatch, viewportId]);

  const updateState = useCallback(
    (state: Partial<ViewportDisplayState>) => {
      dispatch(setViewportState({ viewportId, state }));
    },
    [dispatch, viewportId]
  );

  const reset = useCallback(() => {
    dispatch(resetViewportState(viewportId));
  }, [dispatch, viewportId]);

  return {
    isActive,
    viewportState,
    setActive,
    updateState,
    reset,
  };
}

/**
 * Hook for image loading progress
 */
export function useImageLoading() {
  const dispatch = useAppDispatch();
  const { imageLoadingProgress, isLoadingImages } = useAppSelector(
    (state) => state.dicom
  );

  const setProgress = useCallback(
    (progress: number) => {
      dispatch(setImageLoadingProgress(progress));
    },
    [dispatch]
  );

  const setLoading = useCallback(
    (loading: boolean) => {
      dispatch(setIsLoadingImages(loading));
    },
    [dispatch]
  );

  return {
    progress: imageLoadingProgress,
    isLoading: isLoadingImages,
    setProgress,
    setLoading,
  };
}

/**
 * Hook for study list with filtering and pagination
 */
export function useStudyList(initialFilters?: StudyFilters) {
  const dispatch = useAppDispatch();
  const { filters, currentPage, pageSize } = useAppSelector((state) => state.dicom);

  const queryFilters = {
    ...filters,
    ...initialFilters,
    page: currentPage,
    limit: pageSize,
  };

  const { data, isLoading, error, refetch } = useGetStudiesQuery(queryFilters);

  const setFilter = useCallback(
    (key: keyof StudyFilters, value: any) => {
      dispatch(updateFilter({ key, value }));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const goToPage = useCallback(
    (page: number) => {
      dispatch(setCurrentPage(page));
    },
    [dispatch]
  );

  return {
    studies: data?.items || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    currentPage,
    pageSize,
    isLoading,
    error,
    filters,
    setFilter,
    resetFilters,
    goToPage,
    refetch,
  };
}

/**
 * Hook for active tool management
 */
export function useActiveTool(viewportId: string = 'main-viewport') {
  const [activeTool, setActiveToolState] = useState<ToolType | null>(null);

  const setActiveTool = useCallback((tool: ToolType) => {
    setActiveToolState(tool);
    // Import dynamically to avoid SSR issues
    import('@/lib/cornerstone/setup').then(async (setup) => {
      // Segmentation tools need a segmentation to exist first
      const isSegmentationTool = ['Brush', 'Eraser', 'PlanarFreehandROI', 'RectangleScissors', 'CircleScissors', 'SphereScissors'].includes(tool);

      if (isSegmentationTool) {
        // Ensure segmentation exists before activating tool
        await setup.ensureSegmentationExists(viewportId, 'default', [255, 0, 0]);
      }

      // Handle segmentation tools specially
      if (tool === 'Brush') {
        setup.activateBrushTool(undefined, false);
      } else if (tool === 'Eraser') {
        setup.activateBrushTool(undefined, true);
      } else if (tool === 'PlanarFreehandROI') {
        setup.activateFreehandSegmentationTool();
      } else if (tool === 'RectangleScissors') {
        setup.activateScissorsTool(undefined, 'rectangle');
      } else if (tool === 'CircleScissors') {
        setup.activateScissorsTool(undefined, 'circle');
      } else if (tool === 'SphereScissors') {
        setup.activateScissorsTool(undefined, 'sphere');
      } else {
        setup.setActiveTool(tool);
      }
    });
  }, [viewportId]);

  // Toggle eraser mode (for right-click behavior)
  const setEraserMode = useCallback((enabled: boolean) => {
    import('@/lib/cornerstone/setup').then((setup) => {
      setup.setEraserMode(enabled);
    });
  }, []);

  return {
    activeTool,
    setActiveTool,
    setEraserMode,
  };
}

/**
 * Hook for Cornerstone initialization
 */
export function useCornerstoneInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) {
      // Check if Cornerstone is actually initialized (in case of HMR)
      import('@/lib/cornerstone/setup').then(({ isCornerstoneInitialized }) => {
        if (isCornerstoneInitialized() && !isInitialized) {
          setIsInitialized(true);
        }
      });
      return;
    }
    initRef.current = true;

    const init = async () => {
      try {
        const { initializeCornerstone, isCornerstoneInitialized } = await import('@/lib/cornerstone/setup');

        // Check if already initialized (in case of HMR or re-render)
        if (isCornerstoneInitialized()) {
          setIsInitialized(true);
          return;
        }

        await initializeCornerstone();
        setIsInitialized(true);
      } catch (err) {
        console.error('[DicomHooks] Failed to initialize Cornerstone:', err);
        setError(err instanceof Error ? err : new Error('Initialization failed'));
      }
    };

    init();

    // Note: We don't cleanup on unmount because Cornerstone should persist
    // across component mounts/unmounts during normal navigation
    // Cleanup only happens on full page reload or explicit destroy
  }, [isInitialized]);

  return { isInitialized, error };
}

/**
 * Hook for stack navigation (scrolling through slices)
 */
export function useStackNavigation(totalImages: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalImages) {
        setCurrentIndex(index);
      }
    },
    [totalImages]
  );

  const nextImage = useCallback(() => {
    goToImage(currentIndex + 1);
  }, [currentIndex, goToImage]);

  const prevImage = useCallback(() => {
    goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  const goToFirst = useCallback(() => {
    goToImage(0);
  }, [goToImage]);

  const goToLast = useCallback(() => {
    goToImage(totalImages - 1);
  }, [goToImage, totalImages]);

  return {
    currentIndex,
    totalImages,
    goToImage,
    nextImage,
    prevImage,
    goToFirst,
    goToLast,
    isFirst: currentIndex === 0,
    isLast: currentIndex === totalImages - 1,
  };
}
