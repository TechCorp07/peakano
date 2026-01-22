'use client';

/**
 * ViewerToolbar Component (Two-Row Layout)
 * Displays all tools visibly organized by category
 */

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Wand2,
  Save,
  Check,
  HelpCircle,
  // Draw tools
  PenTool,
  Paintbrush,
  Eraser,
  Hexagon,
  // Smart tools
  Target,
  Layers,
  Brain,
  // View tools
  Scan,
  ZoomIn,
  Move,
  RotateCw,
  // Layout icons
  Square,
  Grid2X2,
  LayoutGrid,
  // Adjust icons
  Contrast,
  SunDim,
  // Measurement tools
  Ruler,
  RectangleHorizontal,
  Circle,
  ArrowUpRight,
  MoveHorizontal,
  // Segment tools
  Sliders,
  ScanLine,
  // Mask mode icons
  Plus,
  Minus,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import type { ToolType, ViewportLayoutType } from '@/lib/cornerstone/types';
import type { CanvasToolType } from './AnnotationCanvas';
import { useCanvasAnnotationStore } from '@/features/annotation';
import { useSmartToolStore, type SmartToolType } from '@/lib/smartTools';
import { useAnnotationToolsStore, type SegmentToolType, type MaskOperationType } from '@/lib/annotation';
import { useAISegmentationStore } from '@/lib/aiSegmentation';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
}

function ToolButton({ icon, label, active, onClick, shortcut, disabled }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'flex flex-col items-center justify-center px-2 py-1 min-w-[48px] rounded transition-colors',
        'text-[10px] text-[#8B949E] hover:text-white hover:bg-white/10',
        active && 'bg-primary/20 text-primary border border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon}
      <span className="mt-0.5 truncate max-w-[52px]">{label}</span>
    </button>
  );
}

interface ToolGroupProps {
  label: string;
  children: React.ReactNode;
}

function ToolGroup({ label, children }: ToolGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-[9px] text-[#6E7681] uppercase tracking-wider mr-1 font-medium min-w-[40px]">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        {children}
      </div>
      <div className="w-px h-8 bg-[#30363D] mx-2" />
    </div>
  );
}

interface ViewerToolbarProps {
  activeTool: ToolType | null;
  onToolChange: (tool: ToolType) => void;
  onSave?: () => void;
  onSubmit?: () => void;
  onLayoutChange?: (layout: ViewportLayoutType) => void;
  activeLayout?: ViewportLayoutType;
  onSmartToolChange?: (tool: SmartToolType) => void;
  onToggleOverlay?: () => void;
  onToggleMPR?: () => void;
  onInvert?: () => void;
  isInverted?: boolean;
  showOverlay?: boolean;
  showMPR?: boolean;
  className?: string;
}

export default function ViewerToolbar({
  activeTool,
  onToolChange,
  onSave,
  onSubmit,
  onLayoutChange,
  activeLayout = '1x1',
  onSmartToolChange,
  onToggleOverlay,
  onToggleMPR,
  onInvert,
  isInverted = false,
  showOverlay = true,
  showMPR = false,
  className,
}: ViewerToolbarProps) {
  // Canvas annotation store for draw tools
  const { activeTool: activeCanvasTool, setActiveTool: setCanvasTool } = useCanvasAnnotationStore();
  // Smart tool store
  const { activeTool: activeSmartTool, setActiveTool: setSmartTool } = useSmartToolStore();
  // AI Segmentation store
  const { isActive: isAIActive, setActive: setAIActive } = useAISegmentationStore();
  // Annotation tools store (Phase 1)
  const { 
    activeSegmentTool,
    maskOperationMode,
    setActiveTool: setAnnotationTool,
    setActiveSegmentTool,
    setMaskOperationMode 
  } = useAnnotationToolsStore();

  // Helper to deactivate all tools (but preserve mask operation mode)
  const deactivateAllTools = () => {
    setCanvasTool('none');
    setSmartTool('none');
    setAIActive(false);
    setActiveSegmentTool('none');
    // Don't reset maskOperationMode - it should persist as a user preference
    setAnnotationTool('none');
  };

  // AI Segmentation handler
  const handleAISegmentation = () => {
    if (isAIActive) {
      setAIActive(false);
      return;
    }
    deactivateAllTools();
    setAIActive(true);
  };

  // Draw tool handlers
  const handleDrawTool = (tool: CanvasToolType) => {
    if (activeCanvasTool === tool) {
      setCanvasTool('none');
      onToolChange('WindowLevel');
      return;
    }
    deactivateAllTools();
    setCanvasTool(tool);
    onToolChange('WindowLevel');
  };

  // Smart tool handlers
  const handleSmartTool = (tool: SmartToolType) => {
    if (activeSmartTool === tool) {
      setSmartTool('none');
      onSmartToolChange?.('none');
      return;
    }
    deactivateAllTools();
    setSmartTool(tool);
    onSmartToolChange?.(tool);
    // Set Cornerstone tools passive
    (async () => {
      try {
        const csTools = await import('@cornerstonejs/tools');
        const toolGroup = csTools.ToolGroupManager.getToolGroup('mriToolGroup');
        if (toolGroup) {
          const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
          if (currentPrimaryTool) {
            toolGroup.setToolPassive(currentPrimaryTool);
          }
        }
      } catch (e) { /* ignore */ }
    })();
  };

  // Measure tool handlers
  const handleMeasureTool = (tool: ToolType) => {
    if (activeTool === tool) {
      onToolChange('WindowLevel');
      return;
    }
    deactivateAllTools();
    onToolChange(tool);
  };

  // Segment tool handlers
  const handleSegmentTool = (tool: SegmentToolType) => {
    if (activeSegmentTool === tool) {
      setActiveSegmentTool('none');
      setAnnotationTool('none');
      // Don't reset maskOperationMode - it should persist
      return;
    }
    deactivateAllTools();
    setActiveSegmentTool(tool);
    
    // Set Cornerstone tools passive
    (async () => {
      try {
        const csTools = await import('@cornerstonejs/tools');
        const toolGroup = csTools.ToolGroupManager.getToolGroup('mriToolGroup');
        if (toolGroup) {
          const currentPrimaryTool = toolGroup.getActivePrimaryMouseButtonTool();
          if (currentPrimaryTool) {
            toolGroup.setToolPassive(currentPrimaryTool);
          }
        }
      } catch (e) { /* ignore */ }
    })();

    // Set annotation tool and mask operation mode
    if (tool === 'threshold' || tool === 'adaptive-threshold' || 
        tool === 'otsu' || tool === 'hysteresis') {
      setAnnotationTool('threshold');
    } else if (tool === 'mask-union') {
      setMaskOperationMode('union');
    } else if (tool === 'mask-subtract') {
      setMaskOperationMode('subtract');
    } else if (tool === 'mask-intersect') {
      setMaskOperationMode('intersect');
    }
  };

  // View tool handlers
  const handleViewTool = (tool: ToolType) => {
    if (activeTool === tool) {
      onToolChange('WindowLevel');
      return;
    }
    deactivateAllTools();
    onToolChange(tool);
  };

  // Layout handler
  const handleLayout = (layout: ViewportLayoutType) => {
    onLayoutChange?.(layout);
  };

  // Adjust tool handlers
  const handleAdjustTool = (tool: ToolType) => {
    if (activeTool === tool) {
      onToolChange('WindowLevel');
      return;
    }
    deactivateAllTools();
    onToolChange(tool);
  };

  // Mask mode handler - sets selection combination mode
  const handleMaskMode = (mode: MaskOperationType) => {
    setMaskOperationMode(mode);
  };
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      // Draw tools
      if (key === 'f') handleDrawTool('freehand');
      else if (key === 'b') handleDrawTool('brush');
      else if (key === 'e') handleDrawTool('eraser');
      else if (key === 'p') handleDrawTool('polygon');
      // Smart tools
      else if (key === 'w') handleSmartTool('magic-wand');
      else if (key === 'g') handleSmartTool('region-growing');
      else if (key === 'i') handleSmartTool('interpolation');
      else if (key === 's') handleAISegmentation();
      // Measure tools
      else if (key === 'l') handleMeasureTool('Length');
      else if (key === 'r') handleMeasureTool('RectangleROI');
      else if (key === 'a') handleMeasureTool('Angle');
      else if (key === 'd') handleMeasureTool('Bidirectional');
      // Segment tools
      else if (key === 't') handleSegmentTool('threshold');
      // View
      else if (key === 'm') onToggleMPR?.();
      else if (key === 'o') onToggleOverlay?.();
      // Escape
      else if (key === 'escape') {
        deactivateAllTools();
        onToolChange('WindowLevel');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCanvasTool, activeSmartTool, activeTool, activeSegmentTool, isAIActive]);

  return (
    <header className={cn('bg-[#161B22] border-b border-[#30363D]', className)}>
      {/* Row 1: Draw, Smart, Measure, Segment */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-[#30363D]/50">
        <div className="flex items-center overflow-x-auto">
          {/* Back Button */}
          <Link
            href={ROUTES.STUDIES}
            className="flex items-center gap-1 px-2 py-1 text-sm text-[#8B949E] hover:text-white hover:bg-white/10 rounded mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          <div className="w-px h-8 bg-[#30363D] mx-2" />

          {/* Draw Tools */}
          <ToolGroup label="Draw">
            <ToolButton
              icon={<PenTool className="h-4 w-4" />}
              label="Freehand"
              shortcut="F"
              active={activeCanvasTool === 'freehand'}
              onClick={() => handleDrawTool('freehand')}
            />
            <ToolButton
              icon={<Paintbrush className="h-4 w-4" />}
              label="Brush"
              shortcut="B"
              active={activeCanvasTool === 'brush'}
              onClick={() => handleDrawTool('brush')}
            />
            <ToolButton
              icon={<Eraser className="h-4 w-4" />}
              label="Eraser"
              shortcut="E"
              active={activeCanvasTool === 'eraser'}
              onClick={() => handleDrawTool('eraser')}
            />
            <ToolButton
              icon={<Hexagon className="h-4 w-4" />}
              label="Polygon"
              shortcut="P"
              active={activeCanvasTool === 'polygon'}
              onClick={() => handleDrawTool('polygon')}
            />
          </ToolGroup>

          {/* Smart Tools */}
          <ToolGroup label="Smart">
            <ToolButton
              icon={<Wand2 className="h-4 w-4" />}
              label="Magic"
              shortcut="W"
              active={activeSmartTool === 'magic-wand'}
              onClick={() => handleSmartTool('magic-wand')}
            />
            <ToolButton
              icon={<Target className="h-4 w-4" />}
              label="Region"
              shortcut="G"
              active={activeSmartTool === 'region-growing'}
              onClick={() => handleSmartTool('region-growing')}
            />
            <ToolButton
              icon={<Layers className="h-4 w-4" />}
              label="Interp"
              shortcut="I"
              active={activeSmartTool === 'interpolation'}
              onClick={() => handleSmartTool('interpolation')}
            />
            <ToolButton
              icon={<Brain className="h-4 w-4" />}
              label="AI Seg"
              shortcut="S"
              active={isAIActive}
              onClick={handleAISegmentation}
            />
          </ToolGroup>

          {/* Measure Tools */}
          <ToolGroup label="Measure">
            <ToolButton
              icon={<Ruler className="h-4 w-4" />}
              label="Length"
              shortcut="L"
              active={activeTool === 'Length'}
              onClick={() => handleMeasureTool('Length')}
            />
            <ToolButton
              icon={<RectangleHorizontal className="h-4 w-4" />}
              label="Rect"
              shortcut="R"
              active={activeTool === 'RectangleROI'}
              onClick={() => handleMeasureTool('RectangleROI')}
            />
            <ToolButton
              icon={<Circle className="h-4 w-4" />}
              label="Ellipse"
              active={activeTool === 'EllipticalROI'}
              onClick={() => handleMeasureTool('EllipticalROI')}
            />
            <ToolButton
              icon={<ArrowUpRight className="h-4 w-4" />}
              label="Angle"
              shortcut="A"
              active={activeTool === 'Angle'}
              onClick={() => handleMeasureTool('Angle')}
            />
            <ToolButton
              icon={<MoveHorizontal className="h-4 w-4" />}
              label="Bidir"
              shortcut="D"
              active={activeTool === 'Bidirectional'}
              onClick={() => handleMeasureTool('Bidirectional')}
            />
          </ToolGroup>

          {/* Segment Tools */}
          <ToolGroup label="Segment">
            <ToolButton
              icon={<Sliders className="h-4 w-4" />}
              label="Thresh"
              shortcut="T"
              active={activeSegmentTool === 'threshold'}
              onClick={() => handleSegmentTool('threshold')}
            />
            <ToolButton
              icon={<ScanLine className="h-4 w-4" />}
              label="Adaptive"
              active={activeSegmentTool === 'adaptive-threshold'}
              onClick={() => handleSegmentTool('adaptive-threshold')}
            />
            <ToolButton
              icon={<Target className="h-4 w-4" />}
              label="Otsu"
              active={activeSegmentTool === 'otsu'}
              onClick={() => handleSegmentTool('otsu')}
            />
            <ToolButton
              icon={<Layers className="h-4 w-4" />}
              label="Hyster"
              active={activeSegmentTool === 'hysteresis'}
              onClick={() => handleSegmentTool('hysteresis')}
            />
          </ToolGroup>
        </div>

        {/* Right: Save/Submit */}
        <div className="flex items-center gap-2 ml-2">
          {onSave && (
            <button onClick={onSave} className="flex items-center gap-1 px-2 py-1 text-sm text-[#8B949E] hover:text-white hover:bg-white/10 rounded">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
          {onSubmit && (
            <button onClick={onSubmit} className="flex items-center gap-1 px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded">
              <Check className="h-4 w-4" />
              <span>Submit</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: View, Layout, Adjust, Mask Ops */}
      <div className="flex items-center justify-between px-3 py-1">
        <div className="flex items-center overflow-x-auto">
          {/* View Tools */}
          <ToolGroup label="View">
            <ToolButton
              icon={<Scan className="h-4 w-4" />}
              label="MPR"
              shortcut="M"
              active={showMPR}
              onClick={() => onToggleMPR?.()}
            />
            <ToolButton
              icon={<Layers className="h-4 w-4" />}
              label="Overlay"
              shortcut="O"
              active={showOverlay}
              onClick={() => onToggleOverlay?.()}
            />
            <ToolButton
              icon={<ZoomIn className="h-4 w-4" />}
              label="Zoom"
              active={activeTool === 'Zoom'}
              onClick={() => handleViewTool('Zoom')}
            />
            <ToolButton
              icon={<Move className="h-4 w-4" />}
              label="Pan"
              active={activeTool === 'Pan'}
              onClick={() => handleViewTool('Pan')}
            />
            <ToolButton
              icon={<RotateCw className="h-4 w-4" />}
              label="Reset"
              onClick={() => onToolChange('StackScroll')}
            />
          </ToolGroup>

          {/* Layout Options */}
          <ToolGroup label="Layout">
            <ToolButton
              icon={<Square className="h-4 w-4" />}
              label="1×1"
              active={activeLayout === '1x1'}
              onClick={() => handleLayout('1x1')}
            />
            <ToolButton
              icon={<Grid2X2 className="h-4 w-4" />}
              label="1×2"
              active={activeLayout === '1x2'}
              onClick={() => handleLayout('1x2')}
            />
            <ToolButton
              icon={<Grid2X2 className="h-4 w-4" />}
              label="2×2"
              active={activeLayout === '2x2'}
              onClick={() => handleLayout('2x2')}
            />
            <ToolButton
              icon={<LayoutGrid className="h-4 w-4" />}
              label="2×3"
              active={activeLayout === '2x3'}
              onClick={() => handleLayout('2x3')}
            />
            <ToolButton
              icon={<LayoutGrid className="h-4 w-4" />}
              label="3×3"
              active={activeLayout === '3x3'}
              onClick={() => handleLayout('3x3')}
            />
          </ToolGroup>

          {/* Adjust Tools */}
          <ToolGroup label="Adjust">
            <ToolButton
              icon={<Contrast className="h-4 w-4" />}
              label="W/L"
              active={activeTool === 'WindowLevel'}
              onClick={() => handleAdjustTool('WindowLevel')}
            />
            <ToolButton
              icon={<SunDim className="h-4 w-4" />}
              label="Invert"
              active={isInverted}
              onClick={() => onInvert?.()}
            />
          </ToolGroup>

          {/* Mask Selection Mode */}
          <ToolGroup label="Mode">
            <ToolButton
              icon={<Plus className="h-4 w-4" />}
              label="Replace"
              active={maskOperationMode === 'replace'}
              onClick={() => handleMaskMode('replace')}
            />
            <ToolButton
              icon={<Plus className="h-4 w-4" />}
              label="Add"
              active={maskOperationMode === 'add'}
              onClick={() => handleMaskMode('add')}
            />
            <ToolButton
              icon={<Minus className="h-4 w-4" />}
              label="Sub"
              active={maskOperationMode === 'subtract'}
              onClick={() => handleMaskMode('subtract')}
            />
            <ToolButton
              icon={<Crosshair className="h-4 w-4" />}
              label="Intersect"
              active={maskOperationMode === 'intersect'}
              onClick={() => handleMaskMode('intersect')}
            />
          </ToolGroup>
        </div>

        {/* Help */}
        <button
          className="p-1.5 text-[#8B949E] hover:text-white hover:bg-white/10 rounded"
          title="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
