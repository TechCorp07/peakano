'use client';

/**
 * MeasurementsPanel Component
 * Displays and manages all measurements with export functionality
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Ruler,
  Circle,
  Triangle,
  Box,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  FileJson,
  Table,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type MeasurementResult,
  type MeasurementExportEntry,
  formatArea,
  formatVolume,
  formatMeasurement,
  createMeasurementDownload,
  type ExportFormat,
} from '@/lib/annotation';

/**
 * A measurement entry from Cornerstone or custom tools
 */
interface MeasurementEntry {
  id: string;
  type: 'length' | 'angle' | 'area' | 'ellipse' | 'rectangle' | 'volume' | 'bidirectional';
  label?: string;
  sliceIndex?: number;
  visible: boolean;
  values: {
    value?: number;
    unit?: string;
    area?: number;
    perimeter?: number;
    width?: number;
    height?: number;
    angle?: number;
  };
  timestamp: number;
}

interface MeasurementsPanelProps {
  /** All measurements */
  measurements: MeasurementEntry[];
  /** Current slice index */
  currentSlice?: number;
  /** Callback to toggle measurement visibility */
  onToggleVisibility?: (id: string) => void;
  /** Callback to delete measurement */
  onDelete?: (id: string) => void;
  /** Callback to delete all measurements */
  onDeleteAll?: () => void;
  /** Callback to jump to measurement */
  onGoToMeasurement?: (id: string, sliceIndex?: number) => void;
  /** Pixel spacing for unit conversion */
  pixelSpacing?: { x: number; y: number };
  className?: string;
}

const typeIcons: Record<MeasurementEntry['type'], React.ReactNode> = {
  length: <Ruler className="h-3.5 w-3.5" />,
  angle: <Triangle className="h-3.5 w-3.5" />,
  area: <Box className="h-3.5 w-3.5" />,
  ellipse: <Circle className="h-3.5 w-3.5" />,
  rectangle: <Box className="h-3.5 w-3.5" />,
  volume: <Box className="h-3.5 w-3.5" />,
  bidirectional: <Ruler className="h-3.5 w-3.5" />,
};

const typeLabels: Record<MeasurementEntry['type'], string> = {
  length: 'Length',
  angle: 'Angle',
  area: 'Area',
  ellipse: 'Ellipse',
  rectangle: 'Rectangle',
  volume: 'Volume',
  bidirectional: 'Bidirectional',
};

export default function MeasurementsPanel({
  measurements,
  currentSlice,
  onToggleVisibility,
  onDelete,
  onDeleteAll,
  onGoToMeasurement,
  pixelSpacing,
  className,
}: MeasurementsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'current' | 'type'>('all');
  const [typeFilter, setTypeFilter] = useState<MeasurementEntry['type'] | 'all'>('all');
  
  // Filter measurements
  const filteredMeasurements = useMemo(() => {
    let filtered = measurements;
    
    if (filter === 'current' && currentSlice !== undefined) {
      filtered = filtered.filter((m) => m.sliceIndex === currentSlice);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [measurements, filter, currentSlice, typeFilter]);
  
  // Summary statistics
  const summary = useMemo(() => {
    const byType: Record<string, number> = {};
    measurements.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });
    return byType;
  }, [measurements]);
  
  // Format measurement value for display
  const formatValue = useCallback((m: MeasurementEntry): string => {
    const { values, type } = m;
    
    switch (type) {
      case 'length':
        return formatMeasurement(values.value || 0, values.unit || 'mm');
      case 'angle':
        return formatMeasurement(values.angle || values.value || 0, '°');
      case 'area':
      case 'ellipse':
      case 'rectangle':
        return formatArea(values.area || 0);
      case 'volume':
        return formatVolume(values.value || 0);
      case 'bidirectional':
        return `${formatMeasurement(values.width || 0, 'mm')} × ${formatMeasurement(values.height || 0, 'mm')}`;
      default:
        return formatMeasurement(values.value || 0, values.unit || '');
    }
  }, []);
  
  // Handle export
  const handleExport = useCallback((format: ExportFormat) => {
    const exportData: MeasurementExportEntry[] = measurements.map((m) => ({
      id: m.id,
      type: m.type === 'length' ? 'distance' : m.type === 'angle' ? 'angle' : 'region',
      sliceIndex: m.sliceIndex,
      label: m.label,
      values: m.values as Record<string, number | string>,
      timestamp: m.timestamp,
    }));
    
    const { url, filename } = createMeasurementDownload(
      exportData,
      format,
      `measurements-${new Date().toISOString().split('T')[0]}`
    );
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [measurements]);
  
  // Copy to clipboard
  const handleCopy = useCallback(() => {
    const text = filteredMeasurements
      .map((m) => `${typeLabels[m.type]}: ${formatValue(m)}${m.sliceIndex !== undefined ? ` (Slice ${m.sliceIndex + 1})` : ''}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
  }, [filteredMeasurements, formatValue]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Measurements
            <Badge variant="secondary" className="ml-2 text-xs">
              {measurements.length}
            </Badge>
          </CardTitle>
          
          {/* Export menu */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleExport('json')}
              title="Export as JSON"
            >
              <FileJson className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleExport('csv')}
              title="Export as CSV"
            >
              <Table className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as typeof filter)}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
            <TabsTrigger value="current" className="flex-1 text-xs">This Slice</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Type filter badges */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Badge>
          {Object.entries(summary).map(([type, count]) => (
            <Badge
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              className="cursor-pointer text-xs flex items-center gap-1"
              onClick={() => setTypeFilter(type as MeasurementEntry['type'])}
            >
              {typeIcons[type as MeasurementEntry['type']]}
              {count}
            </Badge>
          ))}
        </div>
        
        {/* Measurements list */}
        <ScrollArea className="h-48">
          <div className="space-y-1 pr-2">
            {filteredMeasurements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No measurements yet
              </p>
            ) : (
              filteredMeasurements.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded hover:bg-slate-800/50 group cursor-pointer',
                    m.sliceIndex === currentSlice && 'bg-green-500/10 border-l-2 border-green-500'
                  )}
                  onClick={() => onGoToMeasurement?.(m.id, m.sliceIndex)}
                >
                  {/* Type icon */}
                  <div className="text-slate-400">
                    {typeIcons[m.type]}
                  </div>
                  
                  {/* Value */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {m.label || typeLabels[m.type]}
                    </p>
                    <p className="text-xs text-green-400 font-mono">
                      {formatValue(m)}
                    </p>
                  </div>
                  
                  {/* Slice badge */}
                  {m.sliceIndex !== undefined && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      S{m.sliceIndex + 1}
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility?.(m.id);
                      }}
                    >
                      {m.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-slate-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(m.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Footer actions */}
        {measurements.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-slate-700/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-red-400 hover:text-red-300"
              onClick={onDeleteAll}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
