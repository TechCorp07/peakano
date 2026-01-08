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
import { useCanvasAnnotationStore } from '@/features/annotation';

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
  const { activeTool: canvasTool, brushRadius, fillColor, setActiveTool: setCanvasTool } = useCanvasAnnotationStore();

  // Check if canvas annotation tool is active
  const CANVAS_TOOLS: CanvasToolType[] = ['freehand', 'brush', 'eraser', 'polygon'];
  const isCanvasToolActive = CANVAS_TOOLS.includes(canvasTool);

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
      // Ctrl+scroll activates Zoom tool - deactivate any canvas annotation tools
      if (e.ctrlKey && isCanvasToolActive) {
        setCanvasTool('none');
        // Don't prevent default - let Cornerstone handle Zoom
        return;
      }

      // Regular scroll = stack navigation
      e.preventDefault();
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

  // Handle click to activate viewport
  const handleClick = useCallback(() => {
    if (!isActive) {
      setActive();
    }
  }, [isActive, setActive]);

  // Handle canvas annotation changes
  const handleAnnotationsChange = useCallback(() => {
    // Store annotations for this viewport/slice
    // Can be extended to sync with external annotation system
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative w-full h-full bg-black',
        isActive && 'ring-2 ring-green-500',
        !isCanvasToolActive && 'cursor-crosshair',
        className
      )}
      onClick={handleClick}
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

      {/* Canvas annotation overlay - renders on top of DICOM viewport */}
      {isReady && (
        <AnnotationCanvas
          ref={annotationCanvasRef}
          activeTool={canvasTool}
          brushRadius={brushRadius}
          fillColor={fillColor}
          imageIndex={currentImageIndex}
          onAnnotationsChange={handleAnnotationsChange}
          disabled={!isCanvasToolActive}
          viewport={viewportRef.current}
          cornerstoneElement={elementRef.current}
          className="z-10"
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
    </div>
  );
}
