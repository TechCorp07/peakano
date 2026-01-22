'use client';

/**
 * Viewport Component
 * Renders a single DICOM viewport using Cornerstone3D
 * With canvas-based annotation overlay for drawing tools
 *
 * Supports two usage patterns:
 * 1. Direct imageIds: Pass pre-computed imageIds array
 * 2. Study/Series UIDs: Pass studyUid, seriesUid, instanceUids for automatic ID generation
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useViewport, useImageLoading } from '@/features/dicom/hooks';
import { TOOL_GROUP_ID } from '@/lib/cornerstone/types';
import { cn } from '@/lib/utils';
import type { Annotation, OnAnnotationChange } from '@/types/annotation';
import AnnotationCanvas, { type CanvasToolType, type AnnotationCanvasRef, type CornerstoneViewport } from './AnnotationCanvas';
import NativeSegmentationOverlay, { type NativeToolType } from './NativeSegmentationOverlay';
import AIPromptOverlay from './AIPromptOverlay';
import { useCanvasAnnotationStore } from '@/features/annotation';
import { useSmartToolStore, useSmartTools } from '@/lib/smartTools';
import { useAISegmentationStore } from '@/lib/aiSegmentation';
import { useAnnotationToolsStore, thresholdSegment, otsuThreshold, hysteresisThreshold, adaptiveThreshold, maskToContours } from '@/lib/annotation';

/**
 * Viewport orientation for MPR views
 */
export type ViewportOrientation = 'axial' | 'sagittal' | 'coronal';

/**
 * Viewport props interface - matches architecture spec
 */
export interface ViewportProps {
  /** Unique viewport identifier */
  viewportId: string;

  // Option 1: Direct image IDs (current implementation)
  /** Pre-computed image IDs for the viewport */
  imageIds?: string[];

  // Option 2: Study/Series based (spec-compliant)
  /** Study Instance UID */
  studyUid?: string;
  /** Series Instance UID */
  seriesUid?: string;
  /** Array of SOP Instance UIDs */
  instanceUids?: string[];

  /** Viewport orientation for MPR views (future support) */
  orientation?: ViewportOrientation;

  /** Annotations to display on viewport */
  annotations?: Annotation[];
  /** Callback when annotation is created, modified, or deleted */
  onAnnotationChange?: OnAnnotationChange;

  /** Additional CSS classes */
  className?: string;
  /** Callback when image is rendered (with current index) */
  onImageRendered?: (imageIndex: number) => void;

  /** Show/hide viewport info overlay */
  showOverlay?: boolean;
  /** Initial image index to display */
  initialImageIndex?: number;

  /**
   * Use native Cornerstone segmentation instead of custom canvas overlay.
   * Native segmentation has pixel-perfect pan/zoom sync because it renders
   * in the same WebGL pass as the image. Recommended for network deployments.
   * Default: false (uses custom AnnotationCanvas for backward compatibility)
   */
  useNativeSegmentation?: boolean;

  /** Invert the image colors (negative) */
  isInverted?: boolean;
}

export default function Viewport({
  viewportId,
  imageIds: directImageIds,
  studyUid,
  seriesUid,
  instanceUids,
  orientation = 'axial',
  annotations,
  onAnnotationChange,
  className,
  onImageRendered,
  showOverlay = true,
  initialImageIndex = 0,
  useNativeSegmentation = false,
  isInverted = false,
}: ViewportProps) {
  // Compute imageIds from either direct prop or study/series/instance UIDs
  const imageIds = useMemo(() => {
    // If direct imageIds provided, use them
    if (directImageIds && directImageIds.length > 0) {
      return directImageIds;
    }

    // If study/series/instance UIDs provided, generate imageIds
    // This would typically use createWadoRsImageIds, but requires API base URL
    // For now, return empty - the parent component should handle conversion
    if (studyUid && seriesUid && instanceUids && instanceUids.length > 0) {
      // Note: In a full implementation, this would call createWadoRsImageIds
      // But that requires siteConfig which adds coupling
      // Better to let parent component handle this conversion
      console.warn('[Viewport] studyUid/seriesUid/instanceUids provided but no imageIds - parent should convert');
      return [];
    }

    return [];
  }, [directImageIds, studyUid, seriesUid, instanceUids]);

  const elementRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<CornerstoneViewport | null>(null);
  const annotationCanvasRef = useRef<AnnotationCanvasRef>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);

  const { isActive, setActive } = useViewport(viewportId);
  const { setProgress, setLoading } = useImageLoading();

  // Canvas annotation store
  const { activeTool: canvasTool, brushRadius, fillColor, setActiveTool: setCanvasTool, annotations: storeAnnotations } = useCanvasAnnotationStore();

  // Smart tools store and hook
  const { activeTool: smartTool } = useSmartToolStore();
  const smartToolsApi = useSmartTools({
    viewport: viewportRef.current,
    imageIndex: currentImageIndex,
    totalSlices: imageIds.length,
  });
  const isSmartToolActive = smartTool !== 'none';

  // AI Segmentation store
  const { isActive: isAIActive } = useAISegmentationStore();

  // Segment tools store
  const { activeSegmentTool, thresholdConfig } = useAnnotationToolsStore();
  const { setAnnotations: setStoreAnnotations } = useCanvasAnnotationStore();
  const isSegmentToolActive = activeSegmentTool !== 'none' && 
    ['threshold', 'adaptive-threshold', 'otsu', 'hysteresis'].includes(activeSegmentTool);

  // Check if canvas annotation tool is active
  const CANVAS_TOOLS: CanvasToolType[] = ['freehand', 'brush', 'eraser', 'polygon'];
  const isCanvasToolActive = CANVAS_TOOLS.includes(canvasTool);

  // Disable Cornerstone primary tool when smart tool, canvas tool, or AI tool is active
  useEffect(() => {
    if (!isReady) return;

    const disableCornerstonePrimaryTool = async () => {
      if (isSmartToolActive || isCanvasToolActive || isAIActive) {
        try {
          const csTools = await import('@cornerstonejs/tools');
          const toolGroup = csTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
          if (toolGroup) {
            const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
            if (currentPrimaryTool) {
              // Set primary tool to passive to prevent it from handling clicks
              toolGroup.setToolPassive(currentPrimaryTool);
            }
          }
        } catch (error) {
          console.warn('[Viewport] Failed to disable Cornerstone tool:', error);
        }
      }
    };

    disableCornerstonePrimaryTool();
  }, [isReady, isSmartToolActive, isCanvasToolActive, isAIActive]);

  // Force cursor reset when smart tool or AI tool changes - override any Cornerstone tool cursor
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const canvas = element.querySelector('canvas');

    if (isSmartToolActive || isAIActive) {
      // Force crosshair cursor on both container and canvas
      element.style.cursor = 'crosshair';
      if (canvas) {
        canvas.style.cursor = 'crosshair';
      }
    } else {
      // Reset cursor
      element.style.cursor = '';
      if (canvas) {
        canvas.style.cursor = '';
      }
    }
  }, [smartTool, isSmartToolActive, isAIActive]);

  // Store refs for props that shouldn't trigger re-init
  const orientationRef = useRef(orientation);
  const annotationsRef = useRef(annotations);
  const onAnnotationChangeRef = useRef(onAnnotationChange);

  // Update refs when props change
  useEffect(() => {
    orientationRef.current = orientation;
    annotationsRef.current = annotations;
    onAnnotationChangeRef.current = onAnnotationChange;
  }, [orientation, annotations, onAnnotationChange]);

  // TODO: Future MPR support - orientation will be used to set viewport orientation
  // TODO: Annotation integration - annotations will be synced with Cornerstone annotation state

  // Initialize viewport
  useEffect(() => {
    if (!elementRef.current || imageIds.length === 0) {
      return;
    }

    let isMounted = true;

    const initViewport = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { getRenderingEngine, createToolGroup, getCornerstoneCore } = await import(
          '@/lib/cornerstone/setup'
        );
        const csTools = await import('@cornerstonejs/tools');
        const csCore = getCornerstoneCore();

        if (!csCore) {
          console.error('[Viewport] Cornerstone core not initialized');
          return;
        }

        const renderingEngine = getRenderingEngine();
        const element = elementRef.current!;

        // Enable the element
        const viewportInput = {
          viewportId,
          type: csCore.Enums.ViewportType.STACK,
          element,
          defaultOptions: {
            background: [0, 0, 0] as [number, number, number],
          },
        };

        renderingEngine.enableElement(viewportInput);

        // Get the viewport
        const viewport = renderingEngine.getViewport(viewportId);
        viewportRef.current = viewport as CornerstoneViewport;

        // Listen for IMAGE_RENDERED event to apply proper VOI after image loads
        let imageRenderedHandled = false;
        const handleImageRendered = () => {
          if (imageRenderedHandled) return;
          imageRenderedHandled = true;
          applyVOIAndRender();
        };

        // Function to apply VOI and render - called both from event and setTimeout fallback
        const applyVOIAndRender = async () => {
          try {
            // Reset camera to fit image
            viewport.resetCamera();

            // Get the csImage which has DICOM metadata
            const csImage = viewport.csImage;

            if (csImage) {
              // Check if the image has window width/center from DICOM tags
              const ww = csImage.windowWidth;
              const wc = csImage.windowCenter;

              if (ww && wc) {
                // Use the embedded window/level from DICOM
                const windowWidth = Array.isArray(ww) ? ww[0] : ww;
                const windowCenter = Array.isArray(wc) ? wc[0] : wc;
                viewport.setProperties({
                  voiRange: {
                    lower: windowCenter - windowWidth / 2,
                    upper: windowCenter + windowWidth / 2,
                  }
                });
              } else if (csImage.minPixelValue !== undefined && csImage.maxPixelValue !== undefined) {
                // Use the pixel value range from the image
                viewport.setProperties({
                  voiRange: {
                    lower: csImage.minPixelValue,
                    upper: csImage.maxPixelValue,
                  }
                });
              } else {
                // Calculate VOI from pixel data range
                const pixelData = csImage.getPixelData?.();
                if (pixelData && pixelData.length > 0) {
                  let min = Infinity;
                  let max = -Infinity;
                  // Sample pixels for performance (every 10th pixel)
                  for (let i = 0; i < pixelData.length; i += 10) {
                    if (pixelData[i] < min) min = pixelData[i];
                    if (pixelData[i] > max) max = pixelData[i];
                  }
                  if (min !== Infinity && max !== -Infinity && max > min) {
                    viewport.setProperties({
                      voiRange: { lower: min, upper: max }
                    });
                  }
                } else {
                  // Fallback: Use a wide default range for 16-bit images
                  viewport.setProperties({
                    voiRange: { lower: 0, upper: 4095 } // 12-bit DICOM typical range
                  });
                }
              }
            } else {
              // No csImage - use fallback
              viewport.setProperties({
                voiRange: { lower: 0, upper: 4095 }
              });
            }

            // Force render
            viewport.render();
          } catch (err: unknown) {
            const error = err as Error;
            console.warn('[Viewport] Error applying VOI:', error?.message || String(err));
          }
        };

        // Add event listener for image rendered
        element.addEventListener(csCore.Enums.Events.IMAGE_RENDERED, handleImageRendered);

        // Add viewport to tool group
        let toolGroup = csTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);

        if (!toolGroup) {
          toolGroup = createToolGroup(TOOL_GROUP_ID);
        }

        if (toolGroup) {
          toolGroup.addViewport(viewportId, renderingEngine.id);
        }

        // Set the stack
        setLoading(true);

        try {
          await viewport.setStack(imageIds, 0);

          // Wait for image to load then apply VOI (fallback if IMAGE_RENDERED event doesn't fire)
          setTimeout(() => {
            if (!imageRenderedHandled) {
              applyVOIAndRender();
            }
          }, 1000);

        } catch (stackError: unknown) {
          const error = stackError as Error;
          console.error('[Viewport] Error setting stack:', error?.message || String(stackError));
          // Continue anyway - the image might still render with error
        }

        // Render
        try {
          viewport.render();
        } catch (renderError: unknown) {
          const error = renderError as Error;
          console.error('[Viewport] Render error:', error?.message || String(renderError));
        }

        if (isMounted) {
          setIsReady(true);
          setLoading(false);
          setProgress(100);
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[Viewport] Failed to initialize:', err?.message || String(error));
        if (isMounted) {
          setLoading(false);
          // Mark as ready anyway to prevent infinite loading spinner
          setIsReady(true);
        }
      }
    };

    initViewport();

    return () => {
      isMounted = false;
      // Cleanup
      import('@/lib/cornerstone/setup').then(({ getRenderingEngine, getCornerstoneCore }) => {
        try {
          const renderingEngine = getRenderingEngine();
          const csCore = getCornerstoneCore();
          // Remove event listener if element exists
          if (elementRef.current && csCore?.Enums?.Events?.IMAGE_RENDERED) {
            elementRef.current.removeEventListener(
              csCore.Enums.Events.IMAGE_RENDERED,
              () => {} // Placeholder - actual handler is scoped to initViewport
            );
          }
          renderingEngine.disableElement(viewportId);
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
    };
  }, [viewportId, imageIds, setLoading, setProgress]);

  // Apply image inversion when isInverted changes
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isReady) return;

    try {
      viewport.setProperties({ invert: isInverted });
      viewport.render();
    } catch (err) {
      console.warn('[Viewport] Error applying invert:', err);
    }
  }, [isInverted, isReady]);

  // Sync store annotations (from smart tools) to AnnotationCanvas
  useEffect(() => {
    const canvas = annotationCanvasRef.current;
    console.log('[Viewport] Sync effect triggered, canvas:', !!canvas, 'isReady:', isReady, 'storeAnnotations size:', storeAnnotations.size);
    
    if (!canvas || !isReady) return;

    // Get annotations for current slice from store
    const key = String(currentImageIndex);
    const sliceAnnotations = storeAnnotations.get(key) || [];
    
    console.log('[Viewport] Slice', key, 'has', sliceAnnotations.length, 'annotations');

    if (sliceAnnotations.length > 0) {
      console.log('[Viewport] Syncing', sliceAnnotations.length, 'annotations from store to canvas for slice', currentImageIndex);
      console.log('[Viewport] First annotation:', JSON.stringify(sliceAnnotations[0]).slice(0, 200));
      canvas.setAnnotations(sliceAnnotations);
      canvas.redraw();
    }
  }, [storeAnnotations, currentImageIndex, isReady]);

  // Handle image navigation
  const scrollToImage = useCallback(
    async (index: number) => {
      if (!viewportRef.current || index < 0 || index >= imageIds.length) return;

      await viewportRef.current.setImageIdIndex(index);
      viewportRef.current.render();
      setCurrentImageIndex(index);
      onImageRendered?.(index);
    },
    [imageIds.length, onImageRendered]
  );

  // Handle wheel scroll for stack navigation
  // Ctrl+scroll triggers Zoom tool and deactivates annotation tools
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isReady) return;

    const handleWheel = (e: WheelEvent) => {
      // Always prevent default to stop slice navigation during zoom
      e.preventDefault();

      // Ctrl+scroll = zoom (not slice navigation)
      if (e.ctrlKey) {
        // Deactivate any canvas annotation tools when zooming
        if (isCanvasToolActive) {
          setCanvasTool('none');
        }

        // Manually apply zoom via viewport camera
        const viewport = viewportRef.current;
        if (viewport) {
          try {
            const camera = viewport.getCamera();
            // Zoom in on scroll up (negative deltaY), zoom out on scroll down (positive deltaY)
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            const newParallelScale = camera.parallelScale * zoomFactor;
            // Clamp zoom to reasonable bounds
            const clampedScale = Math.max(10, Math.min(1000, newParallelScale));
            viewport.setCamera({ ...camera, parallelScale: clampedScale });
            viewport.render();
          } catch {
            // Ignore camera errors
          }
        }
        return;
      }

      // Regular scroll = stack navigation (only when Ctrl is NOT pressed)
      const delta = e.deltaY > 0 ? 1 : -1;
      scrollToImage(currentImageIndex + delta);
    };

    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [isReady, currentImageIndex, scrollToImage, isCanvasToolActive, setCanvasTool]);

  // Handle Shift+click for Pan tool - deactivates annotation tools
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isReady) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Shift+left click activates Pan tool - deactivate any canvas annotation tools
      if (e.shiftKey && e.button === 0 && isCanvasToolActive) {
        setCanvasTool('none');
        // Don't prevent default - let Cornerstone handle Pan
      }
    };

    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isReady, isCanvasToolActive, setCanvasTool]);

  // Handle click to activate viewport and execute smart tools
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    // Always activate viewport on click
    if (!isActive) {
      setActive();
    }

    // Execute smart tool if one is active - stop event propagation to prevent Cornerstone tools
    if (isSmartToolActive && viewportRef.current) {
      // Prevent Cornerstone from handling this click (e.g., WindowLevel tool)
      e.stopPropagation();
      e.preventDefault();

      const canvas = viewportRef.current.canvas;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;

      try {
        // Capture event modifiers for mask operation mode
        const eventModifiers = { shiftKey: e.shiftKey, altKey: e.altKey };
        
        if (smartTool === 'magic-wand') {
          console.log('[Viewport] Executing Magic Wand at', canvasX, canvasY, 'modifiers:', eventModifiers);
          const result = await smartToolsApi.executeMagicWand(canvasX, canvasY);
          if (result && result.pixelCount > 0) {
            console.log('[Viewport] Magic Wand selected', result.pixelCount, 'pixels');
            smartToolsApi.resultToAnnotation(result, eventModifiers);
          }
        } else if (smartTool === 'region-growing') {
          console.log('[Viewport] Executing Region Growing at', canvasX, canvasY, 'modifiers:', eventModifiers);
          const result = await smartToolsApi.executeRegionGrowing(canvasX, canvasY);
          if (result && result.stats.area > 0) {
            console.log('[Viewport] Region Growing selected', result.stats.area, 'pixels');
            smartToolsApi.resultToAnnotation(result, eventModifiers);
          }
        }
      } catch (error) {
        console.error('[Viewport] Smart tool execution failed:', error);
      }
    }

    // Execute segment tool if one is active
    if (isSegmentToolActive && viewportRef.current) {
      e.stopPropagation();
      e.preventDefault();

      try {
        // Get image data from viewport
        const viewport = viewportRef.current as unknown as { 
          getImageData?: () => { dimensions: number[]; scalarData: Float32Array | Int16Array | Uint8Array | Uint16Array } | null;
          canvasToWorld?: (point: [number, number]) => [number, number, number];
        };
        const imageData = viewport.getImageData?.();
        if (!imageData) {
          console.warn('[Viewport] No image data for segment tool');
          return;
        }

        const { dimensions, scalarData } = imageData;
        const width = dimensions[0];
        const height = dimensions[1];

        console.log('[Viewport] Executing segment tool:', activeSegmentTool, 'on image', width, 'x', height);

        let result;
        if (activeSegmentTool === 'threshold') {
          result = thresholdSegment(scalarData as Float32Array, width, height, thresholdConfig);
        } else if (activeSegmentTool === 'adaptive-threshold') {
          result = adaptiveThreshold(scalarData as Float32Array, width, height, { windowSize: 15, constant: 5, method: 'mean' });
        } else if (activeSegmentTool === 'otsu') {
          result = otsuThreshold(scalarData as Float32Array, width, height);
        } else if (activeSegmentTool === 'hysteresis') {
          result = hysteresisThreshold(scalarData as Float32Array, width, height, thresholdConfig.lowerThreshold, thresholdConfig.upperThreshold);
        }

        if (result && result.pixelCount > 0) {
          console.log('[Viewport] Segment tool selected', result.pixelCount, 'pixels');
          
          // Convert mask to contours
          const contours = maskToContours({ data: result.data, width: result.width, height: result.height });
          
          if (contours.length > 0) {
            // Get the largest contour
            const largestContour = contours.reduce((a, b) => a.length > b.length ? a : b);
            
            // Convert 2D contour points to world coordinates
            const canvasToWorld = viewport.canvasToWorld;
            const pointsWorld = largestContour.map(([x, y]) => {
              if (canvasToWorld) {
                const worldPoint = canvasToWorld([x, y]);
                return worldPoint;
              }
              // Fallback: use canvas coordinates as world (not ideal but works for visualization)
              return [x, y, 0] as [number, number, number];
            });
            
            console.log('[Viewport] Created contour with', pointsWorld.length, 'points');
            
            // Create annotation from contour
            const annotation = {
              id: `segment-${Date.now()}`,
              type: 'freehand' as const,
              pointsWorld,
              completed: true,
              color: 'rgba(144, 238, 144, 0.4)',
            };
            const key = String(currentImageIndex);
            const existing = storeAnnotations.get(key) || [];
            setStoreAnnotations(key, [...existing, annotation]);
          }
        } else {
          console.log('[Viewport] Segment tool found no pixels matching criteria');
        }
      } catch (error) {
        console.error('[Viewport] Segment tool execution failed:', error);
      }
    }
  }, [isActive, setActive, isSmartToolActive, smartTool, smartToolsApi, isSegmentToolActive, activeSegmentTool, thresholdConfig, currentImageIndex, storeAnnotations, setStoreAnnotations]);

  // Handle canvas annotation changes
  const handleAnnotationsChange = useCallback(() => {
    // Store annotations for this viewport/slice
    // Can be extended to sync with external annotation system
  }, []);

  // Get cursor class based on active smart tool
  const getSmartToolCursor = () => {
    if (!isSmartToolActive) return '';
    switch (smartTool) {
      case 'magic-wand':
        return 'cursor-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23FFD700\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72\'%3E%3C/path%3E%3Cpath d=\'m14 7 3 3\'%3E%3C/path%3E%3Cpath d=\'M5 6v4\'%3E%3C/path%3E%3Cpath d=\'M19 14v4\'%3E%3C/path%3E%3Cpath d=\'M10 2v2\'%3E%3C/path%3E%3Cpath d=\'M7 8H3\'%3E%3C/path%3E%3Cpath d=\'M21 16h-4\'%3E%3C/path%3E%3Cpath d=\'M11 3H9\'%3E%3C/path%3E%3C/svg%3E"),_crosshair]';
      case 'region-growing':
        return 'cursor-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2300FF00\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\'%3E%3C/circle%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'6\'%3E%3C/circle%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'2\'%3E%3C/circle%3E%3C/svg%3E"),_crosshair]';
      case 'interpolation':
        return 'cursor-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2300BFFF\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z\'%3E%3C/path%3E%3Cpath d=\'m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65\'%3E%3C/path%3E%3Cpath d=\'m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65\'%3E%3C/path%3E%3C/svg%3E"),_crosshair]';
      default:
        return 'cursor-cell';
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative w-full h-full bg-black',
        isActive && 'ring-2 ring-green-500',
        !isCanvasToolActive && !isSmartToolActive && !isSegmentToolActive && 'cursor-crosshair',
        getSmartToolCursor(),
        isSegmentToolActive && 'cursor-crosshair',
        className
      )}
      style={(isSmartToolActive || isSegmentToolActive) ? { cursor: 'crosshair' } : undefined}
      onClick={handleClick}
      onMouseDown={(isSmartToolActive || isSegmentToolActive) ? (e) => { e.stopPropagation(); } : undefined}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Loading overlay */}
      {!isReady && imageIds.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading images...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {imageIds.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <p className="text-slate-500">No images to display</p>
        </div>
      )}

      {/* Annotation overlay - either native Cornerstone segmentation or custom canvas */}
      {isReady && useNativeSegmentation && (
        <NativeSegmentationOverlay
          viewportId={viewportId}
          activeTool={canvasTool as NativeToolType}
          brushRadius={brushRadius}
          fillColor={fillColor}
          disabled={!isCanvasToolActive}
          onSegmentationChange={handleAnnotationsChange}
        />
      )}
      {isReady && !useNativeSegmentation && (
        <AnnotationCanvas
          ref={annotationCanvasRef}
          activeTool={canvasTool}
          brushRadius={brushRadius}
          fillColor={fillColor}
          imageIndex={currentImageIndex}
          onAnnotationsChange={handleAnnotationsChange}
          disabled={!isCanvasToolActive || isAIActive}
          viewport={viewportRef.current}
          cornerstoneElement={elementRef.current}
          className="z-10"
        />
      )}

      {/* AI Segmentation Prompt Overlay */}
      {isReady && isAIActive && elementRef.current && (
        <AIPromptOverlay
          width={elementRef.current.clientWidth}
          height={elementRef.current.clientHeight}
          imageWidth={512}
          imageHeight={512}
          currentSlice={currentImageIndex}
          zIndex={50}
        />
      )}

      {/* Image index indicator */}
      {showOverlay && isReady && imageIds.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white z-30 pointer-events-none">
          {currentImageIndex + 1} / {imageIds.length}
        </div>
      )}

      {/* Orientation indicator (for future MPR support) */}
      {showOverlay && isReady && orientation && (
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white uppercase z-30 pointer-events-none">
          {orientation}
        </div>
      )}

      {/* Active tool indicator */}
      {showOverlay && isReady && isCanvasToolActive && (
        <div className="absolute top-2 right-2 bg-green-600/80 px-2 py-1 rounded text-xs text-white uppercase z-30 pointer-events-none">
          {canvasTool}
        </div>
      )}

      {/* Smart tool indicator */}
      {showOverlay && isReady && isSmartToolActive && (
        <div className="absolute top-2 right-2 bg-purple-600/80 px-2 py-1 rounded text-xs text-white uppercase z-30 pointer-events-none">
          {smartTool}
        </div>
      )}

      {/* AI Segmentation tool indicator */}
      {showOverlay && isReady && isAIActive && (
        <div className="absolute top-2 right-2 bg-pink-600/80 px-2 py-1 rounded text-xs text-white uppercase z-30 pointer-events-none">
          AI Segment
        </div>
      )}
    </div>
  );
}
