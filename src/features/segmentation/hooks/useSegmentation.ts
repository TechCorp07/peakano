/**
 * useSegmentation Hook
 * Bridges Cornerstone3D segmentation with Zustand store
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSegmentationStore, type SegmentationLayer } from '../store';
import {
  createSegmentation,
  getActiveSegmentation,
  activateBrushTool,
  setBrushProperties,
  setSegmentationVisibility,
  setSegmentationOpacity,
  removeSegmentation,
  clearSegmentation,
  getSegmentationData,
} from '@/lib/cornerstone/setup';

interface UseSegmentationOptions {
  viewportId: string;
  enabled?: boolean;
}

/**
 * Hook to manage segmentation state and Cornerstone integration
 */
export function useSegmentation({ viewportId, enabled = true }: UseSegmentationOptions) {
  const {
    layers,
    activeLayerId,
    brushSize,
    brushOpacity,
    isEraserMode,
    selectedLabelId,
    labels,
    addLayer,
    removeLayer: removeLayerFromStore,
    updateLayer,
    setActiveLayer,
    setBrushSize,
    setBrushOpacity,
    setEraserMode,
    toggleLayerVisibility,
    setLayerOpacity,
    clearViewport,
  } = useSegmentationStore();

  const isInitializedRef = useRef(false);

  // Get layers for current viewport
  const viewportLayers = layers[viewportId] || [];

  // Get selected label
  const selectedLabel = selectedLabelId
    ? labels.find((l) => l.id === selectedLabelId)
    : null;

  // Get active layer
  const activeLayer = activeLayerId
    ? viewportLayers.find((l) => l.id === activeLayerId)
    : null;

  /**
   * Create a new segmentation layer for the current label
   */
  const createLayer = useCallback(async () => {
    if (!enabled || !selectedLabel) {
      console.warn('[useSegmentation] Cannot create layer: no label selected or disabled');
      return null;
    }

    // Parse color from hex to RGB
    const hexColor = selectedLabel.color;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const color: [number, number, number] = [r, g, b];

    // Create Cornerstone segmentation
    const segmentationId = await createSegmentation(viewportId, selectedLabel.id, color);

    if (!segmentationId) {
      console.error('[useSegmentation] Failed to create Cornerstone segmentation');
      return null;
    }

    // Create layer in store
    const layer: SegmentationLayer = {
      id: `layer-${Date.now()}`,
      segmentationId,
      labelId: selectedLabel.id,
      labelName: selectedLabel.name,
      labelColor: color,
      visible: true,
      opacity: brushOpacity,
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLayer(viewportId, layer);

    return layer;
  }, [enabled, selectedLabel, viewportId, brushOpacity, addLayer]);

  /**
   * Activate brush tool for drawing
   */
  const activateBrush = useCallback(
    (eraser: boolean = false) => {
      if (!enabled) return;

      setEraserMode(eraser);
      activateBrushTool(undefined, eraser);

      // Update brush size
      setBrushProperties(undefined, { brushSize });
    },
    [enabled, brushSize, setEraserMode]
  );

  /**
   * Update brush size
   */
  const updateBrushSize = useCallback(
    (size: number) => {
      setBrushSize(size);
      setBrushProperties(undefined, { brushSize: size });
    },
    [setBrushSize]
  );

  /**
   * Toggle layer visibility
   */
  const toggleVisibility = useCallback(
    (layerId: string) => {
      const layer = viewportLayers.find((l) => l.id === layerId);
      if (layer) {
        toggleLayerVisibility(viewportId, layerId);
        setSegmentationVisibility(layer.segmentationId, !layer.visible);
      }
    },
    [viewportId, viewportLayers, toggleLayerVisibility]
  );

  /**
   * Update layer opacity
   */
  const updateLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      const layer = viewportLayers.find((l) => l.id === layerId);
      if (layer) {
        setLayerOpacity(viewportId, layerId, opacity);
        setSegmentationOpacity(layer.segmentationId, opacity);
      }
    },
    [viewportId, viewportLayers, setLayerOpacity]
  );

  /**
   * Delete a layer
   */
  const deleteLayer = useCallback(
    (layerId: string) => {
      const layer = viewportLayers.find((l) => l.id === layerId);
      if (layer) {
        removeSegmentation(layer.segmentationId);
        removeLayerFromStore(viewportId, layerId);
      }
    },
    [viewportId, viewportLayers, removeLayerFromStore]
  );

  /**
   * Clear all segmentation data in a layer
   */
  const clearLayer = useCallback(
    (layerId: string) => {
      const layer = viewportLayers.find((l) => l.id === layerId);
      if (layer) {
        clearSegmentation(layer.segmentationId);
      }
    },
    [viewportLayers]
  );

  /**
   * Get segmentation data for export
   */
  const exportLayerData = useCallback(
    (layerId: string): Uint8Array | null => {
      const layer = viewportLayers.find((l) => l.id === layerId);
      if (layer) {
        return getSegmentationData(layer.segmentationId);
      }
      return null;
    },
    [viewportLayers]
  );

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Don't clear on unmount - let parent decide when to clear
    };
  }, []);

  /**
   * Sync brush size with Cornerstone when it changes
   */
  useEffect(() => {
    if (enabled && isInitializedRef.current) {
      setBrushProperties(undefined, { brushSize });
    }
  }, [enabled, brushSize]);

  /**
   * Initialize
   */
  useEffect(() => {
    if (enabled && !isInitializedRef.current) {
      isInitializedRef.current = true;
    }
  }, [enabled]);

  return {
    // State
    layers: viewportLayers,
    activeLayer,
    activeLayerId,
    brushSize,
    brushOpacity,
    isEraserMode,
    selectedLabel,

    // Actions
    createLayer,
    deleteLayer,
    clearLayer,
    setActiveLayer,
    activateBrush,
    updateBrushSize,
    setBrushOpacity,
    toggleVisibility,
    updateLayerOpacity,
    exportLayerData,
    clearViewport: () => clearViewport(viewportId),

    // Helpers
    hasLayers: viewportLayers.length > 0,
    canDraw: !!selectedLabel,
  };
}
