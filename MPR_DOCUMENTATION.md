# MPR (Multi-Planar Reconstruction) Implementation

## Overview

MPR (Multi-Planar Reconstruction) is a visualization technique that allows viewing medical imaging data in three orthogonal planes: **Axial**, **Sagittal**, and **Coronal**. This implementation uses Cornerstone3D's volume rendering capabilities to create synchronized viewports.

## Features

- **Volume Rendering**: Converts DICOM stack images into a 3D volume
- **Three Orthogonal Views**: Axial (top-down), Sagittal (left-right), Coronal (front-back)
- **Synchronized Crosshairs**: Click in one view to see the corresponding point in all views
- **Interactive Navigation**: Pan, zoom, and scroll through slices
- **Maximize/Minimize Views**: Focus on a single view or see all three
- **Reset Views**: Return to default camera positions

## Architecture

### Files Created

```
src/lib/cornerstone/
├── mpr.ts          # Core MPR logic (volume creation, viewport setup)
├── useMPR.ts       # React hook for MPR state management

src/components/medical/DicomViewer/
├── MPRLayout.tsx   # UI component with three-panel layout
```

### Core Module (`mpr.ts`)

The main MPR module provides:

1. **Volume Creation**
   ```typescript
   createVolumeFromImageIds(imageIds: string[], volumeId?: string): Promise<string>
   ```
   Creates a 3D volume from a stack of 2D DICOM images.

2. **Viewport Setup**
   ```typescript
   setupMPRViewports(
     renderingEngineId: string,
     viewportConfigs: MPRViewportConfig[],
     volumeId: string
   ): Promise<void>
   ```
   Configures three ORTHOGRAPHIC viewports with proper orientations.

3. **Tool Group with Crosshairs**
   ```typescript
   createMPRToolGroup(viewportIds: string[], renderingEngineId: string): Promise<void>
   ```
   Sets up the CrosshairsTool for synchronized navigation.

4. **Enable/Disable MPR**
   ```typescript
   enableMPR(
     renderingEngineId: string,
     imageIds: string[],
     elements: { axial: HTMLDivElement; sagittal: HTMLDivElement; coronal: HTMLDivElement }
   ): Promise<void>
   
   disableMPR(renderingEngineId: string): Promise<void>
   ```
   High-level functions to enable/disable MPR mode.

### React Hook (`useMPR.ts`)

Provides React integration:

```typescript
const {
  isEnabled,
  isLoading,
  error,
  mprState,
  enableMPR,
  disableMPR,
  resetViews,
  syncCameras,
  axialRef,
  sagittalRef,
  coronalRef,
} = useMPR({
  renderingEngineId: 'myEngine',
  imageIds: ['...'],
  autoInit: true,
});
```

### Layout Component (`MPRLayout.tsx`)

A React component that renders the three-viewport layout with:
- Color-coded viewport borders (red, teal, blue)
- Orientation labels (Axial, Sagittal, Coronal)
- Toolbar with:
  - Crosshairs toggle
  - Reset views button
  - Close MPR button
- Loading state with progress indicator
- Maximize/minimize individual viewports

## Usage

### Enabling MPR

MPR is triggered from the viewer toolbar. The "MPR" button in the View dropdown toggles MPR mode:

```typescript
// In AnnotationWorkspace.tsx
const handleToggleMPR = useCallback(() => {
  if (imageIds.length < 3) {
    console.warn('MPR requires at least 3 images');
    return;
  }
  setShowMPR(prev => !prev);
}, [imageIds.length]);
```

### Requirements

For MPR to work properly:
1. **Minimum 3 images** - Volume reconstruction needs multiple slices
2. **Same series** - Images should be from the same acquisition
3. **Consistent spacing** - Regular slice intervals produce better results

## Technical Details

### Orientation Vectors

Each view uses specific camera orientation vectors:

| View     | View Up       | View Plane Normal |
|----------|---------------|-------------------|
| Axial    | [0, -1, 0]    | [0, 0, 1]         |
| Sagittal | [0, 0, 1]     | [1, 0, 0]         |
| Coronal  | [0, 0, 1]     | [0, 1, 0]         |

### Volume ID Format

Volumes are cached with IDs like: `mprVolume_1234567890` (timestamp-based unique IDs)

### Tool Configuration

The MPR tool group includes:
- **CrosshairsTool**: Primary tool (left-click)
- **PanTool**: Shift + left-click
- **ZoomTool**: Ctrl + scroll
- **StackScrollTool**: Mouse wheel (scroll through slices)

## Crosshairs Color Coding

Each viewport's crosshairs are color-coded:
- **Axial**: Red (#FF6B6B)
- **Sagittal**: Teal (#4ECDC4)  
- **Coronal**: Blue (#45B7D1)

## Cleanup

When MPR is disabled or the component unmounts:
1. MPR tool group is destroyed
2. Volume viewports are disabled
3. Cached volume is removed from memory
4. State is reset

## Performance Considerations

1. **Volume Loading**: Large DICOM series may take time to load into volume
2. **Memory Usage**: Volume data is cached in memory
3. **GPU Rendering**: ORTHOGRAPHIC viewports use GPU acceleration

## Future Enhancements

- [ ] 3D Volume Rendering (4th viewport option)
- [ ] Slab thickness control
- [ ] Oblique plane support
- [ ] Measurement tools in volume mode
- [ ] Export MPR slices

## Dependencies

- `@cornerstonejs/core` - Volume rendering and viewport management
- `@cornerstonejs/tools` - CrosshairsTool and navigation tools
- `zustand` - State management (optional, used in hook)

## Troubleshooting

### Volume doesn't load
- Ensure imageIds are valid and accessible
- Check browser console for CORS or network errors
- Verify Cornerstone is properly initialized

### Crosshairs not syncing
- Ensure all three viewports are in the same tool group
- Check that CrosshairsTool is active (not passive)

### Viewport shows black
- Wait for volume to fully load
- Check that volumeId matches between creation and setVolumes
- Verify viewport elements are mounted and visible
