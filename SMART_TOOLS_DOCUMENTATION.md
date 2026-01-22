# Smart Tools Implementation Documentation

## Overview

This document describes the implementation of Smart Tools (Magic Wand, Region Growing, and Interpolation) for the Medical Imaging Annotation Platform. These tools provide advanced segmentation capabilities that go beyond manual drawing.

## Implementation Date
January 19, 2026

---

## Smart Tools Architecture

### File Structure

```
src/lib/smartTools/
├── index.ts              # Main exports
├── types.ts              # TypeScript type definitions
├── magicWand.ts          # Magic Wand algorithm
├── regionGrowing.ts      # Region Growing algorithm
├── interpolation.ts      # Slice Interpolation algorithm
├── store.ts              # Zustand state management
└── useSmartTools.ts      # React hook for integration

src/components/medical/DicomViewer/
├── SmartToolsPanel.tsx   # Settings UI panel
├── ViewerToolbar.tsx     # Updated with smart tool handlers
├── Viewport.tsx          # Updated with smart tool click handlers
└── AnnotationWorkspace.tsx # Updated with smart tools integration
```

---

## 1. Magic Wand Tool

### Algorithm: Flood Fill Selection

**File:** `src/lib/smartTools/magicWand.ts`

**How it works:**
1. User clicks on a pixel in the DICOM image
2. The algorithm captures the seed pixel's intensity value
3. Using a stack-based flood fill (DFS), it expands to neighboring pixels
4. Pixels are included if their intensity is within the configured tolerance
5. The selection mask is converted to contour points for annotation

**Configuration Options:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `tolerance` | 32 | Intensity difference threshold (0-255) |
| `eightConnected` | true | Use 8-connected neighbors (includes diagonals) |
| `maxPixels` | 1,000,000 | Performance limit for selection |
| `smoothEdges` | true | Apply morphological smoothing to edges |

**Key Features:**
- Flood fill with configurable connectivity (4 or 8)
- Edge smoothing using erosion/dilation
- Contour extraction from binary mask
- Performance-limited to prevent UI freezing

### Usage
```typescript
import { magicWandSelect } from '@/lib/smartTools';

const result = magicWandSelect(
  imageData,    // Float32Array | Int16Array | Uint8Array
  width,        // Image width
  height,       // Image height
  seedX,        // Click X coordinate
  seedY,        // Click Y coordinate
  config,       // MagicWandConfig
  canvasToWorld // Optional coordinate converter
);
```

---

## 2. Region Growing Tool

### Algorithm: Seeded Region Growing with Gradient Detection

**File:** `src/lib/smartTools/regionGrowing.ts`

**How it works:**
1. User clicks on a seed point
2. Initial intensity statistics are calculated from local neighborhood
3. Region expands using priority queue (most similar pixels first)
4. Growth stops when:
   - Pixel intensity differs too much from region mean
   - Edge gradient exceeds threshold
   - Maximum iterations reached
5. Adaptive threshold adjusts as region statistics update

**Configuration Options:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `intensityTolerance` | 25 | Base intensity threshold |
| `gradientThreshold` | 50 | Sobel gradient threshold for edge detection |
| `maxIterations` | 10,000 | Maximum pixels to process |
| `minRegionSize` | 10 | Minimum pixels for valid region |
| `useAdaptiveThreshold` | true | Adjust threshold based on region statistics |

**Key Features:**
- Priority-based expansion (similar pixels first)
- Sobel gradient edge detection
- Adaptive thresholding based on region variance
- Multi-seed support for complex regions
- Real-time statistics calculation

### Usage
```typescript
import { regionGrow } from '@/lib/smartTools';

const result = regionGrow(
  imageData,
  width,
  height,
  seedX,
  seedY,
  config,       // RegionGrowingConfig
  canvasToWorld
);

// Result includes:
// - mask: Uint8Array binary mask
// - stats: { meanIntensity, stdIntensity, minIntensity, maxIntensity, area }
// - contourPoints: Point3[] for annotation
```

---

## 3. Interpolation Tool

### Algorithm: Slice-to-Slice Contour Interpolation

**File:** `src/lib/smartTools/interpolation.ts`

**How it works:**
1. User annotates key frame slices (at least 2)
2. The algorithm identifies annotated slices as key frames
3. For each gap between key frames:
   - Contours are resampled to uniform point count
   - Points are interpolated based on position ratio
   - Z-coordinate is calculated for target slice
4. Three interpolation methods available

**Interpolation Methods:**

| Method | Description |
|--------|-------------|
| `linear` | Point-by-point linear interpolation |
| `shape-based` | Centroid + normalized shape interpolation |
| `morphological` | Shape blending with radius scaling |

**Configuration Options:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `method` | 'linear' | Interpolation algorithm |
| `maxGapSlices` | 10 | Maximum slices to interpolate across |
| `smoothingFactor` | 0.5 | Contour smoothing (0-1) |
| `autoApply` | false | Auto-interpolate on new key frames |

**Key Features:**
- Contour resampling for uniform point matching
- Three interpolation algorithms
- Configurable smoothing
- Key frame detection
- Supports varying contour sizes

### Usage
```typescript
import { interpolateSlices, canvasAnnotationsToSliceAnnotations } from '@/lib/smartTools';

// Convert existing annotations to slice format
const sliceAnnotations = canvasAnnotationsToSliceAnnotations(annotationsMap);

// Execute interpolation
const result = interpolateSlices(
  sliceAnnotations,
  config,           // InterpolationConfig
  sliceZCoordinates // Map<sliceIndex, zCoordinate>
);

// Result includes:
// - sliceAnnotations: all slices including interpolated
// - interpolatedCount: number of new slices created
// - sliceRange: { start, end } of coverage
```

---

## State Management

### Zustand Store

**File:** `src/lib/smartTools/store.ts`

```typescript
interface SmartToolState {
  activeTool: SmartToolType;
  magicWandConfig: MagicWandConfig;
  regionGrowingConfig: RegionGrowingConfig;
  interpolationConfig: InterpolationConfig;
  isProcessing: boolean;
  lastResult: MagicWandResult | RegionGrowingResult | InterpolationResult | null;
  error: string | null;
}
```

**Selector Hooks:**
- `useSmartTool()` - Active smart tool
- `useMagicWandConfig()` - Magic Wand settings
- `useRegionGrowingConfig()` - Region Growing settings
- `useInterpolationConfig()` - Interpolation settings
- `useSmartToolProcessing()` - Processing state
- `useSmartToolResult()` - Last execution result
- `useSmartToolError()` - Error message

---

## UI Integration

### SmartToolsPanel Component

**File:** `src/components/medical/DicomViewer/SmartToolsPanel.tsx`

A floating settings panel that appears when a smart tool is selected:
- Displays tool-specific configuration sliders
- Shows processing status and results
- Provides usage hints
- Reset button for configuration

### ViewerToolbar Integration

**Updated:** `src/components/medical/DicomViewer/ViewerToolbar.tsx`

- Smart tools now have `smartTool` property in dropdown items
- `handleSmartSelect` activates the smart tool store
- Deactivates canvas and Cornerstone tools when smart tool selected
- Shows selected smart tool in dropdown

### Viewport Integration

**Updated:** `src/components/medical/DicomViewer/Viewport.tsx`

- Imports and uses `useSmartTools` hook
- Click handler executes smart tool algorithms
- Results automatically converted to canvas annotations
- Smart tool indicator shown on viewport
- Cursor changes to `cursor-cell` when smart tool active

---

## View Tools Status

### Implemented Tools
| Tool | Status | Notes |
|------|--------|-------|
| Zoom | ✅ Functional | Ctrl+Scroll, integrated with Cornerstone |
| Pan | ✅ Functional | Shift+Drag, integrated with Cornerstone |
| Overlay | ✅ Toggle | Shows/hides viewport info overlays |

### Placeholder Tools
| Tool | Status | Notes |
|------|--------|-------|
| MPR | ⚠️ Placeholder | Requires Volume viewport setup (complex) |

**Note:** MPR (Multi-Planar Reconstruction) requires significant additional infrastructure including volume loading, volume viewport creation, and linked crosshair tools. The handler exists but logs a message indicating it needs volume rendering setup.

---

## Testing the Smart Tools

### Magic Wand
1. Open a DICOM study in the viewer
2. Click **Smart** > **Magic Wand** in the toolbar
3. Adjust tolerance in the settings panel (lower = more precise)
4. Click on a region of similar intensity in the image
5. The selected area will be converted to an annotation

### Region Growing
1. Click **Smart** > **Region Growing** in the toolbar
2. Adjust intensity tolerance and gradient threshold
3. Click on the center of a structure to segment
4. Region will grow until it hits edges or dissimilar tissue

### Interpolation
1. Annotate at least 2 slices using drawing tools (brush, polygon, etc.)
2. Click **Smart** > **Interpolation** in the toolbar
3. Select interpolation method (linear, shape-based, or morphological)
4. Click **Apply Interpolation** to fill in between annotated slices

---

## Performance Considerations

- **Magic Wand**: Limited to 1M pixels max, uses stack-based DFS
- **Region Growing**: Limited to 10K iterations, uses priority queue
- **Interpolation**: O(n × m) where n = slices, m = points per contour
- All algorithms run synchronously; consider Web Workers for very large images

---

## Future Improvements

1. **Web Worker Processing**: Move algorithms to background thread
2. **Preview Mode**: Show selection preview before confirming
3. **Undo/Redo**: Integrate with canvas annotation history
4. **Multi-label Support**: Apply different labels to smart selections
5. **AI-Assisted Segmentation**: Integrate ML models for smarter selection
6. **Volume Rendering**: Enable MPR with 3D volume support

---

## Files Modified

| File | Changes |
|------|---------|
| `ViewerToolbar.tsx` | Added smartTool property, updated handlers |
| `Viewport.tsx` | Added smart tool click handling and indicators |
| `AnnotationWorkspace.tsx` | Integrated SmartToolsPanel |

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/smartTools/types.ts` | Type definitions |
| `src/lib/smartTools/magicWand.ts` | Magic Wand algorithm |
| `src/lib/smartTools/regionGrowing.ts` | Region Growing algorithm |
| `src/lib/smartTools/interpolation.ts` | Slice interpolation |
| `src/lib/smartTools/store.ts` | Zustand state store |
| `src/lib/smartTools/useSmartTools.ts` | React integration hook |
| `src/lib/smartTools/index.ts` | Main exports |
| `src/components/medical/DicomViewer/SmartToolsPanel.tsx` | Settings UI |
