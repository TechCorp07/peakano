// @ts-nocheck
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
import { useFrameAwareImageIds } from '@/lib/dicom';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import type { ToolType, ViewportLayoutType, ViewportCellConfig } from '@/lib/cornerstone/types';
import { LAYOUT_CONFIGS } from '@/lib/cornerstone/types';
import type { StudyWithSeriesUrls, SeriesWithInstanceUrls, InstanceWithUrls } from '@/types/dicom';

import ViewerToolbar from './ViewerToolbar';
import ViewerLeftSidebar from './ViewerLeftSidebar';
import ViewerContextPanel from './ViewerContextPanel';
import Viewport from './Viewport';
import ViewportGrid from './ViewportGrid';
import StackNavigator from './StackNavigator';
import SmartToolsPanel from './SmartToolsPanel';
import AISegmentationPanel from './AISegmentationPanel';
import { MPRLayout } from './MPRLayout';
import { useSmartToolStore, type SmartToolType } from '@/lib/smartTools';
import { useAISegmentationStore, useAISegmentation } from '@/lib/aiSegmentation';
import { RENDERING_ENGINE_ID } from '@/lib/cornerstone/types';

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

  // Stack navigation - we'll update totalImages after frame detection
  // Using 0 as initial value, will be updated when imageIds are loaded
  const [actualTotalImages, setActualTotalImages] = useState(0);
  const { currentIndex, totalImages, goToImage } = useStackNavigation(actualTotalImages);

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

  // Smart tools state
  const { activeTool: activeSmartTool, setActiveTool: setSmartTool } = useSmartToolStore();
  const [showSmartToolsPanel, setShowSmartToolsPanel] = useState(false);

  // AI Segmentation state
  const { isActive: isAIActive, setActive: setAIActive } = useAISegmentationStore();
  const { executeSegmentation, executeAutoSegmentation } = useAISegmentation({
    studyUid: studyInstanceUID,
    seriesUid: selectedSeriesUID || '',
    currentSlice: currentIndex,
    onSegmentationComplete: (contour) => {
      console.log('[AISegmentation] Received contour with', contour.length, 'points');
      // TODO: Convert contour to annotation
    },
    onError: (error) => {
      console.error('[AISegmentation] Error:', error);
    },
  });

  // MPR (Multi-Planar Reconstruction) state
  const [showMPR, setShowMPR] = useState(false);

  // Overlay toggle
  const [showOverlay, setShowOverlay] = useState(true);

  // Image invert toggle
  const [isInverted, setIsInverted] = useState(false);

  // Track if initial series has been set to prevent re-running
  const initialSeriesSetRef = useRef(false);
  const onLoadCalledRef = useRef(false);
  const prevImageIdsRef = useRef<string[]>([]);

  // Add timeout for initialization to prevent infinite loading
  const [initTimeout, setInitTimeout] = useState(false);

  // Check if this is a local or static study
  const isLocalStudy = studyInstanceUID.startsWith('local-');
  const isStaticStudy = studyInstanceUID.startsWith('static-');
  const needsLocalImageIds = isLocalStudy || isStaticStudy;

  // Get series list from study (stable reference)
  const seriesList = useMemo((): SeriesWithInstanceUrls[] => {
    if (!study) return [];
    const studyWithSeries = study as StudyWithSeriesUrls;
    return studyWithSeries.series || [];
  }, [study]);

  // Set initial series when study loads (only once)
  useEffect(() => {
    if (study && seriesList.length > 0 && !selectedSeriesUID && !initialSeriesSetRef.current) {
      initialSeriesSetRef.current = true;
      setSelectedSeriesUID(seriesList[0].seriesInstanceUID);
    }
  }, [study, seriesList, selectedSeriesUID]);

  // Extract file URLs from instances for frame-aware loading
  const fileUrls = useMemo(() => {
    console.log('[AnnotationWorkspace] fileUrls useMemo:', {
      instancesLength: instances.length,
      selectedSeriesUID,
      needsLocalImageIds,
      isLocalStudy,
      isStaticStudy,
    });

    if (instances.length === 0 || !selectedSeriesUID || !needsLocalImageIds) {
      console.log('[AnnotationWorkspace] fileUrls returning empty array');
      return [];
    }

    const sortedInstances = [...instances].sort(
      (a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0)
    );

    // Cast instances to InstanceWithUrls for URL property access
    const instancesWithUrls = sortedInstances as InstanceWithUrls[];

    console.log('[AnnotationWorkspace] sortedInstances:', instancesWithUrls.map(inst => ({
      id: inst.id,
      _staticUrl: inst._staticUrl,
      _localUrl: inst._localUrl,
    })));

    const urls = instancesWithUrls.map((inst) => {
      // Check for static URL first (pre-loaded files in public/dicom/)
      const staticUrl = inst._staticUrl;
      if (staticUrl) {
        // Static files are served from public directory, need full URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}${staticUrl}`;
      }
      // Fall back to local URL (uploaded files stored as blob URLs)
      const localUrl = inst._localUrl;
      if (localUrl) {
        return localUrl;
      }
      return '';
    }).filter(url => url !== '');

    console.log('[AnnotationWorkspace] fileUrls result:', urls);
    return urls;
  }, [instances, selectedSeriesUID, needsLocalImageIds, isLocalStudy, isStaticStudy]);

  // Use frame-aware imageIds hook for local/static studies (detects multi-frame DICOM)
  const {
    imageIds: frameAwareImageIds,
    isLoading: frameDetectionLoading,
  } = useFrameAwareImageIds(fileUrls, needsLocalImageIds && fileUrls.length > 0);

  // Generate image IDs - use frame-aware for local/static, WADO-RS for remote
  const imageIds = useMemo(() => {
    // For local/static studies, use frame-aware imageIds
    if (needsLocalImageIds) {
      if (frameAwareImageIds.length > 0) {
        return frameAwareImageIds;
      }
      // Fallback while loading or if frame detection fails
      return prevImageIdsRef.current;
    }

    // For remote studies, use WADO-RS URLs (unchanged)
    if (instances.length === 0 || !selectedSeriesUID) {
      return prevImageIdsRef.current.length === 0 ? [] : prevImageIdsRef.current;
    }

    const sortedInstances = [...instances].sort(
      (a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0)
    );

    const sopInstanceUIDs = sortedInstances.map((inst) => inst.sopInstanceUID);
    const newIds = createWadoRsImageIds(
      siteConfig.apiUrl,
      studyInstanceUID,
      selectedSeriesUID,
      sopInstanceUIDs
    );

    // Only update ref if IDs actually changed
    if (JSON.stringify(newIds) !== JSON.stringify(prevImageIdsRef.current)) {
      prevImageIdsRef.current = newIds;
    }

    return prevImageIdsRef.current;
  }, [instances, studyInstanceUID, selectedSeriesUID, needsLocalImageIds, frameAwareImageIds]);

  // Update prevImageIdsRef when frame-aware imageIds are loaded
  useEffect(() => {
    if (needsLocalImageIds && frameAwareImageIds.length > 0) {
      prevImageIdsRef.current = frameAwareImageIds;
    }
  }, [needsLocalImageIds, frameAwareImageIds]);

  // Update total images count when imageIds change (for stack navigation)
  useEffect(() => {
    if (imageIds.length > 0) {
      setActualTotalImages(imageIds.length);
    }
  }, [imageIds.length]);

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

  // Handle smart tool change
  const handleSmartToolChange = useCallback((tool: SmartToolType) => {
    setSmartTool(tool);
    setShowSmartToolsPanel(tool !== 'none');
  }, [setSmartTool]);

  // Handle overlay toggle
  const handleToggleOverlay = useCallback(() => {
    setShowOverlay(prev => !prev);
  }, []);

  // Handle image invert toggle
  const handleToggleInvert = useCallback(() => {
    setIsInverted(prev => !prev);
  }, []);

  // Handle MPR toggle
  const handleToggleMPR = useCallback(() => {
    if (imageIds.length < 3) {
      console.warn('[AnnotationWorkspace] MPR requires at least 3 images for volume reconstruction');
      return;
    }
    setShowMPR(prev => !prev);
    console.log('[AnnotationWorkspace] MPR toggle:', !showMPR);
  }, [imageIds.length, showMPR]);

  // Quick Action: Reset View
  const handleResetView = useCallback(async () => {
    const viewportId = activeLayout === '1x1' ? 'main-viewport' : activeViewportId;
    try {
      const { getRenderingEngine } = await import('@/lib/cornerstone/setup');
      const renderingEngine = getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);
      if (viewport) {
        viewport.resetCamera();
        viewport.render();
      }
    } catch (error) {
      console.error('[AnnotationWorkspace] Failed to reset view:', error);
    }
  }, [activeLayout, activeViewportId]);

  // Quick Action: Toggle Ruler (Length tool)
  const handleToggleRuler = useCallback(() => {
    if (activeTool === 'Length') {
      setActiveTool('WindowLevel');
    } else {
      setActiveTool('Length');
    }
  }, [activeTool, setActiveTool]);

  // Quick Action: Center Image
  const handleCenterImage = useCallback(async () => {
    const viewportId = activeLayout === '1x1' ? 'main-viewport' : activeViewportId;
    try {
      const { getRenderingEngine } = await import('@/lib/cornerstone/setup');
      const renderingEngine = getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);
      if (viewport) {
        viewport.resetCamera();
        viewport.render();
      }
    } catch (error) {
      console.error('[AnnotationWorkspace] Failed to center image:', error);
    }
  }, [activeLayout, activeViewportId]);

  // Handle interpolation apply - uses the smart tools store to trigger interpolation
  const handleApplyInterpolation = useCallback(async () => {
    console.log('[AnnotationWorkspace] Applying interpolation...');
    
    // Import and execute interpolation through the store
    const { useSmartToolStore, interpolateSlices, canvasAnnotationsToSliceAnnotations } = await import('@/lib/smartTools');
    const { useCanvasAnnotationStore } = await import('@/features/annotation');
    
    const store = useSmartToolStore.getState();
    const canvasStore = useCanvasAnnotationStore.getState();
    const { interpolationConfig, setProcessing, setResult, setError } = store;
    const { annotations: canvasAnnotations, setAnnotations } = canvasStore;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Convert canvas annotations to slice annotations
      const annotationsMap = new Map<number, Array<{ pointsWorld: Array<[number, number, number]>; completed?: boolean }>>();
      
      canvasAnnotations.forEach((anns, key) => {
        const sliceIndex = typeof key === 'number' ? key : parseInt(String(key), 10);
        if (!isNaN(sliceIndex)) {
          const converted = anns
            .filter(ann => 'pointsWorld' in ann && Array.isArray((ann as { pointsWorld?: unknown }).pointsWorld))
            .map(ann => ({
              pointsWorld: (ann as { pointsWorld: Array<[number, number, number]> }).pointsWorld,
              completed: 'completed' in ann ? (ann as { completed?: boolean }).completed : true,
            }));
          annotationsMap.set(sliceIndex, converted);
        }
      });

      const sliceAnnotations = canvasAnnotationsToSliceAnnotations(annotationsMap);

      if (sliceAnnotations.length < 2) {
        throw new Error('Need at least 2 annotated slices for interpolation');
      }

      // Calculate Z coordinates for slices
      const sliceZCoords = new Map<number, number>();
      for (let i = 0; i < imageIds.length; i++) {
        sliceZCoords.set(i, i);
      }

      // Execute interpolation
      const result = interpolateSlices(sliceAnnotations, interpolationConfig, sliceZCoords);

      console.log('[AnnotationWorkspace] Interpolation result:', result);
      setResult(result);

      // Add interpolated annotations to canvas store
      for (const slice of result.sliceAnnotations) {
        const key = String(slice.sliceIndex);
        const existing = canvasAnnotations.get(key) || [];
        
        // Only add if this slice was interpolated (not a key frame)
        const isKeyFrame = sliceAnnotations.some(s => s.sliceIndex === slice.sliceIndex);
        if (!isKeyFrame) {
          const newAnnotations = slice.contours.map((contour, idx) => ({
            id: `interpolated-${slice.sliceIndex}-${idx}-${Date.now()}`,
            type: 'freehand' as const,
            pointsWorld: contour.points,
            completed: true,
            color: 'rgba(100, 200, 255, 0.4)', // Different color for interpolated
          }));
          setAnnotations(key, [...existing, ...newAnnotations]);
        }
      }
      
      console.log('[AnnotationWorkspace] Interpolation complete:', result.interpolatedCount, 'slices interpolated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Interpolation failed';
      console.error('[AnnotationWorkspace] Interpolation error:', message);
      setError(message);
    } finally {
      setProcessing(false);
    }
  }, [imageIds.length]);

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

  // Loading state - wait for initialization, study, series selection, and frame detection
  const isLoadingOverall = !isInitialized || studyLoading || (study && !selectedSeriesUID) || frameDetectionLoading;

  // Set init timeout to prevent infinite loading
  useEffect(() => {
    if (!isInitialized && !initError) {
      const timer = setTimeout(() => {
        setInitTimeout(true);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, initError]);

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
    const errorMessage = initError?.message || 
      (studyError && 'message' in studyError ? studyError.message : null) || 
      'Failed to load study. Please try again.';
    return (
      <div
        className={cn('flex items-center justify-center h-full bg-[#0D1117]', className)}
        data-theme="app"
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        onSmartToolChange={handleSmartToolChange}
        onToggleOverlay={handleToggleOverlay}
        onToggleMPR={handleToggleMPR}
        showOverlay={showOverlay}
        showMPR={showMPR}
        onInvert={handleToggleInvert}
        isInverted={isInverted}
      />

      {/* Smart Tools Panel */}
      {showSmartToolsPanel && activeSmartTool !== 'none' && (
        <SmartToolsPanel
          activeTool={activeSmartTool}
          onClose={() => {
            setSmartTool('none');
            setShowSmartToolsPanel(false);
          }}
          onApply={handleApplyInterpolation}
        />
      )}

      {/* AI Segmentation Panel */}
      {isAIActive && (
        <AISegmentationPanel
          onClose={() => setAIActive(false)}
          onExecute={executeSegmentation}
        />
      )}

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
            ) : showMPR ? (
              /* MPR Layout - Three orthogonal views */
              <MPRLayout
                imageIds={imageIds}
                renderingEngineId={RENDERING_ENGINE_ID}
                onClose={() => setShowMPR(false)}
                className="h-full"
              />
            ) : isMultiViewport ? (
              /* Multi-viewport grid layout */
              <ViewportGrid
                layout={activeLayout}
                cells={gridCells}
                activeViewportId={activeViewportId}
                onViewportActivate={handleViewportActivate}
                onImageRendered={handleGridImageRendered}
                className="h-full"
                isInverted={isInverted}
              />
            ) : (
              /* Single viewport layout */
              <>
                <Viewport
                  viewportId="main-viewport"
                  imageIds={imageIds}
                  onImageRendered={handleImageRendered}
                  className="h-full"
                  useNativeSegmentation={false}
                  showOverlay={showOverlay}
                  isInverted={isInverted}
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
          onResetView={handleResetView}
          onToggleRuler={handleToggleRuler}
          onCenterImage={handleCenterImage}
          onToolChange={handleToolChange}
        />
      </div>
    </div>
  );
}
