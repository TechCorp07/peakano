/**
 * Annotation Progress Panel Component
 * Displays annotation progress, slice indicators, and statistics
 * 
 * Phase 3: Progress Tracking UI
 * 
 * @module components/AnnotationProgressPanel
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useProgressTracking } from '@/lib/annotation/useProgressTracking';
import { getSliceIndicatorColor, formatProgress, formatAnnotationCount } from '@/lib/annotation/progressTracking';

// ============================================================================
// Types
// ============================================================================

interface AnnotationProgressPanelProps {
  studyUid?: string;
  seriesUid?: string;
  totalSlices?: number;
  currentSlice?: number;
  onSliceClick?: (sliceIndex: number) => void;
  className?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Progress bar component
 */
function ProgressBar({ 
  value, 
  max = 100, 
  color = '#3B82F6',
  backgroundColor = '#374151',
  height = 8,
  showLabel = false,
}: {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
}) {
  const percent = Math.min((value / max) * 100, 100);
  
  return (
    <div className="relative w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ backgroundColor, height }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 ml-2">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

/**
 * Slice indicator strip showing annotation status for each slice
 */
function SliceIndicatorStrip({
  indicators,
  currentSlice,
  onSliceClick,
  maxVisible = 50,
}: {
  indicators: Array<{ index: number; status: 'empty' | 'annotated' | 'complete'; annotationCount: number }>;
  currentSlice: number;
  onSliceClick?: (index: number) => void;
  maxVisible?: number;
}) {
  // If too many slices, show a compressed view
  const showCompressed = indicators.length > maxVisible;
  
  // For compressed view, group slices
  const groupedIndicators = useMemo(() => {
    if (!showCompressed) return indicators;
    
    const groupSize = Math.ceil(indicators.length / maxVisible);
    const groups: typeof indicators = [];
    
    for (let i = 0; i < indicators.length; i += groupSize) {
      const group = indicators.slice(i, i + groupSize);
      // Use the "best" status in the group (complete > annotated > empty)
      let bestStatus: 'empty' | 'annotated' | 'complete' = 'empty';
      let totalAnnotations = 0;
      
      for (const ind of group) {
        totalAnnotations += ind.annotationCount;
        if (ind.status === 'complete') bestStatus = 'complete';
        else if (ind.status === 'annotated' && bestStatus !== 'complete') bestStatus = 'annotated';
      }
      
      groups.push({
        index: i,
        status: bestStatus,
        annotationCount: totalAnnotations,
      });
    }
    
    return groups;
  }, [indicators, showCompressed, maxVisible]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>0</span>
        <span>{indicators.length - 1}</span>
      </div>
      <div className="flex gap-0.5 overflow-hidden">
        {groupedIndicators.map((indicator, idx) => {
          const isCurrent = showCompressed
            ? Math.floor(currentSlice / Math.ceil(indicators.length / maxVisible)) === idx
            : indicator.index === currentSlice;
          
          return (
            <button
              key={indicator.index}
              onClick={() => onSliceClick?.(indicator.index)}
              className={`
                flex-1 min-w-[3px] h-4 rounded-sm transition-all duration-150
                hover:opacity-80 hover:scale-y-125
                ${isCurrent ? 'ring-1 ring-white ring-offset-1 ring-offset-gray-900' : ''}
              `}
              style={{ backgroundColor: getSliceIndicatorColor(indicator.status) }}
              title={`Slice ${indicator.index}: ${indicator.annotationCount} annotations`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#22C55E' }} />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#3B82F6' }} />
          <span>Annotated</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#374151' }} />
          <span>Empty</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Statistics card
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = '#3B82F6',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-800/50 rounded-lg text-center">
      <p className="text-xs text-[#8B949E] mb-1">{label}</p>
      <div 
        className="p-2 rounded-lg mb-1"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
      {subValue && (
        <p className="text-xs text-[#8B949E]">{subValue}</p>
      )}
    </div>
  );
}

/**
 * Current slice statistics
 */
function CurrentSliceStats({
  stats,
  sliceIndex,
  isComplete,
  onToggleComplete,
}: {
  stats: {
    annotationCount: number;
    totalArea: number;
    totalPerimeter: number;
    coverage: number;
  } | null;
  sliceIndex: number;
  isComplete: boolean;
  onToggleComplete: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[#E6EDF3] flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Slice {sliceIndex}
        </h4>
        <button
          onClick={onToggleComplete}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors
            ${isComplete 
              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}
          `}
        >
          {isComplete ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </>
          ) : (
            <>
              <Circle className="w-3 h-3" />
              Mark Complete
            </>
          )}
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-800/30 rounded">
            <p className="text-xs text-[#8B949E]">Annotations</p>
            <p className="text-sm font-medium text-white">{stats.annotationCount}</p>
          </div>
          <div className="p-2 bg-gray-800/30 rounded">
            <p className="text-xs text-[#8B949E]">Coverage</p>
            <p className="text-sm font-medium text-white">{stats.coverage.toFixed(1)}%</p>
          </div>
          <div className="p-2 bg-gray-800/30 rounded">
            <p className="text-xs text-[#8B949E]">Total Area</p>
            <p className="text-sm font-medium text-white">{Math.round(stats.totalArea)} px²</p>
          </div>
          <div className="p-2 bg-gray-800/30 rounded">
            <p className="text-xs text-[#8B949E]">Perimeter</p>
            <p className="text-sm font-medium text-white">{Math.round(stats.totalPerimeter)} px</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-800/30 rounded text-center text-gray-500 text-sm">
          No annotations on this slice
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AnnotationProgressPanel({
  studyUid = 'default',
  seriesUid = 'default',
  totalSlices = 100,
  currentSlice = 0,
  onSliceClick,
  className = '',
}: AnnotationProgressPanelProps) {
  const {
    currentSliceStats,
    sliceIndicators,
    completedSlices,
    toggleSliceComplete,
    progressSummary,
  } = useProgressTracking({
    studyUid,
    seriesUid,
    totalSlices,
    currentSlice,
    autoUpdate: true,
    updateInterval: 1000,
  });

  const handleToggleComplete = useCallback(() => {
    toggleSliceComplete(currentSlice);
  }, [toggleSliceComplete, currentSlice]);

  const isCurrentSliceComplete = completedSlices.has(currentSlice);

  return (
    <div className={`flex flex-col gap-4 p-4 bg-gray-900/80 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Progress Tracking
        </h3>
        <span className="text-xs text-[#8B949E]">
          {progressSummary.annotatedSlices} / {progressSummary.totalSlices} slices
        </span>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#E6EDF3]">Annotation Progress</span>
          <span className="text-blue-400 font-medium">
            {formatProgress(progressSummary.progressPercent)}
          </span>
        </div>
        <ProgressBar
          value={progressSummary.progressPercent}
          color="#3B82F6"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#E6EDF3]">Completion Progress</span>
          <span className="text-green-400 font-medium">
            {formatProgress(progressSummary.completionPercent)}
          </span>
        </div>
        <ProgressBar
          value={progressSummary.completionPercent}
          color="#22C55E"
        />
      </div>

      {/* Slice Indicators */}
      <div className="pt-2 border-t border-gray-700/50">
        <h4 className="text-xs font-medium text-[#E6EDF3] mb-2">Slice Overview</h4>
        <SliceIndicatorStrip
          indicators={sliceIndicators}
          currentSlice={currentSlice}
          onSliceClick={onSliceClick}
        />
      </div>

      {/* Statistics */}
      <div className="pt-2 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Target}
            label="Total Annotations"
            value={progressSummary.totalAnnotations}
            color="#3B82F6"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Slices"
            value={progressSummary.completedSlices}
            subValue={`of ${progressSummary.totalSlices}`}
            color="#22C55E"
          />
        </div>
      </div>

      {/* Current Slice */}
      <div className="pt-2 border-t border-gray-700/50">
        <CurrentSliceStats
          stats={currentSliceStats}
          sliceIndex={currentSlice}
          isComplete={isCurrentSliceComplete}
          onToggleComplete={handleToggleComplete}
        />
      </div>
    </div>
  );
}

export default AnnotationProgressPanel;
