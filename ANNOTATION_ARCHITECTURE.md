# Annotation Architecture

## Overview

This document describes the comprehensive architecture for the DICOM annotation system in the MRI Scan Reading Tool. The system is designed to handle multi-slice medical images (e.g., 138 slices per study) where users annotate one slice at a time, with support for AI-powered segmentation.

## Recommended Approach

**Canvas overlay for drawing + Cornerstone3D for viewing/navigation + AI Backend for intelligent segmentation**

### Comparison

| Aspect | Canvas Overlay | Cornerstone3D Segmentation | AI Segmentation |
|--------|---------------|---------------------------|-----------------|
| **Drawing UX** | Smooth, immediate feedback | Can be laggy, complex setup | Click-based, AI does the work |
| **Multi-slice support** | Simple Map per slice | Requires volume setup | Slice-aware prompts |
| **Custom tools** | Full control | Limited to built-in tools | Model-specific |
| **3D visualization** | Need to convert | Built-in but tightly coupled | Backend can generate |
| **Reliability** | Works with any image source | Struggles with blob URLs/stacks | Requires backend service |

### Why This Approach

1. **Better User Experience**: Canvas provides smooth, immediate visual feedback during drawing
2. **Simpler Architecture**: Per-slice annotations stored in a simple Map structure
3. **Full Control**: Custom tools (freehand, brush, eraser, polygon) with custom cursors
4. **Reliability**: Works regardless of how DICOM images are loaded (blob URLs, WADO-RS, etc.)
5. **Decoupled**: Drawing system is independent of viewing system
6. **AI-Powered**: MedSAM2/SAM integration for intelligent one-click segmentation

## Workflow

```
1. USER DRAWS (Canvas) OR AI SEGMENTS (MedSAM/SAM)
   └─> Per-slice annotations stored in Map<sliceIndex, annotations[]>
   └─> Mode tools control how new annotations combine with existing

2. USER NAVIGATES (Cornerstone3D)
   └─> Scroll through slices, canvas syncs to show that slice's annotations

3. VIEW IN 3D (Optional - Cornerstone3D Volume)
   └─> Compile all slice annotations → 3D labelmap → Volume render
```

## Current Implementation

### What's Working

#### Core Drawing Tools
- ✅ Per-slice annotation storage (`Map<number, CanvasAnnotation[]>`)
- ✅ Freehand tool with loop detection and fill
- ✅ Brush tool with configurable radius
- ✅ Eraser tool
- ✅ Polygon tool with vertex editing
- ✅ Custom SVG cursors for each tool
- ✅ Right-click temporary eraser mode (for freehand/brush)
- ✅ Keyboard shortcuts (F, B, E, P, W, G, I, S, Escape)
- ✅ Tool indicator overlay
- ✅ Slice navigation synced with annotations

#### Mode Tools (Mask Operation Modes)
- ✅ **Replace Mode**: New annotation replaces all existing on slice
- ✅ **Add Mode**: New annotation appends to existing (default)
- ✅ **Subtract Mode**: New annotation subtracts from existing
- ✅ **Intersect Mode**: New annotation intersects with existing
- ✅ Modifier keys: Shift=Add, Alt=Subtract

#### Smart Tools
- ✅ **Magic Wand**: Threshold-based selection from seed point
- ✅ **Region Growing**: Intensity-based region expansion
- ✅ **Interpolation**: Auto-fill between annotated slices

#### AI Segmentation (MedSAM/SAM Integration)
- ✅ **Point Prompts**: Foreground (+) and Background (-) points
- ✅ **Box Prompts**: Bounding box for region of interest
- ✅ **Model Selection**: MedSAM2, SAM, nnU-Net
- ✅ **Backend Integration**: FastAPI service at localhost:8006
- ✅ **Job-based Processing**: Async inference with status polling
- ✅ **Contour Extraction**: AI mask → polygon contour → annotation
- ✅ **Mode Integration**: AI results respect mask operation mode

### Key Files

```
src/
├── components/medical/DicomViewer/
│   ├── AIPromptOverlay.tsx         # Visual overlay for AI prompts
│   ├── AISegmentationPanel.tsx     # AI settings and controls
│   ├── AnnotationCanvas.tsx        # Canvas overlay component
│   ├── AnnotationProgressPanel.tsx # Progress tracking UI
│   ├── AnnotationSidebar.tsx       # Integrated sidebar (Phase 6)
│   ├── LabelManagementPanel.tsx    # Multi-label management UI
│   ├── SmartToolsPanel.tsx         # Smart tools (magic wand, region grow)
│   ├── Viewport.tsx                # Integrates canvas with DICOM viewer
│   ├── ViewerToolbar.tsx           # Two-row toolbar with all tools
│   └── Visualization3DPanel.tsx    # 3D labelmap and export UI
├── features/annotation/
│   ├── canvasStore.ts              # Zustand store for annotation state
│   └── index.ts                    # Feature exports
├── lib/annotation/
│   ├── brushTools.ts               # Brush tool utilities
│   ├── dicomSegExport.ts           # DICOM SEG export (Phase 6)
│   ├── index.ts                    # Library exports
│   ├── labelmap3D.ts               # 2D to 3D labelmap conversion
│   ├── maskOperations.ts           # Mask boolean operations
│   ├── measurementTools.ts         # Area, volume calculations
│   ├── mprOverlay.ts               # MPR overlay utilities
│   ├── multiLabelStore.ts          # Multi-label Zustand store (Phase 6)
│   ├── persistence.ts              # Save/load annotations
│   ├── progressTracking.ts         # Progress calculation
│   ├── store.ts                    # Annotation tools store with mode
│   ├── thresholdSegmentation.ts    # Threshold tools
│   ├── useAnnotationPersistence.ts # Persistence hook
│   ├── useMaskOperations.ts        # Mask operations hook
│   ├── useProgressTracking.ts      # Progress hook
│   └── volumeRendering.ts          # Volume render config
├── lib/aiSegmentation/
│   ├── api.ts                      # AI backend API client
│   ├── index.ts                    # Library exports
│   ├── store.ts                    # AI segmentation Zustand store
│   ├── types.ts                    # TypeScript types for AI
│   └── useAISegmentation.ts        # Main AI segmentation hook
├── lib/smartTools/
│   ├── api.ts                      # Smart tools API (if backend)
│   ├── index.ts                    # Library exports
│   ├── interpolation.ts            # Slice interpolation algorithm
│   ├── magicWand.ts                # Magic wand flood fill
│   ├── regionGrowing.ts            # Region growing algorithm
│   ├── store.ts                    # Smart tools Zustand store
│   ├── types.ts                    # TypeScript types
│   └── useSmartTools.ts            # Smart tools hook with mode support
```

## Data Structures

### Canvas Annotation Types

```typescript
type CanvasToolType = 'freehand' | 'brush' | 'eraser' | 'polygon' | 'none';

interface CanvasPoint {
  x: number;
  y: number;
}

interface PolygonAnnotation {
  id: string;
  type: 'polygon';
  points: CanvasPoint[];
  completed: boolean;
  color: string;
}

interface FreehandAnnotation {
  id: string;
  type: 'freehand';
  points: CanvasPoint[];
  completed: boolean;
  color: string;
}

interface BrushStroke {
  id: string;
  type: 'brush';
  points: CanvasPoint[];
  radius: number;
  color: string;
}

type CanvasAnnotation = PolygonAnnotation | FreehandAnnotation | BrushStroke;
```

### Mask Operation Types

```typescript
/**
 * Mask operation type for combining annotations
 */
export type MaskOperationType = 
  | 'replace'    // New replaces all existing
  | 'add'        // Append to existing (union)
  | 'union'      // Same as add
  | 'subtract'   // Remove from existing
  | 'intersect'  // Keep only overlap
  | 'xor'        // Keep non-overlapping
  | 'none';      // No operation
```

### AI Segmentation Types

```typescript
// Prompt types for AI segmentation
type PromptType = 'point' | 'box';

// AI model options
type AISegmentationModel = 'medsam2' | 'sam' | 'nnunet';

// Point prompt - positive (foreground) or negative (background)
interface PointPrompt {
  type: 'point';
  x: number;
  y: number;
  label: 0 | 1;  // 1 = foreground, 0 = background
  sliceIndex?: number;
}

// Box prompt - bounding box for region of interest
interface BoxPrompt {
  type: 'box';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sliceIndex?: number;
}

type Prompt = PointPrompt | BoxPrompt;

// Segmentation result mask
interface SegmentationMask {
  width: number;
  height: number;
  sliceIndex?: number;
  rle?: number[];           // Run-length encoded mask
  mask?: Uint8Array;        // Raw mask data
  contour?: [number, number][]; // Direct contour points from AI
  confidence?: number;
}
```

### Storage Structure

```typescript
// Annotations stored per slice index
Map<sliceIndex: number, annotations: CanvasAnnotation[]>

// For persistence, convert to serializable format:
{
  studyId: string,
  seriesId: string,
  slices: {
    [sliceIndex: number]: CanvasAnnotation[]
  }
}
```

## Roadmap

### Phase 1: Core Drawing (Completed)
- [x] Canvas overlay component
- [x] Freehand, Brush, Eraser, Polygon tools
- [x] Custom cursors
- [x] Right-click eraser mode
- [x] Keyboard shortcuts

### Phase 2: Persistence (Completed)
- [x] Save annotations to backend/localStorage
- [x] Auto-save on changes
- [x] Load annotations on study open
- [x] Export annotations (JSON, CSV)
- [x] Import annotations from JSON
- [x] UI panel with save status and controls

### Phase 3: Progress Tracking (Completed)
- [x] Slice progress indicator (show which slices have annotations)
- [x] Progress bar in study list
- [x] Annotation statistics (area, count per slice)
- [x] Completion tracking and marking
- [x] Progress panel UI component

### Phase 4: 3D Visualization (Completed)
- [x] Compile 2D annotations to 3D labelmap
- [x] Volume rendering configuration
- [x] MPR views with annotation overlay
- [x] Cross-reference line visualization
- [x] Coordinate conversion utilities

### Phase 5: Smart Tools (Completed)
- [x] Magic wand (threshold-based selection)
- [x] Region growing
- [x] Interpolation (auto-fill between annotated slices)
- [x] Smart tools store with configuration
- [x] Integration with mask operation modes

### Phase 6: Integration & Export (Completed)
- [x] DICOM SEG export (standards-compliant segmentation format)
- [x] Multi-label segmentation store with presets
- [x] Label management panel (add/edit/delete labels, color picker)
- [x] Integrated annotation sidebar (combines labels, progress, 3D)
- [x] 3D visualization panel with labelmap generation
- [x] Export options (DICOM SEG, JSON)

### Phase 7: AI Segmentation (Completed)
- [x] MedSAM2/SAM model integration
- [x] AI backend API client (FastAPI at localhost:8006)
- [x] Point prompts (foreground/background)
- [x] Box prompts for region of interest
- [x] AI segmentation store (Zustand)
- [x] useAISegmentation hook
- [x] AISegmentationPanel component
- [x] AIPromptOverlay component
- [x] Job-based async processing with polling
- [x] Mask-to-contour extraction
- [x] Model selection (MedSAM2, SAM, nnU-Net)
- [x] Service health checking

### Phase 8: Mode Tools (Completed)
- [x] Mask operation mode store integration
- [x] Replace mode (clear and add new)
- [x] Add/Union mode (append to existing)
- [x] Subtract mode (remove from existing)
- [x] Intersect mode (keep only overlap)
- [x] Mode UI in ViewerToolbar
- [x] Keyboard modifiers (Shift=Add, Alt=Subtract)
- [x] Mode integration with Smart Tools
- [x] Mode integration with AI Segmentation

### Future Phases
- [ ] XOR mode full implementation
- [ ] Collaborative annotation (multi-user)
- [ ] NIfTI/NRRD export formats
- [ ] Server-side annotation storage
- [ ] nnU-Net auto-segmentation
- [ ] 3D propagation of AI segmentation

## Tool Behaviors

### Freehand Tool
- **Cursor**: Pen icon
- **Action**: Click and drag to draw freely
- **Completion**: Loop auto-closes when start/end points are near
- **Fill**: Translucent light green when loop is closed
- **Right-click**: Temporary eraser mode

### Brush Tool
- **Cursor**: Brush icon
- **Action**: Click and drag to paint
- **Size**: Configurable radius (default 15px)
- **Fill**: Translucent light green
- **Right-click**: Temporary eraser mode

### Eraser Tool
- **Cursor**: Eraser icon
- **Action**: Click and drag to erase
- **Behavior**: Removes any annotation that overlaps with eraser path

### Polygon Tool
- **Cursor**: Crosshair icon
- **Action**: Click to add vertices
- **Completion**: Click first vertex or double-click to close
- **Fill**: Translucent light green when closed
- **Editing**: Vertices can be dragged to resize (when selected)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Activate Freehand tool |
| `B` | Activate Brush tool |
| `E` | Activate Eraser tool |
| `P` | Activate Polygon tool |
| `W` | Activate Magic Wand |
| `G` | Activate Region Growing |
| `I` | Activate Interpolation |
| `S` | Activate AI Segmentation |
| `L` | Activate Length measurement |
| `R` | Activate Rectangle ROI |
| `A` | Activate Angle measurement |
| `D` | Activate Bidirectional measurement |
| `T` | Activate Threshold tool |
| `M` | Toggle MPR view |
| `O` | Toggle Overlay |
| `Escape` | Deactivate current tool / Cancel operation |
| `Delete` | Delete selected annotation |
| `Shift+Click` | Force Add mode (with smart/AI tools) |
| `Alt+Click` | Force Subtract mode (with smart/AI tools) |

## Configuration

### Default Colors

```typescript
// Fill color for annotations (translucent light green)
fillColor: 'rgba(144, 238, 144, 0.4)'

// Default brush radius
brushRadius: 15
```

### Customization

Colors and brush size can be modified through the `useCanvasAnnotationStore`:

```typescript
const { setFillColor, setBrushRadius } = useCanvasAnnotationStore();

setFillColor('rgba(255, 0, 0, 0.4)'); // Red
setBrushRadius(25); // Larger brush
```

## Integration Notes

### Adding New Tools

1. Add tool type to `CanvasToolType`
2. Add cursor SVG to `TOOL_CURSORS`
3. Implement drawing logic in `AnnotationCanvas`
4. Add to toolbar in `ViewerToolbar`
5. Add keyboard shortcut if needed

### Persisting Annotations

When implementing persistence:

1. Subscribe to `onAnnotationsChange` callback
2. Debounce saves to avoid excessive writes
3. Include study/series context for proper association
4. Consider DICOM SEG format for interoperability

### 3D Volume Conversion

To convert 2D annotations to 3D:

1. Create a 3D array matching image dimensions
2. For each slice, rasterize annotations to binary mask
3. Stack masks into volume
4. Use Cornerstone3D's segmentation display for rendering

---

## AI Segmentation System

### Overview

The AI Segmentation system integrates MedSAM2/SAM models for intelligent, one-click segmentation of medical structures. Users can place point or box prompts, and the AI generates accurate contours.

### Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Frontend UI    │ ───> │  API Client     │ ───> │  FastAPI Backend│
│ (React/Next.js) │      │  (api.ts)       │      │  (localhost:8006│
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ AISegmentation  │      │ useAISegment-   │      │ MedSAM2/SAM     │
│ Panel.tsx       │      │ ation.ts hook   │      │ Models (Docker) │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Components

#### AISegmentationPanel.tsx
Settings and controls panel:
- Model selection dropdown (MedSAM2, SAM, nnU-Net)
- Point mode toggle (foreground +1 / background 0)
- Prompts list with remove buttons
- Execute/Clear/Undo controls
- Job status indicator
- Service health status

#### AIPromptOverlay.tsx
Visual overlay on the DICOM viewport:
- Green circles for foreground points (+)
- Red circles for background points (-)
- Blue rectangles for box prompts
- Real-time drawing of box prompts

#### useAISegmentation.ts Hook
Main hook for AI segmentation operations:
- Manages prompts state
- Handles backend communication
- Polls job status
- Converts mask results to annotations
- Respects mask operation mode

### API Endpoints

```typescript
// Base URL: http://localhost:8006/api

// Health check
GET /v1/health/

// Interactive segmentation (point/box prompts)
POST /v1/inference/segment/interactive
Body: {
  study_uid: string,
  series_uid: string,
  instance_uid?: string,
  model: 'medsam2' | 'sam' | 'nnunet',
  prompts: Prompt[],
  output_format?: 'rle' | 'mask' | 'dicom_seg'
}
Response: { id: string, status: string, ... }

// Get job result
GET /v1/inference/jobs/{job_id}/result
Response: SegmentationMask

// List available models
GET /v1/smart/
Response: { tools: [{ name, display_name, type }] }
```

### Workflow

1. User activates AI Segmentation (press `S` or click AI Seg button)
2. User clicks on image to place foreground/background points
3. User optionally draws bounding box
4. User clicks Execute
5. Frontend sends request to backend
6. Backend returns job ID
7. Frontend polls for job completion
8. Result mask is converted to contour points
9. Contour is added as freehand annotation
10. Mask operation mode determines how it combines with existing

---

## Mode Tools System

### Overview

Mode Tools control how new annotations combine with existing annotations on a slice. This applies to all annotation sources: manual drawing, smart tools, and AI segmentation.

### Modes

| Mode | Behavior | Icon | Use Case |
|------|----------|------|----------|
| **Replace** | Clear all existing, add new | Plus | Start fresh on a slice |
| **Add** | Append to existing (union) | Plus | Extend annotation area |
| **Subtract** | Remove new from existing | Minus | Carve out regions |
| **Intersect** | Keep only overlapping area | Crosshair | Refine to common area |

### Implementation

#### Store (lib/annotation/store.ts)

```typescript
export type MaskOperationType = 'replace' | 'add' | 'union' | 'subtract' | 'intersect' | 'xor' | 'none';

export interface AnnotationToolsState {
  maskOperationMode: MaskOperationType;
  // ...
}

export interface AnnotationToolsActions {
  setMaskOperationMode: (mode: MaskOperationType) => void;
  // ...
}
```

#### ViewerToolbar Integration

The Mode tools appear in Row 2 of the toolbar:

```tsx
{/* Mask Selection Mode */}
<ToolGroup label="Mode">
  <ToolButton label="Replace" active={mode === 'replace'} onClick={() => handleMaskMode('replace')} />
  <ToolButton label="Add" active={mode === 'add'} onClick={() => handleMaskMode('add')} />
  <ToolButton label="Sub" active={mode === 'subtract'} onClick={() => handleMaskMode('subtract')} />
  <ToolButton label="Intersect" active={mode === 'intersect'} onClick={() => handleMaskMode('intersect')} />
</ToolGroup>
```

#### Smart Tools Integration (useSmartTools.ts)

```typescript
const resultToAnnotation = useCallback((result, eventModifiers) => {
  // Determine effective mode from event modifiers or store
  let effectiveMode = maskOperationMode;
  if (eventModifiers?.shiftKey) effectiveMode = 'add';
  else if (eventModifiers?.altKey) effectiveMode = 'subtract';

  // Handle different modes
  switch (effectiveMode) {
    case 'replace':
      setAnnotations(key, [annotation]);
      break;
    case 'add':
    case 'union':
      setAnnotations(key, [...existing, annotation]);
      break;
    case 'subtract':
      setAnnotations(key, [...existing, { ...annotation, type: 'eraser-freehand' }]);
      break;
    case 'intersect':
      setAnnotations(key, [...existing, annotation]);
      break;
  }
}, [maskOperationMode]);
```

### Modifier Keys

- **Shift+Click**: Forces Add mode regardless of toolbar selection
- **Alt+Click**: Forces Subtract mode regardless of toolbar selection

---

## ViewerToolbar Layout

### Two-Row Design

The toolbar is organized into two rows for better organization:

#### Row 1: Primary Tools
| Group | Tools |
|-------|-------|
| **Draw** | Freehand, Brush, Eraser, Polygon |
| **Smart** | Magic Wand, Region Growing, Interpolation, AI Seg |
| **Measure** | Length, Rectangle, Ellipse, Angle, Bidirectional |
| **Segment** | Threshold, Adaptive, Otsu, Hysteresis |
| (Right) | Save, Submit buttons |

#### Row 2: View & Mode Tools
| Group | Tools |
|-------|-------|
| **View** | MPR, Overlay, Zoom, Pan, Reset |
| **Layout** | 1×1, 1×2, 2×2, 2×3, 3×3 |
| **Adjust** | Window/Level, Invert |
| **Mode** | Replace, Add, Subtract, Intersect |
| (Right) | Help button |

### Styling

```tsx
function ToolButton({ icon, label, active, onClick, shortcut, disabled }) {
  return (
    <button
      className={cn(
        'flex flex-col items-center justify-center px-2 py-1 min-w-[48px] rounded',
        'text-[10px] text-[#8B949E] hover:text-white hover:bg-white/10',
        active && 'bg-primary/20 text-primary border border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </button>
  );
}
```
