# Phase 2: Persistence - Documentation

## Overview

Phase 2 implements annotation persistence functionality for the Medical Imaging Annotation Platform. This phase adds:

1. **LocalStorage Persistence** - Save annotations to browser storage
2. **Auto-Save** - Automatic saving with debounce and interval-based backup
3. **Load on Open** - Automatically restore annotations when opening a study
4. **Export Formats** - JSON and CSV export capabilities
5. **Import Support** - Load annotations from JSON files
6. **UI Controls** - Save status indicators and management panel

---

## 1. Persistence Service (`src/lib/annotation/persistence.ts`)

### Purpose
Core persistence functionality for serializing, storing, and retrieving annotations.

### Key Types

```typescript
interface SerializableAnnotation {
  id: string;
  type: 'freehand' | 'brush' | 'polygon' | 'eraser' | 'eraser-freehand' | 'eraser-polygon';
  points: Array<{ x: number; y: number; z?: number }>;
  completed: boolean;
  radius?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnotationSession {
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
```

### LocalStorage Functions

| Function | Description |
|----------|-------------|
| `saveToLocalStorage` | Save annotations to localStorage |
| `loadFromLocalStorage` | Load annotations from localStorage |
| `hasLocalStorageAnnotations` | Check if saved annotations exist |
| `deleteFromLocalStorage` | Remove annotations from localStorage |
| `getAllLocalStorageSessions` | List all stored sessions |

### Export Functions

| Function | Description | Output |
|----------|-------------|--------|
| `exportAsJSON` | Full session export | JSON string |
| `exportAsCSV` | Summary export | CSV string |
| `exportContoursAsCSV` | Point-by-point export | CSV string |
| `exportAndDownload` | Export and trigger download | File download |

### Import Functions

| Function | Description |
|----------|-------------|
| `importFromJSON` | Parse JSON string to session |
| `importFromFile` | Read and parse JSON file |

### Example Usage

```typescript
import { 
  saveToLocalStorage,
  loadFromLocalStorage,
  exportAndDownload,
  importFromFile
} from '@/lib/annotation';

// Save annotations
saveToLocalStorage(studyUid, seriesUid, annotationsMap, userId);

// Load annotations
const loaded = loadFromLocalStorage(studyUid, seriesUid, 'main-viewport');

// Export as JSON
exportAndDownload(studyUid, seriesUid, annotationsMap, 'json');

// Import from file
const result = await importFromFile(file, 'main-viewport');
if (result) {
  // Apply result.annotations to store
}
```

---

## 2. Auto-Save Manager

### Purpose
Manages automatic saving with intelligent debouncing and periodic backups.

### Configuration

```typescript
interface AutoSaveConfig {
  enabled: boolean;      // Enable/disable auto-save
  intervalMs: number;    // Periodic save interval (default: 30s)
  debounceMs: number;    // Debounce delay after changes (default: 2s)
}
```

### AutoSaveManager Class

```typescript
class AutoSaveManager {
  start(saveCallback: () => void): void;  // Start auto-save
  stop(): void;                           // Stop and save pending
  markDirty(): void;                      // Mark changes for save
  saveNow(): void;                        // Force immediate save
  hasPendingChanges(): boolean;           // Check for unsaved changes
  getLastSaveTime(): number;              // Get timestamp of last save
}
```

### Example Usage

```typescript
import { AutoSaveManager } from '@/lib/annotation';

const autoSave = new AutoSaveManager({
  enabled: true,
  debounceMs: 2000,
  intervalMs: 30000,
});

// Start auto-save with callback
autoSave.start(() => {
  saveToLocalStorage(studyUid, seriesUid, annotations);
});

// Mark changes when user draws
function onAnnotationChange() {
  autoSave.markDirty();
}

// Stop on unmount
useEffect(() => {
  return () => autoSave.stop();
}, []);
```

---

## 3. Persistence Hook (`src/lib/annotation/useAnnotationPersistence.ts`)

### Purpose
React hook that provides complete persistence functionality with state management.

### Interface

```typescript
interface UsePersistenceOptions {
  studyUid: string;
  seriesUid: string;
  userId?: string;
  viewportId?: string;
  autoSave?: boolean;
  autoSaveDebounceMs?: number;
  autoSaveIntervalMs?: number;
  autoLoadOnMount?: boolean;
}

interface UsePersistenceReturn {
  // State
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  annotatedSlices: number[];
  totalAnnotations: number;
  
  // Actions
  save: () => Promise<boolean>;
  load: () => Promise<boolean>;
  clear: () => void;
  exportAnnotations: (format: 'json' | 'csv' | 'contours-csv') => void;
  importAnnotations: (file: File) => Promise<boolean>;
}
```

### Example Usage

```typescript
import { useAnnotationPersistence } from '@/lib/annotation';

function AnnotationViewer({ studyUid, seriesUid }) {
  const {
    saveStatus,
    hasUnsavedChanges,
    totalAnnotations,
    annotatedSlices,
    save,
    exportAnnotations,
  } = useAnnotationPersistence({
    studyUid,
    seriesUid,
    autoSave: true,
    autoLoadOnMount: true,
  });

  return (
    <div>
      <span>Status: {saveStatus}</span>
      <span>Annotations: {totalAnnotations}</span>
      <button onClick={() => save()}>Save</button>
      <button onClick={() => exportAnnotations('json')}>Export</button>
    </div>
  );
}
```

### Features

1. **Auto-load on mount** - Automatically loads saved annotations when component mounts
2. **Auto-save on changes** - Saves annotations after debounce when changes detected
3. **Change detection** - Tracks whether annotations have changed since last save
4. **Before unload warning** - Prompts user before leaving with unsaved changes
5. **Error handling** - Catches and exposes save/load errors

---

## 4. UI Component (`src/components/medical/DicomViewer/AnnotationPersistencePanel.tsx`)

### Purpose
Visual interface for managing annotation persistence.

### Features

| Feature | Description |
|---------|-------------|
| Save Status | Icon indicator showing current save state |
| Statistics | Total annotations and annotated slices count |
| Progress Bar | Visual progress of annotated slices |
| Save Button | Manual save trigger (highlighted when unsaved) |
| Export Menu | Dropdown with JSON/CSV export options |
| Import Button | File picker for JSON import |
| Clear Button | Delete all annotations (with confirmation) |
| Slice Preview | Shows which slices have annotations |

### Integration

The panel is integrated into the **Advanced** tab of `ViewerContextPanel`:

```tsx
<AnnotationPersistencePanel 
  studyUid={studyInstanceUID}
  seriesUid={seriesInstanceUID}
  totalSlices={totalSlices}
/>
```

---

## 5. Storage Format

### LocalStorage Key Format
```
annotations_{studyUid}_{seriesUid}
```

### Session JSON Structure
```json
{
  "id": "session_1737302400000",
  "studyUid": "1.2.3.4.5",
  "seriesUid": "1.2.3.4.5.6",
  "userId": "user-123",
  "annotations": {
    "0": [
      {
        "id": "ann_1",
        "type": "freehand",
        "points": [{"x": 100, "y": 100}, {"x": 150, "y": 120}],
        "completed": true,
        "createdAt": "2026-01-19T12:00:00.000Z",
        "updatedAt": "2026-01-19T12:00:00.000Z"
      }
    ],
    "5": [...]
  },
  "metadata": {
    "createdAt": "2026-01-19T12:00:00.000Z",
    "updatedAt": "2026-01-19T12:05:00.000Z",
    "version": "1.0.0",
    "totalAnnotations": 15,
    "annotatedSlices": [0, 5, 10, 15]
  }
}
```

---

## 6. File Structure

```
src/lib/annotation/
├── persistence.ts              # Core persistence service
├── useAnnotationPersistence.ts # React hook
├── index.ts                    # Updated exports

src/components/medical/DicomViewer/
├── AnnotationPersistencePanel.tsx  # UI component
└── ViewerContextPanel.tsx          # Integration point
```

---

## 7. Export Formats

### JSON Export
Full session data including all annotations, metadata, and study information.

### CSV Export (Summary)
```csv
slice_index,annotation_id,type,points_count,is_closed,created_at
0,ann_1,freehand,25,true,2026-01-19T12:00:00.000Z
5,ann_2,polygon,8,true,2026-01-19T12:01:00.000Z
```

### Contours CSV Export
```csv
slice_index,annotation_id,point_index,x,y
0,ann_1,0,100.00,100.00
0,ann_1,1,105.50,102.30
0,ann_1,2,110.00,105.00
```

---

## 8. Future Enhancements (Phase 3+)

- **Backend Sync** - Save to annotation service API
- **DICOM SEG Export** - Export as DICOM Segmentation objects
- **Conflict Resolution** - Handle concurrent edits
- **Version History** - Undo/redo with versioning
- **Cloud Storage** - S3/GCS backup integration

---

## 9. Dependencies

### No New Dependencies Required
Uses existing:
- `zustand` - State management
- `lucide-react` - Icons
- Browser `localStorage` API

---

## 10. Testing

### Manual Testing Steps

1. **Save Test**
   - Open a study
   - Create some annotations
   - Click Save or wait for auto-save
   - Refresh page
   - Verify annotations are restored

2. **Export Test**
   - Create annotations
   - Export as JSON
   - Verify file downloads
   - Open file and check content

3. **Import Test**
   - Export annotations
   - Clear all annotations
   - Import the exported file
   - Verify annotations are restored

4. **Auto-Save Test**
   - Create annotations
   - Wait 2 seconds (debounce)
   - Check status shows "Saved"
   - Modify annotation
   - Check status shows "Unsaved"
   - Wait for auto-save

5. **Unload Warning Test**
   - Create unsaved annotations
   - Try to close tab
   - Verify warning appears
