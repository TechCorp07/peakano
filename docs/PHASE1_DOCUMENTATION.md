# Phase 1: Core Tool Completion - Documentation

## Overview

Phase 1 focuses on completing the core annotation toolset for the Medical Imaging Annotation Platform. This phase implements four key areas:

1. **Boolean Mask Operations** - Union, subtract, intersect, XOR operations for combining masks
2. **Enhanced Brush System** - Standard, 3D, and adaptive brush tools with presets
3. **Threshold Segmentation** - Multiple thresholding algorithms for automatic segmentation
4. **Measurement Enhancements** - Area, volume, perimeter calculations with export capabilities

---

## 1. Mask Operations (`src/lib/annotation/maskOperations.ts`)

### Purpose
Provides comprehensive binary mask manipulation tools for combining, modifying, and analyzing segmentation masks.

### Boolean Operations

| Function | Description | Signature |
|----------|-------------|-----------|
| `maskUnion` | Combines two masks (OR operation) | `(maskA, maskB, width, height) => MaskOperationResult` |
| `maskSubtract` | Removes maskB from maskA | `(maskA, maskB, width, height) => MaskOperationResult` |
| `maskIntersect` | Keeps only overlapping regions (AND) | `(maskA, maskB, width, height) => MaskOperationResult` |
| `maskXor` | Keeps non-overlapping regions | `(maskA, maskB, width, height) => MaskOperationResult` |
| `maskInvert` | Inverts mask values | `(mask, width, height) => MaskOperationResult` |
| `maskUnionMultiple` | Combines multiple masks | `(masks, width, height) => MaskOperationResult` |

### Morphological Operations

| Function | Description | Signature |
|----------|-------------|-----------|
| `maskDilate` | Expands mask boundaries | `(mask, width, height, kernelSize) => MaskOperationResult` |
| `maskErode` | Shrinks mask boundaries | `(mask, width, height, kernelSize) => MaskOperationResult` |
| `maskOpen` | Erode then dilate (remove small noise) | `(mask, width, height, kernelSize) => MaskOperationResult` |
| `maskClose` | Dilate then erode (fill small holes) | `(mask, width, height, kernelSize) => MaskOperationResult` |
| `maskFillHoles` | Fills all internal holes | `(mask, width, height) => MaskOperationResult` |
| `maskBoundary` | Extracts mask boundary | `(mask, width, height) => MaskOperationResult` |

### Utility Functions

| Function | Description |
|----------|-------------|
| `createEmptyMask` | Creates an empty mask of specified dimensions |
| `createMaskFromPolygon` | Converts polygon points to binary mask |
| `maskToContours` | Extracts contour points from mask |
| `countMaskPixels` | Counts non-zero pixels in mask |

### Example Usage

```typescript
import { 
  maskUnion, 
  maskSubtract, 
  maskDilate,
  createMaskFromPolygon 
} from '@/lib/annotation';

// Combine two masks
const combined = maskUnion(mask1, mask2, 512, 512);

// Subtract one mask from another
const difference = maskSubtract(mask1, mask2, 512, 512);

// Dilate a mask
const dilated = maskDilate(mask, 512, 512, 5);

// Create mask from polygon
const polygon = [[100, 100], [200, 100], [200, 200], [100, 200]];
const maskFromPoly = createMaskFromPolygon(polygon, 512, 512);
```

---

## 2. Threshold Segmentation (`src/lib/annotation/thresholdSegmentation.ts`)

### Purpose
Provides multiple threshold-based segmentation algorithms for automatic region extraction based on pixel intensity.

### Thresholding Functions

| Function | Description | Best Use Case |
|----------|-------------|---------------|
| `thresholdSegment` | Simple min/max threshold | Known intensity ranges |
| `adaptiveThreshold` | Locally adaptive threshold | Uneven lighting/contrast |
| `otsuThreshold` | Automatic optimal threshold | Bimodal histograms |
| `multiOtsuThreshold` | Multiple automatic thresholds | Multiple regions |
| `hysteresisThreshold` | Edge-connected thresholding | Preserving weak edges |

### Configuration Types

```typescript
interface ThresholdConfig {
  min: number;              // Minimum threshold (0-255)
  max: number;              // Maximum threshold (0-255)
  method: 'simple' | 'adaptive' | 'otsu' | 'multi-otsu' | 'hysteresis';
  adaptiveBlockSize?: number;  // For adaptive method
  adaptiveC?: number;          // Constant for adaptive
  otsuClasses?: number;        // Number of classes for multi-otsu
  hysteresisLow?: number;      // Low threshold for hysteresis
  hysteresisHigh?: number;     // High threshold for hysteresis
}
```

### Helper Functions

| Function | Description |
|----------|-------------|
| `calculateHistogram` | Computes intensity histogram (256 bins) |
| `findHistogramPeaks` | Finds peaks in histogram for analysis |

### Example Usage

```typescript
import { 
  thresholdSegment, 
  adaptiveThreshold,
  otsuThreshold,
  hysteresisThreshold,
  calculateHistogram 
} from '@/lib/annotation';

// Simple threshold
const segmented = thresholdSegment(imageData, 512, 512, { min: 100, max: 200 });

// Adaptive threshold (for uneven illumination)
const adaptive = adaptiveThreshold(imageData, 512, 512, 15, 5);

// Automatic Otsu threshold
const otsu = otsuThreshold(imageData, 512, 512);
console.log('Otsu threshold:', otsu.threshold);

// Hysteresis threshold (for edge preservation)
const hysteresis = hysteresisThreshold(imageData, 512, 512, 50, 150);
```

---

## 3. Enhanced Brush System (`src/lib/annotation/brushTools.ts`)

### Purpose
Provides advanced brush tools for manual segmentation with support for 2D, 3D, and adaptive brush modes.

### Brush Types

#### Standard Brush
- Circular or square shape
- Configurable size and hardness
- Feathered edges option

#### 3D Brush
- Paints across multiple slices
- Spherical influence in 3D volume
- Configurable depth radius

#### Adaptive Brush
- Edge-aware painting
- Respects intensity boundaries
- Ideal for complex structures

### Configuration Types

```typescript
interface BrushConfig {
  size: number;           // Brush diameter (1-100)
  shape: 'circle' | 'square';
  hardness: number;       // Edge hardness (0-1)
  opacity: number;        // Stroke opacity (0-1)
  spacing: number;        // Stroke point spacing
  feathering: boolean;    // Enable soft edges
}

interface Brush3DConfig extends BrushConfig {
  depthRadius: number;    // Slices affected above/below
  depthFalloff: 'linear' | 'gaussian';
  preserveContours: boolean;
}

interface AdaptiveBrushConfig extends BrushConfig {
  edgeSensitivity: number;    // Edge detection sensitivity
  intensityTolerance: number; // Intensity matching threshold
  useGradient: boolean;       // Use gradient for edges
}
```

### Brush Presets

| Preset | Size | Hardness | Best For |
|--------|------|----------|----------|
| `fine` | 5 | 0.9 | Detail work |
| `medium` | 15 | 0.7 | General use |
| `large` | 30 | 0.5 | Broad areas |
| `soft` | 20 | 0.3 | Soft edges |
| `eraser` | 20 | 1.0 | Clean erasing |
| `detail` | 3 | 1.0 | Fine details |

### Key Functions

| Function | Description |
|----------|-------------|
| `generateBrushMask` | Creates brush stamp mask |
| `applyBrushStroke` | Applies 2D brush stroke to mask |
| `apply3DBrushStroke` | Applies 3D brush across volume |
| `createAdaptiveBrush` | Creates edge-aware brush mask |
| `interpolateStrokePoints` | Fills gaps between stroke points |

### Example Usage

```typescript
import { 
  generateBrushMask,
  applyBrushStroke,
  apply3DBrushStroke,
  DEFAULT_BRUSH_PRESETS 
} from '@/lib/annotation';

// Use a preset
const finePreset = DEFAULT_BRUSH_PRESETS.find(p => p.name === 'fine');

// Generate brush mask
const brushMask = generateBrushMask(finePreset.config);

// Apply stroke to canvas
const updatedMask = applyBrushStroke(
  currentMask,
  512, 512,
  strokePoints,
  finePreset.config,
  'add'  // 'add' or 'subtract'
);

// 3D brush for volume
const volumeMasks = apply3DBrushStroke(
  volumeData,  // Map<sliceIndex, Uint8Array>
  currentSlice,
  strokePoints,
  brush3DConfig
);
```

---

## 4. Measurement Tools (`src/lib/annotation/measurementTools.ts`)

### Purpose
Provides comprehensive measurement calculations for annotated regions, including area, volume, perimeter, and statistical analysis.

### Measurement Types

```typescript
interface MaskMeasurements {
  area: number;           // Area in mm² (or pixels if no spacing)
  perimeter: number;      // Perimeter in mm
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  pixelCount: number;     // Raw pixel count
  aspectRatio: number;    // Width/height ratio
  circularity: number;    // How circular (0-1)
  compactness: number;    // Shape compactness
  meanIntensity?: number; // If image data provided
  stdIntensity?: number;  // Intensity std dev
  minIntensity?: number;
  maxIntensity?: number;
}
```

### Key Functions

| Function | Description | Signature |
|----------|-------------|-----------|
| `calculateArea` | Calculate area in mm² | `(mask, width, height, pixelSpacing?) => number` |
| `calculateVolume` | Calculate volume from mask stack | `(masks, dimensions, spacing) => number` |
| `calculatePerimeter` | Calculate perimeter in mm | `(mask, width, height, pixelSpacing?) => number` |
| `calculateMeasurements` | Get all measurements | `(mask, config) => MaskMeasurements` |
| `calculateDistance` | Distance between two points | `(p1, p2, spacing?) => number` |
| `calculateAngle` | Angle between three points | `(p1, p2, p3) => number` |

### Export Functions

| Function | Description |
|----------|-------------|
| `exportMeasurements` | Export as JSON/CSV string |
| `createMeasurementDownload` | Create downloadable file blob |

### Formatting Helpers

| Function | Description |
|----------|-------------|
| `formatMeasurement` | Format value with unit |
| `formatArea` | Format area with mm² |
| `formatVolume` | Format volume with mm³ or cm³ |

### Example Usage

```typescript
import { 
  calculateMeasurements,
  calculateVolume,
  exportMeasurements,
  createMeasurementDownload,
  formatArea 
} from '@/lib/annotation';

// Calculate all measurements for a mask
const measurements = calculateMeasurements(mask, {
  width: 512,
  height: 512,
  pixelSpacing: [0.5, 0.5],  // 0.5mm per pixel
  sliceThickness: 2.0,
  imageData: pixelData  // Optional: for intensity stats
});

console.log('Area:', formatArea(measurements.area));
console.log('Circularity:', measurements.circularity.toFixed(2));

// Calculate volume from multiple slices
const volume = calculateVolume(
  maskStack,  // Map<sliceIndex, Uint8Array>
  { width: 512, height: 512, depth: 100 },
  { x: 0.5, y: 0.5, z: 2.0 }  // mm per voxel
);

// Export measurements
const json = exportMeasurements([measurements], 'json');
const csv = exportMeasurements([measurements], 'csv');

// Create download
const blob = createMeasurementDownload([measurements], 'json');
// Use blob for download...
```

---

## 5. State Management (`src/lib/annotation/store.ts`)

### Purpose
Zustand-based state management for all annotation tools, providing reactive state updates and tool configuration persistence.

### Store Structure

```typescript
interface AnnotationToolsState {
  // Active tool
  activeTool: AnnotationToolType;
  
  // Brush settings
  brushConfig: BrushConfig;
  brush3DConfig: Brush3DConfig;
  adaptiveBrushConfig: AdaptiveBrushConfig;
  activeBrushPreset: string | null;
  
  // Threshold settings
  thresholdConfig: ThresholdConfig;
  
  // Mask operation mode
  maskOperationMode: MaskOperationType;
  
  // Selection state
  hasSelection: boolean;
  selectionMask: Uint8Array | null;
  
  // Processing state
  isProcessing: boolean;
  processingMessage: string | null;
}
```

### Selector Hooks

| Hook | Purpose |
|------|---------|
| `useActiveTool` | Get/set current active tool |
| `useBrushConfig` | Access brush configuration |
| `useBrush3DConfig` | Access 3D brush config |
| `useAdaptiveBrushConfig` | Access adaptive brush config |
| `useThresholdConfig` | Access threshold settings |
| `useMaskOperationMode` | Get current mask operation |
| `useHasSelection` | Check if selection exists |
| `useIsProcessing` | Check processing state |

### Example Usage

```typescript
import { 
  useAnnotationToolsStore,
  useActiveTool,
  useBrushConfig,
  useThresholdConfig 
} from '@/lib/annotation';

function MyComponent() {
  // Use individual selectors for performance
  const activeTool = useActiveTool();
  const brushConfig = useBrushConfig();
  const thresholdConfig = useThresholdConfig();
  
  // Or access full store
  const { setActiveTool, setBrushConfig } = useAnnotationToolsStore();
  
  const handleToolChange = (tool) => {
    setActiveTool(tool);
  };
  
  const handleBrushSizeChange = (size) => {
    setBrushConfig({ size });
  };
}
```

---

## 6. UI Components

### ThresholdToolPanel
Location: `src/components/medical/DicomViewer/ThresholdToolPanel.tsx`

Interactive UI for threshold segmentation with:
- Histogram visualization
- Min/max threshold sliders
- Method selection dropdown
- Preview toggle
- Apply/Cancel actions

### BrushSettingsPanel
Location: `src/components/medical/DicomViewer/BrushSettingsPanel.tsx`

Brush configuration UI with:
- Preset selection
- Size/hardness/opacity sliders
- Shape selection (circle/square)
- 3D brush toggle and depth settings
- Adaptive brush settings

### MaskOperationsPanel
Location: `src/components/medical/DicomViewer/MaskOperationsPanel.tsx`

Mask manipulation UI with:
- Boolean operation buttons (Union, Subtract, Intersect, XOR)
- Morphological operations (Dilate, Erode, Open, Close)
- Fill holes and boundary extraction
- Preview and apply workflow

### MeasurementsPanel
Location: `src/components/medical/DicomViewer/MeasurementsPanel.tsx`

Measurement display UI with:
- List of all measurements
- Individual measurement details
- Export options (JSON, CSV)
- Visibility toggle per measurement
- Delete functionality

---

## 7. Integration Points

### Toolbar Integration
The Phase 1 tools are accessible via:
- **Segment** dropdown menu in ViewerToolbar
  - Threshold
  - Adaptive Threshold
  - Otsu Auto
  - Hysteresis
  - Mask Union/Subtract/Intersect

### Context Panel Integration
Advanced tools are available in the **Advanced** tab of ViewerContextPanel:
- ThresholdToolPanel
- BrushSettingsPanel
- MaskOperationsPanel
- MeasurementsPanel

---

## 8. File Structure

```
src/lib/annotation/
├── index.ts              # Barrel exports
├── maskOperations.ts     # Boolean & morphological operations
├── thresholdSegmentation.ts  # Threshold algorithms
├── brushTools.ts         # Brush tool system
├── measurementTools.ts   # Measurement calculations
└── store.ts              # Zustand state management

src/components/medical/DicomViewer/
├── ThresholdToolPanel.tsx
├── BrushSettingsPanel.tsx
├── MaskOperationsPanel.tsx
├── MeasurementsPanel.tsx
├── ViewerToolbar.tsx     # Updated with Segment dropdown
└── ViewerContextPanel.tsx  # Updated with Advanced tab
```

---

## 9. Dependencies

### New Dependencies Added
- No new dependencies required - uses existing:
  - `zustand` - State management
  - `lucide-react` - Icons

### shadcn/ui Components Used
- `slider` - For threshold and brush controls
- `switch` - For toggles
- `tabs` - For panel organization
- `tooltip` - For hints
- `separator` - For visual separation
- `scroll-area` - For scrollable content
- `badge` - For labels

---

## 10. Future Enhancements (Phase 2+)

- **AI-Assisted Segmentation** - SAM integration
- **Active Contours** - Semi-automatic boundary detection
- **ONNX Model Support** - Custom model inference
- **Real-time Preview** - GPU-accelerated previews
- **Collaborative Annotations** - Multi-user support

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial Phase 1 implementation |

---

## Contributing

When extending Phase 1 tools:

1. Add new functions to appropriate module
2. Export from `index.ts`
3. Update store if state is needed
4. Create/update UI component
5. Update this documentation
