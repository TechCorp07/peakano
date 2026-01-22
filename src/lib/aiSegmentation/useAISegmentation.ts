/**
 * AI Segmentation Hook
 * React hook for using AI segmentation with the canvas
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAISegmentationStore } from './store';
import {
  requestInteractiveSegmentation,
  requestAutoSegmentation,
  getJobStatus,
  getSegmentationResult,
  cancelJob,
  decodeRLEMask,
  maskToContour,
} from './api';
import type { Prompt, AISegmentationModel } from './types';

interface UseAISegmentationOptions {
  studyUid: string;
  seriesUid: string;
  instanceUid?: string;
  currentSlice?: number;
  onSegmentationComplete?: (contour: { x: number; y: number }[]) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for AI-powered segmentation
 */
export function useAISegmentation({
  studyUid,
  seriesUid,
  instanceUid,
  currentSlice = 0,
  onSegmentationComplete,
  onError,
}: UseAISegmentationOptions) {
  const {
    isActive,
    selectedModel,
    prompts,
    drawingState,
    isProcessing,
    currentJobId,
    jobStatus,
    resultMask,
    error,
    setActive,
    toggle,
    setModel,
    addPointPrompt,
    addBoxPrompt,
    removePrompt,
    clearPrompts,
    undoLastPrompt,
    startBoxDrawing,
    updateBoxDrawing,
    endBoxDrawing,
    cancelBoxDrawing,
    setPointMode,
    setProcessing,
    setJobId,
    setJobStatus,
    setResultMask,
    acceptResult,
    rejectResult,
    setError,
    reset,
  } = useAISegmentationStore();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Handle click on canvas - add point prompt
   */
  const handleCanvasClick = useCallback(
    (imageX: number, imageY: number) => {
      if (!isActive || drawingState.isDrawingBox) return;

      const label = drawingState.pointMode === 'foreground' ? 1 : 0;
      addPointPrompt(imageX, imageY, label as 0 | 1, currentSlice);
    },
    [isActive, drawingState, currentSlice, addPointPrompt]
  );

  /**
   * Handle mouse down on canvas - start box drawing
   */
  const handleCanvasMouseDown = useCallback(
    (imageX: number, imageY: number, isRightClick: boolean) => {
      if (!isActive) return;

      // Right-click or shift-click starts box drawing
      if (isRightClick) {
        startBoxDrawing(imageX, imageY);
      }
    },
    [isActive, startBoxDrawing]
  );

  /**
   * Handle mouse move on canvas - update box
   */
  const handleCanvasMouseMove = useCallback(
    (imageX: number, imageY: number) => {
      if (!isActive || !drawingState.isDrawingBox) return;
      updateBoxDrawing(imageX, imageY);
    },
    [isActive, drawingState.isDrawingBox, updateBoxDrawing]
  );

  /**
   * Handle mouse up on canvas - end box drawing
   */
  const handleCanvasMouseUp = useCallback(
    (imageX: number, imageY: number) => {
      if (!isActive || !drawingState.isDrawingBox) return;
      updateBoxDrawing(imageX, imageY);
      endBoxDrawing();
    },
    [isActive, drawingState.isDrawingBox, updateBoxDrawing, endBoxDrawing]
  );

  /**
   * Poll for job completion
   */
  const pollJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const job = await getJobStatus(jobId);
        setJobStatus(job.status);

        if (job.status === 'completed') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // Get result
          const result = await getSegmentationResult(jobId);
          setResultMask(result);
          setProcessing(false);

          // Notify with contour
          if (onSegmentationComplete) {
            // Use contour directly if available, otherwise convert from RLE
            if (result.contour && result.contour.length > 0) {
              // Convert [x, y] format to { x, y } format
              const formattedContour = result.contour.map((point: [number, number]) => ({ x: point[0], y: point[1] }));
              onSegmentationComplete(formattedContour);
            } else if (result.rle) {
              const mask = decodeRLEMask(result.rle, result.width, result.height);
              const contour = maskToContour(mask, result.width, result.height);
              onSegmentationComplete(contour);
            }
          }
        } else if (job.status === 'failed') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          setError(job.errorMessage || 'Segmentation failed');
          onError?.(job.errorMessage || 'Segmentation failed');
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    },
    [setJobStatus, setResultMask, setProcessing, setError, onSegmentationComplete, onError]
  );

  /**
   * Execute interactive segmentation with current prompts
   */
  const executeSegmentation = useCallback(async () => {
    if (prompts.length === 0) {
      setError('Add at least one prompt point or box');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await requestInteractiveSegmentation({
        studyUid,
        seriesUid,
        instanceUid,
        model: selectedModel,
        prompts,
      });

      setJobId(response.id);
      setJobStatus(response.status);

      // If job is immediately completed (unlikely but possible)
      if (response.status === 'completed') {
        const result = await getSegmentationResult(response.id);
        setResultMask(result);
        setProcessing(false);

        if (onSegmentationComplete) {
          if (result.contour && result.contour.length > 0) {
            // Convert [x, y] format to { x, y } format
            const formattedContour = result.contour.map((point: [number, number]) => ({ x: point[0], y: point[1] }));
            onSegmentationComplete(formattedContour);
          } else if (result.rle) {
            const mask = decodeRLEMask(result.rle, result.width, result.height);
            const contour = maskToContour(mask, result.width, result.height);
            onSegmentationComplete(contour);
          }
        }
      } else {
        // Start polling
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(response.id);
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Segmentation failed';
      setError(message);
      onError?.(message);
      setProcessing(false);
    }
  }, [
    studyUid,
    seriesUid,
    instanceUid,
    selectedModel,
    prompts,
    setProcessing,
    setError,
    setJobId,
    setJobStatus,
    setResultMask,
    onSegmentationComplete,
    onError,
    pollJobStatus,
  ]);

  /**
   * Execute auto segmentation (full volume)
   */
  const executeAutoSegmentation = useCallback(
    async (model?: AISegmentationModel) => {
      setProcessing(true);
      setError(null);

      try {
        const response = await requestAutoSegmentation({
          studyUid,
          seriesUid,
          model: model || 'nnunet',
        });

        setJobId(response.id);
        setJobStatus(response.status);

        // Start polling
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(response.id);
        }, 2000); // Longer interval for auto segmentation
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Auto segmentation failed';
        setError(message);
        onError?.(message);
        setProcessing(false);
      }
    },
    [studyUid, seriesUid, setProcessing, setError, setJobId, setJobStatus, onError, pollJobStatus]
  );

  /**
   * Cancel current job
   */
  const cancelCurrentJob = useCallback(async () => {
    if (!currentJobId) return;

    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    try {
      await cancelJob(currentJobId);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }

    setJobId(null);
    setJobStatus(null);
    setProcessing(false);
  }, [currentJobId, setJobId, setJobStatus, setProcessing]);

  return {
    // State
    isActive,
    selectedModel,
    prompts,
    drawingState,
    isProcessing,
    jobStatus,
    resultMask,
    error,

    // Actions
    setActive,
    toggle,
    setModel,
    addPointPrompt,
    addBoxPrompt,
    removePrompt,
    clearPrompts,
    undoLastPrompt,
    setPointMode,
    acceptResult,
    rejectResult,
    reset,

    // Canvas handlers
    handleCanvasClick,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,

    // Execution
    executeSegmentation,
    executeAutoSegmentation,
    cancelCurrentJob,
  };
}

export default useAISegmentation;
