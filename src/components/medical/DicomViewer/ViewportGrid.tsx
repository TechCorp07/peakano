'use client';

/**
 * ViewportGrid Component
 * Flexible multi-viewport grid layout for DICOM viewing
 * Supports layouts: 1x1, 1x2, 2x1, 2x2, 1x3, 3x1, 2x3, 3x3
 */

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ViewportLayoutType, ViewportCellConfig } from '@/lib/cornerstone/types';
import { LAYOUT_CONFIGS } from '@/lib/cornerstone/types';
import Viewport from './Viewport';

export interface ViewportGridProps {
  /** Current layout type */
  layout: ViewportLayoutType;
  /** Configuration for each viewport cell */
  cells: ViewportCellConfig[];
  /** Currently active viewport ID */
  activeViewportId: string;
  /** Callback when a viewport is clicked/activated */
  onViewportActivate: (viewportId: string) => void;
  /** Callback when an image is rendered in a viewport */
  onImageRendered?: (viewportId: string, imageIndex: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show overlay info on viewports */
  showOverlay?: boolean;
  /** Invert the image colors */
  isInverted?: boolean;
}

export default function ViewportGrid({
  layout,
  cells,
  activeViewportId,
  onViewportActivate,
  onImageRendered,
  className,
  showOverlay = true,
  isInverted = false,
}: ViewportGridProps) {
  const layoutConfig = LAYOUT_CONFIGS[layout];
  const totalCells = layoutConfig.rows * layoutConfig.cols;

  // Generate viewport IDs for the grid
  const viewportIds = useMemo(() => {
    return Array.from({ length: totalCells }, (_, i) => `viewport-${i}`);
  }, [totalCells]);

  // Get cell config for a given index, or empty config
  const getCellConfig = useCallback(
    (index: number): ViewportCellConfig => {
      if (index < cells.length) {
        return cells[index];
      }
      // Return empty config for unfilled cells
      return {
        viewportId: viewportIds[index],
        imageIds: [],
      };
    },
    [cells, viewportIds]
  );

  // Handle viewport click
  const handleViewportClick = useCallback(
    (viewportId: string) => {
      onViewportActivate(viewportId);
    },
    [onViewportActivate]
  );

  // Handle image rendered callback
  const handleImageRendered = useCallback(
    (viewportId: string) => (imageIndex: number) => {
      onImageRendered?.(viewportId, imageIndex);
    },
    [onImageRendered]
  );

  // Generate grid style based on layout
  const gridStyle = useMemo(() => {
    return {
      display: 'grid',
      gridTemplateRows: `repeat(${layoutConfig.rows}, 1fr)`,
      gridTemplateColumns: `repeat(${layoutConfig.cols}, 1fr)`,
      gap: '2px',
    };
  }, [layoutConfig]);

  return (
    <div className={cn('w-full h-full bg-[#0D1117]', className)} style={gridStyle}>
      {viewportIds.map((viewportId, index) => {
        const cellConfig = getCellConfig(index);
        const isActive = activeViewportId === cellConfig.viewportId || activeViewportId === viewportId;
        const effectiveViewportId = cellConfig.viewportId || viewportId;

        return (
          <div
            key={viewportId}
            className={cn(
              'relative bg-black overflow-hidden',
              isActive && 'ring-2 ring-primary ring-inset'
            )}
            onClick={() => handleViewportClick(effectiveViewportId)}
          >
            {cellConfig.imageIds.length > 0 ? (
              <>
                <Viewport
                  viewportId={effectiveViewportId}
                  imageIds={cellConfig.imageIds}
                  onImageRendered={handleImageRendered(effectiveViewportId)}
                  showOverlay={showOverlay}
                  isInverted={isInverted}
                  className="w-full h-full"
                />
                {/* Series label overlay */}
                {cellConfig.label && (
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    {cellConfig.label}
                  </div>
                )}
              </>
            ) : (
              // Empty cell placeholder
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-[#8B949E]">
                  <p className="text-sm">Empty</p>
                  <p className="text-xs mt-1">Drag series here</p>
                </div>
              </div>
            )}

            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook to manage viewport grid state
 */
export function useViewportGridState(initialLayout: ViewportLayoutType = '1x1') {
  const [layout, setLayout] = useState<ViewportLayoutType>(initialLayout);
  const [activeViewportId, setActiveViewportId] = useState<string>('viewport-0');
  const [cellsData, setCellsData] = useState<Map<number, Omit<ViewportCellConfig, 'viewportId'>>>(new Map());

  const layoutConfig = LAYOUT_CONFIGS[layout];
  const totalCells = layoutConfig.rows * layoutConfig.cols;

  // Derive cells from cellsData using useMemo (avoids setState in useEffect)
  const cells = useMemo(() => {
    const result: ViewportCellConfig[] = [];
    for (let i = 0; i < totalCells; i++) {
      const data = cellsData.get(i);
      result.push({
        viewportId: `viewport-${i}`,
        imageIds: data?.imageIds ?? [],
        label: data?.label,
        seriesInstanceUID: data?.seriesInstanceUID,
      });
    }
    return result;
  }, [totalCells, cellsData]);

  // Set image IDs for a specific cell
  const setCellImageIds = useCallback(
    (index: number, imageIds: string[], label?: string, seriesInstanceUID?: string) => {
      setCellsData((prev) => {
        const newMap = new Map(prev);
        newMap.set(index, { imageIds, label, seriesInstanceUID });
        return newMap;
      });
    },
    []
  );

  // Clear a specific cell
  const clearCell = useCallback((index: number) => {
    setCellsData((prev) => {
      const newMap = new Map(prev);
      newMap.delete(index);
      return newMap;
    });
  }, []);

  // Clear all cells
  const clearAllCells = useCallback(() => {
    setCellsData(new Map());
  }, []);

  return {
    layout,
    setLayout,
    activeViewportId,
    setActiveViewportId,
    cells,
    setCellImageIds,
    clearCell,
    clearAllCells,
    totalCells,
  };
}

