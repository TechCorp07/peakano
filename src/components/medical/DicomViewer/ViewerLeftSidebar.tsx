'use client';

/**
 * ViewerLeftSidebar Component (RedBrick AI-Inspired)
 * Left sidebar with case info and structures list
 */

import { useState } from 'react';
import {
  FileText,
  Check,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Scan,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Study, Series } from '@/types/dicom';

interface Structure {
  id: string;
  label: string;
  color: string;
  isCompleted: boolean;
}

interface ViewerLeftSidebarProps {
  study: Study | null;
  series: Series[];
  selectedSeriesUID: string | null;
  onSelectSeries: (seriesUID: string) => void;
  structures?: Structure[];
  selectedStructure?: string | null;
  onSelectStructure?: (structureId: string) => void;
  className?: string;
}

export default function ViewerLeftSidebar({
  study,
  series,
  selectedSeriesUID,
  onSelectSeries,
  structures = [],
  selectedStructure,
  onSelectStructure,
  className,
}: ViewerLeftSidebarProps) {
  const [isSeriesExpanded, setIsSeriesExpanded] = useState(true);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(true);

  const completedStructures = structures.filter((s) => s.isCompleted);
  const pendingStructures = structures.filter((s) => !s.isCompleted);

  // Format date from DICOM format (YYYYMMDD) to readable format
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      if (dateStr.length === 8) {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        return `${month}/${day}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <aside
      className={cn(
        'w-60 bg-[#161B22] border-r border-[#30363D] flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Case Information */}
      <div className="p-4 border-b border-[#30363D]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-white text-sm">
            {study?.modality || 'DICOM'} Study
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#8B949E]">
            <User className="h-3.5 w-3.5" />
            <span className="text-[#E6EDF3]">{study?.patientName || 'Unknown Patient'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#8B949E]">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[#E6EDF3]">{formatDate(study?.studyDate || null)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#8B949E]">
            <Scan className="h-3.5 w-3.5" />
            <span className="text-[#E6EDF3]">{study?.modality || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-[#8B949E]">
            <Hash className="h-3.5 w-3.5" />
            <span className="text-[#E6EDF3] truncate" title={study?.studyInstanceUID}>
              {study?.studyInstanceUID?.slice(-12) || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div className="border-b border-[#30363D]">
        <button
          onClick={() => setIsSeriesExpanded(!isSeriesExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#6E7681] uppercase tracking-wider hover:text-[#8B949E]"
        >
          <span>Series ({series.length})</span>
          {isSeriesExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isSeriesExpanded && (
          <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
            {series.map((s) => (
              <button
                key={s.seriesInstanceUID}
                onClick={() => onSelectSeries(s.seriesInstanceUID)}
                className={cn(
                  'w-full px-3 py-2 rounded-md text-left transition-colors',
                  selectedSeriesUID === s.seriesInstanceUID
                    ? 'bg-primary/15 text-primary border-l-2 border-primary'
                    : 'text-[#8B949E] hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[#30363D]">
                    {s.modality}
                  </span>
                  <span className="text-xs truncate flex-1">
                    {s.seriesDescription || `Series ${s.seriesNumber || '—'}`}
                  </span>
                </div>
                <div className="text-[10px] text-[#6E7681] mt-1">
                  {s.numberOfInstances || 0} images
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Structures (for annotation mode) */}
      {structures.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <button
            onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#6E7681] uppercase tracking-wider hover:text-[#8B949E]"
          >
            <span>Structures</span>
            {isStructuresExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isStructuresExpanded && (
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {/* Completed Structures */}
              {completedStructures.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-xs text-success mb-2 px-2">
                    <Check className="h-3.5 w-3.5" />
                    <span>Labeled ({completedStructures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {completedStructures.map((structure) => (
                      <button
                        key={structure.id}
                        onClick={() => onSelectStructure?.(structure.id)}
                        className={cn(
                          'structure-item',
                          selectedStructure === structure.id && 'active'
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: structure.color }}
                        />
                        <span className="truncate flex-1">{structure.label}</span>
                        <Check className="h-3 w-3 text-success" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Structures */}
              {pendingStructures.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8B949E] mb-2 px-2">
                    <Circle className="h-3.5 w-3.5" />
                    <span>To Label ({pendingStructures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {pendingStructures.map((structure) => (
                      <button
                        key={structure.id}
                        onClick={() => onSelectStructure?.(structure.id)}
                        className={cn(
                          'structure-item',
                          selectedStructure === structure.id && 'active'
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                          style={{ borderColor: structure.color }}
                        />
                        <span className="truncate flex-1">{structure.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Info */}
      {study && (
        <div className="p-3 border-t border-[#30363D] bg-[#0D1117]">
          <div className="text-[10px] text-[#6E7681] space-y-1">
            <div className="flex justify-between">
              <span>Series</span>
              <span className="text-[#8B949E]">{study.numberOfSeries || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Images</span>
              <span className="text-[#8B949E]">{study.numberOfInstances || 0}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
