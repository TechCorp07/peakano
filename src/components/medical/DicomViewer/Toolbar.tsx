'use client';

/**
 * Toolbar Component
 * Provides tool selection and viewport controls
 */

import { useCallback } from 'react';
import {
  MousePointer2,
  Move,
  ZoomIn,
  Ruler,
  Square,
  Circle,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Contrast,
  Crosshair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ToolType } from '@/lib/cornerstone/types';

interface ToolbarProps {
  activeTool: ToolType | null;
  onToolChange: (tool: ToolType) => void;
  onReset?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onInvert?: () => void;
  className?: string;
}

interface ToolButtonProps {
  tool: ToolType;
  activeTool: ToolType | null;
  icon: React.ReactNode;
  label: string;
  onClick: (tool: ToolType) => void;
}

function ToolButton({ tool, activeTool, icon, label, onClick }: ToolButtonProps) {
  const isActive = activeTool === tool;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'flex flex-col items-center justify-center h-14 w-14 p-1',
        isActive
          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
      )}
      onClick={() => onClick(tool)}
      title={label}
    >
      {icon}
      <span className="text-[10px] mt-1 truncate w-full text-center">{label}</span>
    </Button>
  );
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onReset,
  onFlipHorizontal,
  onFlipVertical,
  onInvert,
  className,
}: ToolbarProps) {
  const handleToolChange = useCallback(
    (tool: ToolType) => {
      onToolChange(tool);
    },
    [onToolChange]
  );

  const tools: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
    { tool: 'WindowLevel', icon: <Contrast className="h-5 w-5" />, label: 'W/L' },
    { tool: 'Pan', icon: <Move className="h-5 w-5" />, label: 'Pan' },
    { tool: 'Zoom', icon: <ZoomIn className="h-5 w-5" />, label: 'Zoom' },
    { tool: 'Length', icon: <Ruler className="h-5 w-5" />, label: 'Length' },
    { tool: 'RectangleROI', icon: <Square className="h-5 w-5" />, label: 'Rect' },
    { tool: 'EllipticalROI', icon: <Circle className="h-5 w-5" />, label: 'Ellipse' },
    { tool: 'Crosshairs', icon: <Crosshair className="h-5 w-5" />, label: 'Cross' },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-2 bg-slate-800 border-b border-slate-700',
        className
      )}
    >
      {/* Tool buttons */}
      <div className="flex items-center gap-1">
        {tools.map(({ tool, icon, label }) => (
          <ToolButton
            key={tool}
            tool={tool}
            activeTool={activeTool}
            icon={icon}
            label={label}
            onClick={handleToolChange}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-slate-600 mx-2" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {onFlipHorizontal && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center h-14 w-14 p-1 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onFlipHorizontal}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-1">Flip H</span>
          </Button>
        )}

        {onFlipVertical && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center h-14 w-14 p-1 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onFlipVertical}
            title="Flip Vertical"
          >
            <FlipVertical className="h-5 w-5" />
            <span className="text-[10px] mt-1">Flip V</span>
          </Button>
        )}

        {onInvert && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center h-14 w-14 p-1 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onInvert}
            title="Invert Colors"
          >
            <Contrast className="h-5 w-5" />
            <span className="text-[10px] mt-1">Invert</span>
          </Button>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center h-14 w-14 p-1 text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onReset}
            title="Reset View"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-[10px] mt-1">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
