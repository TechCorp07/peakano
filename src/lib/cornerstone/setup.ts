/**
 * Cornerstone3D Setup and Initialization
 * Configures the rendering engine, image loaders, and tools
 *
 * IMPORTANT: This module should only be imported on the client side.
 * Use dynamic imports in components to avoid SSR issues.
 */

import { RENDERING_ENGINE_ID, TOOL_GROUP_ID, type ToolType } from './types';

// Types for dynamically imported Cornerstone modules
type CornerstoneCore = typeof import('@cornerstonejs/core');
type CornerstoneTools = typeof import('@cornerstonejs/tools');
type DicomImageLoader = typeof import('@cornerstonejs/dicom-image-loader');
type RenderingEngine = InstanceType<CornerstoneCore['RenderingEngine']>;

// Track initialization state
let isInitialized = false;
let renderingEngine: RenderingEngine | null = null;

// Store module references after dynamic import
let csCore: CornerstoneCore | null = null;
let csTools: CornerstoneTools | null = null;
let dicomImageLoader: DicomImageLoader | null = null;

// Segmentation state
let segmentationIdCounter = 0;
const activeSegmentations: Map<string, string> = new Map(); // viewportId -> segmentationId

/**
 * Initialize Cornerstone3D and all required loaders/tools
 * This function dynamically imports Cornerstone to avoid SSR issues
 */
export async function initializeCornerstone(): Promise<void> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  if (isInitialized) {
    return;
  }

  try {
    // Dynamically import Cornerstone modules to avoid SSR issues
    csCore = await import('@cornerstonejs/core');
    csTools = await import('@cornerstonejs/tools');
    dicomImageLoader = await import('@cornerstonejs/dicom-image-loader');

    // Store on window for HMR recovery
    if (typeof window !== 'undefined') {
      window.__cornerstoneCore = csCore;
    }

    // Initialize Cornerstone core first
    await csCore.init();

    // Initialize DICOM image loader with Cornerstone3D v4.x API
    try {
      const workerCount = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? Math.max(1, Math.floor(navigator.hardwareConcurrency / 2))
        : 1;

      dicomImageLoader.init({
        maxWebWorkers: workerCount,
      });

      // Store fileManager reference for use with blob URLs
      const wadouriModule = dicomImageLoader.wadouri;
      if (wadouriModule?.fileManager) {
        window.__cornerstoneWadouriFileManager = wadouriModule.fileManager;
      }
    } catch (loaderError) {
      console.error('[Cornerstone] DICOM image loader initialization error:', loaderError);
      // Continue even if loader init has issues - basic functionality may still work
    }

    // Initialize Cornerstone tools
    await csTools.init();

    // Configure cache (1GB)
    csCore.cache.setMaxCacheSize(1073741824);

    // Add tools
    addAllTools();

    isInitialized = true;
  } catch (error) {
    console.error('[Cornerstone] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Add all tools to Cornerstone
 */
function addAllTools(): void {
  if (!csTools) return;

  // Basic navigation tools
  csTools.addTool(csTools.PanTool);
  csTools.addTool(csTools.WindowLevelTool);
  csTools.addTool(csTools.StackScrollTool);
  csTools.addTool(csTools.ZoomTool);

  // Measurement tools
  csTools.addTool(csTools.LengthTool);
  csTools.addTool(csTools.RectangleROITool);
  csTools.addTool(csTools.EllipticalROITool);
  csTools.addTool(csTools.ProbeTool);
  csTools.addTool(csTools.AngleTool);

  // Segmentation/Drawing tools
  csTools.addTool(csTools.BrushTool);
  csTools.addTool(csTools.PlanarFreehandROITool);
  csTools.addTool(csTools.RectangleScissorsTool);
  csTools.addTool(csTools.CircleScissorsTool);
  csTools.addTool(csTools.SphereScissorsTool);

  // Contour segmentation tools (for filled regions)
  if (csTools.PlanarFreehandContourSegmentationTool) {
    csTools.addTool(csTools.PlanarFreehandContourSegmentationTool);
  }

  // Segmentation display tool (required for showing segmentations)
  if (csTools.SegmentationDisplayTool) {
    csTools.addTool(csTools.SegmentationDisplayTool);
  }

  // NOTE: CrosshairsTool is NOT added here because it requires multi-viewport
  // MPR configuration. It will throw errors on single viewport setups.
  // Add it separately when setting up MPR views with proper viewport references.
}

/**
 * Create and get the rendering engine
 */
export function getRenderingEngine(): RenderingEngine | null {
  if (!isInitialized || !csCore) {
    throw new Error('Cornerstone not initialized. Call initializeCornerstone() first.');
  }

  if (!renderingEngine) {
    renderingEngine = new csCore.RenderingEngine(RENDERING_ENGINE_ID);
  }

  return renderingEngine;
}

/**
 * Create a tool group with default tool configurations
 */
export function createToolGroup(toolGroupId: string = TOOL_GROUP_ID) {
  if (!csTools) {
    throw new Error('Cornerstone tools not initialized.');
  }

  const toolGroup = csTools.ToolGroupManager.createToolGroup(toolGroupId);

  if (!toolGroup) {
    throw new Error(`Failed to create tool group: ${toolGroupId}`);
  }

  // Add tools to the group
  toolGroup.addTool(csTools.WindowLevelTool.toolName);
  toolGroup.addTool(csTools.PanTool.toolName);
  toolGroup.addTool(csTools.ZoomTool.toolName);
  toolGroup.addTool(csTools.StackScrollTool.toolName);
  toolGroup.addTool(csTools.LengthTool.toolName);
  toolGroup.addTool(csTools.RectangleROITool.toolName);
  toolGroup.addTool(csTools.EllipticalROITool.toolName);
  toolGroup.addTool(csTools.ProbeTool.toolName);
  toolGroup.addTool(csTools.AngleTool.toolName);

  // Segmentation tools
  toolGroup.addTool(csTools.BrushTool.toolName);
  toolGroup.addTool(csTools.PlanarFreehandROITool.toolName);
  toolGroup.addTool(csTools.RectangleScissorsTool.toolName);
  toolGroup.addTool(csTools.CircleScissorsTool.toolName);
  toolGroup.addTool(csTools.SphereScissorsTool.toolName);

  // Add contour segmentation tool if available
  if (csTools.PlanarFreehandContourSegmentationTool) {
    toolGroup.addTool(csTools.PlanarFreehandContourSegmentationTool.toolName);
  }

  // Enable segmentation display tool (required to see segmentations)
  if (csTools.SegmentationDisplayTool) {
    toolGroup.addTool(csTools.SegmentationDisplayTool.toolName);
    toolGroup.setToolEnabled(csTools.SegmentationDisplayTool.toolName);
  }
  // NOTE: CrosshairsTool excluded - requires MPR setup with linked viewports

  // NOTE: No default primary tool is set - user must explicitly select a tool
  // This prevents accidental window/level adjustments when viewing images

  // Pan: Shift + left click (to avoid conflict with annotation tools)
  toolGroup.setToolActive(csTools.PanTool.toolName, {
    bindings: [{
      mouseButton: csTools.Enums.MouseBindings.Primary,
      modifierKey: csTools.Enums.KeyboardBindings.Shift,
    }],
  });

  // Zoom: Ctrl + mouse scroll (to avoid conflict with stack scroll)
  toolGroup.setToolActive(csTools.ZoomTool.toolName, {
    bindings: [{
      mouseButton: csTools.Enums.MouseBindings.Wheel,
      modifierKey: csTools.Enums.KeyboardBindings.Ctrl,
    }],
  });

  // Stack scroll: mouse wheel (default behavior)
  toolGroup.setToolActive(csTools.StackScrollTool.toolName, {
    bindings: [{ mouseButton: csTools.Enums.MouseBindings.Wheel }],
  });

  return toolGroup;
}

/**
 * Get an existing tool group
 */
export function getToolGroup(toolGroupId: string = TOOL_GROUP_ID) {
  if (!csTools) return null;
  return csTools.ToolGroupManager.getToolGroup(toolGroupId);
}

/**
 * Set the active tool
 * Pan and Zoom can be activated as primary tools when explicitly selected,
 * while also keeping modifier key shortcuts available
 */
export function setActiveTool(
  toolName: ToolType,
  toolGroupId: string = TOOL_GROUP_ID,
  mouseButton: 'Primary' | 'Secondary' | 'Auxiliary' = 'Primary'
): void {
  const toolGroup = getToolGroup(toolGroupId);

  if (!toolGroup || !csTools) {
    console.warn(`Tool group ${toolGroupId} not found`);
    return;
  }

  // Deactivate current primary tool
  const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
  if (currentPrimaryTool) {
    toolGroup.setToolPassive(currentPrimaryTool);
  }

  // Get the mouse button enum
  const mouseButtonEnum =
    mouseButton === 'Primary'
      ? csTools.Enums.MouseBindings.Primary
      : mouseButton === 'Secondary'
        ? csTools.Enums.MouseBindings.Secondary
        : csTools.Enums.MouseBindings.Auxiliary;

  // Handle Pan - activate as primary AND keep Shift+click shortcut
  if (toolName === 'Pan') {
    toolGroup.setToolActive(toolName, {
      bindings: [
        { mouseButton: mouseButtonEnum }, // Primary activation
        {
          mouseButton: csTools.Enums.MouseBindings.Primary,
          modifierKey: csTools.Enums.KeyboardBindings.Shift,
        }, // Shift shortcut
      ],
    });
    return;
  }

  // Handle Zoom - activate as primary AND keep Ctrl+scroll shortcut
  if (toolName === 'Zoom') {
    toolGroup.setToolActive(toolName, {
      bindings: [
        { mouseButton: mouseButtonEnum }, // Primary activation
        {
          mouseButton: csTools.Enums.MouseBindings.Wheel,
          modifierKey: csTools.Enums.KeyboardBindings.Ctrl,
        }, // Ctrl+scroll shortcut
      ],
    });
    return;
  }

  // Activate new tool with standard binding
  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: mouseButtonEnum }],
  });
}

/**
 * Destroy the rendering engine and cleanup
 */
export function destroyCornerstone(): void {
  if (renderingEngine) {
    renderingEngine.destroy();
    renderingEngine = null;
  }

  if (csTools) {
    // Destroy all tool groups
    csTools.ToolGroupManager.destroyToolGroup(TOOL_GROUP_ID);
  }

  if (csCore) {
    // Clear cache
    csCore.cache.purgeCache();
  }

  isInitialized = false;
}

/**
 * Check if Cornerstone is initialized
 */
export function isCornerstoneInitialized(): boolean {
  return isInitialized;
}

/**
 * Get Cornerstone core module (for direct access if needed)
 */
export function getCornerstoneCore() {
  return csCore;
}

/**
 * Get Cornerstone tools module (for direct access if needed)
 */
export function getCornerstoneTools() {
  return csTools;
}

/**
 * Create image IDs from DICOM instance paths
 */
export function createImageIds(
  baseUrl: string,
  instanceUIDs: string[]
): string[] {
  return instanceUIDs.map((uid) => `wadors:${baseUrl}/${uid}`);
}

/**
 * Create a WADOuri image ID
 */
export function createWadoUriImageId(url: string): string {
  return `wadouri:${url}`;
}

/**
 * Create WADOrs image IDs
 */
export function createWadoRsImageIds(
  baseUrl: string,
  studyInstanceUID: string,
  seriesInstanceUID: string,
  sopInstanceUIDs: string[]
): string[] {
  return sopInstanceUIDs.map(
    (sopInstanceUID) =>
      `wadors:${baseUrl}/studies/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/frames/1`
  );
}

// =============================================================================
// VIEWPORT MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Get a viewport by ID from the rendering engine
 * Handles HMR scenarios where the module-level reference may be stale
 */
export function getViewport(viewportId: string) {
  // Try the module-level reference first
  if (renderingEngine) {
    const viewport = renderingEngine.getViewport(viewportId);
    if (viewport) return viewport;
  }

  // If module reference is null or viewport not found, try to get from Cornerstone registry
  // This handles HMR scenarios where the module state was reset
  if (csCore) {
    try {
      const engine = csCore.getRenderingEngine(RENDERING_ENGINE_ID);
      if (engine) {
        // Update module reference for future calls
        renderingEngine = engine;
        return engine.getViewport(viewportId);
      }
    } catch (e) {
      // getRenderingEngine may throw if not found
    }
  }

  // Last resort: try to access Cornerstone from window cache in case of HMR module reset
  if (typeof window !== 'undefined' && window.__cornerstoneCore) {
    try {
      const csCoreModule = window.__cornerstoneCore;
      if (csCoreModule && csCoreModule.getRenderingEngine) {
        const engine = csCoreModule.getRenderingEngine(RENDERING_ENGINE_ID);
        if (engine) {
          // Update module references
          csCore = csCoreModule;
          renderingEngine = engine;
          return engine.getViewport(viewportId);
        }
      }
    } catch (e) {
      // Module may not be available
    }
  }

  console.warn('[Cornerstone] Rendering engine not initialized or viewport not found:', viewportId);
  return null;
}

/**
 * Flip viewport horizontally
 */
export function flipViewportHorizontal(viewportId: string): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const currentFlipH = viewport.getProperties()?.flipHorizontal ?? false;
    viewport.setProperties({ flipHorizontal: !currentFlipH });
    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error flipping viewport horizontally:', error);
    return false;
  }
}

/**
 * Flip viewport vertically
 */
export function flipViewportVertical(viewportId: string): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const currentFlipV = viewport.getProperties()?.flipVertical ?? false;
    viewport.setProperties({ flipVertical: !currentFlipV });
    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error flipping viewport vertically:', error);
    return false;
  }
}

/**
 * Rotate viewport by specified degrees (clockwise)
 */
export function rotateViewport(viewportId: string, degrees: number = 90): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const currentRotation = viewport.getProperties()?.rotation ?? 0;
    const newRotation = (currentRotation + degrees) % 360;
    viewport.setProperties({ rotation: newRotation });
    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error rotating viewport:', error);
    return false;
  }
}

/**
 * Invert viewport colors (negative image)
 */
export function invertViewport(viewportId: string): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const currentInvert = viewport.getProperties()?.invert ?? false;
    viewport.setProperties({ invert: !currentInvert });
    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error inverting viewport:', error);
    return false;
  }
}

/**
 * Reset viewport to default state
 */
export function resetViewport(viewportId: string): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    // Reset all transformations
    viewport.setProperties({
      flipHorizontal: false,
      flipVertical: false,
      rotation: 0,
      invert: false,
    });

    // Reset camera (zoom, pan)
    viewport.resetCamera();

    // Reset to default window/level if available
    const csImage = viewport.csImage;
    if (csImage) {
      const ww = csImage.windowWidth;
      const wc = csImage.windowCenter;
      if (ww && wc) {
        const windowWidth = Array.isArray(ww) ? ww[0] : ww;
        const windowCenter = Array.isArray(wc) ? wc[0] : wc;
        viewport.setProperties({
          voiRange: {
            lower: windowCenter - windowWidth / 2,
            upper: windowCenter + windowWidth / 2,
          },
        });
      }
    }

    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error resetting viewport:', error);
    return false;
  }
}

/**
 * Set window/level for a viewport
 */
export function setWindowLevel(
  viewportId: string,
  windowWidth: number,
  windowCenter: number
): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) {
    console.warn('[Cornerstone] setWindowLevel: viewport not found:', viewportId);
    return false;
  }

  try {
    const voiRange = {
      lower: windowCenter - windowWidth / 2,
      upper: windowCenter + windowWidth / 2,
    };
    console.log('[Cornerstone] Setting window/level:', { viewportId, windowWidth, windowCenter, voiRange });
    viewport.setProperties({ voiRange });
    viewport.render();
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting window/level:', error);
    return false;
  }
}

/**
 * Get current viewport properties
 */
export function getViewportProperties(viewportId: string): {
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotation: number;
  invert: boolean;
  windowWidth?: number;
  windowCenter?: number;
} | null {
  const viewport = getViewport(viewportId);
  if (!viewport) return null;

  try {
    const props = viewport.getProperties() || {};
    const voiRange = props.voiRange;

    let windowWidth: number | undefined;
    let windowCenter: number | undefined;

    if (voiRange) {
      windowWidth = voiRange.upper - voiRange.lower;
      windowCenter = (voiRange.upper + voiRange.lower) / 2;
    }

    return {
      flipHorizontal: props.flipHorizontal ?? false,
      flipVertical: props.flipVertical ?? false,
      rotation: props.rotation ?? 0,
      invert: props.invert ?? false,
      windowWidth,
      windowCenter,
    };
  } catch (error) {
    console.error('[Cornerstone] Error getting viewport properties:', error);
    return null;
  }
}

/**
 * Get the default Window/Level from the loaded DICOM image
 * Returns the DICOM-embedded values or calculates from pixel data range
 */
export function getDefaultWindowLevel(viewportId: string): {
  windowWidth: number;
  windowCenter: number;
} | null {
  const viewport = getViewport(viewportId);
  if (!viewport) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csImage = (viewport as any).csImage;
    if (csImage) {
      // First try to get DICOM-embedded window/level values
      const ww = csImage.windowWidth;
      const wc = csImage.windowCenter;
      if (ww !== undefined && wc !== undefined) {
        const windowWidth = Array.isArray(ww) ? ww[0] : ww;
        const windowCenter = Array.isArray(wc) ? wc[0] : wc;
        if (windowWidth > 0) {
          console.log('[Cornerstone] Using DICOM-embedded W/L:', { windowWidth, windowCenter });
          return { windowWidth, windowCenter };
        }
      }

      // Fallback: calculate from pixel data range
      const minPixelValue = csImage.minPixelValue ?? 0;
      const maxPixelValue = csImage.maxPixelValue ?? 255;
      const windowWidth = maxPixelValue - minPixelValue;
      const windowCenter = (maxPixelValue + minPixelValue) / 2;
      console.log('[Cornerstone] Calculated W/L from pixel range:', {
        minPixelValue, maxPixelValue, windowWidth, windowCenter
      });
      return { windowWidth, windowCenter };
    }

    // Try to get from current VOI range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (viewport as any).getProperties?.() || {};
    if (props.voiRange) {
      const windowWidth = props.voiRange.upper - props.voiRange.lower;
      const windowCenter = (props.voiRange.upper + props.voiRange.lower) / 2;
      console.log('[Cornerstone] Using current VOI range:', { windowWidth, windowCenter });
      return { windowWidth, windowCenter };
    }

    return null;
  } catch (error) {
    console.error('[Cornerstone] Error getting default window/level:', error);
    return null;
  }
}

/**
 * Set zoom level for a viewport
 */
export function setViewportZoom(viewportId: string, zoomFactor: number): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const camera = viewport.getCamera();
    if (camera) {
      // Adjust parallelScale for zoom (lower = more zoomed in)
      const baseScale = camera.parallelScale || 1;
      viewport.setCamera({
        ...camera,
        parallelScale: baseScale / zoomFactor,
      });
      viewport.render();
    }
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting zoom:', error);
    return false;
  }
}

/**
 * Pan viewport by specified offset
 */
export function panViewport(viewportId: string, deltaX: number, deltaY: number): boolean {
  const viewport = getViewport(viewportId);
  if (!viewport) return false;

  try {
    const camera = viewport.getCamera();
    if (camera && camera.focalPoint) {
      const [fx, fy, fz] = camera.focalPoint;
      viewport.setCamera({
        ...camera,
        focalPoint: [fx + deltaX, fy + deltaY, fz] as [number, number, number],
      });
      viewport.render();
    }
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error panning viewport:', error);
    return false;
  }
}

// =============================================================================
// SEGMENTATION FUNCTIONS
// =============================================================================

/**
 * Segmentation representation configuration
 */
export interface SegmentationConfig {
  segmentationId: string;
  color?: [number, number, number, number]; // RGBA
  opacity?: number;
  visible?: boolean;
}

/**
 * Create a new segmentation for a viewport
 * This creates a labelmap that can be drawn on with brush/eraser tools
 *
 * For stack viewports (2D), we create a stack-based labelmap segmentation
 * For volume viewports (3D), we would create a volume-based labelmap
 */
export async function createSegmentation(
  viewportId: string,
  labelId: string,
  color: [number, number, number] = [255, 0, 0]
): Promise<string | null> {
  if (!csTools || !csCore) {
    console.error('[Cornerstone] Tools not initialized');
    return null;
  }

  try {
    const viewport = getViewport(viewportId);
    if (!viewport) {
      console.error('[Cornerstone] Viewport not found:', viewportId);
      return null;
    }

    const { segmentation } = csTools;

    // Generate unique segmentation ID
    const segmentationId = `seg-${labelId}-${++segmentationIdCounter}`;

    // Get the image IDs from the viewport
    const imageIds = viewport.getImageIds?.() || [];
    if (imageIds.length === 0) {
      console.error('[Cornerstone] No images in viewport');
      return null;
    }

    console.log('[Cornerstone] Creating segmentation for', imageIds.length, 'images');

    // For stack viewports in Cornerstone3D v4.x:
    // Stack viewports use imageIds, not volumes. We need to use the stack-specific API.

    let segmentationCreated = false;

    // Method 1: Try utilities.segmentation.createLabelmapVolumeForViewport (works for stack viewports)
    if (csTools.utilities?.segmentation?.createLabelmapVolumeForViewport) {
      try {
        console.log('[Cornerstone] Trying createLabelmapVolumeForViewport...');
        await csTools.utilities.segmentation.createLabelmapVolumeForViewport({
          viewportId,
          segmentationId,
          options: {},
        });

        await segmentation.addSegmentations([
          {
            segmentationId,
            representation: {
              type: csTools.Enums.SegmentationRepresentations.Labelmap,
            },
          },
        ]);

        segmentationCreated = true;
        console.log('[Cornerstone] Created segmentation with utilities.createLabelmapVolumeForViewport');
      } catch (utilsError) {
        console.warn('[Cornerstone] createLabelmapVolumeForViewport failed:', utilsError);
      }
    }

    // Method 2: Direct stack approach - add segmentation with imageIds
    if (!segmentationCreated) {
      try {
        console.log('[Cornerstone] Using direct imageIds approach');

        // Add segmentation directly with imageIds
        await segmentation.addSegmentations([
          {
            segmentationId,
            representation: {
              type: csTools.Enums.SegmentationRepresentations.Labelmap,
              data: {
                imageIds: imageIds,
              },
            },
          },
        ]);

        segmentationCreated = true;
        console.log('[Cornerstone] Created segmentation with direct imageIds');
      } catch (directError) {
        console.warn('[Cornerstone] Direct imageIds approach failed:', directError);
      }
    }

    // Method 3: Simplest form - just add segmentation without data
    if (!segmentationCreated) {
      try {
        console.log('[Cornerstone] Trying simplest form...');
        await segmentation.addSegmentations([
          {
            segmentationId,
            representation: {
              type: csTools.Enums.SegmentationRepresentations.Labelmap,
            },
          },
        ]);

        segmentationCreated = true;
        console.log('[Cornerstone] Created segmentation with simplest form');
      } catch (simpleError) {
        console.error('[Cornerstone] All segmentation creation methods failed');
        return null;
      }
    }

    // Add segmentation representation to viewport
    try {
      if (segmentation.addLabelmapRepresentationToViewportMap) {
        // v4.x preferred API
        await segmentation.addLabelmapRepresentationToViewportMap({
          [viewportId]: [
            {
              segmentationId,
              type: csTools.Enums.SegmentationRepresentations.Labelmap,
            },
          ],
        });
        console.log('[Cornerstone] Added labelmap representation to viewport');
      } else if (segmentation.addSegmentationRepresentations) {
        // Older API
        await segmentation.addSegmentationRepresentations(TOOL_GROUP_ID, [
          {
            segmentationId,
            type: csTools.Enums.SegmentationRepresentations.Labelmap,
            options: {
              colorLUT: [
                [0, 0, 0, 0], // Background (index 0) - transparent
                [...color, 200], // Segment 1 with specified color and semi-transparency
              ],
            },
          },
        ]);
        console.log('[Cornerstone] Added segmentation representation to tool group');
      }
    } catch (repError) {
      console.warn('[Cornerstone] Could not add segmentation representation:', repError);
    }

    // Track active segmentation for this viewport
    activeSegmentations.set(viewportId, segmentationId);

    // Set segment 1 as active (for drawing)
    try {
      if (segmentation.segmentIndex?.setActiveSegmentIndex) {
        segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, 1);
      } else if (segmentation.activeSegmentation?.setActiveSegmentIndex) {
        segmentation.activeSegmentation.setActiveSegmentIndex(segmentationId, 1);
      }
    } catch (indexError) {
      console.warn('[Cornerstone] Could not set active segment index:', indexError);
    }

    // Configure the global segmentation config for better visibility
    try {
      const globalConfig = segmentation.config?.getGlobalConfig?.();
      if (globalConfig?.representations?.LABELMAP) {
        globalConfig.representations.LABELMAP.fillAlpha = 0.5;
        globalConfig.representations.LABELMAP.outlineWidthActive = 2;
        globalConfig.representations.LABELMAP.outlineWidthInactive = 1;
        globalConfig.representations.LABELMAP.renderFill = true;
        globalConfig.representations.LABELMAP.renderOutline = true;
        segmentation.config.setGlobalConfig(globalConfig);
      }
    } catch (configError) {
      console.warn('[Cornerstone] Could not set global segmentation config:', configError);
    }

    console.log('[Cornerstone] Segmentation created successfully:', segmentationId);
    return segmentationId;
  } catch (error) {
    console.error('[Cornerstone] Error creating segmentation:', error);
    return null;
  }
}

/**
 * Get the active segmentation ID for a viewport
 */
export function getActiveSegmentation(viewportId: string): string | null {
  return activeSegmentations.get(viewportId) || null;
}

/**
 * Set the active segment index for drawing
 */
export function setActiveSegmentIndex(segmentationId: string, index: number): boolean {
  if (!csTools) return false;

  try {
    csTools.segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, index);
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting active segment:', error);
    return false;
  }
}

/**
 * Set brush tool properties
 */
export function setBrushProperties(
  toolGroupId: string = TOOL_GROUP_ID,
  properties: {
    brushSize?: number;
    brushThresholdGate?: number;
  }
): boolean {
  if (!csTools) return false;

  try {
    const toolGroup = getToolGroup(toolGroupId);
    if (!toolGroup) return false;

    if (properties.brushSize !== undefined) {
      // Set brush size for the tool
      csTools.utilities.segmentation.setBrushSizeForToolGroup(
        toolGroupId,
        properties.brushSize
      );
    }

    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting brush properties:', error);
    return false;
  }
}

/**
 * Get brush size for a tool group
 */
export function getBrushSize(toolGroupId: string = TOOL_GROUP_ID): number {
  if (!csTools) return 10;

  try {
    return csTools.utilities.segmentation.getBrushSizeForToolGroup(toolGroupId) || 10;
  } catch (error) {
    return 10;
  }
}

/**
 * Set segmentation visibility
 */
export function setSegmentationVisibility(
  segmentationId: string,
  visible: boolean
): boolean {
  if (!csTools) return false;

  try {
    csTools.segmentation.config.visibility.setSegmentationVisibility(
      TOOL_GROUP_ID,
      segmentationId,
      visible
    );
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting segmentation visibility:', error);
    return false;
  }
}

/**
 * Set segmentation opacity
 * Note: Currently sets global opacity for all segmentations.
 * The segmentationId parameter is kept for future per-segmentation opacity support.
 */
export function setSegmentationOpacity(
  _segmentationId: string,
  opacity: number
): boolean {
  if (!csTools) return false;

  try {
    const config = csTools.segmentation.config.getGlobalConfig();
    config.representations.LABELMAP.fillAlpha = opacity;
    config.representations.LABELMAP.outlineOpacity = opacity;
    csTools.segmentation.config.setGlobalConfig(config);

    // Re-render viewports
    if (renderingEngine) {
      renderingEngine.renderViewports([...activeSegmentations.keys()]);
    }
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting segmentation opacity:', error);
    return false;
  }
}

/**
 * Remove a segmentation
 */
export function removeSegmentation(segmentationId: string): boolean {
  if (!csTools) return false;

  try {
    csTools.segmentation.removeSegmentationsFromToolGroup(TOOL_GROUP_ID, [
      segmentationId,
    ]);

    // Remove from tracking
    for (const [vpId, segId] of activeSegmentations.entries()) {
      if (segId === segmentationId) {
        activeSegmentations.delete(vpId);
        break;
      }
    }

    return true;
  } catch (error) {
    console.error('[Cornerstone] Error removing segmentation:', error);
    return false;
  }
}

/**
 * Clear all segmentation data (erase all drawn segments)
 */
export function clearSegmentation(segmentationId: string): boolean {
  if (!csTools) return false;

  try {
    const segmentationVolume = csTools.segmentation.state.getSegmentation(segmentationId);
    if (segmentationVolume?.representationData?.LABELMAP?.volumeId) {
      const volume = csCore.cache.getVolume(
        segmentationVolume.representationData.LABELMAP.volumeId
      );
      if (volume) {
        const scalarData = volume.getScalarData();
        scalarData.fill(0);

        // Trigger re-render
        if (renderingEngine) {
          renderingEngine.render();
        }
      }
    }
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error clearing segmentation:', error);
    return false;
  }
}

/**
 * Activate brush tool for segmentation with right-click eraser support
 */
export function activateBrushTool(
  toolGroupId: string = TOOL_GROUP_ID,
  isEraser: boolean = false
): boolean {
  if (!csTools) return false;

  try {
    const toolGroup = getToolGroup(toolGroupId);
    if (!toolGroup) return false;

    // Deactivate current primary tool
    const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
    if (currentPrimaryTool) {
      toolGroup.setToolPassive(currentPrimaryTool);
    }

    // Get brush tool name
    const brushToolName = csTools.BrushTool.toolName;

    // Configure brush mode (normal or eraser)
    if (isEraser) {
      // Set to eraser mode by using segment index 0 (background)
      for (const segId of activeSegmentations.values()) {
        csTools.segmentation.segmentIndex.setActiveSegmentIndex(segId, 0);
      }
    } else {
      // Set to draw mode with segment index 1
      for (const segId of activeSegmentations.values()) {
        csTools.segmentation.segmentIndex.setActiveSegmentIndex(segId, 1);
      }
    }

    // Activate brush tool with left-click draw, right-click erase
    toolGroup.setToolActive(brushToolName, {
      bindings: [
        { mouseButton: csTools.Enums.MouseBindings.Primary },
      ],
    });

    return true;
  } catch (error) {
    console.error('[Cornerstone] Error activating brush tool:', error);
    return false;
  }
}

/**
 * Activate freehand/brush segmentation tool for painting filled regions
 *
 * Note: PlanarFreehandROITool is an annotation tool that draws outlines.
 * For actual segmentation (filled painting), we use BrushTool which paints
 * directly onto the labelmap. The BrushTool provides brush-based painting
 * that fills pixels as you draw.
 *
 * For polygon-style filling, use the scissors tools (RectangleScissors, etc.)
 * which fill the entire selected region.
 */
export function activateFreehandSegmentationTool(
  toolGroupId: string = TOOL_GROUP_ID
): boolean {
  if (!csTools) return false;

  try {
    const toolGroup = getToolGroup(toolGroupId);
    if (!toolGroup) return false;

    // Deactivate current primary tool
    const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
    if (currentPrimaryTool) {
      toolGroup.setToolPassive(currentPrimaryTool);
    }

    // Use BrushTool for freehand painting - it paints filled pixels onto the labelmap
    // The brush size can be adjusted for finer or broader strokes
    const toolName = csTools.BrushTool.toolName;

    // Set to draw mode with segment index 1
    for (const segId of activeSegmentations.values()) {
      csTools.segmentation.segmentIndex.setActiveSegmentIndex(segId, 1);
    }

    // Activate brush tool for freehand painting
    toolGroup.setToolActive(toolName, {
      bindings: [
        { mouseButton: csTools.Enums.MouseBindings.Primary },
      ],
    });

    return true;
  } catch (error) {
    console.error('[Cornerstone] Error activating freehand segmentation tool:', error);
    return false;
  }
}

/**
 * Activate scissors tool for polygon/rectangle segmentation (fills selected region)
 */
export function activateScissorsTool(
  toolGroupId: string = TOOL_GROUP_ID,
  type: 'rectangle' | 'circle' | 'sphere' = 'rectangle'
): boolean {
  if (!csTools) return false;

  try {
    const toolGroup = getToolGroup(toolGroupId);
    if (!toolGroup) return false;

    // Deactivate current primary tool
    const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
    if (currentPrimaryTool) {
      toolGroup.setToolPassive(currentPrimaryTool);
    }

    // Select the scissors tool
    let toolName: string;
    switch (type) {
      case 'circle':
        toolName = csTools.CircleScissorsTool.toolName;
        break;
      case 'sphere':
        toolName = csTools.SphereScissorsTool.toolName;
        break;
      default:
        toolName = csTools.RectangleScissorsTool.toolName;
    }

    // Set to draw mode
    for (const segId of activeSegmentations.values()) {
      csTools.segmentation.segmentIndex.setActiveSegmentIndex(segId, 1);
    }

    // Activate scissors tool
    toolGroup.setToolActive(toolName, {
      bindings: [
        { mouseButton: csTools.Enums.MouseBindings.Primary },
      ],
    });

    return true;
  } catch (error) {
    console.error('[Cornerstone] Error activating scissors tool:', error);
    return false;
  }
}

/**
 * Set eraser mode for any active segmentation tool
 * This sets the segment index to 0 (background) so drawing erases
 */
export function setEraserMode(enabled: boolean): boolean {
  if (!csTools) return false;

  try {
    const segmentIndex = enabled ? 0 : 1;
    for (const segId of activeSegmentations.values()) {
      csTools.segmentation.segmentIndex.setActiveSegmentIndex(segId, segmentIndex);
    }
    return true;
  } catch (error) {
    console.error('[Cornerstone] Error setting eraser mode:', error);
    return false;
  }
}

/**
 * Ensure a segmentation exists for the viewport before drawing
 * Creates one automatically if not present
 */
export async function ensureSegmentationExists(
  viewportId: string,
  labelId: string = 'default',
  color: [number, number, number] = [255, 0, 0]
): Promise<string | null> {
  // Check if segmentation already exists
  const existing = getActiveSegmentation(viewportId);
  if (existing) {
    return existing;
  }

  // Create new segmentation
  return await createSegmentation(viewportId, labelId, color);
}

/**
 * Check if a segmentation exists for the viewport
 */
export function hasSegmentation(viewportId: string): boolean {
  return activeSegmentations.has(viewportId);
}

/**
 * Get segmentation mask data for export/save
 */
export function getSegmentationData(segmentationId: string): Uint8Array | null {
  if (!csTools || !csCore) return null;

  try {
    const segmentationVolume = csTools.segmentation.state.getSegmentation(segmentationId);
    if (segmentationVolume?.representationData?.LABELMAP?.volumeId) {
      const volume = csCore.cache.getVolume(
        segmentationVolume.representationData.LABELMAP.volumeId
      );
      if (volume) {
        return new Uint8Array(volume.getScalarData());
      }
    }
    return null;
  } catch (error) {
    console.error('[Cornerstone] Error getting segmentation data:', error);
    return null;
  }
}
