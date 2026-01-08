'use client';

/**
 * AnnotationList Component
 * Displays list of annotations for the current series/image
 */

import { useCallback } from 'react';
import {
  Ruler,
  Square,
  Circle,
  Triangle,
  Crosshair,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnnotationStore } from '@/features/annotations';
import type { Annotation, AnnotationToolType } from '@/types/annotation';

/**
 * Icon mapping for annotation types
 */
const ANNOTATION_ICONS: Record<AnnotationToolType, React.ReactNode> = {
  length: <Ruler className="h-4 w-4" />,
  rectangle: <Square className="h-4 w-4" />,
  ellipse: <Circle className="h-4 w-4" />,
  circleROI: <Circle className="h-4 w-4" />,
  polygon: <Triangle className="h-4 w-4" />,
  freehand: <MoreHorizontal className="h-4 w-4" />,
  angle: <Triangle className="h-4 w-4" />,
  probe: <Crosshair className="h-4 w-4" />,
  bidirectional: <Ruler className="h-4 w-4" />,
  arrowAnnotate: <ChevronRight className="h-4 w-4" />,
};

/**
 * Format annotation type for display
 */
function formatAnnotationType(type: AnnotationToolType): string {
  const labels: Record<AnnotationToolType, string> = {
    length: 'Length',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    circleROI: 'Circle ROI',
    polygon: 'Polygon',
    freehand: 'Freehand',
    angle: 'Angle',
    probe: 'Probe',
    bidirectional: 'Bidirectional',
    arrowAnnotate: 'Arrow',
  };
  return labels[type] || type;
}

/**
 * Format measurement value
 */
function formatMeasurement(annotation: Annotation): string {
  const stats = annotation.data.cachedStats;
  if (!stats) return '';

  if (stats.length !== undefined) {
    return `${stats.length.toFixed(2)} ${stats.unit || 'mm'}`;
  }
  if (stats.area !== undefined) {
    return `${stats.area.toFixed(2)} ${stats.unit || 'mm²'}`;
  }
  if (stats.angle !== undefined) {
    return `${stats.angle.toFixed(1)}°`;
  }
  if (stats.mean !== undefined) {
    return `Mean: ${stats.mean.toFixed(1)} HU`;
  }
  return '';
}

interface AnnotationItemProps {
  annotation: Annotation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

function AnnotationItem({
  annotation,
  isActive,
  onSelect,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}: AnnotationItemProps) {
  const isVisible = annotation.data.isVisible !== false;
  const isLocked = annotation.data.isLocked === true;
  const measurement = formatMeasurement(annotation);
  const label = useAnnotationStore((state) =>
    state.labels.find((l) => l.id === annotation.labelId)
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
        'hover:bg-[#21262D]',
        isActive && 'bg-[#21262D] ring-1 ring-primary'
      )}
      onClick={() => onSelect(annotation.id)}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded',
          label ? 'text-white' : 'text-[#8B949E]'
        )}
        style={label ? { backgroundColor: label.color } : undefined}
      >
        {ANNOTATION_ICONS[annotation.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white truncate">
            {label?.name || formatAnnotationType(annotation.type)}
          </span>
          {isLocked && <Lock className="h-3 w-3 text-[#8B949E]" />}
        </div>
        {measurement && (
          <p className="text-xs text-[#8B949E] truncate">{measurement}</p>
        )}
        <p className="text-xs text-[#6E7681]">Slice {annotation.imageIndex + 1}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(annotation.id);
          }}
          className="p-1 hover:bg-[#30363D] rounded"
          title={isVisible ? 'Hide' : 'Show'}
        >
          {isVisible ? (
            <Eye className="h-4 w-4 text-[#8B949E]" />
          ) : (
            <EyeOff className="h-4 w-4 text-[#6E7681]" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(annotation.id);
          }}
          className="p-1 hover:bg-[#30363D] rounded"
          title={isLocked ? 'Unlock' : 'Lock'}
        >
          {isLocked ? (
            <Lock className="h-4 w-4 text-[#8B949E]" />
          ) : (
            <Unlock className="h-4 w-4 text-[#6E7681]" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(annotation.id);
          }}
          className="p-1 hover:bg-red-500/20 rounded"
          title="Delete"
          disabled={isLocked}
        >
          <Trash2 className={cn('h-4 w-4', isLocked ? 'text-[#6E7681]' : 'text-red-400')} />
        </button>
      </div>
    </div>
  );
}

interface AnnotationListProps {
  /** Filter to show annotations for specific image */
  sopInstanceUID?: string;
  /** Filter to show annotations for specific series */
  seriesInstanceUID?: string;
  /** Show all annotations regardless of filter */
  showAll?: boolean;
  /** Group annotations by image */
  groupByImage?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when annotation is deleted externally (from Cornerstone) */
  onDeleteAnnotation?: (id: string) => void;
}

export default function AnnotationList({
  sopInstanceUID,
  seriesInstanceUID,
  showAll = false,
  groupByImage = true,
  className,
  onDeleteAnnotation,
}: AnnotationListProps) {
  const {
    annotations,
    activeAnnotationId,
    setActiveAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useAnnotationStore();

  // Filter annotations
  const filteredAnnotations = showAll
    ? annotations
    : annotations.filter((a) => {
        if (sopInstanceUID) return a.sopInstanceUID === sopInstanceUID;
        if (seriesInstanceUID) return a.seriesInstanceUID === seriesInstanceUID;
        return true;
      });

  // Group by image if enabled
  const groupedAnnotations = groupByImage
    ? filteredAnnotations.reduce((acc, ann) => {
        const key = ann.sopInstanceUID;
        if (!acc[key]) {
          acc[key] = {
            sopInstanceUID: ann.sopInstanceUID,
            imageIndex: ann.imageIndex,
            annotations: [],
          };
        }
        acc[key].annotations.push(ann);
        return acc;
      }, {} as Record<string, { sopInstanceUID: string; imageIndex: number; annotations: Annotation[] }>)
    : null;

  // Handlers
  const handleSelect = useCallback(
    (id: string) => {
      setActiveAnnotation(id === activeAnnotationId ? null : id);
    },
    [activeAnnotationId, setActiveAnnotation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (onDeleteAnnotation) {
        onDeleteAnnotation(id);
      } else {
        deleteAnnotation(id);
      }
    },
    [deleteAnnotation, onDeleteAnnotation]
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      const annotation = annotations.find((a) => a.id === id);
      if (annotation) {
        updateAnnotation(id, {
          data: {
            ...annotation.data,
            isVisible: annotation.data.isVisible === false ? true : false,
          },
        });
      }
    },
    [annotations, updateAnnotation]
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const annotation = annotations.find((a) => a.id === id);
      if (annotation) {
        updateAnnotation(id, {
          data: {
            ...annotation.data,
            isLocked: !annotation.data.isLocked,
          },
        });
      }
    },
    [annotations, updateAnnotation]
  );

  if (filteredAnnotations.length === 0) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <p className="text-sm text-[#8B949E]">No annotations yet</p>
        <p className="text-xs text-[#6E7681] mt-1">
          Use measurement tools to create annotations
        </p>
      </div>
    );
  }

  // Render grouped by image
  if (groupByImage && groupedAnnotations) {
    const groups = Object.values(groupedAnnotations).sort(
      (a, b) => a.imageIndex - b.imageIndex
    );

    return (
      <div className={cn('space-y-2', className)}>
        {groups.map((group) => (
          <div key={group.sopInstanceUID} className="border-b border-[#30363D] pb-2">
            <div className="flex items-center gap-2 px-3 py-1 text-xs text-[#8B949E]">
              <ChevronDown className="h-3 w-3" />
              <span>Slice {group.imageIndex + 1}</span>
              <span className="text-[#6E7681]">({group.annotations.length})</span>
            </div>
            <div className="space-y-1">
              {group.annotations.map((annotation) => (
                <AnnotationItem
                  key={annotation.id}
                  annotation={annotation}
                  isActive={annotation.id === activeAnnotationId}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render flat list
  return (
    <div className={cn('space-y-1', className)}>
      {filteredAnnotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          isActive={annotation.id === activeAnnotationId}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
        />
      ))}
    </div>
  );
}
