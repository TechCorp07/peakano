'use client';

/**
 * AnnotationWorkspace Component (RedBrick AI-Inspired)
 * Complete 4-zone annotation workspace layout
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  useCornerstoneInit,
  useStudyLoader,
  useSeriesLoader,
  useActiveTool,
  useStackNavigation,
} from '@/features/dicom/hooks';
import { createWadoRsImageIds } from '@/lib/cornerstone/setup';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import type { ToolType, ViewportLayoutType, ViewportCellConfig } from '@/lib/cornerstone/types';
import { LAYOUT_CONFIGS } from '@/lib/cornerstone/types';

import ViewerToolbar from './ViewerToolbar';
import ViewerLeftSidebar from './ViewerLeftSidebar';
import ViewerContextPanel from './ViewerContextPanel';
import Viewport from './Viewport';
import ViewportGrid from './ViewportGrid';
import StackNavigator from './StackNavigator';

interface AnnotationWorkspaceProps {
  studyInstanceUID: string;
  initialSeriesUID?: string;
  className?: string;
  onLoad?: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
}

export default function AnnotationWorkspace({
  studyInstanceUID,
  initialSeriesUID,
  className,
  onLoad,
  onSave,
  onSubmit,
}: AnnotationWorkspaceProps) {
  // Cornerstone initialization
  const { isInitialized, error: initError } = useCornerstoneInit();

  // Load study data
  const { study, isLoading: studyLoading, error: studyError, isExpired } = useStudyLoader(studyInstanceUID);

  // Selected series
  const [selectedSeriesUID, setSelectedSeriesUID] = useState<string | null>(
    initialSeriesUID || null
  );

  // Load series with instances
  const {
    series: selectedSeries,
    instances,
    isLoading: seriesLoading,
  } = useSeriesLoader(studyInstanceUID, selectedSeriesUID || undefined);

  // Active tool
  const { activeTool, setActiveTool } = useActiveTool();

  // Stack navigation
  const { currentIndex, totalImages, goToImage } = useStackNavigation(instances.length);

  // Layout state
  const [activeLayout, setActiveLayout] = useState<ViewportLayoutType>('1x1');
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false);
  const [activeViewportId, setActiveViewportId] = useState('viewport-0');

  // Window/Level state - initialized to null, will be set from DICOM image
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const [windowCenter, setWindowCenter] = useState<number | null>(null);
  const windowLevelInitRef = useRef(false);

  // Brush settings
  const [brushSize, setBrushSize] = useState(10);
  const [brushOpacity, setBrushOpacity] = useState(1);

  // Zoom state
  const [zoom] = useState(100);

  // Track if initial series has been set to prevent re-running
  const initialSeriesSetRef = useRef(false);
  const onLoadCalledRef = useRef(false);
  const prevImageIdsRef = useRef<string[]>([]);

  // Check if this is a local study
  const isLocalStudy = studyInstanceUID.startsWith('local-');

  // Get series list from study (stable reference)
  const seriesList = useMemo(() => {
    if (!study) return [];
    return (study as any).series || [];
  }, [study]);

  // Set initial series when study loads (only once)
  useEffect(() => {
    if (study && seriesList.length > 0 && !selectedSeriesUID && !initialSeriesSetRef.current) {
      initialSeriesSetRef.current = true;
      setSelectedSeriesUID(seriesList[0].seriesInstanceUID);
    }
  }, [study, seriesList, selectedSeriesUID]);

  // Generate image IDs directly (no state, just computed value)
  const imageIds = useMemo(() => {
    if (instances.length === 0 || !selectedSeriesUID) {
      return prevImageIdsRef.current.length === 0 ? [] : prevImageIdsRef.current;
    }

    const sortedInstances = [...instances].sort(
      (a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0)
    );

    let newIds: string[];
    if (isLocalStudy) {
      // For local studies, use the stored object URLs with wadouri scheme
      // Cornerstone's wadouri loader CAN handle blob: URLs - it fetches them via XMLHttpRequest
      newIds = sortedInstances.map((inst) => {
        const localUrl = (inst as any)._localUrl;
        if (localUrl) {
          return `wadouri:${localUrl}`;
        }
        return '';
      }).filter(id => id !== ''); // Remove empty entries
    } else {
      // For remote studies, use WADO-RS URLs
      const sopInstanceUIDs = sortedInstances.map((inst) => inst.sopInstanceUID);
      newIds = createWadoRsImageIds(
        siteConfig.apiUrl,
        studyInstanceUID,
        selectedSeriesUID,
        sopInstanceUIDs
      );
    }

    // Only update ref if IDs actually changed
    if (JSON.stringify(newIds) !== JSON.stringify(prevImageIdsRef.current)) {
      prevImageIdsRef.current = newIds;
    }

    return prevImageIdsRef.current;
  }, [instances, studyInstanceUID, selectedSeriesUID, isLocalStudy]);

  // Notify when viewer is ready (only once)
  useEffect(() => {
    if (isInitialized && study && imageIds.length > 0 && !onLoadCalledRef.current) {
      onLoadCalledRef.current = true;
      onLoad?.();
    }
  }, [isInitialized, study, imageIds.length, onLoad]);

  // Initialize Window/Level from DICOM image after first render
  // Uses a small delay to ensure viewport has loaded the image
  useEffect(() => {
    if (!isInitialized || imageIds.length === 0 || windowLevelInitRef.current) {
      return;
    }

    // Delay to allow viewport to fully load the image
    const timer = setTimeout(async () => {
      if (windowLevelInitRef.current) return;

      const { getDefaultWindowLevel } = await import('@/lib/cornerstone/setup');
      const viewportId = activeLayout === '1x1' ? 'main-viewport' : activeViewportId;
      const defaults = getDefaultWindowLevel(viewportId);

      if (defaults && !windowLevelInitRef.current) {
        windowLevelInitRef.current = true;
        console.log('[AnnotationWorkspace] Setting initial W/L from image:', defaults);
        setWindowWidth(defaults.windowWidth);
        setWindowCenter(defaults.windowCenter);
      }
    }, 500); // Wait for image to load

    return () => clearTimeout(timer);
  }, [isInitialized, imageIds.length, activeLayout, activeViewportId]);

  // Handle series selection
  const handleSeriesSelect = useCallback((seriesUID: string) => {
    setSelectedSeriesUID(seriesUID);
  }, []);

  // Handle tool change
  const handleToolChange = useCallback(
    (tool: ToolType) => {
      setActiveTool(tool);
    },
    [setActiveTool]
  );

  // Handle window/level change
  const handleWindowLevelChange = useCallback(async (width: number, center: number) => {
    setWindowWidth(width);
    setWindowCenter(center);
    // Apply to Cornerstone viewport - use correct viewport ID based on layout
    const { setWindowLevel } = await import('@/lib/cornerstone/setup');
    const viewportId = activeLayout === '1x1' ? 'main-viewport' : activeViewportId;
    const success = setWindowLevel(viewportId, width, center);
    if (!success) {
      console.warn('[AnnotationWorkspace] Failed to set window/level for viewport:', viewportId);
    }
  }, [activeLayout, activeViewportId]);

  // Handle image navigation
  const handleImageRendered = useCallback(
    (index: number) => {
      goToImage(index);
    },
    [goToImage]
  );

  // Handle viewport activation (for multi-viewport)
  const handleViewportActivate = useCallback((viewportId: string) => {
    setActiveViewportId(viewportId);
  }, []);

  // Handle image rendered in grid viewport
  const handleGridImageRendered = useCallback(
    (viewportId: string, imageIndex: number) => {
      // Only track for active viewport
      if (viewportId === activeViewportId) {
        goToImage(imageIndex);
      }
    },
    [activeViewportId, goToImage]
  );

  // Generate viewport grid cells configuration
  const gridCells = useMemo((): ViewportCellConfig[] => {
    const layoutConfig = LAYOUT_CONFIGS[activeLayout];
    const totalCells = layoutConfig.rows * layoutConfig.cols;
    const cells: ViewportCellConfig[] = [];

    // First cell always gets the current imageIds
    cells.push({
      viewportId: 'viewport-0',
      imageIds: imageIds,
      seriesInstanceUID: selectedSeriesUID || undefined,
      label: selectedSeries ? `${selectedSeries.modality} - ${selectedSeries.seriesDescription || 'Series'}` : undefined,
    });

    // Additional cells are empty (can be filled by dragging series)
    for (let i = 1; i < totalCells; i++) {
      cells.push({
        viewportId: `viewport-${i}`,
        imageIds: [],
      });
    }

    return cells;
  }, [activeLayout, imageIds, selectedSeriesUID, selectedSeries]);

  // Determine if using single or multi-viewport layout
  const isMultiViewport = activeLayout !== '1x1';

  // Error state - handle expired local studies specially
  if (isExpired && isLocalStudy) {
    return (
      <div
        className={cn('flex items-center justify-center h-full bg-[#0D1117]', className)}
        data-theme="app"
      >
        <div className="max-w-md text-center">
          <Alert className="border-amber-500/50 bg-amber-500/10 mb-4">
            <RefreshCw className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-400">Session Expired</AlertTitle>
            <AlertDescription className="text-amber-300/80">
              This locally uploaded study has expired. Browser-stored files are only available during the same session they were uploaded.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-[#8B949E] mb-4">
            To view this study again, please re-upload the DICOM files from the DICOM Management page.
          </p>
          <Link href="/admin/dicom">
            <Button className="bg-primary hover:bg-primary/90">
              Go to DICOM Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (initError || studyError) {
    return (
      <div
        className={cn('flex items-center justify-center h-full bg-[#0D1117]', className)}
        data-theme="app"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {initError?.message || (studyError as any)?.message || 'Failed to load study. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state - wait for initialization, study, and series selection
  const isLoadingOverall = !isInitialized || studyLoading || (study && !selectedSeriesUID);

  // Add timeout for initialization to prevent infinite loading
  const [initTimeout, setInitTimeout] = useState(false);
  useEffect(() => {
    if (!isInitialized && !initError) {
      const timer = setTimeout(() => {
        setInitTimeout(true);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, initError]);

  if (initTimeout && !isInitialized) {
    return (
      <div
        className={cn('flex items-center justify-center h-full bg-[#0D1117]', className)}
        data-theme="app"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Viewer initialization timed out. Please refresh the page and try again.
            Check browser console for errors.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingOverall) {
    return (
      <div
        className={cn('flex items-center justify-center h-full bg-[#0D1117]', className)}
        data-theme="app"
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-[#8B949E]">
            {!isInitialized
              ? 'Initializing viewer...'
              : studyLoading
              ? 'Loading study...'
              : 'Preparing series...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-[#0D1117]', className)} data-theme="app">
      {/* Top Toolbar */}
      <ViewerToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onSave={onSave}
        onSubmit={onSubmit}
        activeLayout={activeLayout}
        onLayoutChange={setActiveLayout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <ViewerLeftSidebar
          study={study || null}
          series={seriesList}
          selectedSeriesUID={selectedSeriesUID}
          onSelectSeries={handleSeriesSelect}
        />

        {/* Center: Viewport Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {/* Viewport(s) */}
          <div className="flex-1 relative">
            {seriesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : isMultiViewport ? (
              /* Multi-viewport grid layout */
              <ViewportGrid
                layout={activeLayout}
                cells={gridCells}
                activeViewportId={activeViewportId}
                onViewportActivate={handleViewportActivate}
                onImageRendered={handleGridImageRendered}
                className="h-full"
              />
            ) : (
              /* Single viewport layout */
              <>
                <Viewport
                  viewportId="main-viewport"
                  imageIds={imageIds}
                  onImageRendered={handleImageRendered}
                  className="h-full"
                />

                {/* Viewport Label */}
                {selectedSeries && (
                  <div className="viewport-label">
                    {selectedSeries.modality} - {selectedSeries.seriesDescription || 'Axial'}
                  </div>
                )}

                {/* Viewport Info */}
                <div className="viewport-info">
                  S: {currentIndex + 1}/{totalImages}
                </div>
              </>
            )}
          </div>

          {/* Stack Navigator */}
          {imageIds.length > 1 && (
            <div className="bg-[#161B22] border-t border-[#30363D] px-4 py-3">
              <StackNavigator
                currentIndex={currentIndex}
                totalImages={totalImages}
                onNavigate={goToImage}
              />
            </div>
          )}
        </div>

        {/* Right Context Panel */}
        <ViewerContextPanel
          activeTool={activeTool}
          modality={selectedSeries?.modality || study?.modality}
          isCollapsed={isContextPanelCollapsed}
          onCollapse={() => setIsContextPanelCollapsed(!isContextPanelCollapsed)}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          brushOpacity={brushOpacity}
          onBrushOpacityChange={setBrushOpacity}
          windowWidth={windowWidth}
          windowCenter={windowCenter}
          onWindowLevelChange={handleWindowLevelChange}
          currentSlice={currentIndex + 1}
          totalSlices={totalImages}
          zoom={zoom}
          studyInstanceUID={studyInstanceUID}
          seriesInstanceUID={selectedSeriesUID || undefined}
        />
      </div>
    </div>
  );
}
