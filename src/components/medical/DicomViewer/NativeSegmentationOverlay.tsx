'use client';

/**
 * NativeSegmentationOverlay Component
 *
 * Uses Cornerstone.js native segmentation system (labelmap) for annotations.
 * This ensures pixel-perfect synchronization during pan/zoom because:
 * 1. Segmentations are rendered by Cornerstone's WebGL pipeline
 * 2. No separate canvas overlay needed
 * 3. Coordinate transformations happen in the same render pass as the image
 *
 * This replaces the custom AnnotationCanvas for segmentation tasks.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useCanvasAnnotationStore } from '@/features/annotation';

export type NativeToolType = 'none' | 'brush' | 'eraser' | 'freehand' | 'polygon';

interface NativeSegmentationOverlayProps {
  viewportId: string;
  activeTool: NativeToolType;
  brushRadius?: number;
  fillColor?: string;
  disabled?: boolean;
  onSegmentationChange?: () => void;
}

/**
 * Maps our tool types to Cornerstone tool names
 */
const TOOL_NAME_MAP: Record<NativeToolType, string | null> = {
  none: null,
  brush: 'Brush',
  eraser: 'Brush', // Brush with segment index 0
  freehand: 'Brush', // Use brush for freehand painting
  polygon: 'RectangleScissors', // For now, use scissors for polygon-like fills
};

export default function NativeSegmentationOverlay({
  viewportId,
  activeTool,
  brushRadius = 15,
  fillColor = 'rgba(144, 238, 144, 0.4)',
  disabled = false,
  onSegmentationChange,
}: NativeSegmentationOverlayProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [segmentationId, setSegmentationId] = useState<string | null>(null);
  const csToolsRef = useRef<typeof import('@cornerstonejs/tools') | null>(null);

  // Parse fillColor to RGB for Cornerstone
  const parseColor = useCallback((color: string): [number, number, number] => {
    // Handle rgba format
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])];
    }
    // Default to light green
    return [144, 238, 144];
  }, []);

  // Initialize segmentation for this viewport
  useEffect(() => {
    if (disabled) return;

    let isMounted = true;

    const initSegmentation = async () => {
      try {
        const {
          ensureSegmentationExists,
          getCornerstoneTools,
          getToolGroup
        } = await import('@/lib/cornerstone/setup');

        const csTools = getCornerstoneTools();
        if (!csTools) {
          console.error('[NativeSegmentation] Cornerstone tools not initialized');
          return;
        }

        csToolsRef.current = csTools;

        // Parse the fill color
        const rgb = parseColor(fillColor);

        // Create or get segmentation for this viewport
        const segId = await ensureSegmentationExists(viewportId, 'annotation', rgb);

        if (isMounted && segId) {
          setSegmentationId(segId);
          setIsInitialized(true);
          console.log('[NativeSegmentation] Initialized segmentation:', segId);
        }
      } catch (error) {
        console.error('[NativeSegmentation] Failed to initialize:', error);
      }
    };

    initSegmentation();

    return () => {
      isMounted = false;
    };
  }, [viewportId, fillColor, disabled, parseColor]);

  // Update brush size when it changes
  useEffect(() => {
    if (!isInitialized || !csToolsRef.current) return;

    try {
      const { setBrushProperties } = require('@/lib/cornerstone/setup');
      setBrushProperties(undefined, { brushSize: brushRadius });
    } catch (error) {
      console.warn('[NativeSegmentation] Could not set brush size:', error);
    }
  }, [brushRadius, isInitialized]);

  // Activate/deactivate tools based on activeTool prop
  useEffect(() => {
    if (!isInitialized || disabled) return;

    const activateToolAsync = async () => {
      try {
        const {
          activateBrushTool,
          setEraserMode,
          getToolGroup
        } = await import('@/lib/cornerstone/setup');

        const csTools = csToolsRef.current;
        if (!csTools) return;

        // Get the tool group
        const toolGroup = getToolGroup();
        if (!toolGroup) {
          console.warn('[NativeSegmentation] Tool group not found');
          return;
        }

        if (activeTool === 'none' || disabled) {
          // Deactivate segmentation tools, activate default navigation
          const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
          if (currentPrimaryTool &&
              ['Brush', 'RectangleScissors', 'CircleScissors', 'SphereScissors'].includes(currentPrimaryTool)) {
            toolGroup.setToolPassive(currentPrimaryTool);
          }
          setEraserMode(false);
          return;
        }

        // Activate the appropriate tool
        if (activeTool === 'eraser') {
          activateBrushTool(undefined, true); // isEraser = true
        } else if (activeTool === 'brush' || activeTool === 'freehand') {
          activateBrushTool(undefined, false);
        } else if (activeTool === 'polygon') {
          // Use rectangle scissors for now
          const { activateScissorsTool } = await import('@/lib/cornerstone/setup');
          activateScissorsTool(undefined, 'rectangle');
        }

        console.log('[NativeSegmentation] Activated tool:', activeTool);
      } catch (error) {
        console.error('[NativeSegmentation] Error activating tool:', error);
      }
    };

    activateToolAsync();
  }, [activeTool, isInitialized, disabled]);

  // This component doesn't render any visible UI
  // The segmentation is rendered by Cornerstone directly on the viewport
  return null;
}

/**
 * Hook to use native segmentation tools
 * Provides a simpler API for components that just need tool activation
 */
export function useNativeSegmentation(viewportId: string) {
  const { activeTool, brushRadius, fillColor, setActiveTool } = useCanvasAnnotationStore();

  const activateNativeTool = useCallback(async (tool: NativeToolType) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  const clearSegmentation = useCallback(async () => {
    try {
      const { getActiveSegmentation, clearSegmentation } = await import('@/lib/cornerstone/setup');
      const segId = getActiveSegmentation(viewportId);
      if (segId) {
        clearSegmentation(segId);
      }
    } catch (error) {
      console.error('[useNativeSegmentation] Error clearing:', error);
    }
  }, [viewportId]);

  return {
    activeTool: activeTool as NativeToolType,
    brushRadius,
    fillColor,
    activateNativeTool,
    clearSegmentation,
  };
}
