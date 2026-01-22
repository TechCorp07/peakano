'use client';

/**
 * MPRLayout Component
 * Displays three synchronized viewports for Multi-Planar Reconstruction (MPR)
 * showing axial, sagittal, and coronal views of a DICOM volume
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize2, Minimize2, RotateCcw, Crosshair, X } from 'lucide-react';
import type { MPROrientation } from '@/lib/cornerstone/mpr';

interface MPRLayoutProps {
  imageIds: string[];
  renderingEngineId: string;
  onClose?: () => void;
  className?: string;
}

interface ViewportState {
  isMaximized: boolean;
  maximizedView: MPROrientation | null;
}

const VIEWPORT_LABELS: Record<MPROrientation, { label: string; color: string }> = {
  axial: { label: 'Axial', color: '#FF6B6B' },
  sagittal: { label: 'Sagittal', color: '#4ECDC4' },
  coronal: { label: 'Coronal', color: '#45B7D1' },
};

export function MPRLayout({
  imageIds,
  renderingEngineId,
  onClose,
  className = '',
}: MPRLayoutProps): React.ReactElement {
  const axialRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewportState, setViewportState] = useState<ViewportState>({
    isMaximized: false,
    maximizedView: null,
  });
  const [crosshairsActive, setCrosshairsActive] = useState(true);

  // Initialize MPR
  useEffect(() => {
    let isMounted = true;

    const initMPR = async () => {
      if (
        !axialRef.current ||
        !sagittalRef.current ||
        !coronalRef.current ||
        imageIds.length === 0
      ) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import MPR module
        const { enableMPR, initializeMPR } = await import('@/lib/cornerstone/mpr');

        // Initialize MPR module
        await initializeMPR();

        // Enable MPR with the viewport elements
        await enableMPR(renderingEngineId, imageIds, {
          axial: axialRef.current,
          sagittal: sagittalRef.current,
          coronal: coronalRef.current,
        });

        if (isMounted) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[MPRLayout] Failed to initialize MPR:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize MPR');
          setIsLoading(false);
        }
      }
    };

    initMPR();

    return () => {
      isMounted = false;

      // Cleanup MPR on unmount
      (async () => {
        try {
          const { disableMPR } = await import('@/lib/cornerstone/mpr');
          await disableMPR(renderingEngineId);
        } catch {
          // Ignore cleanup errors
        }
      })();
    };
  }, [imageIds, renderingEngineId]);

  // Handle maximize/minimize viewport
  const handleMaximize = useCallback((orientation: MPROrientation) => {
    setViewportState((prev) => {
      if (prev.isMaximized && prev.maximizedView === orientation) {
        return { isMaximized: false, maximizedView: null };
      }
      return { isMaximized: true, maximizedView: orientation };
    });
  }, []);

  // Reset all views
  const handleReset = useCallback(async () => {
    try {
      const { resetMPRViews } = await import('@/lib/cornerstone/mpr');
      await resetMPRViews();
    } catch (err) {
      console.error('[MPRLayout] Failed to reset views:', err);
    }
  }, []);

  // Toggle crosshairs
  const handleToggleCrosshairs = useCallback(async () => {
    try {
      const csTools = await import('@cornerstonejs/tools');
      const toolGroup = csTools.ToolGroupManager.getToolGroup('mprToolGroup');
      
      if (toolGroup && csTools.CrosshairsTool) {
        if (crosshairsActive) {
          toolGroup.setToolPassive(csTools.CrosshairsTool.toolName);
        } else {
          toolGroup.setToolActive(csTools.CrosshairsTool.toolName, {
            bindings: [{ mouseButton: csTools.Enums.MouseBindings.Primary }],
          });
        }
        setCrosshairsActive(!crosshairsActive);
      }
    } catch (err) {
      console.error('[MPRLayout] Failed to toggle crosshairs:', err);
    }
  }, [crosshairsActive]);

  // Render single viewport panel
  const renderViewportPanel = (
    orientation: MPROrientation,
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    const { label, color } = VIEWPORT_LABELS[orientation];
    const isMaximized = viewportState.isMaximized && viewportState.maximizedView === orientation;
    const isHidden = viewportState.isMaximized && viewportState.maximizedView !== orientation;

    if (isHidden) {
      return null;
    }

    return (
      <div
        className={`
          relative bg-black rounded-lg overflow-hidden border-2
          ${isMaximized ? 'col-span-2 row-span-2' : ''}
          transition-all duration-200
        `}
        style={{ borderColor: color }}
      >
        {/* Viewport header */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1"
          style={{ backgroundColor: `${color}20` }}
        >
          <span className="text-white text-sm font-medium" style={{ color }}>
            {label}
          </span>
          <button
            onClick={() => handleMaximize(orientation)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Viewport container */}
        <div
          ref={ref}
          className="w-full h-full"
          style={{ minHeight: isMaximized ? '600px' : '280px' }}
        />
      </div>
    );
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load MPR</p>
          <p className="text-gray-400 text-sm">{error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">MPR View</span>
          {isLoading && (
            <span className="text-gray-400 text-sm animate-pulse">Loading...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCrosshairs}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${crosshairsActive
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }
            `}
            title={crosshairsActive ? 'Disable Crosshairs' : 'Enable Crosshairs'}
            disabled={!isInitialized}
          >
            <Crosshair className="w-4 h-4" />
            <span>Crosshairs</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            title="Reset Views"
            disabled={!isInitialized}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
              title="Close MPR"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewport grid */}
      <div
        className={`
          grid gap-2 p-2
          ${viewportState.isMaximized ? 'grid-cols-1' : 'grid-cols-2'}
        `}
        style={{ minHeight: '600px' }}
      >
        {renderViewportPanel('axial', axialRef)}
        {renderViewportPanel('sagittal', sagittalRef)}
        {!viewportState.isMaximized && renderViewportPanel('coronal', coronalRef)}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white">Creating volume from images...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MPRLayout;
