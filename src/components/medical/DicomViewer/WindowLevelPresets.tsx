'use client';

/**
 * WindowLevelPresets Component
 * Quick presets for common window/level settings
 */

import { Button } from '@/components/ui/button';
import { WINDOW_LEVEL_PRESETS } from '@/lib/cornerstone/types';
import { cn } from '@/lib/utils';
import type { Modality } from '@/types/dicom';

interface WindowLevelPresetsProps {
  modality: Modality;
  onPresetSelect: (windowWidth: number, windowCenter: number) => void;
  className?: string;
}

export default function WindowLevelPresets({
  modality,
  onPresetSelect,
  className,
}: WindowLevelPresetsProps) {
  // Get presets for the current modality
  const presets = WINDOW_LEVEL_PRESETS[modality] || WINDOW_LEVEL_PRESETS['CT'] || [];

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-slate-800 rounded-lg p-3', className)}>
      <h4 className="text-xs font-medium text-slate-400 mb-2">W/L Presets</h4>
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.name}
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-7 text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => onPresetSelect(preset.windowWidth, preset.windowCenter)}
          >
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
