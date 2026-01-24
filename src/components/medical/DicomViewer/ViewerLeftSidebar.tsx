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
  Clock,
  Activity,
  Layers,
  Image as ImageIcon,
  Tag,
  Clipboard,
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

  // Format time from DICOM format (HHMMSS or HHMMSS.ffffff) to readable format
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const hours = timeStr.slice(0, 2);
      const minutes = timeStr.slice(2, 4);
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      const hour12 = parseInt(hours) % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Get modality display info
  const getModalityInfo = (modality: string) => {
    const modalityMap: Record<string, { name: string; color: string }> = {
      'MR': { name: 'MRI', color: 'bg-blue-500' },
      'CT': { name: 'CT Scan', color: 'bg-green-500' },
      'XR': { name: 'X-Ray', color: 'bg-yellow-500' },
      'US': { name: 'Ultrasound', color: 'bg-purple-500' },
      'NM': { name: 'Nuclear', color: 'bg-red-500' },
      'PT': { name: 'PET', color: 'bg-orange-500' },
      'CR': { name: 'Radiography', color: 'bg-teal-500' },
      'DX': { name: 'Digital X-Ray', color: 'bg-cyan-500' },
      'MG': { name: 'Mammography', color: 'bg-pink-500' },
    };
    return modalityMap[modality] || { name: modality, color: 'bg-gray-500' };
  };

  const modalityInfo = getModalityInfo(study?.modality || 'OT');

  return (
    <aside
      className={cn(
        'w-60 bg-[#161B22] border-r border-[#30363D] flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Case Information - Header */}
      <div className="p-4 border-b border-[#30363D]">
        {/* Modality Badge & Study Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('px-2 py-1 rounded text-xs font-bold text-white', modalityInfo.color)}>
            {study?.modality || 'DICOM'}
          </span>
          <span className="font-medium text-white text-sm">
            {modalityInfo.name} Study
          </span>
        </div>

        {/* Study Description */}
        {study?.studyDescription && (
          <p className="text-xs text-[#8B949E] mb-3 line-clamp-2" title={study.studyDescription}>
            {study.studyDescription}
          </p>
        )}

        {/* Patient Info Card */}
        <div className="bg-[#0D1117] rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-white">{study?.patientName || 'Unknown Patient'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {study?.patientId && (
              <div className="flex items-center gap-1.5 text-[#6E7681]">
                <Tag className="h-3 w-3" />
                <span className="text-[#8B949E]">ID: {study.patientId}</span>
              </div>
            )}
            {study?.patientSex && (
              <div className="flex items-center gap-1.5 text-[#6E7681]">
                <Activity className="h-3 w-3" />
                <span className="text-[#8B949E]">{study.patientSex === 'M' ? 'Male' : study.patientSex === 'F' ? 'Female' : study.patientSex}</span>
              </div>
            )}
          </div>
        </div>

        {/* Study Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#8B949E]">
            <Calendar className="h-3.5 w-3.5 text-[#6E7681]" />
            <span className="text-[#E6EDF3]">{formatDate(study?.studyDate || null)}</span>
            {formatTime(study?.studyTime || null) && (
              <>
                <span className="text-[#30363D]">•</span>
                <Clock className="h-3.5 w-3.5 text-[#6E7681]" />
                <span className="text-[#8B949E]">{formatTime(study?.studyTime || null)}</span>
              </>
            )}
          </div>
          {study?.accessionNumber && (
            <div className="flex items-center gap-2 text-[#8B949E]">
              <Clipboard className="h-3.5 w-3.5 text-[#6E7681]" />
              <span className="text-[#E6EDF3]">Acc# {study.accessionNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#8B949E]">
            <Hash className="h-3.5 w-3.5 text-[#6E7681]" />
            <span className="text-[#E6EDF3] truncate font-mono text-[10px]" title={study?.studyInstanceUID}>
              {study?.studyInstanceUID?.slice(-16) || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Series List */}
      <div className="border-b border-[#30363D]">
        <button
          onClick={() => setIsSeriesExpanded(!isSeriesExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#6E7681] uppercase tracking-wider hover:text-[#8B949E] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Series ({series.length})</span>
          </div>
          {isSeriesExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isSeriesExpanded && (
          <div className="px-2 pt-1 pb-3 space-y-2 max-h-64 overflow-y-auto">
            {series.map((s, index) => {
              const seriesModalityInfo = getModalityInfo(s.modality);
              const isSelected = selectedSeriesUID === s.seriesInstanceUID;
              
              return (
                <button
                  key={s.seriesInstanceUID}
                  onClick={() => onSelectSeries(s.seriesInstanceUID)}
                  className={cn(
                    'w-full rounded-lg text-left transition-all duration-200 overflow-hidden',
                    isSelected
                      ? 'bg-primary/15 ring-1 ring-primary shadow-lg shadow-primary/10'
                      : 'bg-[#0D1117] hover:bg-[#21262D] hover:ring-1 hover:ring-[#30363D]'
                  )}
                >
                  {/* Series Header with Thumbnail Placeholder */}
                  <div className="flex items-start gap-3 p-3">
                    {/* Thumbnail Placeholder */}
                    <div className={cn(
                      'w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-primary/20' : 'bg-[#21262D]'
                    )}>
                      <ImageIcon className={cn(
                        'h-6 w-6',
                        isSelected ? 'text-primary' : 'text-[#6E7681]'
                      )} />
                    </div>
                    
                    {/* Series Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0',
                          seriesModalityInfo.color
                        )}>
                          {s.modality}
                        </span>
                        {s.seriesNumber && (
                          <span className="text-[10px] text-[#6E7681] flex-shrink-0">#{s.seriesNumber}</span>
                        )}
                      </div>
                      <p className={cn(
                        'text-xs font-medium leading-tight',
                        isSelected ? 'text-primary' : 'text-[#E6EDF3]'
                      )} title={s.seriesDescription || `Series ${s.seriesNumber || index + 1}`}>
                        {s.seriesDescription || `Series ${s.seriesNumber || index + 1}`}
                      </p>
                      {s.bodyPart && (
                        <p className="text-[10px] text-[#6E7681] mt-0.5">{s.bodyPart}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Series Stats Footer */}
                  <div className={cn(
                    'px-3 py-2 flex items-center justify-between text-[10px] border-t',
                    isSelected ? 'border-primary/30 bg-primary/10' : 'border-[#21262D]'
                  )}>
                    <div className="flex items-center gap-1 text-[#8B949E] flex-shrink-0">
                      <ImageIcon className="h-3 w-3" />
                      <span>{s.numberOfInstances || 0} images</span>
                    </div>
                    {isSelected && (
                      <span className="text-primary font-medium flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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

      {/* Quick Info Summary Footer */}
      {study && (
        <div className="mt-auto border-t border-[#30363D] bg-[#0D1117]">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 divide-x divide-[#30363D]">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#6E7681] mb-1">
                <Layers className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wide">Series</span>
              </div>
              <span className="text-lg font-semibold text-white">{study.numberOfSeries || series.length}</span>
            </div>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#6E7681] mb-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wide">Images</span>
              </div>
              <span className="text-lg font-semibold text-white">{study.numberOfInstances || 0}</span>
            </div>
          </div>
          
          {/* Annotation Progress (if structures exist) */}
          {structures.length > 0 && (
            <div className="px-3 pb-3 pt-2 border-t border-[#30363D]">
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className="text-[#6E7681]">Annotation Progress</span>
                <span className="text-primary font-medium">
                  {Math.round((completedStructures.length / structures.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                  style={{ width: `${(completedStructures.length / structures.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
