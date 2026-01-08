'use client';

/**
 * ViewerToolbar Component (RedBrick AI-Inspired)
 * Top toolbar with dropdown menus for tool selection
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Wand2,
  Eye,
  LayoutGrid,
  SlidersHorizontal,
  Save,
  Check,
  HelpCircle,
  ChevronDown,
  // Draw tools
  PenTool,
  Paintbrush,
  Eraser,
  Hexagon,
  // Smart tools
  Sparkles,
  Target,
  Layers,
  // View tools
  // Crosshair, // Disabled - requires MPR setup
  Scan,
  ZoomIn,
  Move,
  // Layout icons
  Square,
  Grid2X2,
  // Adjust icons
  Contrast,
  CircleDot,
  // Measurement tools
  Ruler,
  RectangleHorizontal,
  Circle,
  ArrowUpRight,
  MoveHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import type { ToolType, ViewportLayoutType } from '@/lib/cornerstone/types';
import type { CanvasToolType } from './AnnotationCanvas';
import { useCanvasAnnotationStore } from '@/features/annotation';

interface DropdownItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  tool?: ToolType;
  canvasTool?: CanvasToolType;
}

interface DropdownMenuProps {
  label: string;
  icon: React.ReactNode;
  items: DropdownItem[];
  selectedId?: string;
  onSelect: (item: DropdownItem) => void;
}

function DropdownMenu({ label, icon, items, selectedId, onSelect }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSelection = items.some((item) => item.id === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'toolbar-btn',
          hasSelection && 'active'
        )}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="dropdown-panel animate-slideDown">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className={cn(
                'dropdown-item w-full',
                item.id === selectedId && 'selected'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="shortcut">{item.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      )}
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
  className?: string;
}

export default function ViewerToolbar({
  activeTool,
  onToolChange,
  onSave,
  onSubmit,
  onLayoutChange,
  activeLayout = '1x1',
  className,
}: ViewerToolbarProps) {
  // Canvas annotation store for draw tools
  const { activeTool: activeCanvasTool, setActiveTool: setCanvasTool } = useCanvasAnnotationStore();

  const drawTools: DropdownItem[] = [
    { id: 'freehand', label: 'Freehand', icon: <PenTool className="h-4 w-4" />, shortcut: 'F', canvasTool: 'freehand' },
    { id: 'brush', label: 'Brush', icon: <Paintbrush className="h-4 w-4" />, shortcut: 'B', canvasTool: 'brush' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="h-4 w-4" />, shortcut: 'E', canvasTool: 'eraser' },
    { id: 'polygon', label: 'Polygon', icon: <Hexagon className="h-4 w-4" />, shortcut: 'P', canvasTool: 'polygon' },
  ];

  const smartTools: DropdownItem[] = [
    { id: 'magic-wand', label: 'Magic Wand', icon: <Wand2 className="h-4 w-4" />, shortcut: 'W' },
    { id: 'region-growing', label: 'Region Growing', icon: <Target className="h-4 w-4" />, shortcut: 'G' },
    { id: 'interpolation', label: 'Interpolation', icon: <Layers className="h-4 w-4" />, shortcut: 'I' },
  ];

  const viewTools: DropdownItem[] = [
    { id: 'mpr', label: 'MPR', icon: <Scan className="h-4 w-4" />, shortcut: 'M' },
    // Crosshair tool disabled - requires MPR setup with linked viewports
    // { id: 'crosshair', label: 'Crosshair', icon: <Crosshair className="h-4 w-4" />, shortcut: 'C', tool: 'Crosshairs' },
    { id: 'overlay', label: 'Overlay', icon: <Layers className="h-4 w-4" />, shortcut: 'O' },
    { id: 'zoom', label: 'Zoom', icon: <ZoomIn className="h-4 w-4" />, shortcut: 'Ctrl+Scroll', tool: 'Zoom' },
    { id: 'pan', label: 'Pan', icon: <Move className="h-4 w-4" />, shortcut: 'Shift+Drag', tool: 'Pan' },
  ];

  const layoutOptions: DropdownItem[] = [
    { id: '1x1', label: '1×1', icon: <Square className="h-4 w-4" />, shortcut: '1' },
    { id: '1x2', label: '1×2', icon: <Grid2X2 className="h-4 w-4" />, shortcut: '2' },
    { id: '2x2', label: '2×2', icon: <Grid2X2 className="h-4 w-4" />, shortcut: '3' },
    { id: '2x3', label: '2×3', icon: <LayoutGrid className="h-4 w-4" />, shortcut: '4' },
    { id: '3x3', label: '3×3', icon: <LayoutGrid className="h-4 w-4" />, shortcut: '5' },
  ];

  const adjustTools: DropdownItem[] = [
    { id: 'window-level', label: 'Window/Level', icon: <Contrast className="h-4 w-4" />, tool: 'WindowLevel' },
    { id: 'opacity', label: 'Opacity', icon: <CircleDot className="h-4 w-4" /> },
  ];

  const measureTools: DropdownItem[] = [
    { id: 'length', label: 'Length', icon: <Ruler className="h-4 w-4" />, shortcut: 'L', tool: 'Length' },
    { id: 'rectangle', label: 'Rectangle ROI', icon: <RectangleHorizontal className="h-4 w-4" />, shortcut: 'R', tool: 'RectangleROI' },
    { id: 'ellipse', label: 'Ellipse ROI', icon: <Circle className="h-4 w-4" />, shortcut: 'O', tool: 'EllipticalROI' },
    { id: 'angle', label: 'Angle', icon: <ArrowUpRight className="h-4 w-4" />, shortcut: 'A', tool: 'Angle' },
    { id: 'bidirectional', label: 'Bidirectional', icon: <MoveHorizontal className="h-4 w-4" />, shortcut: 'D', tool: 'Bidirectional' },
  ];

  const handleDrawSelect = (item: DropdownItem) => {
    if (item.canvasTool) {
      // Set canvas annotation tool
      setCanvasTool(item.canvasTool);
      // Deactivate Cornerstone tools when using canvas tools - set to WindowLevel as neutral
      onToolChange('WindowLevel');
    } else if (item.tool) {
      // Set Cornerstone tool and deactivate canvas tools
      setCanvasTool('none');
      onToolChange(item.tool);
    }
  };

  const handleSmartSelect = (item: DropdownItem) => {
    console.log('Smart tool selected:', item.id);
  };

  const handleViewSelect = (item: DropdownItem) => {
    if (item.tool) {
      setCanvasTool('none'); // Deactivate canvas tools
      onToolChange(item.tool);
    }
  };

  const handleLayoutSelect = (item: DropdownItem) => {
    onLayoutChange?.(item.id as ViewportLayoutType);
  };

  const handleAdjustSelect = (item: DropdownItem) => {
    if (item.tool) {
      setCanvasTool('none'); // Deactivate canvas tools
      onToolChange(item.tool);
    }
  };

  const handleMeasureSelect = (item: DropdownItem) => {
    if (item.tool) {
      setCanvasTool('none'); // Deactivate canvas tools
      onToolChange(item.tool);
    }
  };

  // Keyboard shortcuts for draw tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Draw tool shortcuts - deactivate Pan/other Cornerstone tools when selecting annotation tools
      if (key === 'f') {
        setCanvasTool('freehand');
        onToolChange('WindowLevel'); // Neutral tool, not Pan
      } else if (key === 'b') {
        setCanvasTool('brush');
        onToolChange('WindowLevel');
      } else if (key === 'e') {
        setCanvasTool('eraser');
        onToolChange('WindowLevel');
      } else if (key === 'p') {
        setCanvasTool('polygon');
        onToolChange('WindowLevel');
      } else if (key === 'escape') {
        // Escape to deactivate all tools (canvas tools and Pan)
        setCanvasTool('none');
        // Reset to default WindowLevel tool
        onToolChange('WindowLevel');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCanvasTool, onToolChange]);

  return (
    <header
      className={cn(
        'h-14 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4',
        className
      )}
    >
      {/* Left Section: Back + Tool Dropdowns */}
      <div className="flex items-center gap-1">
        <Link
          href={ROUTES.STUDIES}
          className="toolbar-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>

        <div className="w-px h-6 bg-[#30363D] mx-2" />

        <DropdownMenu
          label="Draw"
          icon={<Pencil className="h-4 w-4" />}
          items={drawTools}
          selectedId={
            drawTools.find((t) => t.canvasTool === activeCanvasTool)?.id
          }
          onSelect={handleDrawSelect}
        />

        <DropdownMenu
          label="Smart"
          icon={<Sparkles className="h-4 w-4" />}
          items={smartTools}
          onSelect={handleSmartSelect}
        />

        <DropdownMenu
          label="Measure"
          icon={<Ruler className="h-4 w-4" />}
          items={measureTools}
          selectedId={
            measureTools.find((t) => t.tool === activeTool)?.id
          }
          onSelect={handleMeasureSelect}
        />

        <DropdownMenu
          label="View"
          icon={<Eye className="h-4 w-4" />}
          items={viewTools}
          selectedId={
            viewTools.find((t) => t.tool === activeTool)?.id
          }
          onSelect={handleViewSelect}
        />

        <DropdownMenu
          label="Layout"
          icon={<LayoutGrid className="h-4 w-4" />}
          items={layoutOptions}
          selectedId={activeLayout}
          onSelect={handleLayoutSelect}
        />

        <DropdownMenu
          label="Adjust"
          icon={<SlidersHorizontal className="h-4 w-4" />}
          items={adjustTools}
          selectedId={
            adjustTools.find((t) => t.tool === activeTool)?.id
          }
          onSelect={handleAdjustSelect}
        />
      </div>

      {/* Right Section: Save, Submit, Help */}
      <div className="flex items-center gap-2">
        {onSave && (
          <button
            onClick={onSave}
            className="toolbar-btn"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        )}

        {onSubmit && (
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
          >
            <Check className="h-4 w-4" />
            <span>Submit</span>
          </button>
        )}

        <button
          className="p-2 text-[#8B949E] hover:text-white hover:bg-white/10 rounded-md"
          title="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
