/**
 * MPR (Multi-Planar Reconstruction) Setup
 * Handles volume loading and multi-viewport configuration for MPR views
 */

import type { IVolumeViewport, Point3 } from '@cornerstonejs/core/types';

// MPR Constants
export const MPR_TOOL_GROUP_ID = 'mprToolGroup';
export const MPR_VOLUME_ID = 'mprVolume';

// Orientation presets for MPR views
export type MPROrientation = 'axial' | 'sagittal' | 'coronal';

export interface MPRViewportConfig {
  viewportId: string;
  orientation: MPROrientation;
  element: HTMLDivElement;
}

export interface MPRState {
  isEnabled: boolean;
  volumeId: string | null;
  viewportIds: string[];
  activeViewportId: string | null;
}

// Module state
let mprState: MPRState = {
  isEnabled: false,
  volumeId: null,
  viewportIds: [],
  activeViewportId: null,
};

// Cornerstone module references
let csCore: typeof import('@cornerstonejs/core') | null = null;
let csTools: typeof import('@cornerstonejs/tools') | null = null;

/**
 * Initialize MPR module with Cornerstone references
 */
export async function initializeMPR(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  csCore = await import('@cornerstonejs/core');
  csTools = await import('@cornerstonejs/tools');
}

/**
 * Get orientation vectors for each MPR view
 */
function getOrientationVectors(orientation: MPROrientation): {
  viewUp: Point3;
  viewPlaneNormal: Point3;
} {
  switch (orientation) {
    case 'axial':
      return {
        viewUp: [0, -1, 0] as Point3,
        viewPlaneNormal: [0, 0, 1] as Point3,
      };
    case 'sagittal':
      return {
        viewUp: [0, 0, 1] as Point3,
        viewPlaneNormal: [1, 0, 0] as Point3,
      };
    case 'coronal':
      return {
        viewUp: [0, 0, 1] as Point3,
        viewPlaneNormal: [0, 1, 0] as Point3,
      };
    default:
      return {
        viewUp: [0, -1, 0] as Point3,
        viewPlaneNormal: [0, 0, 1] as Point3,
      };
  }
}

/**
 * Create a volume from a stack of image IDs
 */
export async function createVolumeFromImageIds(
  imageIds: string[],
  volumeId: string = MPR_VOLUME_ID
): Promise<string> {
  if (!csCore) {
    await initializeMPR();
  }
  
  if (!csCore) {
    throw new Error('Cornerstone core not initialized');
  }

  // Create a unique volume ID
  const uniqueVolumeId = `${volumeId}_${Date.now()}`;

  try {
    // Create the volume using streaming volume loader
    const volume = await csCore.volumeLoader.createAndCacheVolume(uniqueVolumeId, {
      imageIds,
    });

    // Load the volume data
    await volume.load();

    mprState.volumeId = uniqueVolumeId;
    
    return uniqueVolumeId;
  } catch (error) {
    console.error('[MPR] Failed to create volume:', error);
    throw error;
  }
}

/**
 * Setup MPR viewports with volume rendering
 */
export async function setupMPRViewports(
  renderingEngineId: string,
  viewportConfigs: MPRViewportConfig[],
  volumeId: string
): Promise<void> {
  if (!csCore || !csTools) {
    await initializeMPR();
  }

  if (!csCore || !csTools) {
    throw new Error('Cornerstone not initialized');
  }

  const renderingEngine = csCore.getRenderingEngine(renderingEngineId);
  if (!renderingEngine) {
    throw new Error(`Rendering engine ${renderingEngineId} not found`);
  }

  // Create viewport inputs for each MPR view
  const viewportInputs = viewportConfigs.map((config) => {
    const { viewUp, viewPlaneNormal } = getOrientationVectors(config.orientation);
    
    return {
      viewportId: config.viewportId,
      type: csCore!.Enums.ViewportType.ORTHOGRAPHIC,
      element: config.element,
      defaultOptions: {
        orientation: {
          viewUp,
          viewPlaneNormal,
        },
        background: [0, 0, 0] as [number, number, number],
      },
    };
  });

  // Enable all viewports
  renderingEngine.setViewports(viewportInputs);

  // Set the volume on each viewport
  for (const config of viewportConfigs) {
    const viewport = renderingEngine.getViewport(config.viewportId) as IVolumeViewport;
    if (viewport) {
      await viewport.setVolumes([{ volumeId }]);
      viewport.render();
    }
  }

  // Store viewport IDs
  mprState.viewportIds = viewportConfigs.map((c) => c.viewportId);
  mprState.activeViewportId = viewportConfigs[0]?.viewportId || null;
  mprState.isEnabled = true;
}

/**
 * Create MPR tool group with crosshairs
 */
export async function createMPRToolGroup(viewportIds: string[], renderingEngineId: string): Promise<void> {
  if (!csTools) {
    await initializeMPR();
  }

  if (!csTools) {
    throw new Error('Cornerstone tools not initialized');
  }

  // Destroy existing MPR tool group if it exists
  const existingGroup = csTools.ToolGroupManager.getToolGroup(MPR_TOOL_GROUP_ID);
  if (existingGroup) {
    csTools.ToolGroupManager.destroyToolGroup(MPR_TOOL_GROUP_ID);
  }

  // Create new tool group
  const toolGroup = csTools.ToolGroupManager.createToolGroup(MPR_TOOL_GROUP_ID);
  if (!toolGroup) {
    throw new Error('Failed to create MPR tool group');
  }

  // Add Crosshairs tool if not already added globally
  if (!csTools.CrosshairsTool) {
    console.warn('[MPR] CrosshairsTool not available');
  } else {
    // Add CrosshairsTool to the global tool list if not already added
    try {
      csTools.addTool(csTools.CrosshairsTool);
    } catch {
      // Tool might already be added
    }
    
    toolGroup.addTool(csTools.CrosshairsTool.toolName, {
      getReferenceLineColor: (viewportId: string) => {
        // Color-code each viewport's crosshair
        const index = viewportIds.indexOf(viewportId);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']; // Red, Teal, Blue
        return colors[index % colors.length];
      },
      getReferenceLineControllable: () => true,
      getReferenceLineDraggableRotatable: () => true,
      getReferenceLineSlabThicknessControlsOn: () => true,
    });
  }

  // Add standard navigation tools
  toolGroup.addTool(csTools.WindowLevelTool.toolName);
  toolGroup.addTool(csTools.PanTool.toolName);
  toolGroup.addTool(csTools.ZoomTool.toolName);
  toolGroup.addTool(csTools.StackScrollTool.toolName);

  // Add viewports to the tool group
  for (const viewportId of viewportIds) {
    toolGroup.addViewport(viewportId, renderingEngineId);
  }

  // Activate crosshairs
  if (csTools.CrosshairsTool) {
    toolGroup.setToolActive(csTools.CrosshairsTool.toolName, {
      bindings: [{ mouseButton: csTools.Enums.MouseBindings.Primary }],
    });
  }

  // Pan with shift+click
  toolGroup.setToolActive(csTools.PanTool.toolName, {
    bindings: [{
      mouseButton: csTools.Enums.MouseBindings.Primary,
      modifierKey: csTools.Enums.KeyboardBindings.Shift,
    }],
  });

  // Zoom with ctrl+scroll
  toolGroup.setToolActive(csTools.ZoomTool.toolName, {
    bindings: [{
      mouseButton: csTools.Enums.MouseBindings.Wheel,
      modifierKey: csTools.Enums.KeyboardBindings.Ctrl,
    }],
  });

  // Scroll through slices with wheel
  toolGroup.setToolActive(csTools.StackScrollTool.toolName, {
    bindings: [{ mouseButton: csTools.Enums.MouseBindings.Wheel }],
  });
}

/**
 * Enable MPR mode for a set of image IDs
 */
export async function enableMPR(
  renderingEngineId: string,
  imageIds: string[],
  elements: {
    axial: HTMLDivElement;
    sagittal: HTMLDivElement;
    coronal: HTMLDivElement;
  }
): Promise<void> {
  // Create volume from image IDs
  const volumeId = await createVolumeFromImageIds(imageIds);

  // Configure viewports
  const viewportConfigs: MPRViewportConfig[] = [
    { viewportId: 'mpr-axial', orientation: 'axial', element: elements.axial },
    { viewportId: 'mpr-sagittal', orientation: 'sagittal', element: elements.sagittal },
    { viewportId: 'mpr-coronal', orientation: 'coronal', element: elements.coronal },
  ];

  // Setup viewports with volume
  await setupMPRViewports(renderingEngineId, viewportConfigs, volumeId);

  // Create tool group with crosshairs
  const viewportIds = viewportConfigs.map((c) => c.viewportId);
  await createMPRToolGroup(viewportIds, renderingEngineId);
}

/**
 * Disable MPR mode and cleanup
 */
export async function disableMPR(renderingEngineId: string): Promise<void> {
  if (!csCore || !csTools) return;

  const renderingEngine = csCore.getRenderingEngine(renderingEngineId);
  if (!renderingEngine) return;

  // Destroy MPR tool group
  const toolGroup = csTools.ToolGroupManager.getToolGroup(MPR_TOOL_GROUP_ID);
  if (toolGroup) {
    csTools.ToolGroupManager.destroyToolGroup(MPR_TOOL_GROUP_ID);
  }

  // Disable MPR viewports
  for (const viewportId of mprState.viewportIds) {
    try {
      renderingEngine.disableElement(viewportId);
    } catch {
      // Viewport might already be disabled
    }
  }

  // Remove cached volume
  if (mprState.volumeId) {
    try {
      csCore.cache.removeVolumeLoadObject(mprState.volumeId);
    } catch {
      // Volume might not exist
    }
  }

  // Reset state
  mprState = {
    isEnabled: false,
    volumeId: null,
    viewportIds: [],
    activeViewportId: null,
  };
}

/**
 * Get current MPR state
 */
export function getMPRState(): MPRState {
  return { ...mprState };
}

/**
 * Check if MPR is currently enabled
 */
export function isMPREnabled(): boolean {
  return mprState.isEnabled;
}

/**
 * Synchronize camera positions across MPR viewports
 */
export async function syncMPRCameras(sourceViewportId: string): Promise<void> {
  if (!csCore) return;

  const renderingEngine = csCore.getRenderingEngine(
    (await import('./types')).RENDERING_ENGINE_ID
  );
  if (!renderingEngine) return;

  const sourceViewport = renderingEngine.getViewport(sourceViewportId) as IVolumeViewport;
  if (!sourceViewport) return;

  const camera = sourceViewport.getCamera();
  const { focalPoint } = camera;

  // Update focal point in other viewports to match the intersection
  for (const viewportId of mprState.viewportIds) {
    if (viewportId === sourceViewportId) continue;

    const viewport = renderingEngine.getViewport(viewportId) as IVolumeViewport;
    if (viewport) {
      const otherCamera = viewport.getCamera();
      viewport.setCamera({
        ...otherCamera,
        focalPoint,
      });
      viewport.render();
    }
  }
}

/**
 * Reset MPR views to default positions
 */
export async function resetMPRViews(): Promise<void> {
  if (!csCore) return;

  const renderingEngine = csCore.getRenderingEngine(
    (await import('./types')).RENDERING_ENGINE_ID
  );
  if (!renderingEngine) return;

  for (const viewportId of mprState.viewportIds) {
    const viewport = renderingEngine.getViewport(viewportId) as IVolumeViewport;
    if (viewport) {
      viewport.resetCamera();
      viewport.render();
    }
  }
}
