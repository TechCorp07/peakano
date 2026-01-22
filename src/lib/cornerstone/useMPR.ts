'use client';

/**
 * useMPR Hook
 * React hook for managing MPR (Multi-Planar Reconstruction) state and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { MPRState, MPROrientation } from '@/lib/cornerstone/mpr';

interface UseMPROptions {
  renderingEngineId: string;
  imageIds: string[];
  autoInit?: boolean;
}

interface UseMPRReturn {
  // State
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  mprState: MPRState | null;

  // Actions
  enableMPR: (elements: {
    axial: HTMLDivElement;
    sagittal: HTMLDivElement;
    coronal: HTMLDivElement;
  }) => Promise<void>;
  disableMPR: () => Promise<void>;
  resetViews: () => Promise<void>;
  syncCameras: (sourceViewportId: string) => Promise<void>;

  // Refs
  axialRef: React.RefObject<HTMLDivElement | null>;
  sagittalRef: React.RefObject<HTMLDivElement | null>;
  coronalRef: React.RefObject<HTMLDivElement | null>;
}

export function useMPR({
  renderingEngineId,
  imageIds,
  autoInit = false,
}: UseMPROptions): UseMPRReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mprState, setMPRState] = useState<MPRState | null>(null);

  // Viewport refs
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);

  // Enable MPR
  const handleEnableMPR = useCallback(
    async (elements: {
      axial: HTMLDivElement;
      sagittal: HTMLDivElement;
      coronal: HTMLDivElement;
    }) => {
      if (imageIds.length === 0) {
        setError('No images provided for MPR');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const mprModule = await import('@/lib/cornerstone/mpr');
        
        // Initialize MPR module
        await mprModule.initializeMPR();

        // Enable MPR with elements
        await mprModule.enableMPR(renderingEngineId, imageIds, elements);

        // Update state
        const state = mprModule.getMPRState();
        setMPRState(state);
        setIsEnabled(true);
      } catch (err) {
        console.error('[useMPR] Failed to enable MPR:', err);
        setError(err instanceof Error ? err.message : 'Failed to enable MPR');
      } finally {
        setIsLoading(false);
      }
    },
    [imageIds, renderingEngineId]
  );

  // Disable MPR
  const handleDisableMPR = useCallback(async () => {
    try {
      const mprModule = await import('@/lib/cornerstone/mpr');
      await mprModule.disableMPR(renderingEngineId);
      
      setIsEnabled(false);
      setMPRState(null);
    } catch (err) {
      console.error('[useMPR] Failed to disable MPR:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable MPR');
    }
  }, [renderingEngineId]);

  // Reset views
  const resetViews = useCallback(async () => {
    try {
      const mprModule = await import('@/lib/cornerstone/mpr');
      await mprModule.resetMPRViews();
    } catch (err) {
      console.error('[useMPR] Failed to reset views:', err);
    }
  }, []);

  // Sync cameras
  const syncCameras = useCallback(async (sourceViewportId: string) => {
    try {
      const mprModule = await import('@/lib/cornerstone/mpr');
      await mprModule.syncMPRCameras(sourceViewportId);
    } catch (err) {
      console.error('[useMPR] Failed to sync cameras:', err);
    }
  }, []);

  // Auto-initialize if enabled
  useEffect(() => {
    if (
      autoInit &&
      axialRef.current &&
      sagittalRef.current &&
      coronalRef.current &&
      imageIds.length > 0
    ) {
      handleEnableMPR({
        axial: axialRef.current,
        sagittal: sagittalRef.current,
        coronal: coronalRef.current,
      });
    }

    // Cleanup on unmount
    return () => {
      if (isEnabled) {
        handleDisableMPR();
      }
    };
  }, [autoInit, imageIds, handleEnableMPR, handleDisableMPR, isEnabled]);

  // Refresh MPR state
  useEffect(() => {
    if (!isEnabled) return;

    const refreshState = async () => {
      try {
        const mprModule = await import('@/lib/cornerstone/mpr');
        const state = mprModule.getMPRState();
        setMPRState(state);
      } catch {
        // Ignore refresh errors
      }
    };

    // Refresh state periodically while enabled
    const interval = setInterval(refreshState, 1000);
    return () => clearInterval(interval);
  }, [isEnabled]);

  return {
    // State
    isEnabled,
    isLoading,
    error,
    mprState,

    // Actions
    enableMPR: handleEnableMPR,
    disableMPR: handleDisableMPR,
    resetViews,
    syncCameras,

    // Refs
    axialRef,
    sagittalRef,
    coronalRef,
  };
}

export default useMPR;
