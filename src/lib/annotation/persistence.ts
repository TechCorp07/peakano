/**
 * Annotation Persistence Service
 * Handles saving, loading, and exporting annotations
 * 
 * Phase 2: Persistence implementation
 * - localStorage fallback for offline support
 * - Backend API integration when available
 * - Auto-save functionality
 * - Export to JSON and DICOM SEG formats
 * 
 * @module annotation/persistence
 */

import type { CanvasAnnotation } from '@/components/medical/DicomViewer/AnnotationCanvas';

// ============================================================================
// Types
// ============================================================================

/**
 * Serializable annotation format for storage
 */
export interface SerializableAnnotation {
  id: string;
  type: 'freehand' | 'brush' | 'polygon' | 'eraser' | 'eraser-freehand' | 'eraser-polygon';
  points: Array<{ x: number; y: number; z?: number }>;
  completed: boolean;
  radius?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Annotation session containing all annotations for a study
 */
export interface AnnotationSession {
  id: string;
  studyUid: string;
  seriesUid: string;
  userId?: string;
  annotations: Record<number, SerializableAnnotation[]>; // sliceIndex -> annotations
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    totalAnnotations: number;
    annotatedSlices: number[];
  };
}

/**
 * Storage key generator
 */
const getStorageKey = (studyUid: string, seriesUid: string): string => {
  return `annotations_${studyUid}_${seriesUid}`;
};

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  debounceMs: number;
}

const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  intervalMs: 30000, // 30 seconds
  debounceMs: 2000,  // 2 seconds after last change
};

// ============================================================================
// Serialization / Deserialization
// ============================================================================

/**
 * Convert CanvasAnnotation to serializable format
 */
export function serializeAnnotation(annotation: CanvasAnnotation): SerializableAnnotation {
  const points = annotation.points || [];
  return {
    id: annotation.id,
    type: annotation.type,
    points: points.map(p => ({
      x: p.x,
      y: p.y,
      z: (p as { x: number; y: number; z?: number }).z,
    })),
    completed: annotation.completed || false,
    radius: annotation.radius,
    color: annotation.color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert serializable format back to CanvasAnnotation
 */
export function deserializeAnnotation(data: SerializableAnnotation): CanvasAnnotation {
  return {
    id: data.id,
    type: data.type,
    points: data.points.map(p => ({ x: p.x, y: p.y })),
    completed: data.completed,
    radius: data.radius,
    color: data.color,
  };
}

/**
 * Serialize all annotations for a session
 */
export function serializeSession(
  studyUid: string,
  seriesUid: string,
  annotationsMap: Map<string, CanvasAnnotation[]>,
  userId?: string
): AnnotationSession {
  const annotations: Record<number, SerializableAnnotation[]> = {};
  const annotatedSlices: number[] = [];
  let totalAnnotations = 0;

  // Parse the map keys (format: "viewport_sliceIndex")
  annotationsMap.forEach((anns, key) => {
    const parts = key.split('_');
    const sliceIndex = parseInt(parts[parts.length - 1], 10);
    
    if (!isNaN(sliceIndex) && anns.length > 0) {
      annotations[sliceIndex] = anns.map(serializeAnnotation);
      annotatedSlices.push(sliceIndex);
      totalAnnotations += anns.length;
    }
  });

  return {
    id: `session_${Date.now()}`,
    studyUid,
    seriesUid,
    userId,
    annotations,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalAnnotations,
      annotatedSlices: annotatedSlices.sort((a, b) => a - b),
    },
  };
}

/**
 * Deserialize session back to annotation map
 */
export function deserializeSession(
  session: AnnotationSession,
  viewportId: string = 'main-viewport'
): Map<string, CanvasAnnotation[]> {
  const map = new Map<string, CanvasAnnotation[]>();

  Object.entries(session.annotations).forEach(([sliceIndex, anns]) => {
    const key = `${viewportId}_${sliceIndex}`;
    map.set(key, anns.map(deserializeAnnotation));
  });

  return map;
}

// ============================================================================
// LocalStorage Operations
// ============================================================================

/**
 * Save annotations to localStorage
 */
export function saveToLocalStorage(
  studyUid: string,
  seriesUid: string,
  annotationsMap: Map<string, CanvasAnnotation[]>,
  userId?: string
): boolean {
  try {
    const session = serializeSession(studyUid, seriesUid, annotationsMap, userId);
    const key = getStorageKey(studyUid, seriesUid);
    localStorage.setItem(key, JSON.stringify(session));
    console.log(`[Persistence] Saved ${session.metadata.totalAnnotations} annotations to localStorage`);
    return true;
  } catch (error) {
    console.error('[Persistence] Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Load annotations from localStorage
 */
export function loadFromLocalStorage(
  studyUid: string,
  seriesUid: string,
  viewportId: string = 'main-viewport'
): Map<string, CanvasAnnotation[]> | null {
  try {
    const key = getStorageKey(studyUid, seriesUid);
    const data = localStorage.getItem(key);
    
    if (!data) {
      console.log('[Persistence] No saved annotations found in localStorage');
      return null;
    }

    const session: AnnotationSession = JSON.parse(data);
    const map = deserializeSession(session, viewportId);
    console.log(`[Persistence] Loaded ${session.metadata.totalAnnotations} annotations from localStorage`);
    return map;
  } catch (error) {
    console.error('[Persistence] Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Check if annotations exist in localStorage
 */
export function hasLocalStorageAnnotations(studyUid: string, seriesUid: string): boolean {
  const key = getStorageKey(studyUid, seriesUid);
  return localStorage.getItem(key) !== null;
}

/**
 * Delete annotations from localStorage
 */
export function deleteFromLocalStorage(studyUid: string, seriesUid: string): boolean {
  try {
    const key = getStorageKey(studyUid, seriesUid);
    localStorage.removeItem(key);
    console.log('[Persistence] Deleted annotations from localStorage');
    return true;
  } catch (error) {
    console.error('[Persistence] Failed to delete from localStorage:', error);
    return false;
  }
}

/**
 * Get all stored annotation sessions from localStorage
 */
export function getAllLocalStorageSessions(): AnnotationSession[] {
  const sessions: AnnotationSession[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('annotations_')) {
        const data = localStorage.getItem(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }
    }
  } catch (error) {
    console.error('[Persistence] Failed to list sessions:', error);
  }

  return sessions;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export annotations as JSON
 */
export function exportAsJSON(
  studyUid: string,
  seriesUid: string,
  annotationsMap: Map<string, CanvasAnnotation[]>,
  userId?: string
): string {
  const session = serializeSession(studyUid, seriesUid, annotationsMap, userId);
  return JSON.stringify(session, null, 2);
}

/**
 * Export annotations as CSV
 */
export function exportAsCSV(
  studyUid: string,
  seriesUid: string,
  annotationsMap: Map<string, CanvasAnnotation[]>
): string {
  const rows: string[] = [
    'slice_index,annotation_id,type,points_count,is_closed,created_at',
  ];

  annotationsMap.forEach((anns, key) => {
    const parts = key.split('_');
    const sliceIndex = parts[parts.length - 1];
    
    anns.forEach(ann => {
      const points = ann.points || [];
      rows.push([
        sliceIndex,
        ann.id,
        ann.type,
        points.length.toString(),
        (ann.completed || false).toString(),
        new Date().toISOString(),
      ].join(','));
    });
  });

  return rows.join('\n');
}

/**
 * Export annotation contours as points CSV (for analysis)
 */
export function exportContoursAsCSV(
  annotationsMap: Map<string, CanvasAnnotation[]>
): string {
  const rows: string[] = [
    'slice_index,annotation_id,point_index,x,y',
  ];

  annotationsMap.forEach((anns, key) => {
    const parts = key.split('_');
    const sliceIndex = parts[parts.length - 1];
    
    anns.forEach(ann => {
      const points = ann.points || [];
      points.forEach((point, pointIndex) => {
        rows.push([
          sliceIndex,
          ann.id,
          pointIndex.toString(),
          point.x.toFixed(2),
          point.y.toFixed(2),
        ].join(','));
      });
    });
  });

  return rows.join('\n');
}

/**
 * Create downloadable blob from export data
 */
export function createDownloadBlob(
  data: string,
  format: 'json' | 'csv'
): Blob {
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  return new Blob([data], { type: mimeType });
}

/**
 * Trigger file download in browser
 */
export function downloadFile(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download annotations
 */
export function exportAndDownload(
  studyUid: string,
  seriesUid: string,
  annotationsMap: Map<string, CanvasAnnotation[]>,
  format: 'json' | 'csv' | 'contours-csv' = 'json',
  userId?: string
): void {
  let data: string;
  let filename: string;
  let blobFormat: 'json' | 'csv';

  switch (format) {
    case 'json':
      data = exportAsJSON(studyUid, seriesUid, annotationsMap, userId);
      filename = `annotations_${seriesUid}_${Date.now()}.json`;
      blobFormat = 'json';
      break;
    case 'csv':
      data = exportAsCSV(studyUid, seriesUid, annotationsMap);
      filename = `annotations_${seriesUid}_${Date.now()}.csv`;
      blobFormat = 'csv';
      break;
    case 'contours-csv':
      data = exportContoursAsCSV(annotationsMap);
      filename = `contours_${seriesUid}_${Date.now()}.csv`;
      blobFormat = 'csv';
      break;
  }

  const blob = createDownloadBlob(data, blobFormat);
  downloadFile(blob, filename);
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import annotations from JSON file
 */
export function importFromJSON(
  jsonString: string,
  viewportId: string = 'main-viewport'
): { session: AnnotationSession; annotations: Map<string, CanvasAnnotation[]> } | null {
  try {
    const session: AnnotationSession = JSON.parse(jsonString);
    
    // Validate session structure
    if (!session.studyUid || !session.seriesUid || !session.annotations) {
      throw new Error('Invalid annotation session format');
    }

    const annotations = deserializeSession(session, viewportId);
    console.log(`[Persistence] Imported ${session.metadata.totalAnnotations} annotations`);
    
    return { session, annotations };
  } catch (error) {
    console.error('[Persistence] Failed to import JSON:', error);
    return null;
  }
}

/**
 * Read file and parse as JSON
 */
export async function importFromFile(
  file: File,
  viewportId: string = 'main-viewport'
): Promise<{ session: AnnotationSession; annotations: Map<string, CanvasAnnotation[]> } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importFromJSON(content, viewportId);
      resolve(result);
    };
    
    reader.onerror = () => {
      console.error('[Persistence] Failed to read file');
      resolve(null);
    };
    
    reader.readAsText(file);
  });
}

// ============================================================================
// DICOM SEG Export (Placeholder for future implementation)
// ============================================================================

/**
 * Export annotations as DICOM Segmentation Object
 * Note: This is a placeholder - full implementation requires dcmjs library
 */
export interface DicomSegExportOptions {
  studyUid: string;
  seriesUid: string;
  sopInstanceUid?: string;
  segmentLabel: string;
  segmentDescription?: string;
  segmentAlgorithmType: 'MANUAL' | 'SEMIAUTOMATIC' | 'AUTOMATIC';
  creatorName?: string;
}

export function exportAsDicomSeg(
  _annotationsMap: Map<string, CanvasAnnotation[]>,
  _imageWidth: number,
  _imageHeight: number,
  _options: DicomSegExportOptions
): Uint8Array | null {
  console.warn('[Persistence] DICOM SEG export not yet implemented - requires dcmjs integration');
  // TODO: Implement DICOM SEG export using dcmjs library
  // This would involve:
  // 1. Converting annotations to binary labelmap
  // 2. Creating DICOM SEG dataset with proper headers
  // 3. Encoding the segmentation frames
  return null;
}

// ============================================================================
// Auto-Save Manager
// ============================================================================

/**
 * AutoSaveManager class for managing automatic saving
 */
export class AutoSaveManager {
  private config: AutoSaveConfig;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private pendingChanges: boolean = false;
  private saveCallback: (() => void) | null = null;
  private lastSaveTime: number = 0;

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_SAVE_CONFIG, ...config };
  }

  /**
   * Initialize auto-save with a callback
   */
  start(saveCallback: () => void): void {
    this.saveCallback = saveCallback;
    
    if (this.config.enabled) {
      // Start interval timer
      this.intervalTimer = setInterval(() => {
        if (this.pendingChanges) {
          this.save();
        }
      }, this.config.intervalMs);
    }
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    
    // Save any pending changes before stopping
    if (this.pendingChanges) {
      this.save();
    }
  }

  /**
   * Mark that changes have been made (triggers debounced save)
   */
  markDirty(): void {
    this.pendingChanges = true;

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.save();
    }, this.config.debounceMs);
  }

  /**
   * Perform save operation
   */
  private save(): void {
    if (this.saveCallback && this.pendingChanges) {
      this.saveCallback();
      this.pendingChanges = false;
      this.lastSaveTime = Date.now();
    }
  }

  /**
   * Force immediate save
   */
  saveNow(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingChanges = true;
    this.save();
  }

  /**
   * Get last save time
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return this.pendingChanges;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart interval if running
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      if (this.config.enabled) {
        this.intervalTimer = setInterval(() => {
          if (this.pendingChanges) {
            this.save();
          }
        }, this.config.intervalMs);
      }
    }
  }
}

// ============================================================================
// Singleton Auto-Save Instance
// ============================================================================

let autoSaveInstance: AutoSaveManager | null = null;

export function getAutoSaveManager(): AutoSaveManager {
  if (!autoSaveInstance) {
    autoSaveInstance = new AutoSaveManager();
  }
  return autoSaveInstance;
}
