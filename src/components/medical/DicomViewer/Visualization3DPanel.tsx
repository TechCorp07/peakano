/**
 * 3D Visualization Panel Component
 * UI for 3D labelmap visualization and export
 * 
 * Phase 6: 3D Visualization Integration
 * 
 * @module components/Visualization3DPanel
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Download,
  FileJson,
  FileText,
  Layers,
  Play,
  RefreshCw,
  Settings2,
  Package,
  ScanLine,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCanvasAnnotationStore } from '@/features/annotation';
import {
  annotationsToLabelmap,
  getLabelmapStats,
  type Labelmap3D,
  type LabelmapStats,
} from '@/lib/annotation/labelmap3D';
import {
  downloadDicomSeg,
  type DicomSegExportOptions,
} from '@/lib/annotation/dicomSegExport';
import { useMultiLabelStore } from '@/lib/annotation/multiLabelStore';

// ============================================================================
// Types
// ============================================================================

interface Visualization3DPanelProps {
  studyUid?: string;
  seriesUid?: string;
  dimensions?: [number, number, number];
  spacing?: [number, number, number];
  className?: string;
}

// ============================================================================
// Stats Display Component
// ============================================================================

interface StatsDisplayProps {
  stats: LabelmapStats | null;
  spacing: [number, number, number];
}

function StatsDisplay({ stats, spacing }: StatsDisplayProps) {
  if (!stats) {
    return (
      <div className="p-4 bg-gray-800/50 rounded-lg text-center text-gray-500 text-sm">
        No labelmap generated yet
      </div>
    );
  }

  const voxelVolume = spacing[0] * spacing[1] * spacing[2];
  const volumeCm3 = (stats.volumeMm3 / 1000).toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-2 bg-gray-800/50 rounded">
        <p className="text-xs text-gray-500">Total Voxels</p>
        <p className="text-sm font-medium text-white">
          {stats.totalVoxels.toLocaleString()}
        </p>
      </div>
      <div className="p-2 bg-gray-800/50 rounded">
        <p className="text-xs text-gray-500">Labeled Voxels</p>
        <p className="text-sm font-medium text-white">
          {stats.labeledVoxels.toLocaleString()}
        </p>
      </div>
      <div className="p-2 bg-gray-800/50 rounded">
        <p className="text-xs text-gray-500">Volume</p>
        <p className="text-sm font-medium text-white">
          {volumeCm3} cm³
        </p>
      </div>
      <div className="p-2 bg-gray-800/50 rounded">
        <p className="text-xs text-gray-500">Surface Area</p>
        <p className="text-sm font-medium text-white">
          {stats.surfaceAreaMm2.toFixed(0)} mm²
        </p>
      </div>
      <div className="p-2 bg-gray-800/50 rounded col-span-2">
        <p className="text-xs text-gray-500">Labels</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {Array.from(stats.labelCounts.entries()).map(([labelId, count]) => (
            <span
              key={labelId}
              className="px-2 py-0.5 text-xs bg-blue-600/30 text-blue-300 rounded"
            >
              #{labelId}: {count.toLocaleString()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Export Options Component
// ============================================================================

interface ExportOptionsProps {
  onExport: (format: string, options: DicomSegExportOptions) => void;
  isExporting: boolean;
}

function ExportOptions({ onExport, isExporting }: ExportOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seriesDescription, setSeriesDescription] = useState('Segmentation');
  const [contentCreator, setContentCreator] = useState('PeakPoint Annotation');

  const exportFormats = [
    { id: 'dicom-seg', label: 'DICOM SEG', icon: FileJson, description: 'Standards-compliant' },
    { id: 'nifti', label: 'NIfTI', icon: FileText, description: 'Coming soon', disabled: true },
    { id: 'nrrd', label: 'NRRD', icon: FileText, description: 'Coming soon', disabled: true },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Export Format</span>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showAdvanced ? 'Hide' : 'Show'} options
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-2 p-2 bg-gray-800/50 rounded">
          <div>
            <label className="text-xs text-gray-500">Series Description</label>
            <input
              type="text"
              value={seriesDescription}
              onChange={(e) => setSeriesDescription(e.target.value)}
              className="w-full px-2 py-1 mt-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Content Creator</label>
            <input
              type="text"
              value={contentCreator}
              onChange={(e) => setContentCreator(e.target.value)}
              className="w-full px-2 py-1 mt-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {exportFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => onExport(format.id, { seriesDescription, contentCreatorName: contentCreator })}
            disabled={format.disabled || isExporting}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-colors
              ${format.disabled
                ? 'border-gray-700 bg-gray-800/30 text-gray-600 cursor-not-allowed'
                : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-white'}
            `}
          >
            <format.icon className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{format.label}</div>
              <div className="text-xs text-gray-500">{format.description}</div>
            </div>
            {!format.disabled && (
              <Download className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function Visualization3DPanel({
  studyUid = 'default',
  seriesUid = 'default',
  dimensions = [512, 512, 100],
  spacing = [1, 1, 1],
  className = '',
}: Visualization3DPanelProps) {
  const [labelmap, setLabelmap] = useState<Labelmap3D | null>(null);
  const [stats, setStats] = useState<LabelmapStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [interpolate, setInterpolate] = useState(true);

  const annotations = useCanvasAnnotationStore((state) => state.annotations);
  const labels = useMultiLabelStore((state) => state.labels);

  // Count annotated slices
  const annotatedSliceCount = useMemo(() => {
    let count = 0;
    annotations.forEach((annList) => {
      if (annList.length > 0) count++;
    });
    return count;
  }, [annotations]);

  // Generate labelmap from annotations
  const handleGenerateLabelmap = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newLabelmap = annotationsToLabelmap(annotations, {
        dimensions,
        spacing,
        interpolate,
        maxInterpolationGap: 5,
      });

      // Add label info from multi-label store
      labels.forEach((label, id) => {
        newLabelmap.labels.set(id, {
          id,
          name: label.name,
          color: label.color,
          visible: label.visible,
        });
      });

      const newStats = getLabelmapStats(newLabelmap);
      
      setLabelmap(newLabelmap);
      setStats(newStats);
    } catch (error) {
      console.error('Failed to generate labelmap:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [annotations, dimensions, spacing, interpolate, labels]);

  // Export labelmap
  const handleExport = useCallback(async (format: string, options: DicomSegExportOptions) => {
    if (!labelmap) {
      alert('Please generate a labelmap first');
      return;
    }

    setIsExporting(true);

    try {
      switch (format) {
        case 'dicom-seg':
          downloadDicomSeg(labelmap, `segmentation_${Date.now()}.dcm.json`, options);
          break;
        default:
          alert(`Export format '${format}' is not yet implemented`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. See console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [labelmap]);

  return (
    <div className={`flex flex-col gap-4 p-4 bg-gray-900/80 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          3D Visualization
        </h3>
        <span className="text-xs text-gray-400">
          {annotatedSliceCount} slices annotated
        </span>
      </div>

      {/* Generation Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
          <span className="text-xs text-gray-400">Interpolate slices</span>
          <button
            onClick={() => setInterpolate(!interpolate)}
            className={`px-2 py-1 text-xs rounded ${interpolate ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            {interpolate ? 'On' : 'Off'}
          </button>
        </div>

        <button
          onClick={handleGenerateLabelmap}
          disabled={isGenerating || annotatedSliceCount === 0}
          className={`
            w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-colors
            ${annotatedSliceCount === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white'}
          `}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              Generate 3D Labelmap
            </>
          )}
        </button>
      </div>

      {/* Labelmap Info */}
      {labelmap && (
        <>
          <div className="pt-3 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Labelmap Statistics</span>
              <button
                onClick={() => setShowVisualization(!showVisualization)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {showVisualization ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showVisualization ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            <StatsDisplay stats={stats} spacing={spacing} />
          </div>

          {/* Visualization Preview Placeholder */}
          {showVisualization && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
              <div className="text-gray-400 text-sm mb-2">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                3D Viewer
              </div>
              <p className="text-xs text-gray-500">
                Connect to Cornerstone3D volume rendering for interactive 3D view
              </p>
            </div>
          )}

          {/* Export */}
          <div className="pt-3 border-t border-gray-700/50">
            <ExportOptions onExport={handleExport} isExporting={isExporting} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!labelmap && annotatedSliceCount === 0 && (
        <div className="p-6 text-center text-gray-500">
          <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No annotations yet</p>
          <p className="text-xs mt-1">Create annotations to generate 3D labelmap</p>
        </div>
      )}
    </div>
  );
}

export default Visualization3DPanel;
