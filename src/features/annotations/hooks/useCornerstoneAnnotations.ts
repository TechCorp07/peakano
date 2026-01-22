/**
 * useCornerstoneAnnotations Hook
 * Bridges Cornerstone3D annotation system with Zustand store
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAnnotationStore } from '../store';
import type { Annotation, AnnotationToolType, Label } from '@/types/annotation';
import type { CornerstoneAnnotationEvent, CornerstoneToolsModule } from '@/types/dicom';

/**
 * Map Cornerstone tool names to our annotation types
 */
const TOOL_NAME_MAP: Record<string, AnnotationToolType> = {
  Length: 'length',
  RectangleROI: 'rectangle',
  EllipticalROI: 'ellipse',
  CircleROI: 'circleROI',
  Probe: 'probe',
  Angle: 'angle',
  Bidirectional: 'bidirectional',
  ArrowAnnotate: 'arrowAnnotate',
  FreehandROI: 'freehand',
  PlanarFreehandROI: 'freehand',
  SplineROI: 'polygon',
};

/**
 * Cornerstone annotation data structure
 */
interface CornerstoneAnnotationData {
  metadata?: {
    toolName?: string;
    viewportId?: string;
    referencedImageId?: string;
  };
  data?: {
    handles?: {
      points?: Array<{ x: number; y: number; z?: number }>;
      textBox?: { worldPosition: number[] };
    };
    cachedStats?: Record<string, unknown>;
    text?: string;
    label?: string;
  };
  annotationUID?: string;
}

/**
 * Generate a unique annotation ID
 */
function generateAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert Cornerstone annotation to our Annotation type
 */
function convertCornerstoneAnnotation(
  csAnnotation: CornerstoneAnnotationData,
  studyInstanceUID: string,
  seriesInstanceUID: string,
  sopInstanceUID: string,
  imageIndex: number,
  selectedLabel?: Label | null
): Annotation {
  const toolType = TOOL_NAME_MAP[csAnnotation.metadata?.toolName || ''] || 'length';

  return {
    id: generateAnnotationId(),
    type: toolType,
    data: {
      handles: {
        points: csAnnotation.data?.handles?.points || [],
        activeHandleIndex: csAnnotation.data?.handles?.activeHandleIndex,
        textBox: csAnnotation.data?.handles?.textBox,
      },
      cachedStats: csAnnotation.data?.cachedStats,
      label: selectedLabel?.name || csAnnotation.data?.label,
      isLocked: csAnnotation.isLocked,
      isVisible: csAnnotation.isVisible,
    },
    sopInstanceUID,
    seriesInstanceUID,
    studyInstanceUID,
    frameOfReferenceUID: csAnnotation.metadata?.FrameOfReferenceUID,
    imageIndex,
    // Label association
    labelId: selectedLabel?.id,
    labelName: selectedLabel?.name,
    labelColor: selectedLabel?.color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cornerstoneAnnotationUID: csAnnotation.annotationUID,
  };
}

/**
 * Hook options
 */
interface UseCornerstoneAnnotationsOptions {
  /** Current viewport element */
  viewportElement?: HTMLDivElement | null;
  /** Current study UID */
  studyInstanceUID?: string;
  /** Current series UID */
  seriesInstanceUID?: string;
  /** Current SOP instance UID */
  sopInstanceUID?: string;
  /** Current image index */
  imageIndex?: number;
  /** Enable event listening */
  enabled?: boolean;
}

/**
 * Hook to sync Cornerstone annotations with Zustand store
 */
export function useCornerstoneAnnotations({
  viewportElement,
  studyInstanceUID = '',
  seriesInstanceUID = '',
  sopInstanceUID = '',
  imageIndex = 0,
  enabled = true,
}: UseCornerstoneAnnotationsOptions = {}) {
  const {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    annotations,
    activeAnnotationId,
    setActiveAnnotation,
    labels,
    selectedLabelId,
  } = useAnnotationStore();

  // Get the currently selected label
  const selectedLabel = selectedLabelId
    ? labels.find((l) => l.id === selectedLabelId) || null
    : null;

  // Track if we're initialized
  const isInitializedRef = useRef(false);
  const csToolsRef = useRef<CornerstoneToolsModule | null>(null);

  // Initialize Cornerstone tools reference
  useEffect(() => {
    if (!enabled) return;

    const initTools = async () => {
      try {
        const tools = await import('@cornerstonejs/tools');
        csToolsRef.current = tools as unknown as CornerstoneToolsModule;
        isInitializedRef.current = true;
      } catch (error) {
        console.error('[useCornerstoneAnnotations] Failed to load Cornerstone tools:', error);
      }
    };

    initTools();
  }, [enabled]);

  // Handle annotation added event
  const handleAnnotationAdded = useCallback(
    (event: CornerstoneAnnotationEvent) => {
      if (!studyInstanceUID || !seriesInstanceUID || !sopInstanceUID) return;

      const annotation = event.detail?.annotation;
      if (!annotation) return;

      const converted = convertCornerstoneAnnotation(
        annotation as CornerstoneAnnotationData,
        studyInstanceUID,
        seriesInstanceUID,
        sopInstanceUID,
        imageIndex,
        selectedLabel
      );

      addAnnotation(converted);
    },
    [studyInstanceUID, seriesInstanceUID, sopInstanceUID, imageIndex, selectedLabel, addAnnotation]
  );

  // Handle annotation modified event
  const handleAnnotationModified = useCallback(
    (event: CornerstoneAnnotationEvent) => {
      const csAnnotation = event.detail?.annotation;
      if (!csAnnotation?.annotationUID) return;

      // Find our annotation by Cornerstone UID
      const existing = annotations.find(
        (a) => a.cornerstoneAnnotationUID === csAnnotation.annotationUID
      );

      if (existing) {
        updateAnnotation(existing.id, {
          data: {
            handles: {
              points: csAnnotation.data?.handles?.points || [],
              activeHandleIndex: csAnnotation.data?.handles?.activeHandleIndex,
              textBox: csAnnotation.data?.handles?.textBox,
            },
            cachedStats: csAnnotation.data?.cachedStats,
            label: csAnnotation.data?.label,
            isLocked: csAnnotation.isLocked,
            isVisible: csAnnotation.isVisible,
          },
        });
      }
    },
    [annotations, updateAnnotation]
  );

  // Handle annotation removed event
  const handleAnnotationRemoved = useCallback(
    (event: CornerstoneAnnotationEvent) => {
      const csAnnotationUID = event.detail?.annotation?.annotationUID;
      if (!csAnnotationUID) return;

      // Find our annotation by Cornerstone UID
      const existing = annotations.find(
        (a) => a.cornerstoneAnnotationUID === csAnnotationUID
      );

      if (existing) {
        deleteAnnotation(existing.id);
      }
    },
    [annotations, deleteAnnotation]
  );

  // Handle annotation selection event
  const handleAnnotationSelected = useCallback(
    (event: CornerstoneAnnotationEvent) => {
      const csAnnotationUID = event.detail?.annotation?.annotationUID;
      if (!csAnnotationUID) {
        setActiveAnnotation(null);
        return;
      }

      // Find our annotation by Cornerstone UID
      const existing = annotations.find(
        (a) => a.cornerstoneAnnotationUID === csAnnotationUID
      );

      if (existing) {
        setActiveAnnotation(existing.id);
      }
    },
    [annotations, setActiveAnnotation]
  );

  // Set up Cornerstone event listeners
  useEffect(() => {
    if (!enabled || !viewportElement || !isInitializedRef.current) return;

    const csTools = csToolsRef.current;
    if (!csTools?.Enums?.Events) return;

    const { Events } = csTools.Enums;

    // Add event listeners
    viewportElement.addEventListener(Events.ANNOTATION_ADDED, handleAnnotationAdded);
    viewportElement.addEventListener(Events.ANNOTATION_MODIFIED, handleAnnotationModified);
    viewportElement.addEventListener(Events.ANNOTATION_REMOVED, handleAnnotationRemoved);
    viewportElement.addEventListener(Events.ANNOTATION_SELECTION_CHANGE, handleAnnotationSelected);

    return () => {
      // Remove event listeners
      viewportElement.removeEventListener(Events.ANNOTATION_ADDED, handleAnnotationAdded);
      viewportElement.removeEventListener(Events.ANNOTATION_MODIFIED, handleAnnotationModified);
      viewportElement.removeEventListener(Events.ANNOTATION_REMOVED, handleAnnotationRemoved);
      viewportElement.removeEventListener(Events.ANNOTATION_SELECTION_CHANGE, handleAnnotationSelected);
    };
  }, [
    enabled,
    viewportElement,
    handleAnnotationAdded,
    handleAnnotationModified,
    handleAnnotationRemoved,
    handleAnnotationSelected,
  ]);

  // Get annotations for current image
  const currentImageAnnotations = annotations.filter(
    (a) => a.sopInstanceUID === sopInstanceUID
  );

  // Get annotations for current series
  const currentSeriesAnnotations = annotations.filter(
    (a) => a.seriesInstanceUID === seriesInstanceUID
  );

  // Delete annotation from Cornerstone
  const deleteCornerstoneAnnotation = useCallback(
    async (annotationId: string) => {
      const annotation = annotations.find((a) => a.id === annotationId);
      if (!annotation?.cornerstoneAnnotationUID || !csToolsRef.current) return;

      try {
        const { annotation: annotationModule } = csToolsRef.current;
        annotationModule.state.removeAnnotation(annotation.cornerstoneAnnotationUID);
        deleteAnnotation(annotationId);
      } catch (error) {
        console.error('[useCornerstoneAnnotations] Failed to delete annotation:', error);
      }
    },
    [annotations, deleteAnnotation]
  );

  // Clear all annotations from Cornerstone for current image
  const clearCornerstoneAnnotations = useCallback(async () => {
    if (!csToolsRef.current) return;

    try {
      const { annotation: annotationModule } = csToolsRef.current;

      // Remove each annotation from Cornerstone
      currentImageAnnotations.forEach((ann) => {
        if (ann.cornerstoneAnnotationUID) {
          annotationModule.state.removeAnnotation(ann.cornerstoneAnnotationUID);
        }
        deleteAnnotation(ann.id);
      });
    } catch (error) {
      console.error('[useCornerstoneAnnotations] Failed to clear annotations:', error);
    }
  }, [currentImageAnnotations, deleteAnnotation]);

  return {
    // Current annotations
    annotations,
    currentImageAnnotations,
    currentSeriesAnnotations,

    // Active annotation
    activeAnnotationId,
    activeAnnotation: annotations.find((a) => a.id === activeAnnotationId) || null,

    // Actions
    addAnnotation,
    updateAnnotation,
    deleteAnnotation: deleteCornerstoneAnnotation,
    clearAnnotations: clearCornerstoneAnnotations,
    setActiveAnnotation,

    // Status
    isInitialized: isInitializedRef.current,
  };
}
