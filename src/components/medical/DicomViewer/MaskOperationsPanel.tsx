'use client';

/**
 * MaskOperationsPanel Component
 * UI for boolean mask operations (Union, Subtract, Intersect, XOR)
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Minus,
  Layers,
  Contrast,
  FlipVertical,
  Maximize2,
  Minimize2,
  CircleDot,
  Square,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnnotationToolsStore, type MaskOperationType } from '@/lib/annotation';

interface MaskOperationsPanelProps {
  /** Callback when a mask operation is executed */
  onExecuteOperation?: (operation: MaskOperationType) => void;
  /** Callback for morphological operations */
  onMorphOperation?: (operation: 'dilate' | 'erode' | 'open' | 'close' | 'fill-holes') => void;
  /** Callback to clear all masks */
  onClearAll?: () => void;
  /** Callback to invert mask */
  onInvert?: () => void;
  /** Whether there's an active selection */
  hasSelection?: boolean;
  /** Whether there are annotations to operate on */
  hasAnnotations?: boolean;
  /** Morphological operation radius */
  morphRadius?: number;
  onMorphRadiusChange?: (radius: number) => void;
  className?: string;
}

const operationModeButtons: Array<{
  mode: MaskOperationType;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
}> = [
  {
    mode: 'replace',
    icon: <Square className="h-4 w-4" />,
    label: 'Replace',
    tooltip: 'Replace: New selection replaces existing',
  },
  {
    mode: 'add',
    icon: <Plus className="h-4 w-4" />,
    label: 'Add',
    tooltip: 'Add: Combine with existing selection (Shift+Click)',
  },
  {
    mode: 'subtract',
    icon: <Minus className="h-4 w-4" />,
    label: 'Subtract',
    tooltip: 'Subtract: Remove from existing selection (Alt+Click)',
  },
  {
    mode: 'intersect',
    icon: <Layers className="h-4 w-4" />,
    label: 'Intersect',
    tooltip: 'Intersect: Keep only overlapping areas',
  },
  {
    mode: 'xor',
    icon: <Contrast className="h-4 w-4" />,
    label: 'XOR',
    tooltip: 'XOR: Keep non-overlapping areas only',
  },
];

const morphOperations: Array<{
  operation: 'dilate' | 'erode' | 'open' | 'close' | 'fill-holes';
  icon: React.ReactNode;
  label: string;
  tooltip: string;
}> = [
  {
    operation: 'dilate',
    icon: <Maximize2 className="h-4 w-4" />,
    label: 'Dilate',
    tooltip: 'Dilate: Expand mask edges',
  },
  {
    operation: 'erode',
    icon: <Minimize2 className="h-4 w-4" />,
    label: 'Erode',
    tooltip: 'Erode: Shrink mask edges',
  },
  {
    operation: 'open',
    icon: <CircleDot className="h-4 w-4" />,
    label: 'Open',
    tooltip: 'Open: Remove small protrusions (Erode then Dilate)',
  },
  {
    operation: 'close',
    icon: <CircleDot className="h-4 w-4 rotate-180" />,
    label: 'Close',
    tooltip: 'Close: Fill small holes (Dilate then Erode)',
  },
  {
    operation: 'fill-holes',
    icon: <Square className="h-4 w-4 fill-current" />,
    label: 'Fill',
    tooltip: 'Fill Holes: Fill internal holes in mask',
  },
];

export default function MaskOperationsPanel({
  onExecuteOperation,
  onMorphOperation,
  onClearAll,
  onInvert,
  hasSelection = false,
  hasAnnotations = false,
  morphRadius = 1,
  onMorphRadiusChange,
  className,
}: MaskOperationsPanelProps) {
  const { maskOperationMode, setMaskOperationMode } = useAnnotationToolsStore();
  
  const handleModeChange = useCallback((mode: MaskOperationType) => {
    setMaskOperationMode(mode);
    onExecuteOperation?.(mode);
  }, [setMaskOperationMode, onExecuteOperation]);
  
  const handleMorphOperation = useCallback((operation: 'dilate' | 'erode' | 'open' | 'close' | 'fill-holes') => {
    onMorphOperation?.(operation);
  }, [onMorphOperation]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Mask Operations</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selection Mode */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Selection Mode</label>
          <TooltipProvider>
            <div className="grid grid-cols-5 gap-1">
              {operationModeButtons.map(({ mode, icon, label, tooltip }) => (
                <Tooltip key={mode}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-9 px-2 flex flex-col gap-0.5',
                        maskOperationMode === mode && 'bg-green-500/20 text-green-400 border border-green-500/50'
                      )}
                      onClick={() => handleModeChange(mode)}
                    >
                      {icon}
                      <span className="text-[10px]">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
        
        <Separator />
        
        {/* Morphological Operations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">Morphology</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">R:</span>
              <select
                value={morphRadius}
                onChange={(e) => onMorphRadiusChange?.(parseInt(e.target.value))}
                className="h-6 text-xs bg-slate-800 border border-slate-700 rounded px-1"
              >
                {[1, 2, 3, 5, 7, 10].map((r) => (
                  <option key={r} value={r}>{r}px</option>
                ))}
              </select>
            </div>
          </div>
          
          <TooltipProvider>
            <div className="grid grid-cols-5 gap-1">
              {morphOperations.map(({ operation, icon, label, tooltip }) => (
                <Tooltip key={operation}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 flex flex-col gap-0.5"
                      onClick={() => handleMorphOperation(operation)}
                      disabled={!hasAnnotations}
                    >
                      {icon}
                      <span className="text-[10px]">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
        
        <Separator />
        
        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Quick Actions</label>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onInvert}
                    disabled={!hasAnnotations}
                  >
                    <FlipVertical className="h-3.5 w-3.5 mr-1" />
                    Invert
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Invert mask selection</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-400 hover:text-red-300"
                    onClick={onClearAll}
                    disabled={!hasAnnotations}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Clear all annotations on this slice</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
          <p><kbd className="px-1 py-0.5 bg-slate-700 rounded">Shift</kbd> + Click = Add</p>
          <p><kbd className="px-1 py-0.5 bg-slate-700 rounded">Alt</kbd> + Click = Subtract</p>
        </div>
      </CardContent>
    </Card>
  );
}
