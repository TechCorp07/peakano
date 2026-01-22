/**
 * useAnnotationPersistence Hook
 * React hook for annotation persistence functionality
 * 
 * Provides:
 * - Auto-save management
 * - Load/save operations
 * - Export functionality
 * - Save status indicators
 * 
 * @module annotation/hooks/useAnnotationPersistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasAnnotationStore } from '@/features/annotation';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  hasLocalStorageAnnotations,
  deleteFromLocalStorage,
  exportAndDownload,
  importFromFile,
  AutoSaveManager,
  type AnnotationSession,
} from './persistence';
import type { CanvasAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';

// ============================================================================
// Types
// ============================================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

export interface PersistenceState {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UsePersistenceOptions {
  studyUid: string;
  seriesUid: string;
  userId?: string;
  viewportId?: string;
  autoSave?: boolean;
  autoSaveDebounceMs?: number;
  autoSaveIntervalMs?: number;
  autoLoadOnMount?: boolean;
}

export interface UsePersistenceReturn extends PersistenceState {
  // Actions
  save: () => Promise<boolean>;
  load: () => Promise<boolean>;
  clear: () => void;
  exportAnnotations: (format: 'json' | 'csv' | 'contours-csv') => void;
  importAnnotations: (file: File) => Promise<boolean>;
  
  // Metadata
  annotatedSlices: number[];
  totalAnnotations: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAnnotationPersistence(
  options: UsePersistenceOptions
): UsePersistenceReturn {
  const {
    studyUid,
    seriesUid,
    userId,
    viewportId = 'main-viewport',
    autoSave = true,
    autoSaveDebounceMs = 2000,
    autoSaveIntervalMs = 30000,
    autoLoadOnMount = true,
  } = options;

  // State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotatedSlices, setAnnotatedSlices] = useState<number[]>([]);
  const [totalAnnotations, setTotalAnnotations] = useState(0);

  // Store access
  const { annotations, setAnnotations, clearAllAnnotations } = useCanvasAnnotationStore();

  // Auto-save manager ref
  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null);

  // Track previous annotations for change detection
  const prevAnnotationsRef = useRef<Map<string, CanvasAnnotation[]>>(new Map());

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const updateMetadata = useCallback((annotationsMap: Map<string, CanvasAnnotation[]>) => {
    const slices: number[] = [];
    let total = 0;

    annotationsMap.forEach((anns, key) => {
      const parts = key.split('_');
      const sliceIndex = parseInt(parts[parts.length - 1], 10);
      
      if (!isNaN(sliceIndex) && anns.length > 0) {
        slices.push(sliceIndex);
        total += anns.length;
      }
    });

    setAnnotatedSlices(slices.sort((a, b) => a - b));
    setTotalAnnotations(total);
  }, []);

  // ============================================================================
  // Save Operation
  // ============================================================================

  const save = useCallback(async (): Promise<boolean> => {
    if (!studyUid || !seriesUid) {
      setError('Missing study or series UID');
      return false;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      const success = saveToLocalStorage(studyUid, seriesUid, annotations, userId);
      
      if (success) {
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        updateMetadata(annotations);
        
        // Reset status after delay
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        
        return true;
      } else {
        throw new Error('Failed to save to localStorage');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setSaveStatus('error');
      return false;
    }
  }, [studyUid, seriesUid, annotations, userId, updateMetadata]);

  // ============================================================================
  // Load Operation
  // ============================================================================

  const load = useCallback(async (): Promise<boolean> => {
    if (!studyUid || !seriesUid) {
      setError('Missing study or series UID');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedAnnotations = loadFromLocalStorage(studyUid, seriesUid, viewportId);
      
      if (loadedAnnotations) {
        // Clear existing and set loaded annotations
        loadedAnnotations.forEach((anns, key) => {
          setAnnotations(key, anns);
        });
        
        updateMetadata(loadedAnnotations);
        setHasUnsavedChanges(false);
        prevAnnotationsRef.current = new Map(loadedAnnotations);
        
        console.log(`[Persistence] Loaded annotations for ${annotatedSlices.length} slices`);
        return true;
      } else {
        console.log('[Persistence] No saved annotations found');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [studyUid, seriesUid, viewportId, setAnnotations, updateMetadata, annotatedSlices.length]);

  // ============================================================================
  // Clear Operation
  // ============================================================================

  const clear = useCallback(() => {
    deleteFromLocalStorage(studyUid, seriesUid);
    clearAllAnnotations();
    setAnnotatedSlices([]);
    setTotalAnnotations(0);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
    prevAnnotationsRef.current = new Map();
  }, [studyUid, seriesUid, clearAllAnnotations]);

  // ============================================================================
  // Export Operation
  // ============================================================================

  const exportAnnotations = useCallback((format: 'json' | 'csv' | 'contours-csv') => {
    exportAndDownload(studyUid, seriesUid, annotations, format, userId);
  }, [studyUid, seriesUid, annotations, userId]);

  // ============================================================================
  // Import Operation
  // ============================================================================

  const importAnnotations = useCallback(async (file: File): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await importFromFile(file, viewportId);
      
      if (result) {
        // Verify the import matches current study/series
        if (result.session.studyUid !== studyUid || result.session.seriesUid !== seriesUid) {
          console.warn('[Persistence] Imported annotations are for a different study/series');
          // Still allow import but warn user
        }

        // Set annotations
        result.annotations.forEach((anns, key) => {
          setAnnotations(key, anns);
        });
        
        updateMetadata(result.annotations);
        setHasUnsavedChanges(true);
        
        return true;
      } else {
        throw new Error('Failed to parse import file');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [studyUid, seriesUid, viewportId, setAnnotations, updateMetadata]);

  // ============================================================================
  // Change Detection
  // ============================================================================

  useEffect(() => {
    // Compare current annotations with previous
    const currentKeys = Array.from(annotations.keys()).sort();
    const prevKeys = Array.from(prevAnnotationsRef.current.keys()).sort();

    let hasChanges = currentKeys.length !== prevKeys.length;

    if (!hasChanges) {
      for (const key of currentKeys) {
        const current = annotations.get(key) || [];
        const prev = prevAnnotationsRef.current.get(key) || [];
        
        if (current.length !== prev.length) {
          hasChanges = true;
          break;
        }
        
        // Deep compare (simplified - just check IDs)
        const currentIds = current.map(a => a.id).sort();
        const prevIds = prev.map(a => a.id).sort();
        
        if (JSON.stringify(currentIds) !== JSON.stringify(prevIds)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      updateMetadata(annotations);
      
      // Trigger auto-save
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.markDirty();
      }
    }
  }, [annotations, updateMetadata]);

  // ============================================================================
  // Auto-Save Setup
  // ============================================================================

  useEffect(() => {
    if (autoSave && studyUid && seriesUid) {
      autoSaveManagerRef.current = new AutoSaveManager({
        enabled: true,
        debounceMs: autoSaveDebounceMs,
        intervalMs: autoSaveIntervalMs,
      });

      autoSaveManagerRef.current.start(() => {
        save();
      });
    }

    return () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.stop();
        autoSaveManagerRef.current = null;
      }
    };
  }, [autoSave, autoSaveDebounceMs, autoSaveIntervalMs, studyUid, seriesUid, save]);

  // ============================================================================
  // Auto-Load on Mount
  // ============================================================================

  useEffect(() => {
    if (autoLoadOnMount && studyUid && seriesUid) {
      // Check if annotations exist
      if (hasLocalStorageAnnotations(studyUid, seriesUid)) {
        load();
      }
    }
  }, [autoLoadOnMount, studyUid, seriesUid, load]);

  // ============================================================================
  // Before Unload Warning
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved annotations. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    isLoading,
    error,
    annotatedSlices,
    totalAnnotations,
    
    // Actions
    save,
    load,
    clear,
    exportAnnotations,
    importAnnotations,
  };
}
