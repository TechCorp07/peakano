# Annotation Architecture

## Overview

This document describes the recommended architecture for the DICOM annotation system in the MRI Scan Reading Tool. The system is designed to handle multi-slice medical images (e.g., 138 slices per study) where users annotate one slice at a time.

## Recommended Approach

**Canvas overlay for drawing + Cornerstone3D for viewing/navigation**

### Comparison

| Aspect | Canvas Overlay | Cornerstone3D Segmentation |
|--------|---------------|---------------------------|
| **Drawing UX** | Smooth, immediate feedback | Can be laggy, complex setup |
| **Multi-slice support** | Simple Map per slice | Requires volume setup |
| **Custom tools** | Full control | Limited to built-in tools |
| **3D visualization** | Need to convert | Built-in but tightly coupled |
| **Reliability** | Works with any image source | Struggles with blob URLs/stacks |

### Why This Approach

1. **Better User Experience**: Canvas provides smooth, immediate visual feedback during drawing
2. **Simpler Architecture**: Per-slice annotations stored in a simple Map structure
3. **Full Control**: Custom tools (freehand, brush, eraser, polygon) with custom cursors
4. **Reliability**: Works regardless of how DICOM images are loaded (blob URLs, WADO-RS, etc.)
5. **Decoupled**: Drawing system is independent of viewing system

## Workflow

```
1. USER DRAWS (Canvas)
   └─> Per-slice annotations stored in Map<sliceIndex, annotations[]>

2. USER NAVIGATES (Cornerstone3D)
   └─> Scroll through slices, canvas syncs to show that slice's annotations

3. VIEW IN 3D (Optional - Cornerstone3D Volume)
   └─> Compile all slice annotations → 3D labelmap → Volume render
```

## Current Implementation

### What's Working

- ✅ Per-slice annotation storage (`Map<number, CanvasAnnotation[]>`)
- ✅ Freehand tool with loop detection and fill
- ✅ Brush tool with configurable radius
- ✅ Eraser tool
- ✅ Polygon tool with vertex editing
- ✅ Custom SVG cursors for each tool
- ✅ Right-click temporary eraser mode (for freehand/brush)
- ✅ Keyboard shortcuts (F, B, E, P, Escape)
- ✅ Tool indicator overlay
- ✅ Slice navigation synced with annotations

### Key Files

```
src/
├── components/medical/DicomViewer/
│   ├── AnnotationCanvas.tsx    # Canvas overlay component
│   ├── Viewport.tsx            # Integrates canvas with DICOM viewer
│   └── ViewerToolbar.tsx       # Tool selection UI
├── features/annotation/
│   ├── canvasStore.ts          # Zustand store for annotation state
│   └── index.ts                # Feature exports
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

### Phase 2: Persistence (Next)
- [ ] Save annotations to backend/localStorage
- [ ] Auto-save on changes
- [ ] Load annotations on study open
- [ ] Export annotations (JSON, DICOM SEG)

### Phase 3: Progress Tracking
- [ ] Slice progress indicator (show which slices have annotations)
- [ ] Progress bar in study list
- [ ] Annotation statistics (area, count per slice)

### Phase 4: 3D Visualization
- [ ] Compile 2D annotations to 3D labelmap
- [ ] Volume rendering of annotations
- [ ] MPR views with annotation overlay

### Phase 5: Smart Tools
- [ ] Interpolation (auto-fill between annotated slices)
- [ ] Magic wand (threshold-based selection)
- [ ] Region growing
- [ ] AI-assisted suggestions

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
| `Escape` | Deactivate current tool / Cancel operation |
| `Delete` | Delete selected annotation |

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
