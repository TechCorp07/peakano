'use client';

/**
 * AIPromptOverlay Component
 * Renders AI segmentation prompts (points and boxes) on the canvas
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAISegmentationStore } from '@/lib/aiSegmentation';
import type { Prompt, BoxPrompt } from '@/lib/aiSegmentation';

interface AIPromptOverlayProps {
  /** Canvas width in CSS pixels */
  width: number;
  /** Canvas height in CSS pixels */
  height: number;
  /** Image width in pixels */
  imageWidth: number;
  /** Image height in pixels */
  imageHeight: number;
  /** Transform from image to canvas coordinates */
  imageToCanvas?: (imageX: number, imageY: number) => { x: number; y: number };
  /** Transform from canvas to image coordinates */
  canvasToImage?: (canvasX: number, canvasY: number) => { x: number; y: number };
  /** Current slice index */
  currentSlice?: number;
  /** Z-index for stacking */
  zIndex?: number;
  className?: string;
}

// Default identity transform
const defaultTransform = (x: number, y: number) => ({ x, y });

export default function AIPromptOverlay({
  width,
  height,
  imageWidth,
  imageHeight,
  imageToCanvas = defaultTransform,
  canvasToImage = defaultTransform,
  currentSlice = 0,
  zIndex = 30,
  className,
}: AIPromptOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isActive,
    prompts,
    drawingState,
    addPointPrompt,
    startBoxDrawing,
    updateBoxDrawing,
    endBoxDrawing,
    cancelBoxDrawing,
  } = useAISegmentationStore();

  /**
   * Draw all prompts on the canvas
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!isActive) return;

    // Draw existing prompts
    for (const prompt of prompts) {
      drawPrompt(ctx, prompt, imageToCanvas);
    }

    // Draw current box being drawn
    if (drawingState.isDrawingBox && drawingState.currentBox) {
      drawBox(ctx, drawingState.currentBox, imageToCanvas, true);
    }
  }, [isActive, prompts, drawingState, width, height, imageToCanvas]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  /**
   * Handle mouse events for adding prompts
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const { x: imageX, y: imageY } = canvasToImage(canvasX, canvasY);

      if (e.button === 2) {
        // Right-click: start box drawing
        e.preventDefault();
        startBoxDrawing(imageX, imageY);
      }
    },
    [isActive, canvasToImage, startBoxDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive || !drawingState.isDrawingBox) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const { x: imageX, y: imageY } = canvasToImage(canvasX, canvasY);

      updateBoxDrawing(imageX, imageY);
    },
    [isActive, drawingState.isDrawingBox, canvasToImage, updateBoxDrawing]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const { x: imageX, y: imageY } = canvasToImage(canvasX, canvasY);

      if (drawingState.isDrawingBox) {
        updateBoxDrawing(imageX, imageY);
        endBoxDrawing();
      }
    },
    [
      isActive,
      drawingState,
      canvasToImage,
      updateBoxDrawing,
      endBoxDrawing,
    ]
  );

  // Dedicated click handler for adding points
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isActive) {
        console.log('[AIPromptOverlay] Click ignored - not active');
        return;
      }

      // Ignore if we were drawing a box
      if (drawingState.isDrawingBox) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const { x: imageX, y: imageY } = canvasToImage(canvasX, canvasY);

      // Left-click: add point
      const label = drawingState.pointMode === 'foreground' ? 1 : 0;
      console.log('[AIPromptOverlay] Adding point:', { imageX, imageY, label, mode: drawingState.pointMode });
      addPointPrompt(imageX, imageY, label as 0 | 1, currentSlice);
    },
    [isActive, drawingState, canvasToImage, addPointPrompt, currentSlice]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingState.isDrawingBox) {
        cancelBoxDrawing();
      }
    },
    [drawingState.isDrawingBox, cancelBoxDrawing]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn('absolute inset-0 cursor-crosshair', className)}
      style={{ zIndex, pointerEvents: 'auto' }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    />
  );
}

/**
 * Draw a single prompt
 */
function drawPrompt(
  ctx: CanvasRenderingContext2D,
  prompt: Prompt,
  imageToCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (prompt.type === 'point') {
    drawPoint(ctx, prompt.x, prompt.y, prompt.label, imageToCanvas);
  } else {
    drawBox(ctx, prompt, imageToCanvas, false);
  }
}

/**
 * Draw a point prompt
 */
function drawPoint(
  ctx: CanvasRenderingContext2D,
  imageX: number,
  imageY: number,
  label: 0 | 1,
  imageToCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const { x, y } = imageToCanvas(imageX, imageY);
  const isPositive = label === 1;
  const color = isPositive ? '#22c55e' : '#ef4444'; // green or red
  const radius = 8;

  // Outer circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner symbol (+ or -)
  ctx.beginPath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  if (isPositive) {
    // Plus sign
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
  } else {
    // Minus sign
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
  }
  ctx.stroke();
}

/**
 * Draw a box prompt
 */
function drawBox(
  ctx: CanvasRenderingContext2D,
  box: BoxPrompt,
  imageToCanvas: (x: number, y: number) => { x: number; y: number },
  isDrawing: boolean
) {
  const { x: x1, y: y1 } = imageToCanvas(box.x1, box.y1);
  const { x: x2, y: y2 } = imageToCanvas(box.x2, box.y2);

  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  // Fill
  ctx.fillStyle = isDrawing ? 'rgba(147, 51, 234, 0.2)' : 'rgba(59, 130, 246, 0.2)';
  ctx.fillRect(left, top, width, height);

  // Border
  ctx.strokeStyle = isDrawing ? '#a855f7' : '#3b82f6'; // purple or blue
  ctx.lineWidth = 2;
  ctx.setLineDash(isDrawing ? [5, 5] : []);
  ctx.strokeRect(left, top, width, height);
  ctx.setLineDash([]);

  // Corner handles
  const handleSize = 6;
  ctx.fillStyle = isDrawing ? '#a855f7' : '#3b82f6';

  // Top-left
  ctx.fillRect(left - handleSize / 2, top - handleSize / 2, handleSize, handleSize);
  // Top-right
  ctx.fillRect(left + width - handleSize / 2, top - handleSize / 2, handleSize, handleSize);
  // Bottom-left
  ctx.fillRect(left - handleSize / 2, top + height - handleSize / 2, handleSize, handleSize);
  // Bottom-right
  ctx.fillRect(left + width - handleSize / 2, top + height - handleSize / 2, handleSize, handleSize);
}
