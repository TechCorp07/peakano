'use client';

/**
 * SmartToolsPanel Component
 * Settings panel for Magic Wand, Region Growing, and Interpolation tools
 */

import React, { useState } from 'react';
import {
  X,
  Wand2,
  Target,
  Layers,
  Settings2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useSmartToolStore,
  type SmartToolType,
} from '@/lib/smartTools';

interface SmartToolsPanelProps {
  activeTool: SmartToolType;
  onClose: () => void;
  onApply: () => void;
  className?: string;
}

export default function SmartToolsPanel({
  activeTool,
  onClose,
  onApply,
  className,
}: SmartToolsPanelProps) {
  const {
    magicWandConfig,
    regionGrowingConfig,
    interpolationConfig,
    setMagicWandConfig,
    setRegionGrowingConfig,
    setInterpolationConfig,
    isProcessing,
    lastResult,
    error,
  } = useSmartToolStore();

  if (activeTool === 'none') return null;

  const toolInfo: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
    'magic-wand': {
      icon: <Wand2 className="h-4 w-4" />,
      label: 'Magic Wand',
      description: 'Click on an area to select similar pixels',
    },
    'region-growing': {
      icon: <Target className="h-4 w-4" />,
      label: 'Region Growing',
      description: 'Click to grow a region based on intensity similarity',
    },
    'interpolation': {
      icon: <Layers className="h-4 w-4" />,
      label: 'Interpolation',
      description: 'Interpolate annotations between key frame slices',
    },
  };

  const info = toolInfo[activeTool];
  
  // Guard against unknown tool types
  if (!info) return null;

  return (
    <div
      className={cn(
        'absolute top-16 right-4 w-64 bg-[#1C2128] border border-[#30363D] rounded-lg shadow-xl z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D]">
        <div className="flex items-center gap-2 text-white">
          {info.icon}
          <span className="font-medium">{info.label}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded"
        >
          <X className="h-4 w-4 text-[#8B949E]" />
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-2 text-sm text-[#8B949E] border-b border-[#30363D]">
        {info.description}
      </div>

      {/* Settings */}
      <div className="p-4 space-y-4">
        {activeTool === 'magic-wand' && (
          <>
            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Tolerance: {magicWandConfig.tolerance}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={magicWandConfig.tolerance}
                onChange={(e) => setMagicWandConfig({ tolerance: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#6E7681] mt-1">
                <span>Precise</span>
                <span>Loose</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">8-Connected</span>
              <button
                onClick={() => setMagicWandConfig({ eightConnected: !magicWandConfig.eightConnected })}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  magicWandConfig.eightConnected ? 'bg-primary' : 'bg-[#30363D]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform',
                    magicWandConfig.eightConnected ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">Smooth Edges</span>
              <button
                onClick={() => setMagicWandConfig({ smoothEdges: !magicWandConfig.smoothEdges })}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  magicWandConfig.smoothEdges ? 'bg-primary' : 'bg-[#30363D]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform',
                    magicWandConfig.smoothEdges ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </>
        )}

        {activeTool === 'region-growing' && (
          <>
            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Intensity Tolerance: {regionGrowingConfig.intensityTolerance}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={regionGrowingConfig.intensityTolerance}
                onChange={(e) => setRegionGrowingConfig({ intensityTolerance: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Gradient Threshold: {regionGrowingConfig.gradientThreshold}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={regionGrowingConfig.gradientThreshold}
                onChange={(e) => setRegionGrowingConfig({ gradientThreshold: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#6E7681] mt-1">
                <span>Sensitive to edges</span>
                <span>Ignore edges</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">Adaptive Threshold</span>
              <button
                onClick={() => setRegionGrowingConfig({ useAdaptiveThreshold: !regionGrowingConfig.useAdaptiveThreshold })}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  regionGrowingConfig.useAdaptiveThreshold ? 'bg-primary' : 'bg-[#30363D]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform',
                    regionGrowingConfig.useAdaptiveThreshold ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Min Region Size: {regionGrowingConfig.minRegionSize} px
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={regionGrowingConfig.minRegionSize}
                onChange={(e) => setRegionGrowingConfig({ minRegionSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        )}

        {activeTool === 'interpolation' && (
          <>
            <div>
              <label className="block text-sm text-[#8B949E] mb-2">Method</label>
              <select
                value={interpolationConfig.method}
                onChange={(e) => setInterpolationConfig({ method: e.target.value as 'linear' | 'shape-based' | 'morphological' })}
                className="w-full px-3 py-2 bg-[#21262D] border border-[#30363D] rounded-md text-white text-sm"
              >
                <option value="linear">Linear</option>
                <option value="shape-based">Shape-Based</option>
                <option value="morphological">Morphological</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Max Gap (slices): {interpolationConfig.maxGapSlices}
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={interpolationConfig.maxGapSlices}
                onChange={(e) => setInterpolationConfig({ maxGapSlices: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm text-[#8B949E] mb-2">
                Smoothing: {interpolationConfig.smoothingFactor.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={interpolationConfig.smoothingFactor * 100}
                onChange={(e) => setInterpolationConfig({ smoothingFactor: parseInt(e.target.value) / 100 })}
                className="w-full h-2 bg-[#30363D] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8B949E]">Auto-Apply</span>
              <button
                onClick={() => setInterpolationConfig({ autoApply: !interpolationConfig.autoApply })}
                className={cn(
                  'w-10 h-5 rounded-full transition-colors',
                  interpolationConfig.autoApply ? 'bg-primary' : 'bg-[#30363D]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform',
                    interpolationConfig.autoApply ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Status */}
      {(isProcessing || error || lastResult) && (
        <div className="px-4 py-2 border-t border-[#30363D]">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-[#8B949E]">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}
          {lastResult && !isProcessing && !error && (
            <div className="text-sm text-green-400">
              {'pixelCount' in lastResult && lastResult.pixelCount !== undefined && 
                `Selected ${lastResult.pixelCount.toLocaleString()} pixels`}
              {'stats' in lastResult && lastResult.stats && 'area' in lastResult.stats && 
                `Region: ${(lastResult.stats as { area: number }).area.toLocaleString()} pixels`}
              {'interpolatedCount' in lastResult && lastResult.interpolatedCount !== undefined && 
                `Interpolated ${lastResult.interpolatedCount} slices`}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-[#30363D]">
        {activeTool === 'interpolation' && (
          <button
            onClick={onApply}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Apply Interpolation
          </button>
        )}
        <button
          onClick={() => useSmartToolStore.getState().reset()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#21262D] hover:bg-[#30363D] text-white rounded-md text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {/* Usage Hint */}
      <div className="px-4 py-3 bg-[#161B22] rounded-b-lg text-xs text-[#6E7681]">
        {activeTool === 'magic-wand' && (
          <span>💡 Click on the image to select similar regions. Adjust tolerance for selection sensitivity.</span>
        )}
        {activeTool === 'region-growing' && (
          <span>💡 Click a seed point to grow the region. Edges will stop the growth.</span>
        )}
        {activeTool === 'interpolation' && (
          <span>💡 Annotate at least 2 slices (key frames), then click Apply to fill in between.</span>
        )}
      </div>
    </div>
  );
}
