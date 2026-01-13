'use client';

/**
 * DicomViewer Component
 * Main DICOM viewer component that combines all subcomponents
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import type { ToolType } from '@/lib/cornerstone/types';

import Viewport from './Viewport';
import Toolbar from './Toolbar';
import SeriesSelector from './SeriesSelector';
import MetadataPanel from './MetadataPanel';
import StackNavigator from './StackNavigator';
import WindowLevelPresets from './WindowLevelPresets';

interface DicomViewerProps {
  studyInstanceUID: string;
  initialSeriesUID?: string;
  className?: string;
  showToolbar?: boolean;
  showSidebar?: boolean;
  onLoad?: () => void;
}

export default function DicomViewer({
  studyInstanceUID,
  initialSeriesUID,
  className,
  showToolbar = true,
  showSidebar = true,
  onLoad,
}: DicomViewerProps) {
  // Cornerstone initialization
  const { isInitialized, error: initError } = useCornerstoneInit();

  // Load study data
  const { study, isLoading: studyLoading, error: studyError } = useStudyLoader(studyInstanceUID);

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

  // Generate image IDs for the viewport
  const [imageIds, setImageIds] = useState<string[]>([]);

  // Set initial series when study loads
  useEffect(() => {
    if (study && study.series && study.series.length > 0 && !selectedSeriesUID) {
      setSelectedSeriesUID(study.series[0].seriesInstanceUID);
    }
  }, [study, selectedSeriesUID]);

  // Generate image IDs when instances change
  useEffect(() => {
    if (instances.length > 0 && selectedSeriesUID) {
      const sopInstanceUIDs = instances
        .sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0))
        .map((inst) => inst.sopInstanceUID);

      const ids = createWadoRsImageIds(
        siteConfig.apiUrl,
        studyInstanceUID,
        selectedSeriesUID,
        sopInstanceUIDs
      );

      setImageIds(ids);
    } else {
      setImageIds([]);
    }
  }, [instances, studyInstanceUID, selectedSeriesUID]);

  // Notify when viewer is ready
  useEffect(() => {
    if (isInitialized && study && imageIds.length > 0) {
      onLoad?.();
    }
  }, [isInitialized, study, imageIds, onLoad]);

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

  // Handle viewport actions - connected to Cornerstone manipulation functions
  const handleReset = useCallback(async () => {
    const { resetViewport } = await import('@/lib/cornerstone/setup');
    resetViewport('main-viewport');
  }, []);

  const handleFlipHorizontal = useCallback(async () => {
    const { flipViewportHorizontal } = await import('@/lib/cornerstone/setup');
    flipViewportHorizontal('main-viewport');
  }, []);

  const handleFlipVertical = useCallback(async () => {
    const { flipViewportVertical } = await import('@/lib/cornerstone/setup');
    flipViewportVertical('main-viewport');
  }, []);

  const handleInvert = useCallback(async () => {
    const { invertViewport } = await import('@/lib/cornerstone/setup');
    invertViewport('main-viewport');
  }, []);

  // Handle window/level preset selection
  const handlePresetSelect = useCallback(async (windowWidth: number, windowCenter: number) => {
    const { setWindowLevel } = await import('@/lib/cornerstone/setup');
    setWindowLevel('main-viewport', windowWidth, windowCenter);
  }, []);

  // Handle image navigation
  const handleImageRendered = useCallback((index: number) => {
    goToImage(index);
  }, [goToImage]);

  // Error state
  if (initError || studyError) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-slate-900', className)}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {initError?.message || 'Failed to load study. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (!isInitialized || studyLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-slate-900', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            {!isInitialized ? 'Initializing viewer...' : 'Loading study...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-slate-900', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onReset={handleReset}
          onFlipHorizontal={handleFlipHorizontal}
          onFlipVertical={handleFlipVertical}
          onInvert={handleInvert}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-72 flex-shrink-0 border-r border-slate-700 overflow-y-auto p-3 space-y-3">
            {/* Series Selector */}
            <SeriesSelector
              series={(study as any)?.series || []}
              selectedSeriesUID={selectedSeriesUID}
              onSelectSeries={handleSeriesSelect}
            />

            {/* Window/Level Presets */}
            {selectedSeries && (
              <WindowLevelPresets
                modality={selectedSeries.modality}
                onPresetSelect={handlePresetSelect}
              />
            )}

            {/* Metadata Panel */}
            <MetadataPanel study={study || null} />
          </div>
        )}

        {/* Viewport Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Viewport */}
          <div className="flex-1 relative">
            {seriesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              </div>
            ) : (
              <Viewport
                viewportId="main-viewport"
                imageIds={imageIds}
                onImageRendered={handleImageRendered}
              />
            )}
          </div>

          {/* Stack Navigator */}
          {imageIds.length > 1 && (
            <StackNavigator
              currentIndex={currentIndex}
              totalImages={totalImages}
              onNavigate={goToImage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Export subcomponents for individual use
export { Viewport, Toolbar, SeriesSelector, MetadataPanel, StackNavigator, WindowLevelPresets };

// Export new annotation workspace components
export { default as AnnotationWorkspace } from './AnnotationWorkspace';
export { default as ViewerToolbar } from './ViewerToolbar';
export { default as ViewerLeftSidebar } from './ViewerLeftSidebar';
export { default as ViewerContextPanel } from './ViewerContextPanel';

// Export multi-viewport grid components
export { default as ViewportGrid, useViewportGridState } from './ViewportGrid';

// Export annotation components
export { default as AnnotationList } from './AnnotationList';
export { default as NativeSegmentationOverlay, useNativeSegmentation } from './NativeSegmentationOverlay';
