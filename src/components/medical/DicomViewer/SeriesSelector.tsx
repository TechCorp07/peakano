'use client';

/**
 * SeriesSelector Component
 * Displays and allows selection of series within a study
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Image, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Series } from '@/types/dicom';

interface SeriesSelectorProps {
  series: Series[];
  selectedSeriesUID: string | null;
  onSelectSeries: (seriesUID: string) => void;
  className?: string;
}

export default function SeriesSelector({
  series,
  selectedSeriesUID,
  onSelectSeries,
  className,
}: SeriesSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn('bg-slate-800 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-white">Series</span>
          <span className="text-xs text-slate-400">({series.length})</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Series List */}
      {isExpanded && (
        <div className="border-t border-slate-700">
          {series.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">
              No series available
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {series.map((s) => {
                const isSelected = s.seriesInstanceUID === selectedSeriesUID;

                return (
                  <button
                    key={s.seriesInstanceUID}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 text-left transition-colors',
                      isSelected
                        ? 'bg-green-500/10 border-l-2 border-green-500'
                        : 'hover:bg-slate-700 border-l-2 border-transparent'
                    )}
                    onClick={() => onSelectSeries(s.seriesInstanceUID)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded flex items-center justify-center">
                      <Image className="h-6 w-6 text-slate-600" />
                    </div>

                    {/* Series info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-medium px-1.5 py-0.5 rounded',
                            'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {s.modality}
                        </span>
                        {s.seriesNumber && (
                          <span className="text-xs text-slate-400">
                            #{s.seriesNumber}
                          </span>
                        )}
                      </div>

                      <p
                        className={cn(
                          'text-sm mt-1 truncate',
                          isSelected ? 'text-white' : 'text-slate-300'
                        )}
                      >
                        {s.seriesDescription || 'Unnamed Series'}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.numberOfInstances} images
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
