'use client';

/**
 * AnnotationCanvas Component - Hybrid Rendering Architecture
 *
 * RENDERING CONTRACT:
 * - IMAGE_RENDERED syncs with Cornerstone renders (zoom/pan/scroll)
 * - RAF fallback provides immediate cursor/stroke feedback during interaction
 * - CAMERA_MODIFIED / CAMERA_RESET only set dirty flags
 * - Pointer events update refs + mark dirty + schedule RAF draw
 *
 * WHY HYBRID:
 * - IMAGE_RENDERED alone doesn't fire on mouse movement
 * - RAF alone would be out of sync with Cornerstone during zoom/pan
 * - Hybrid gives both: responsive cursor AND correct alignment
 *
 * DIRTY FLAG CONTRACT:
 * - staticDirtyRef: true when finalized annotations change
 * - activeDirtyRef: true when active stroke/cursor/preview changes
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '@/lib/utils';
import { generateUUID } from '@/lib/utils/uuid';
import { useAnnotationToolsStore, type MaskOperationType } from '@/lib/annotation/store';

// === TYPES ===
export type CanvasToolType = 'freehand' | 'brush' | 'eraser' | 'polygon' | 'none';
export type Point3 = [number, number, number];
export interface CanvasPoint { x: number; y: number; }

export interface WorldPolygonAnnotation {
  id: string;
  type: 'polygon';
  pointsWorld: Point3[];
  completed: boolean;
  color: string;
}

export interface WorldFreehandAnnotation {
  id: string;
  type: 'freehand';
  pointsWorld: Point3[];
  completed: boolean;
  color: string;
}

export interface WorldBrushStroke {
  id: string;
  type: 'brush';
  pointsWorld: Point3[];
  radius: number;
  color: string;
}

export interface WorldEraserStroke {
  id: string;
  type: 'eraser';
  pointsWorld: Point3[];
  radius: number;
}

export interface WorldEraserFreehand {
  id: string;
  type: 'eraser-freehand';
  pointsWorld: Point3[];
}

export interface WorldEraserPolygon {
  id: string;
  type: 'eraser-polygon';
  pointsWorld: Point3[];
}

export type WorldAnnotation = WorldPolygonAnnotation | WorldFreehandAnnotation | WorldBrushStroke | WorldEraserStroke | WorldEraserFreehand | WorldEraserPolygon;

export interface CanvasAnnotation {
  id: string;
  type: 'polygon' | 'freehand' | 'brush' | 'eraser' | 'eraser-freehand' | 'eraser-polygon';
  points?: CanvasPoint[];
  pointsWorld?: Point3[];
  completed?: boolean;
  color?: string;
  radius?: number;
}

// === CONSTANTS ===
const MASK_COLOR = 'rgba(50, 205, 50, 0.6)';  // Lime green with 60% opacity
const MIN_POINT_DISTANCE = 2;
const IDLE_SAVE_MS = 8000;
const PERIODIC_SAVE_MS = 120000;

// === HELPERS ===
const canvasDistance = (p1: CanvasPoint, p2: CanvasPoint): number =>
  Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

// Throttle constant for pan/zoom optimization (~30fps)
const THROTTLE_MS = 33;

// Throttle utility to limit function call frequency during pan/zoom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createThrottle = <T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): { throttled: (...args: Parameters<T>) => void; flush: () => void } => {
  let lastCall = 0;
  let pendingArgs: Parameters<T> | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      // Enough time has passed, execute immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      pendingArgs = null;
      fn(...args);
    } else {
      // Store args for trailing call
      pendingArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          if (pendingArgs) {
            fn(...pendingArgs);
            pendingArgs = null;
          }
        }, remaining);
      }
    }
  };

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs) {
      lastCall = Date.now();
      fn(...pendingArgs);
      pendingArgs = null;
    }
  };

  return { throttled, flush };
};

// === CORNERSTONE VIEWPORT INTERFACE ===
export interface CornerstoneViewport {
  canvas: HTMLCanvasElement;
  element: HTMLElement;
  canvasToWorld: (canvasPoint: [number, number]) => Point3;
  worldToCanvas: (worldPoint: Point3) => [number, number];
  getCamera: () => {
    parallelScale: number;
    focalPoint: Point3;
    position: Point3;
    viewUp: Point3;
  };
  setCamera: (camera: {
    parallelScale?: number;
    focalPoint?: Point3;
    position?: Point3;
    viewUp?: Point3;
  }) => void;
  render: () => void;
  resetCamera: () => void;
  setImageIdIndex: (index: number) => Promise<void>;
  setStack: (imageIds: string[], initialIndex?: number) => Promise<void>;
  setProperties: (props: Record<string, unknown>) => void;
  csImage?: {
    windowWidth?: number | number[];
    windowCenter?: number | number[];
    minPixelValue?: number;
    maxPixelValue?: number;
    getPixelData?: () => number[] | Float32Array | Int16Array | Uint16Array;
  };
}

// === PROPS & REF INTERFACES ===
export interface AnnotationCanvasProps {
  activeTool: CanvasToolType;
  fillColor?: string;
  brushRadius?: number;
  onAnnotationsChange?: (annotations: CanvasAnnotation[]) => void;
  onSave?: (payload: AnnotationSavePayload) => Promise<void>;
  imageIndex?: number;
  className?: string;
  disabled?: boolean;
  onBrushRadiusChange?: (radius: number) => void;
  viewport?: CornerstoneViewport | null;
  cornerstoneElement?: HTMLElement | null;
}

export interface AnnotationSavePayload {
  imageIndex: number;
  annotations: WorldAnnotation[];
  timestamp: number;
}

export interface AnnotationCanvasRef {
  clearAll: () => void;
  undo: () => void;
  getAnnotations: () => CanvasAnnotation[];
  setAnnotations: (annotations: CanvasAnnotation[]) => void;
  redraw: () => void;
  forceSave: () => Promise<void>;
}

// === COMPONENT ===
const AnnotationCanvas = forwardRef<AnnotationCanvasRef, AnnotationCanvasProps>(
  (
    {
      activeTool,
      brushRadius = 15,
      onSave,
      imageIndex = 0,
      className,
      disabled = false,
      onBrushRadiusChange,
      viewport,
      cornerstoneElement,
    },
    ref
  ) => {
    // === DOM REFS ===
    const containerRef = useRef<HTMLDivElement>(null);
    const staticCanvasRef = useRef<HTMLCanvasElement>(null);
    const activeCanvasRef = useRef<HTMLCanvasElement>(null);

    // === ANNOTATION DATA (all refs, no state during hot path) ===
    const annotationsRef = useRef<Map<number, WorldAnnotation[]>>(new Map());
    const activeRef = useRef<WorldAnnotation | null>(null);

    // Freehand/polygon paths
    const freehandPathRef = useRef<Point3[]>([]);
    const eraseFreehandPathRef = useRef<Point3[]>([]);
    const polygonVerticesRef = useRef<Point3[]>([]);
    const erasePolygonVerticesRef = useRef<Point3[]>([]);

    // Interaction state (refs to avoid re-renders)
    const isActiveRef = useRef(false);
    const isEraseModeRef = useRef(false);
    const lastCanvasPointRef = useRef<CanvasPoint | null>(null);
    const mouseCanvasPosRef = useRef<CanvasPoint | null>(null);

    // Pointer tracking for hybrid RAF redraw (Fix A)
    const isPointerDownRef = useRef(false);
    const isRightPointerDownRef = useRef(false); // Track right-click for brush erase shortcut
    const rafIdRef = useRef<number | null>(null);

    // === UI STATE (minimal, for status display only) ===
    const [displayIsActive, setDisplayIsActive] = useState(false);
    const [displayIsEraseMode, setDisplayIsEraseMode] = useState(false);
    const [currentBrushRadius, setCurrentBrushRadius] = useState(brushRadius);

    // === MASK OPERATION MODE (from store) ===
    const maskOperationMode = useAnnotationToolsStore((state) => state.maskOperationMode);

    // === DIRTY FLAGS (core of 280ms approach) ===
    const staticDirtyRef = useRef(false);
    const activeDirtyRef = useRef(false);

    // === CACHED RECT (safe optimization - doesn't change behavior) ===
    const cachedRectRef = useRef<{ rect: DOMRect; scaleX: number; scaleY: number } | null>(null);

    // === PAN/ZOOM OPTIMIZATION: Throttled drawing and camera tracking ===
    const throttledDrawStaticRef = useRef<{ throttled: () => void; flush: () => void } | null>(null);
    const lastCameraRef = useRef<{ parallelScale: number; focalPoint: Point3 } | null>(null);

    // Phase 3: OffscreenCanvas cache for fast pan/zoom rendering
    const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
    const cachedCameraRef = useRef<{ parallelScale: number; focalPoint: Point3 } | null>(null);
    const isInteractingRef = useRef(false);
    const interactionEndTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Note: Removed complex CSS transform approach - using simpler throttled redraw instead

    // === AUTOSAVE STATE ===
    const saveDirtyRef = useRef(false);
    const lastChangeAtRef = useRef(0);
    const saveInFlightRef = useRef(false);
    const saveQueuedRef = useRef(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);

    // === UNDO HISTORY ===
    const historyRef = useRef<WorldAnnotation[][]>([]);
    const historyIndexRef = useRef(-1);

    // Update brush radius from props
    useEffect(() => {
      setCurrentBrushRadius(brushRadius);
    }, [brushRadius]);

    // Reset state when tool changes
    useEffect(() => {
      if (activeTool === 'none') {
        isActiveRef.current = false;
        isEraseModeRef.current = false;
        setDisplayIsActive(false);
        setDisplayIsEraseMode(false);
      }
      freehandPathRef.current = [];
      eraseFreehandPathRef.current = [];
      polygonVerticesRef.current = [];
      erasePolygonVerticesRef.current = [];
      lastCanvasPointRef.current = null;
    }, [activeTool]);

    // === CANVAS CONTEXTS ===
    const getStaticContext = useCallback(() => {
      return staticCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    }, []);

    const getActiveContext = useCallback(() => {
      return activeCanvasRef.current?.getContext('2d');
    }, []);

    // === CANVAS SIZING (only called in IMAGE_RENDERED or resize) ===
    // Fix B: Don't resize canvases mid-stroke to prevent clearing active drawings
    const syncCanvasSize = useCallback(() => {
      if (!viewport?.canvas || !staticCanvasRef.current || !activeCanvasRef.current) {
        return false;
      }

      const csCanvas = viewport.canvas;
      const { width, height } = csCanvas;
      if (width === 0 || height === 0) return false;

      // Fix B: Don't resize mid-stroke - defer until stroke ends
      // This prevents canvas clearing and coordinate jumps during drawing
      if (isPointerDownRef.current) {
        // Still update cached rect for coordinate mapping
        const rect = csCanvas.getBoundingClientRect();
        cachedRectRef.current = {
          rect,
          scaleX: csCanvas.width / rect.width,
          scaleY: csCanvas.height / rect.height,
        };
        return false;
      }

      let changed = false;
      for (const canvas of [staticCanvasRef.current, activeCanvasRef.current]) {
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          changed = true;
        }
      }

      // Update cached rect on size change
      if (changed || !cachedRectRef.current) {
        const rect = csCanvas.getBoundingClientRect();
        cachedRectRef.current = {
          rect,
          scaleX: csCanvas.width / rect.width,
          scaleY: csCanvas.height / rect.height,
        };
      }

      return true;
    }, [viewport]);

    // === COORDINATE CONVERSION (with cached rect - safe optimization) ===
    const clientToCanvasPoint = useCallback((clientX: number, clientY: number): CanvasPoint | null => {
      const csCanvas = viewport?.canvas;
      if (!csCanvas) {
        const canvas = activeCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        return {
          x: ((clientX - rect.left) / rect.width) * canvas.width,
          y: ((clientY - rect.top) / rect.height) * canvas.height,
        };
      }

      // Use cached rect if available (safe optimization)
      if (cachedRectRef.current) {
        const { rect, scaleX, scaleY } = cachedRectRef.current;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
        };
      }

      // Fallback to fresh rect
      const rect = csCanvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * csCanvas.width,
        y: ((clientY - rect.top) / rect.height) * csCanvas.height,
      };
    }, [viewport]);

    const clientToWorld = useCallback((clientX: number, clientY: number): Point3 | null => {
      if (!viewport) return null;
      const canvasPt = clientToCanvasPoint(clientX, clientY);
      if (!canvasPt) return null;
      try {
        return viewport.canvasToWorld([canvasPt.x, canvasPt.y]);
      } catch {
        return null;
      }
    }, [viewport, clientToCanvasPoint]);

    const worldToCanvas = useCallback((worldPt: Point3): CanvasPoint | null => {
      if (!viewport) return null;
      try {
        const [x, y] = viewport.worldToCanvas(worldPt);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { x, y };
      } catch {
        return null;
      }
    }, [viewport]);

    const getWorldRadius = useCallback((screenRadius: number): number => {
      if (!viewport) return screenRadius;
      try {
        const camera = viewport.getCamera();
        if (!camera?.parallelScale) return screenRadius;
        const csCanvas = viewport.canvas;
        if (!csCanvas) return screenRadius;
        const worldUnitsPerPixel = (2 * camera.parallelScale) / csCanvas.height;
        return screenRadius * worldUnitsPerPixel;
      } catch {
        return screenRadius;
      }
    }, [viewport]);

    const getCanvasRadius = useCallback((worldRadius: number): number => {
      if (!viewport) return worldRadius;
      try {
        const camera = viewport.getCamera();
        if (!camera?.parallelScale) return worldRadius;
        const csCanvas = viewport.canvas;
        if (!csCanvas) return worldRadius;
        const worldUnitsPerPixel = (2 * camera.parallelScale) / csCanvas.height;
        return worldRadius / worldUnitsPerPixel;
      } catch {
        return worldRadius;
      }
    }, [viewport]);

    // === ANNOTATION STORAGE ===
    // Track current imageIndex in a ref for use in callbacks without stale closures
    const currentImageIndexRef = useRef(imageIndex);

    // Update the ref whenever imageIndex changes
    useEffect(() => {
      currentImageIndexRef.current = imageIndex;
    }, [imageIndex]);

    const getSliceAnnotations = useCallback((): WorldAnnotation[] => {
      // Use ref to always get current imageIndex, avoiding stale closure issues
      return annotationsRef.current.get(currentImageIndexRef.current) || [];
    }, []);

    const setSliceAnnotations = useCallback((annotations: WorldAnnotation[]) => {
      // Use ref to always set on current imageIndex, avoiding stale closure issues
      annotationsRef.current.set(currentImageIndexRef.current, annotations);
    }, []);

    /**
     * Apply an annotation respecting the current mask operation mode
     * - replace: Clear all existing annotations and add the new one
     * - add/union: Append to existing annotations (default behavior)
     * - subtract: Convert to eraser-type annotation
     * - intersect: Currently treated as add (full intersect would require mask operations)
     * - xor: Currently treated as add (full XOR would require mask operations)
     */
    const applyAnnotationWithMode = useCallback((newAnnotation: WorldAnnotation, mode?: MaskOperationType) => {
      const currentMode = mode ?? maskOperationMode;
      const existing = getSliceAnnotations();

      switch (currentMode) {
        case 'replace':
          // Clear all and add new
          setSliceAnnotations([newAnnotation]);
          break;

        case 'subtract':
          // Convert to eraser type for subtraction
          if (newAnnotation.type === 'brush') {
            const eraserAnnotation: WorldEraserStroke = {
              id: newAnnotation.id,
              type: 'eraser',
              pointsWorld: newAnnotation.pointsWorld,
              radius: newAnnotation.radius,
            };
            setSliceAnnotations([...existing, eraserAnnotation]);
          } else if (newAnnotation.type === 'freehand') {
            const eraserAnnotation: WorldEraserFreehand = {
              id: newAnnotation.id,
              type: 'eraser-freehand',
              pointsWorld: newAnnotation.pointsWorld,
            };
            setSliceAnnotations([...existing, eraserAnnotation]);
          } else if (newAnnotation.type === 'polygon') {
            const eraserAnnotation: WorldEraserPolygon = {
              id: newAnnotation.id,
              type: 'eraser-polygon',
              pointsWorld: newAnnotation.pointsWorld,
            };
            setSliceAnnotations([...existing, eraserAnnotation]);
          } else {
            // For eraser types, just add as-is
            setSliceAnnotations([...existing, newAnnotation]);
          }
          break;

        case 'add':
        case 'union':
        case 'intersect':
        case 'xor':
        case 'none':
        default:
          // Append to existing (default behavior)
          setSliceAnnotations([...existing, newAnnotation]);
          break;
      }
    }, [maskOperationMode, getSliceAnnotations, setSliceAnnotations]);

    // === DIRTY FLAG HELPERS (no drawing here!) ===
    const markSaveDirty = useCallback(() => {
      saveDirtyRef.current = true;
      lastChangeAtRef.current = Date.now();
    }, []);

    const markStaticDirty = useCallback(() => {
      staticDirtyRef.current = true;
    }, []);

    const markActiveDirty = useCallback(() => {
      activeDirtyRef.current = true;
    }, []);

    // === HISTORY ===
    const saveToHistory = useCallback(() => {
      const current = getSliceAnnotations();
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push([...current]);
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    }, [getSliceAnnotations]);

    // === AUTOSAVE (never during active drawing) ===
    const saveIfNeeded = useCallback(async () => {
      // Never save during active drawing
      if (isActiveRef.current) return;
      if (!saveDirtyRef.current || !onSave) return;

      if (saveInFlightRef.current) {
        saveQueuedRef.current = true;
        return;
      }

      saveInFlightRef.current = true;
      try {
        const allAnnotations: WorldAnnotation[] = [];
        annotationsRef.current.forEach((anns) => {
          allAnnotations.push(...anns);
        });

        await onSave({
          imageIndex,
          annotations: allAnnotations,
          timestamp: Date.now(),
        });

        saveDirtyRef.current = false;
      } catch (error) {
        console.error('[AnnotationCanvas] Save failed:', error);
      } finally {
        saveInFlightRef.current = false;
        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          await saveIfNeeded();
        }
      }
    }, [onSave, imageIndex]);

    // Install autosave timers
    useEffect(() => {
      idleTimerRef.current = setInterval(() => {
        if (!saveDirtyRef.current) return;
        if (isActiveRef.current) return; // Don't save during drawing
        if (Date.now() - lastChangeAtRef.current > IDLE_SAVE_MS) {
          saveIfNeeded();
        }
      }, 1000);

      periodicTimerRef.current = setInterval(() => {
        if (saveDirtyRef.current && !isActiveRef.current) {
          saveIfNeeded();
        }
      }, PERIODIC_SAVE_MS);

      return () => {
        if (idleTimerRef.current) clearInterval(idleTimerRef.current);
        if (periodicTimerRef.current) clearInterval(periodicTimerRef.current);
      };
    }, [saveIfNeeded]);

    // === DRAWING: STATIC CANVAS (finalized annotations) ===
    // Full redraw, no caching, no incremental rendering
    // Draws annotations in order, using destination-out for eraser strokes
    const drawStatic = useCallback(() => {
      const ctx = getStaticContext();
      const canvas = staticCanvasRef.current;
      if (!ctx || !canvas || !viewport) return;

      // Ensure canvas dimensions are valid
      if (canvas.width === 0 || canvas.height === 0) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get annotations for the CURRENT slice (using ref for consistency)
      const annotations = getSliceAnnotations();

      // Guard: Don't draw if no annotations for this slice
      if (!annotations || annotations.length === 0) return;

      for (const ann of annotations) {
        if (ann.type === 'brush' && ann.pointsWorld.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = MASK_COLOR;
          ctx.strokeStyle = MASK_COLOR;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const canvasRadius = getCanvasRadius(ann.radius);
          ctx.lineWidth = canvasRadius * 2;

          const pts = ann.pointsWorld;
          const firstPt = worldToCanvas(pts[0]);
          if (firstPt) {
            ctx.beginPath();
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < pts.length; i++) {
              const pt = worldToCanvas(pts[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();

            // Endpoints
            ctx.beginPath();
            ctx.arc(firstPt.x, firstPt.y, canvasRadius, 0, Math.PI * 2);
            ctx.fill();
            if (pts.length > 1) {
              const lastPt = worldToCanvas(pts[pts.length - 1]);
              if (lastPt) {
                ctx.beginPath();
                ctx.arc(lastPt.x, lastPt.y, canvasRadius, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        } else if (ann.type === 'eraser' && ann.pointsWorld.length > 0) {
          // Eraser uses destination-out to cut holes in existing annotations
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const canvasRadius = getCanvasRadius(ann.radius);
          ctx.lineWidth = canvasRadius * 2;

          const pts = ann.pointsWorld;
          const firstPt = worldToCanvas(pts[0]);
          if (firstPt) {
            ctx.beginPath();
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < pts.length; i++) {
              const pt = worldToCanvas(pts[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();

            // Endpoints
            ctx.beginPath();
            ctx.arc(firstPt.x, firstPt.y, canvasRadius, 0, Math.PI * 2);
            ctx.fill();
            if (pts.length > 1) {
              const lastPt = worldToCanvas(pts[pts.length - 1]);
              if (lastPt) {
                ctx.beginPath();
                ctx.arc(lastPt.x, lastPt.y, canvasRadius, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        } else if (ann.type === 'freehand' && ann.pointsWorld.length > 2) {
          ctx.save();
          ctx.fillStyle = MASK_COLOR;
          ctx.beginPath();
          const firstPt = worldToCanvas(ann.pointsWorld[0]);
          if (firstPt) {
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < ann.pointsWorld.length; i++) {
              const pt = worldToCanvas(ann.pointsWorld[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        } else if (ann.type === 'polygon' && ann.completed && ann.pointsWorld.length > 2) {
          ctx.save();
          ctx.fillStyle = MASK_COLOR;
          ctx.beginPath();
          const firstPt = worldToCanvas(ann.pointsWorld[0]);
          if (firstPt) {
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < ann.pointsWorld.length; i++) {
              const pt = worldToCanvas(ann.pointsWorld[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        } else if (ann.type === 'eraser-freehand' && ann.pointsWorld.length > 2) {
          // Eraser freehand uses destination-out to cut holes in existing annotations
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          const firstPt = worldToCanvas(ann.pointsWorld[0]);
          if (firstPt) {
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < ann.pointsWorld.length; i++) {
              const pt = worldToCanvas(ann.pointsWorld[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        } else if (ann.type === 'eraser-polygon' && ann.pointsWorld.length > 2) {
          // Eraser polygon uses destination-out to cut holes in existing annotations
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          const firstPt = worldToCanvas(ann.pointsWorld[0]);
          if (firstPt) {
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < ann.pointsWorld.length; i++) {
              const pt = worldToCanvas(ann.pointsWorld[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Note: Baseline camera tracking removed - using simpler throttled redraw approach
    }, [getStaticContext, viewport, getSliceAnnotations, worldToCanvas, getCanvasRadius]);

    // === DRAWING: ACTIVE CANVAS (current stroke + cursor + previews) ===
    // Full redraw with clearRect, no caching, no incremental rendering
    const drawActive = useCallback(() => {
      const ctx = getActiveContext();
      const canvas = activeCanvasRef.current;
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouseCanvasPos = mouseCanvasPosRef.current;
      const canvasBrushRadius = viewport
        ? getCanvasRadius(getWorldRadius(currentBrushRadius))
        : currentBrushRadius;

      const isActive = isActiveRef.current;
      const isEraseMode = isEraseModeRef.current;

      // Draw current stroke
      const active = activeRef.current;
      if (active) {
        if (active.type === 'brush' && active.pointsWorld.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          // Use semi-transparent color to match static canvas appearance (which has 50% opacity)
          const brushPreviewColor = 'rgba(144, 238, 144, 0.5)';
          ctx.fillStyle = brushPreviewColor;
          ctx.strokeStyle = brushPreviewColor;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const canvasRadius = getCanvasRadius(active.radius);
          ctx.lineWidth = canvasRadius * 2;

          const pts = active.pointsWorld;
          const firstPt = worldToCanvas(pts[0]);
          if (firstPt) {
            ctx.beginPath();
            ctx.moveTo(firstPt.x, firstPt.y);
            for (let i = 1; i < pts.length; i++) {
              const pt = worldToCanvas(pts[i]);
              if (pt) ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(firstPt.x, firstPt.y, canvasRadius, 0, Math.PI * 2);
            ctx.fill();
            if (pts.length > 1) {
              const lastPt = worldToCanvas(pts[pts.length - 1]);
              if (lastPt) {
                ctx.beginPath();
                ctx.arc(lastPt.x, lastPt.y, canvasRadius, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        } else if (active.type === 'eraser' && active.pointsWorld.length > 0) {
          // Eraser now erases immediately - no preview stroke needed
          // The erasing happens in real-time on the static canvas
        }
      }

      // Draw cursor
      const isBrushEraseMode = (isEraseMode && activeTool === 'brush') || activeTool === 'eraser';
      const shouldShowNormalBrushCursor = activeTool === 'brush' && !isEraseMode;

      if (mouseCanvasPos && isBrushEraseMode) {
        ctx.save();
        // Eraser cursor - solid circle (no dashed/paused state since it's click-and-drag)
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, canvasBrushRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (mouseCanvasPos && shouldShowNormalBrushCursor) {
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, canvasBrushRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(80, 255, 80, 1)';
        ctx.lineWidth = 2;
        if (!isActive) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, canvasBrushRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Polygon cursor (when no vertices yet)
      if (activeTool === 'polygon' && !isEraseMode && mouseCanvasPos && polygonVerticesRef.current.length === 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(144, 238, 144, 0.8)';
        ctx.lineWidth = 2;
        // Draw a small crosshair with a circle
        const crossSize = 8;
        ctx.beginPath();
        ctx.moveTo(mouseCanvasPos.x - crossSize, mouseCanvasPos.y);
        ctx.lineTo(mouseCanvasPos.x + crossSize, mouseCanvasPos.y);
        ctx.moveTo(mouseCanvasPos.x, mouseCanvasPos.y - crossSize);
        ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y + crossSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Polygon preview (when vertices exist) - vertices only, no fill
      const polygonVertices = polygonVerticesRef.current;
      if (activeTool === 'polygon' && !isEraseMode && polygonVertices.length > 0) {
        ctx.save();
        const firstPt = worldToCanvas(polygonVertices[0]);
        if (firstPt) {
          // Draw connecting lines between vertices (thick, visible lines)
          ctx.strokeStyle = 'rgb(0, 255, 0)';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < polygonVertices.length; i++) {
            const pt = worldToCanvas(polygonVertices[i]);
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          if (mouseCanvasPos) ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw vertices as filled circles with thick, vibrant outlines
          polygonVertices.forEach((wPt, index) => {
            const pt = worldToCanvas(wPt);
            if (pt) {
              // Outer glow/shadow for visibility
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
              ctx.fillStyle = index === 0 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
              ctx.fill();

              // Main vertex circle
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
              ctx.fillStyle = index === 0 ? 'rgb(255, 50, 50)' : 'rgb(0, 220, 0)';
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });

          if (polygonVertices.length >= 3) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to close', firstPt.x, firstPt.y - 15);
          }
        }
        ctx.restore();
      }

      // Freehand cursor (normal mode)
      if (activeTool === 'freehand' && !isEraseMode && mouseCanvasPos && !isActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(144, 238, 144, 0.8)';
        ctx.lineWidth = 2;
        const crossSize = 10;
        ctx.beginPath();
        ctx.moveTo(mouseCanvasPos.x - crossSize, mouseCanvasPos.y);
        ctx.lineTo(mouseCanvasPos.x + crossSize, mouseCanvasPos.y);
        ctx.moveTo(mouseCanvasPos.x, mouseCanvasPos.y - crossSize);
        ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y + crossSize);
        ctx.stroke();
        ctx.restore();
      }

      // Freehand cursor (erase mode - no path started yet)
      if (activeTool === 'freehand' && isEraseMode && mouseCanvasPos && eraseFreehandPathRef.current.length === 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        const crossSize = 10;
        ctx.beginPath();
        ctx.moveTo(mouseCanvasPos.x - crossSize, mouseCanvasPos.y);
        ctx.lineTo(mouseCanvasPos.x + crossSize, mouseCanvasPos.y);
        ctx.moveTo(mouseCanvasPos.x, mouseCanvasPos.y - crossSize);
        ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y + crossSize);
        ctx.stroke();
        // Add a small "X" indicator for erase mode
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Freehand path preview
      const freehandPath = freehandPathRef.current;
      if (activeTool === 'freehand' && freehandPath.length > 0 && isActive && !isEraseMode) {
        ctx.save();
        const firstPt = worldToCanvas(freehandPath[0]);
        if (firstPt) {
          // Draw the freehand path
          ctx.strokeStyle = 'rgba(144, 238, 144, 1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < freehandPath.length; i++) {
            const pt = worldToCanvas(freehandPath[i]);
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          if (mouseCanvasPos) ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y);
          ctx.stroke();

          // Always draw the red starting point with white outline (visible from the start)
          // Outer glow for visibility
          ctx.beginPath();
          ctx.arc(firstPt.x, firstPt.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fill();

          // Main starting point circle (red with white outline)
          ctx.beginPath();
          ctx.arc(firstPt.x, firstPt.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgb(255, 50, 50)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Show "Click to close" text when there are enough points
          if (freehandPath.length > 5) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to close', firstPt.x, firstPt.y - 18);
          }
        }
        ctx.restore();
      }

      // Erase freehand preview
      const eraseFreehandPath = eraseFreehandPathRef.current;
      if (activeTool === 'freehand' && isEraseMode && eraseFreehandPath.length > 0) {
        ctx.save();
        const firstPt = worldToCanvas(eraseFreehandPath[0]);
        if (firstPt) {
          // Draw the erase path (no fill, just stroke)
          ctx.strokeStyle = 'rgba(255, 80, 80, 1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < eraseFreehandPath.length; i++) {
            const pt = worldToCanvas(eraseFreehandPath[i]);
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          if (mouseCanvasPos) ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y);
          ctx.stroke();

          // Always draw the red starting point with white outline (visible from the start)
          // Outer glow for visibility
          ctx.beginPath();
          ctx.arc(firstPt.x, firstPt.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
          ctx.fill();

          // Main starting point circle (red with white outline)
          ctx.beginPath();
          ctx.arc(firstPt.x, firstPt.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgb(255, 30, 30)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Show "Right-click to close" text when there are enough points
          if (eraseFreehandPath.length > 5) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Right-click to close', firstPt.x, firstPt.y - 18);
          }
        }
        ctx.restore();
      }

      // Polygon cursor (erase mode - no vertices yet)
      if (activeTool === 'polygon' && isEraseMode && mouseCanvasPos && erasePolygonVerticesRef.current.length === 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        // Draw a small crosshair with a circle
        const crossSize = 8;
        ctx.beginPath();
        ctx.moveTo(mouseCanvasPos.x - crossSize, mouseCanvasPos.y);
        ctx.lineTo(mouseCanvasPos.x + crossSize, mouseCanvasPos.y);
        ctx.moveTo(mouseCanvasPos.x, mouseCanvasPos.y - crossSize);
        ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y + crossSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mouseCanvasPos.x, mouseCanvasPos.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Erase polygon preview - vertices only, no fill
      const erasePolygonVertices = erasePolygonVerticesRef.current;
      if (activeTool === 'polygon' && isEraseMode && erasePolygonVertices.length > 0) {
        ctx.save();
        const firstPt = worldToCanvas(erasePolygonVertices[0]);
        if (firstPt) {
          // Draw connecting lines between vertices (thick, visible lines)
          ctx.strokeStyle = 'rgb(255, 50, 50)';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < erasePolygonVertices.length; i++) {
            const pt = worldToCanvas(erasePolygonVertices[i]);
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          if (mouseCanvasPos) ctx.lineTo(mouseCanvasPos.x, mouseCanvasPos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw vertices as filled circles with thick, vibrant outlines
          erasePolygonVertices.forEach((wPt, index) => {
            const pt = worldToCanvas(wPt);
            if (pt) {
              // Outer glow/shadow for visibility
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
              ctx.fill();

              // Main vertex circle
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
              ctx.fillStyle = index === 0 ? 'rgb(255, 30, 30)' : 'rgb(255, 80, 80)';
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });

          // Show "Right-click to close" when there are enough vertices
          if (erasePolygonVertices.length >= 3) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Right-click to close', firstPt.x, firstPt.y - 15);
          }
        }
        ctx.restore();
      }
    }, [getActiveContext, viewport, activeTool, currentBrushRadius, getCanvasRadius, getWorldRadius, worldToCanvas]);

    // === RAF FALLBACK SCHEDULER (Fix A) ===
    // Schedules active canvas redraw on RAF when user is actively drawing
    // This ensures stroke/cursor updates even when Cornerstone doesn't re-render
    const scheduleActiveDraw = useCallback(() => {
      if (rafIdRef.current != null) return; // Already scheduled
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        // Draw both static and active if needed
        if (staticDirtyRef.current) {
          staticDirtyRef.current = false;
          drawStatic();
        }
        if (activeDirtyRef.current) {
          activeDirtyRef.current = false;
          drawActive();
        }
      });
    }, [drawStatic, drawActive]);

    // Cleanup RAF on unmount
    useEffect(() => {
      return () => {
        if (rafIdRef.current != null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }, []);

    // Trigger redraw when tool changes (cursor needs to update)
    useEffect(() => {
      if (activeTool !== 'none') {
        markActiveDirty();
        scheduleActiveDraw();
      }
    }, [activeTool, markActiveDirty, scheduleActiveDraw]);

    // === REDRAW PIPELINE (GOLDEN PART - only on IMAGE_RENDERED) ===
    // Phase 1 & 2: Throttle static canvas redraws and detect camera changes
    const hasCameraChanged = useCallback((): boolean => {
      if (!viewport) return true;
      try {
        const camera = viewport.getCamera();
        const last = lastCameraRef.current;
        if (!last) {
          // First time - store camera and indicate change
          lastCameraRef.current = {
            parallelScale: camera.parallelScale,
            focalPoint: [...camera.focalPoint] as Point3,
          };
          return true;
        }
        // Check if camera has moved significantly
        const changed =
          Math.abs(camera.parallelScale - last.parallelScale) > 0.001 ||
          Math.abs(camera.focalPoint[0] - last.focalPoint[0]) > 0.001 ||
          Math.abs(camera.focalPoint[1] - last.focalPoint[1]) > 0.001;
        if (changed) {
          lastCameraRef.current = {
            parallelScale: camera.parallelScale,
            focalPoint: [...camera.focalPoint] as Point3,
          };
        }
        return changed;
      } catch {
        return true;
      }
    }, [viewport]);

    const redrawOnRender = useCallback(() => {
      syncCanvasSize();

      // Initialize throttled drawStatic if not already done
      if (!throttledDrawStaticRef.current) {
        throttledDrawStaticRef.current = createThrottle(drawStatic, THROTTLE_MS);
      }

      // SIMPLIFIED APPROACH: Always redraw when dirty, with throttling for camera changes
      if (staticDirtyRef.current) {
        staticDirtyRef.current = false;
        const cameraChanged = hasCameraChanged();

        // During pan/zoom (isInteractingRef=true), use throttled draw
        // Otherwise, draw immediately for annotation changes
        if (isInteractingRef.current && cameraChanged) {
          throttledDrawStaticRef.current.throttled();
        } else {
          drawStatic();
        }
      }

      if (activeDirtyRef.current) {
        activeDirtyRef.current = false;
        drawActive();
      }
    }, [syncCanvasSize, drawStatic, drawActive, hasCameraChanged]);

    // Force redraw everything (bypasses throttle for immediate result)
    const redrawAll = useCallback(() => {
      syncCanvasSize();
      staticDirtyRef.current = false;
      activeDirtyRef.current = false;
      // Flush any pending throttled draws before immediate redraw
      if (throttledDrawStaticRef.current) {
        throttledDrawStaticRef.current.flush();
      }
      drawStatic();
      drawActive();
    }, [syncCanvasSize, drawStatic, drawActive]);

    // === CORNERSTONE EVENT LISTENERS (core of 280ms approach) ===
    // Phase 3: Track interaction state for deferred rendering
    useEffect(() => {
      const element = cornerstoneElement;
      if (!element) return;

      let csCore: typeof import('@cornerstonejs/core') | null = null;

      const handleImageRendered = () => {
        redrawOnRender();
      };

      const handleCameraModified = () => {
        // Mark interaction as active (for throttling purposes)
        isInteractingRef.current = true;

        // Mark canvases as dirty - they need redrawing
        staticDirtyRef.current = true;
        activeDirtyRef.current = true;
        // Invalidate cached rect on camera change
        cachedRectRef.current = null;

        // Clear existing timer
        if (interactionEndTimerRef.current) {
          clearTimeout(interactionEndTimerRef.current);
        }

        // Schedule end of interaction - ensures final clean redraw after pan/zoom ends
        interactionEndTimerRef.current = setTimeout(() => {
          isInteractingRef.current = false;
          // Force a clean redraw when interaction ends
          staticDirtyRef.current = true;
          activeDirtyRef.current = true;
          if (throttledDrawStaticRef.current) {
            throttledDrawStaticRef.current.flush();
          }
          drawStatic();
          drawActive();
        }, 150); // Wait 150ms after last camera change
      };

      import('@/lib/cornerstone/setup').then(({ getCornerstoneCore }) => {
        csCore = getCornerstoneCore();
        if (!csCore?.Enums?.Events) return;

        element.addEventListener(csCore.Enums.Events.IMAGE_RENDERED, handleImageRendered);
        element.addEventListener(csCore.Enums.Events.CAMERA_MODIFIED, handleCameraModified);
        element.addEventListener(csCore.Enums.Events.CAMERA_RESET, handleCameraModified);
      }).catch(() => { });

      return () => {
        // Cleanup interaction timer
        if (interactionEndTimerRef.current) {
          clearTimeout(interactionEndTimerRef.current);
        }
        if (csCore?.Enums?.Events) {
          element.removeEventListener(csCore.Enums.Events.IMAGE_RENDERED, handleImageRendered);
          element.removeEventListener(csCore.Enums.Events.CAMERA_MODIFIED, handleCameraModified);
          element.removeEventListener(csCore.Enums.Events.CAMERA_RESET, handleCameraModified);
        }
      };
    }, [cornerstoneElement, redrawOnRender, drawStatic, drawActive]);

    // Redraw when imageIndex changes - cancel any in-progress drawing and reset state
    useEffect(() => {
      // Cancel any in-progress drawing when switching slices
      if (isActiveRef.current || activeRef.current) {
        // Don't commit partial strokes to the old slice - just discard them
        activeRef.current = null;
        isActiveRef.current = false;
        setDisplayIsActive(false);
      }

      // Exit erase mode when switching slices
      if (isEraseModeRef.current) {
        isEraseModeRef.current = false;
        setDisplayIsEraseMode(false);
      }

      // Clear all in-progress paths
      freehandPathRef.current = [];
      eraseFreehandPathRef.current = [];
      polygonVerticesRef.current = [];
      erasePolygonVerticesRef.current = [];
      lastCanvasPointRef.current = null;

      // Force immediate redraw for the new slice
      // Use setTimeout to ensure currentImageIndexRef has updated
      setTimeout(() => {
        redrawAll();
      }, 0);
    }, [imageIndex, redrawAll]);

    // Initial setup and resize observer
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        cachedRectRef.current = null; // Invalidate cache on resize
        redrawAll();
      });

      resizeObserver.observe(container);
      const timer = setTimeout(redrawAll, 100);

      return () => {
        resizeObserver.disconnect();
        clearTimeout(timer);
      };
    }, [redrawAll]);

    // Redraw when viewport becomes available
    useEffect(() => {
      if (viewport) {
        redrawAll();
      }
    }, [viewport, redrawAll]);

    // === COMMIT STROKE ===
    const commitStroke = useCallback(async () => {
      if (activeRef.current) {
        // Use mode-aware application for the annotation
        applyAnnotationWithMode(activeRef.current);
        activeRef.current = null;
      }
      isActiveRef.current = false;
      setDisplayIsActive(false);
      lastCanvasPointRef.current = null;

      saveToHistory();
      markSaveDirty();
      markStaticDirty();
      markActiveDirty();

      // Save on commit
      await saveIfNeeded();
    }, [applyAnnotationWithMode, saveToHistory, markSaveDirty, markStaticDirty, markActiveDirty, saveIfNeeded]);

    // === EVENT HANDLERS (only update refs + mark dirty, no drawing) ===
    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
      // Handle right-click for brush erase shortcut (button 2)
      if (e.button === 2 && activeTool === 'brush' && !disabled && viewport) {
        e.preventDefault();
        e.stopPropagation();

        isRightPointerDownRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        const worldPoint = clientToWorld(e.clientX, e.clientY);
        const canvasPoint = clientToCanvasPoint(e.clientX, e.clientY);
        if (!worldPoint || !canvasPoint) return;

        const worldRadius = getWorldRadius(currentBrushRadius);

        // Enter erase mode and start erasing immediately
        isEraseModeRef.current = true;
        setDisplayIsEraseMode(true);
        isActiveRef.current = true;
        setDisplayIsActive(true);
        lastCanvasPointRef.current = canvasPoint;
        activeRef.current = {
          id: generateUUID(),
          type: 'eraser',
          pointsWorld: [worldPoint],
          radius: worldRadius,
        };
        // Commit immediately to start erasing in real-time
        setSliceAnnotations([...getSliceAnnotations(), activeRef.current]);
        markStaticDirty();
        markActiveDirty();
        scheduleActiveDraw();
        return;
      }

      if (e.button !== 0) return;
      if (disabled || activeTool === 'none' || !viewport) return;

      e.preventDefault();
      e.stopPropagation();

      // Fix A & D: Track pointer state and capture for reliable events
      isPointerDownRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const worldPoint = clientToWorld(e.clientX, e.clientY);
      const canvasPoint = clientToCanvasPoint(e.clientX, e.clientY);
      if (!worldPoint || !canvasPoint) return;

      const worldRadius = getWorldRadius(currentBrushRadius);
      const isEraseMode = isEraseModeRef.current;

      // ERASE MODE
      if (isEraseMode) {
        if (activeTool === 'brush' || activeTool === 'eraser') {
          // Commit eraser stroke as an annotation (uses destination-out compositing)
          if (activeRef.current && activeRef.current.type === 'eraser' && activeRef.current.pointsWorld.length > 0) {
            setSliceAnnotations([...getSliceAnnotations(), activeRef.current]);
            saveToHistory();
            markSaveDirty();
            markStaticDirty();
          }
          activeRef.current = null;
          isActiveRef.current = false;
          isEraseModeRef.current = false;
          setDisplayIsActive(false);
          setDisplayIsEraseMode(false);
          markActiveDirty();
          scheduleActiveDraw();
          saveIfNeeded();
          return;
        } else if (activeTool === 'freehand') {
          // Left-click in freehand erase mode: cancel and exit erase mode
          // (Use right-click near starting point to close the erase shape)
          eraseFreehandPathRef.current = [];
          isActiveRef.current = false;
          isEraseModeRef.current = false;
          setDisplayIsActive(false);
          setDisplayIsEraseMode(false);
          markActiveDirty();
          scheduleActiveDraw();
        } else if (activeTool === 'polygon') {
          // Left-click in polygon erase mode: cancel and exit erase mode
          // (Use right-click to add vertices and close the polygon)
          erasePolygonVerticesRef.current = [];
          isEraseModeRef.current = false;
          setDisplayIsEraseMode(false);
          markActiveDirty();
          scheduleActiveDraw();
        }
        return;
      }

      // NORMAL MODE
      if (activeTool === 'brush') {
        if (isActiveRef.current) {
          commitStroke();
        } else {
          isActiveRef.current = true;
          setDisplayIsActive(true);
          lastCanvasPointRef.current = canvasPoint;
          activeRef.current = {
            id: generateUUID(),
            type: 'brush',
            pointsWorld: [worldPoint],
            radius: worldRadius,
            color: MASK_COLOR,
          };
          markSaveDirty();
          markActiveDirty();
          scheduleActiveDraw(); // Start drawing immediately
        }
      } else if (activeTool === 'eraser') {
        // Eraser starts immediately on pointer down - no second click needed
        // The stroke will be committed on pointer up
        isActiveRef.current = true;
        setDisplayIsActive(true);
        lastCanvasPointRef.current = canvasPoint;
        activeRef.current = {
          id: generateUUID(),
          type: 'eraser',
          pointsWorld: [worldPoint],
          radius: worldRadius,
        };
        // Commit immediately to start erasing
        setSliceAnnotations([...getSliceAnnotations(), activeRef.current]);
        markStaticDirty();
        markActiveDirty();
        scheduleActiveDraw();
      } else if (activeTool === 'polygon') {
        const verts = polygonVerticesRef.current;
        if (verts.length >= 3) {
          const startCanvas = worldToCanvas(verts[0]);
          if (startCanvas && canvasDistance(canvasPoint, startCanvas) < 15) {
            const polygonAnnotation: WorldPolygonAnnotation = {
              id: generateUUID(),
              type: 'polygon',
              pointsWorld: [...verts],
              completed: true,
              color: MASK_COLOR,
            };
            applyAnnotationWithMode(polygonAnnotation);
            polygonVerticesRef.current = [];
            saveToHistory();
            markSaveDirty();
            markStaticDirty();
            markActiveDirty();
            scheduleActiveDraw(); // Immediate visual feedback
            saveIfNeeded();
            return;
          }
        }
        polygonVerticesRef.current.push(worldPoint);
        markActiveDirty();
        scheduleActiveDraw(); // Show new vertex immediately
      } else if (activeTool === 'freehand') {
        if (isActiveRef.current) {
          // Only commit if clicking near the starting point
          const freehandPath = freehandPathRef.current;
          if (freehandPath.length >= 3) {
            const startCanvas = worldToCanvas(freehandPath[0]);
            if (startCanvas && canvasDistance(canvasPoint, startCanvas) < 15) {
              // Close to starting point - commit the annotation
              const freehandAnnotation: WorldFreehandAnnotation = {
                id: generateUUID(),
                type: 'freehand',
                pointsWorld: [...freehandPath],
                completed: true,
                color: MASK_COLOR,
              };
              applyAnnotationWithMode(freehandAnnotation);
              saveToHistory();
              markSaveDirty();
              markStaticDirty();
              saveIfNeeded();

              // Reset state
              isActiveRef.current = false;
              setDisplayIsActive(false);
              freehandPathRef.current = [];
              lastCanvasPointRef.current = null;
              markActiveDirty();
              scheduleActiveDraw();
            }
            // If not near starting point, do nothing - continue drawing
          }
          // If less than 3 points, do nothing - continue drawing
        } else {
          // Start a new freehand drawing
          isActiveRef.current = true;
          setDisplayIsActive(true);
          freehandPathRef.current = [worldPoint];
          lastCanvasPointRef.current = canvasPoint;
          markActiveDirty();
          scheduleActiveDraw(); // Start drawing immediately
        }
      }
    }, [
      disabled, activeTool, viewport,
      clientToWorld, clientToCanvasPoint, getWorldRadius, currentBrushRadius,
      getSliceAnnotations, setSliceAnnotations, saveToHistory, applyAnnotationWithMode,
      markSaveDirty, markStaticDirty, markActiveDirty, worldToCanvas, commitStroke, saveIfNeeded, scheduleActiveDraw
    ]);

    const handleContextMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled || activeTool === 'none' || !viewport) return;

      const worldPoint = clientToWorld(e.clientX, e.clientY);
      const canvasPoint = clientToCanvasPoint(e.clientX, e.clientY);
      if (!worldPoint || !canvasPoint) return;

      const worldRadius = getWorldRadius(currentBrushRadius);

      if (isEraseModeRef.current) {
        // Already in erase mode
        if (activeTool === 'brush' || activeTool === 'eraser') {
          // Exit erase mode - go back to normal drawing
          if (isActiveRef.current) {
            commitStroke();
          } else {
            isActiveRef.current = true;
            setDisplayIsActive(true);
            lastCanvasPointRef.current = canvasPoint;
            activeRef.current = {
              id: generateUUID(),
              type: 'brush',
              pointsWorld: [worldPoint],
              radius: worldRadius,
              color: MASK_COLOR,
            };
            markSaveDirty();
            markActiveDirty();
            scheduleActiveDraw(); // Trigger immediate redraw
          }
          isEraseModeRef.current = false;
          setDisplayIsEraseMode(false);
          markActiveDirty();
          scheduleActiveDraw();
        } else if (activeTool === 'freehand') {
          // Freehand erase mode: right-click near start to close, or add points
          const erasePath = eraseFreehandPathRef.current;

          // Check if we can close the erase path (3+ points and click near start)
          if (erasePath.length >= 3) {
            const startCanvas = worldToCanvas(erasePath[0]);
            if (startCanvas && canvasDistance(canvasPoint, startCanvas) < 15) {
              // Close and commit the erase freehand
              const eraserFreehandAnnotation: WorldEraserFreehand = {
                id: generateUUID(),
                type: 'eraser-freehand',
                pointsWorld: [...erasePath],
              };
              setSliceAnnotations([...getSliceAnnotations(), eraserFreehandAnnotation]);
              eraseFreehandPathRef.current = [];
              isActiveRef.current = false;
              isEraseModeRef.current = false;
              setDisplayIsActive(false);
              setDisplayIsEraseMode(false);
              saveToHistory();
              markSaveDirty();
              markStaticDirty();
              markActiveDirty();
              scheduleActiveDraw();
              saveIfNeeded();
              return;
            }
          }

          // If we have a path but didn't close, continue drawing (add point via mouse move)
          // Right-click without closing just continues the path
          if (erasePath.length > 0) {
            // Do nothing - let mouse move add more points
            return;
          }

          // No path yet - this shouldn't happen as we enter erase mode with first point
        } else if (activeTool === 'polygon') {
          // Polygon erase mode: right-click adds vertices or closes/cancels
          const eraseVerts = erasePolygonVerticesRef.current;

          // Check if we can close the polygon (3+ vertices and click near start)
          if (eraseVerts.length >= 3) {
            const startCanvas = worldToCanvas(eraseVerts[0]);
            if (startCanvas && canvasDistance(canvasPoint, startCanvas) < 15) {
              // Close and commit the erase polygon
              const eraserPolygonAnnotation: WorldEraserPolygon = {
                id: generateUUID(),
                type: 'eraser-polygon',
                pointsWorld: [...eraseVerts],
              };
              setSliceAnnotations([...getSliceAnnotations(), eraserPolygonAnnotation]);
              erasePolygonVerticesRef.current = [];
              isEraseModeRef.current = false;
              setDisplayIsEraseMode(false);
              saveToHistory();
              markSaveDirty();
              markStaticDirty();
              markActiveDirty();
              scheduleActiveDraw();
              saveIfNeeded();
              return;
            }
          }

          // If we have vertices but didn't close, add another vertex
          if (eraseVerts.length > 0) {
            erasePolygonVerticesRef.current.push(worldPoint);
            markActiveDirty();
            scheduleActiveDraw();
          }
        }
        return;
      }

      // Brush erase shortcut is now handled via handlePointerDown with button 2
      // Skip contextmenu handling for brush to prevent double-handling
      if (activeTool === 'brush') {
        return;
      }

      // Enter erase mode for other tools
      isEraseModeRef.current = true;
      setDisplayIsEraseMode(true);

      if (activeTool === 'freehand') {
        isActiveRef.current = true;
        setDisplayIsActive(true);
        eraseFreehandPathRef.current = [worldPoint];
        lastCanvasPointRef.current = canvasPoint;
        markActiveDirty();
        scheduleActiveDraw(); // Trigger immediate redraw
      } else if (activeTool === 'polygon') {
        erasePolygonVerticesRef.current = [worldPoint];
        markActiveDirty();
        scheduleActiveDraw(); // Trigger immediate redraw
      }
    }, [
      disabled, activeTool, viewport,
      clientToWorld, clientToCanvasPoint, getWorldRadius, currentBrushRadius,
      markSaveDirty, markActiveDirty, markStaticDirty, commitStroke, scheduleActiveDraw,
      worldToCanvas, getSliceAnnotations, setSliceAnnotations, saveToHistory, saveIfNeeded
    ]);

    // POINTER MOVE: only update refs + mark dirty if changed
    // CRITICAL FIX: Always use RAF for cursor updates, not just when pointer is down
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
      const canvasPoint = clientToCanvasPoint(e.clientX, e.clientY);

      // Only update + mark dirty if position changed meaningfully
      const prev = mouseCanvasPosRef.current;
      mouseCanvasPosRef.current = canvasPoint;

      if (canvasPoint && prev && canvasDistance(prev, canvasPoint) < 0.5) {
        // Tiny move, ignore
        return;
      }

      markActiveDirty();

      // CRITICAL: Always schedule RAF draw for cursor visibility
      // IMAGE_RENDERED doesn't fire on mouse movement, so we need RAF for cursor
      scheduleActiveDraw();

      if (disabled || activeTool === 'none' || !viewport) return;

      const isActive = isActiveRef.current;
      const lastPt = lastCanvasPointRef.current;
      const shouldAddPoint = !lastPt || !canvasPoint || canvasDistance(lastPt, canvasPoint) >= MIN_POINT_DISTANCE;

      if (isActive && shouldAddPoint && canvasPoint) {
        const worldPoint = clientToWorld(e.clientX, e.clientY);
        if (!worldPoint) return;

        lastCanvasPointRef.current = canvasPoint;

        const isEraseMode = isEraseModeRef.current;

        if (isEraseMode) {
          if ((activeTool === 'brush' || activeTool === 'eraser') && activeRef.current?.type === 'eraser') {
            activeRef.current.pointsWorld.push(worldPoint);
            // Brush erase shortcut erases immediately - redraw static canvas in real-time
            markStaticDirty();
            markActiveDirty();
          } else if (activeTool === 'freehand') {
            eraseFreehandPathRef.current.push(worldPoint);
            markActiveDirty();
          }
        } else {
          if (activeTool === 'brush' && activeRef.current?.type === 'brush') {
            activeRef.current.pointsWorld.push(worldPoint);
            markSaveDirty();
            markActiveDirty();
          } else if (activeTool === 'eraser' && activeRef.current?.type === 'eraser') {
            activeRef.current.pointsWorld.push(worldPoint);
            // Eraser erases immediately - redraw static canvas to show erasing in real-time
            markStaticDirty();
            markActiveDirty();
          } else if (activeTool === 'freehand') {
            freehandPathRef.current.push(worldPoint);
            markSaveDirty();
            markActiveDirty();
          }
        }
      }
    }, [
      disabled, activeTool, viewport,
      clientToCanvasPoint, clientToWorld, markSaveDirty, markActiveDirty, scheduleActiveDraw
    ]);

    // Fix D: Handle pointer up to release capture and sync canvas
    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
      // Handle right-click release for brush erase shortcut
      if (isRightPointerDownRef.current) {
        isRightPointerDownRef.current = false;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Ignore if capture already released
        }

        syncCanvasSize();

        // Finalize brush erase shortcut stroke on right-click release
        if (activeTool === 'brush' && isEraseModeRef.current && activeRef.current?.type === 'eraser') {
          activeRef.current = null;
          isActiveRef.current = false;
          isEraseModeRef.current = false;
          setDisplayIsActive(false);
          setDisplayIsEraseMode(false);
          saveToHistory();
          markSaveDirty();
          saveIfNeeded();
        }

        markStaticDirty();
        markActiveDirty();
        return;
      }

      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        // Fix B: Sync canvas size after stroke ends (was deferred during drawing)
        syncCanvasSize();

        // Finalize eraser stroke on pointer up (eraser erases immediately)
        if (activeTool === 'eraser' && isActiveRef.current && activeRef.current?.type === 'eraser') {
          // The eraser stroke is already in the slice annotations, just finalize state
          activeRef.current = null;
          isActiveRef.current = false;
          setDisplayIsActive(false);
          saveToHistory();
          markSaveDirty();
          saveIfNeeded();
        }

        // Redraw to ensure final state is correct
        markStaticDirty();
        markActiveDirty();
      }
    }, [syncCanvasSize, markStaticDirty, markActiveDirty, activeTool, saveToHistory, markSaveDirty, saveIfNeeded]);

    // Fix D: Handle pointer cancel same as pointer up
    const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
      // Handle right-click cancel for brush erase shortcut
      if (isRightPointerDownRef.current) {
        isRightPointerDownRef.current = false;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Ignore if capture already released
        }
        syncCanvasSize();

        // Finalize brush erase shortcut stroke on cancel
        if (activeTool === 'brush' && isEraseModeRef.current && activeRef.current?.type === 'eraser') {
          activeRef.current = null;
          isActiveRef.current = false;
          isEraseModeRef.current = false;
          setDisplayIsActive(false);
          setDisplayIsEraseMode(false);
          saveToHistory();
          markSaveDirty();
          saveIfNeeded();
        }

        markStaticDirty();
        markActiveDirty();
        return;
      }

      if (isPointerDownRef.current) {
        isPointerDownRef.current = false;
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Ignore if capture already released
        }
        syncCanvasSize();

        // Finalize eraser stroke on pointer cancel (eraser erases immediately)
        if (activeTool === 'eraser' && isActiveRef.current && activeRef.current?.type === 'eraser') {
          activeRef.current = null;
          isActiveRef.current = false;
          setDisplayIsActive(false);
          saveToHistory();
          markSaveDirty();
          saveIfNeeded();
        }

        markStaticDirty();
        markActiveDirty();
      }
    }, [syncCanvasSize, markStaticDirty, markActiveDirty, activeTool, saveToHistory, markSaveDirty, saveIfNeeded]);

    const handlePointerLeave = useCallback(() => {
      mouseCanvasPosRef.current = null;
      markActiveDirty();
      // Always schedule RAF draw to clear cursor when leaving
      scheduleActiveDraw();
    }, [markActiveDirty, scheduleActiveDraw]);

    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled || !viewport) return;

      const isEraseMode = isEraseModeRef.current;

      if (activeTool === 'polygon' && !isEraseMode) {
        const verts = polygonVerticesRef.current;
        if (verts.length >= 3) {
          const polygonAnnotation: WorldPolygonAnnotation = {
            id: generateUUID(),
            type: 'polygon',
            pointsWorld: [...verts],
            completed: true,
            color: MASK_COLOR,
          };
          applyAnnotationWithMode(polygonAnnotation);
          polygonVerticesRef.current = [];
          saveToHistory();
          markSaveDirty();
          markStaticDirty();
          markActiveDirty();
          saveIfNeeded();
        }
      } else if (activeTool === 'polygon' && isEraseMode) {
        const eraseVerts = erasePolygonVerticesRef.current;
        if (eraseVerts.length >= 3) {
          // Commit eraser-polygon annotation
          const eraserPolygonAnnotation: WorldEraserPolygon = {
            id: generateUUID(),
            type: 'eraser-polygon',
            pointsWorld: [...eraseVerts],
          };
          setSliceAnnotations([...getSliceAnnotations(), eraserPolygonAnnotation]);
          erasePolygonVerticesRef.current = [];
          isEraseModeRef.current = false;
          setDisplayIsEraseMode(false);
          saveToHistory();
          markSaveDirty();
          markStaticDirty();
          markActiveDirty();
          saveIfNeeded();
        }
      }
    }, [
      disabled, viewport, activeTool,
      getSliceAnnotations, setSliceAnnotations, saveToHistory, applyAnnotationWithMode,
      markSaveDirty, markStaticDirty, markActiveDirty, saveIfNeeded
    ]);

    // === KEYBOARD HANDLING ===
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          isActiveRef.current = false;
          isEraseModeRef.current = false;
          setDisplayIsActive(false);
          setDisplayIsEraseMode(false);
          activeRef.current = null;
          freehandPathRef.current = [];
          eraseFreehandPathRef.current = [];
          polygonVerticesRef.current = [];
          erasePolygonVerticesRef.current = [];
          lastCanvasPointRef.current = null;
          markActiveDirty();
        }

        if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey && !e.metaKey) {
          const newRadius = Math.min(100, currentBrushRadius + 5);
          setCurrentBrushRadius(newRadius);
          onBrushRadiusChange?.(newRadius);
          markActiveDirty();
        }
        if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
          const newRadius = Math.max(1, currentBrushRadius - 5);
          setCurrentBrushRadius(newRadius);
          onBrushRadiusChange?.(newRadius);
          markActiveDirty();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentBrushRadius, onBrushRadiusChange, markActiveDirty]);

    // === IMPERATIVE HANDLE ===
    useImperativeHandle(ref, () => ({
      clearAll: () => {
        annotationsRef.current.clear();
        activeRef.current = null;
        freehandPathRef.current = [];
        eraseFreehandPathRef.current = [];
        polygonVerticesRef.current = [];
        erasePolygonVerticesRef.current = [];
        historyRef.current = [];
        historyIndexRef.current = -1;
        isActiveRef.current = false;
        isEraseModeRef.current = false;
        setDisplayIsActive(false);
        setDisplayIsEraseMode(false);
        markSaveDirty();
        markStaticDirty();
        markActiveDirty();
      },
      undo: () => {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const prevState = historyRef.current[historyIndexRef.current];
          setSliceAnnotations(prevState ? [...prevState] : []);
          markSaveDirty();
          markStaticDirty();
          markActiveDirty();
        }
      },
      getAnnotations: () => {
        const result: CanvasAnnotation[] = [];
        annotationsRef.current.forEach((anns) => {
          anns.forEach((ann) => {
            result.push({
              id: ann.id,
              type: ann.type,
              pointsWorld: ann.pointsWorld,
              completed: 'completed' in ann ? ann.completed : true,
              color: 'color' in ann ? ann.color : undefined,
              radius: 'radius' in ann ? ann.radius : undefined,
            });
          });
        });
        return result;
      },
      setAnnotations: (annotations: CanvasAnnotation[]) => {
        const worldAnns: WorldAnnotation[] = annotations.map((ann) => {
          if (ann.type === 'brush') {
            return {
              id: ann.id,
              type: 'brush' as const,
              pointsWorld: ann.pointsWorld || [],
              radius: ann.radius || 15,
              color: ann.color || MASK_COLOR,
            };
          } else if (ann.type === 'eraser') {
            return {
              id: ann.id,
              type: 'eraser' as const,
              pointsWorld: ann.pointsWorld || [],
              radius: ann.radius || 15,
            };
          } else if (ann.type === 'freehand') {
            return {
              id: ann.id,
              type: 'freehand' as const,
              pointsWorld: ann.pointsWorld || [],
              completed: ann.completed ?? true,
              color: ann.color || MASK_COLOR,
            };
          } else {
            return {
              id: ann.id,
              type: 'polygon' as const,
              pointsWorld: ann.pointsWorld || [],
              completed: ann.completed ?? true,
              color: ann.color || MASK_COLOR,
            };
          }
        });
        setSliceAnnotations(worldAnns);
        markStaticDirty();
        markActiveDirty();
        // Trigger actual redraw
        scheduleActiveDraw();
      },
      redraw: () => {
        markStaticDirty();
        markActiveDirty();
        // Trigger actual redraw
        scheduleActiveDraw();
      },
      forceSave: async () => {
        saveDirtyRef.current = true;
        await saveIfNeeded();
      },
    }), [setSliceAnnotations, markSaveDirty, markStaticDirty, markActiveDirty, saveIfNeeded, scheduleActiveDraw]);

    // Status text (uses display state)
    const getStatusText = useCallback(() => {
      if (displayIsEraseMode) {
        return displayIsActive ? 'ERASING...' : 'ERASE MODE';
      }
      if (activeTool === 'eraser') {
        return displayIsActive ? 'ERASING...' : 'Click and drag to erase';
      }
      if (activeTool === 'brush') {
        return displayIsActive ? 'Drawing...' : 'Click to draw';
      }
      if (activeTool === 'freehand') {
        return displayIsActive ? 'Drawing... click start to close' : 'Click to start';
      }
      if (activeTool === 'polygon') {
        return polygonVerticesRef.current.length > 0
          ? `${polygonVerticesRef.current.length} vertices`
          : 'Click to add points';
      }
      return '';
    }, [activeTool, displayIsActive, displayIsEraseMode]);

    const getCursorStyle = useCallback(() => {
      if (disabled) return 'default';
      if (activeTool !== 'none') return 'none';
      return 'default';
    }, [disabled, activeTool]);

    return (
      <div
        ref={containerRef}
        className={cn('absolute inset-0', className)}
        style={{ pointerEvents: disabled ? 'none' : 'auto', touchAction: 'none' }}
      >
        {/* Static canvas: finalized annotations */}
        <canvas
          ref={staticCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: 'none',
          }}
        />

        {/* Active canvas: current stroke + cursor */}
        <canvas
          ref={activeCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Interaction layer - uses pointer events for reliable capture (Fix D) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ cursor: getCursorStyle(), touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
        />

        {/* Status indicator */}
        {getStatusText() && (
          <div className={cn(
            "absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded text-xs font-medium pointer-events-none border",
            displayIsActive
              ? (displayIsEraseMode || activeTool === 'eraser')
                ? "bg-red-900/90 text-red-100 border-red-500/50"
                : "bg-green-900/90 text-green-100 border-green-500/50"
              : displayIsEraseMode
                ? "bg-red-900/70 text-red-200 border-red-500/30"
                : "bg-black/70 text-white border-white/20"
          )}>
            {getStatusText()}
          </div>
        )}

        {/* Mask Operation Mode indicator - shows current mode when not 'replace' (default) */}
        {maskOperationMode && maskOperationMode !== 'replace' && activeTool !== 'none' && (
          <div className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium pointer-events-none border flex items-center gap-1.5",
            maskOperationMode === 'add' && "bg-green-900/90 text-green-100 border-green-500/50",
            maskOperationMode === 'subtract' && "bg-red-900/90 text-red-100 border-red-500/50",
            maskOperationMode === 'intersect' && "bg-blue-900/90 text-blue-100 border-blue-500/50",
            maskOperationMode === 'union' && "bg-purple-900/90 text-purple-100 border-purple-500/50",
            maskOperationMode === 'xor' && "bg-orange-900/90 text-orange-100 border-orange-500/50"
          )}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Mode: {maskOperationMode.charAt(0).toUpperCase() + maskOperationMode.slice(1)}
          </div>
        )}

        {/* Brush size indicator */}
        {(activeTool === 'brush' || activeTool === 'eraser') && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-3 py-1.5 rounded text-xs text-white pointer-events-none border border-white/20">
            Size: {currentBrushRadius}px | W/S to resize
          </div>
        )}

        {/* Polygon help */}
        {activeTool === 'polygon' && !displayIsEraseMode && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-3 py-1.5 rounded text-xs text-white pointer-events-none border border-white/20">
            Click to add points | Click first to close
          </div>
        )}

        {/* Freehand help */}
        {activeTool === 'freehand' && !displayIsEraseMode && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-3 py-1.5 rounded text-xs text-white pointer-events-none border border-white/20">
            Draw freely | Click red start to close
          </div>
        )}
      </div>
    );
  }
);

AnnotationCanvas.displayName = 'AnnotationCanvas';

export default AnnotationCanvas;
