'use client';

/**
 * AISegmentationPanel Component
 * Settings and controls panel for AI-powered segmentation (SAM/MedSAM)
 * 
 * Features:
 * - Model selection (MedSAM, SAM, nnU-Net)
 * - Point mode toggle (foreground/background)
 * - Prompts list with ability to remove
 * - Execute/Clear/Undo controls
 * - Job status display
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Brain,
  Circle,
  Square,
  Plus,
  Minus,
  Play,
  RotateCcw,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  MousePointer,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAISegmentationStore, checkAIServiceHealth } from '@/lib/aiSegmentation';
import type { AISegmentationModel, Prompt } from '@/lib/aiSegmentation';

interface AISegmentationPanelProps {
  onClose: () => void;
  onExecute: () => void;
  className?: string;
}

const MODEL_OPTIONS: { value: AISegmentationModel; label: string; description: string }[] = [
  { value: 'medsam2', label: 'MedSAM 2', description: 'Medical-specific, best for organs' },
  { value: 'sam', label: 'SAM', description: 'General purpose, fast' },
  { value: 'nnunet', label: 'nnU-Net', description: 'Auto segmentation' },
];

function PromptItem({
  prompt,
  index,
  onRemove,
}: {
  prompt: Prompt;
  index: number;
  onRemove: () => void;
}) {
  if (prompt.type === 'point') {
    const isPositive = prompt.label === 1;
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#21262D] rounded text-xs">
        <Circle
          className={cn(
            'h-3 w-3',
            isPositive ? 'text-green-400 fill-green-400' : 'text-red-400 fill-red-400'
          )}
        />
        <span className="text-[#8B949E]">
          Point ({Math.round(prompt.x)}, {Math.round(prompt.y)})
        </span>
        <span className={cn('text-xs', isPositive ? 'text-green-400' : 'text-red-400')}>
          {isPositive ? '+' : '-'}
        </span>
        <button
          onClick={onRemove}
          className="ml-auto p-0.5 hover:bg-red-500/20 rounded"
        >
          <X className="h-3 w-3 text-[#6E7681]" />
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#21262D] rounded text-xs">
        <Square className="h-3 w-3 text-blue-400" />
        <span className="text-[#8B949E]">
          Box ({Math.round(prompt.x1)}, {Math.round(prompt.y1)}) → (
          {Math.round(prompt.x2)}, {Math.round(prompt.y2)})
        </span>
        <button
          onClick={onRemove}
          className="ml-auto p-0.5 hover:bg-red-500/20 rounded"
        >
          <X className="h-3 w-3 text-[#6E7681]" />
        </button>
      </div>
    );
  }
}

export default function AISegmentationPanel({
  onClose,
  onExecute,
  className,
}: AISegmentationPanelProps) {
  const {
    selectedModel,
    prompts,
    drawingState,
    isProcessing,
    jobStatus,
    error,
    setModel,
    removePrompt,
    clearPrompts,
    undoLastPrompt,
    setPointMode,
    reset,
  } = useAISegmentationStore();

  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);

  // Check AI service health on mount and periodically
  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      const online = await checkAIServiceHealth();
      if (mounted) {
        setServiceOnline(online);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const hasPrompts = prompts.length > 0;
  const isAutoModel = selectedModel === 'nnunet';

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
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="font-medium">AI Segmentation</span>
          {/* Service Status Indicator */}
          {serviceOnline !== null && (
            <div
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                serviceOnline
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-red-600/20 text-red-400'
              )}
              title={serviceOnline ? 'AI Service Online' : 'AI Service Offline'}
            >
              <Zap className="h-3 w-3" />
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4 text-[#8B949E]" />
        </button>
      </div>

      {/* Service Offline Warning */}
      {serviceOnline === false && (
        <div className="mx-4 mt-3 p-3 bg-yellow-600/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertCircle className="h-3.5 w-3.5" />
            AI Service Offline
          </div>
          <p className="text-yellow-400/80">
            The AI backend is not running. Start it with:
            <code className="block mt-1 px-2 py-1 bg-black/30 rounded text-[10px] font-mono">
              cd peakano && docker-compose up -d
            </code>
          </p>
        </div>
      )}

      {/* Model Selection */}
      <div className="px-4 py-3 border-b border-[#30363D]">
        <label className="block text-sm text-[#8B949E] mb-2">Model</label>
        <div className="space-y-2">
          {MODEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setModel(option.value)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded transition-colors',
                selectedModel === option.value
                  ? 'bg-purple-600/20 border border-purple-500/50'
                  : 'bg-[#21262D] hover:bg-[#30363D] border border-transparent'
              )}
            >
              <Sparkles
                className={cn(
                  'h-4 w-4',
                  selectedModel === option.value ? 'text-purple-400' : 'text-[#6E7681]'
                )}
              />
              <div className="text-left">
                <div className="text-sm text-white">{option.label}</div>
                <div className="text-xs text-[#6E7681]">{option.description}</div>
              </div>
              {selectedModel === option.value && (
                <Check className="h-4 w-4 text-purple-400 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Point Mode (only for interactive models) */}
      {!isAutoModel && (
        <div className="px-4 py-3 border-b border-[#30363D]">
          <label className="block text-sm text-[#8B949E] mb-2">Click Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPointMode('foreground')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                drawingState.pointMode === 'foreground'
                  ? 'bg-green-600/20 border border-green-500/50 text-green-400'
                  : 'bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] border border-transparent'
              )}
            >
              <Plus className="h-4 w-4" />
              Include
            </button>
            <button
              onClick={() => setPointMode('background')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                drawingState.pointMode === 'background'
                  ? 'bg-red-600/20 border border-red-500/50 text-red-400'
                  : 'bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] border border-transparent'
              )}
            >
              <Minus className="h-4 w-4" />
              Exclude
            </button>
          </div>
          <div className="mt-2 text-xs text-[#6E7681]">
            <MousePointer className="inline h-3 w-3 mr-1" />
            Left-click: Add point | Right-drag: Draw box
          </div>
        </div>
      )}

      {/* Prompts List (only for interactive models) */}
      {!isAutoModel && (
        <div className="px-4 py-3 border-b border-[#30363D]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#8B949E]">Prompts ({prompts.length})</label>
            {hasPrompts && (
              <button
                onClick={clearPrompts}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>
          {hasPrompts ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {prompts.map((prompt, index) => (
                <PromptItem
                  key={index}
                  prompt={prompt}
                  index={index}
                  onRemove={() => removePrompt(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#6E7681]">
              Click on the image to add prompts
            </div>
          )}
        </div>
      )}

      {/* Status */}
      {(isProcessing || error || jobStatus) && (
        <div className="px-4 py-3 border-b border-[#30363D]">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {jobStatus === 'pending'
                  ? 'Queued...'
                  : jobStatus === 'running'
                  ? 'Processing...'
                  : 'Starting...'}
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <button
          onClick={onExecute}
          disabled={isProcessing || (!isAutoModel && !hasPrompts)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-medium transition-colors',
            isProcessing || (!isAutoModel && !hasPrompts)
              ? 'bg-[#30363D] text-[#6E7681] cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white'
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {isAutoModel ? 'Run Auto Segmentation' : 'Apply Segmentation'}
            </>
          )}
        </button>

        <div className="flex gap-2">
          <button
            onClick={undoLastPrompt}
            disabled={!hasPrompts || isProcessing}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm transition-colors',
              !hasPrompts || isProcessing
                ? 'bg-[#21262D] text-[#6E7681] cursor-not-allowed'
                : 'bg-[#21262D] hover:bg-[#30363D] text-white'
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            onClick={() => reset()}
            disabled={isProcessing}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm transition-colors',
              isProcessing
                ? 'bg-[#21262D] text-[#6E7681] cursor-not-allowed'
                : 'bg-[#21262D] hover:bg-[#30363D] text-white'
            )}
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
