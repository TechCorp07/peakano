// @ts-nocheck
'use client';

/**
 * ViewerContextPanel Component (RedBrick AI-Inspired)
 * Right context panel with dynamic tool settings and annotations
 */

import { useState } from 'react';
import {
  X,
  Contrast,
  Info,
  RotateCcw,
  Ruler,
  Crosshair,
  ZoomIn,
  Move,
  List,
  Settings,
  Tags,
  Undo,
  Redo,
  Trash2,
  RectangleHorizontal,
  Circle,
  ArrowUpRight,
  MoveHorizontal,
  Sliders,
  PanelRightOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WINDOW_LEVEL_PRESETS } from '@/lib/cornerstone/types';
import type { ToolType } from '@/lib/cornerstone/types';
import AnnotationList from './AnnotationList';
import { useAnnotationStore, useCanUndo, useCanRedo } from '@/features/annotations';

// Phase 1 UI Components
import ThresholdToolPanel from './ThresholdToolPanel';
import BrushSettingsPanel from './BrushSettingsPanel';
import MaskOperationsPanel from './MaskOperationsPanel';
import MeasurementsPanel from './MeasurementsPanel';
// Phase 2 Persistence Panel
import AnnotationPersistencePanel from './AnnotationPersistencePanel';
// Phase 5 Smart Tools
import SmartToolsPanel from './SmartToolsPanel';
// AI Segmentation
import AISegmentationPanel from './AISegmentationPanel';
import { useAISegmentationStore, useAISegmentation } from '@/lib/aiSegmentation';
// Phase 6 Components
import { LabelManagementPanel } from './LabelManagementPanel';
import { AnnotationProgressPanel } from './AnnotationProgressPanel';
import { Visualization3DPanel } from './Visualization3DPanel';
// Mask Operations Hook
import { useMaskOperations } from '@/lib/annotation';
// Canvas Store for annotations
import { useCanvasAnnotationStore } from '@/features/annotation';

interface ViewerContextPanelProps {
  activeTool: ToolType | null;
  modality?: string;
  isCollapsed?: boolean;
  onCollapse?: () => void;
  // Brush settings
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
  brushOpacity?: number;
  onBrushOpacityChange?: (opacity: number) => void;
  // Window/Level settings (null when loading from image)
  windowWidth?: number | null;
  windowCenter?: number | null;
  onWindowLevelChange?: (width: number, center: number) => void;
  // View info
  currentSlice?: number;
  totalSlices?: number;
  zoom?: number;
  // Annotation context
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
  sopInstanceUID?: string;
  // Callback for annotation deletion (to sync with Cornerstone)
  onDeleteAnnotation?: (id: string) => void;
  // Quick actions callbacks
  onResetView?: () => void;
  onToggleRuler?: () => void;
  onCenterImage?: () => void;
  onToolChange?: (tool: ToolType) => void;
  className?: string;
}

type PanelTab = 'tools' | 'annotations' | 'labels' | 'advanced';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  allowInput?: boolean;
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange, allowInput = false }: SliderProps) {
  const [localInputValue, setLocalInputValue] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Use the local value when editing, otherwise derive from prop
  const inputValue = isEditing && localInputValue !== null ? localInputValue : String(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (localInputValue !== null) {
      const numValue = parseFloat(localInputValue);
      if (!isNaN(numValue)) {
        // Clamp to min/max range
        const clampedValue = Math.max(min, Math.min(max, numValue));
        onChange(clampedValue);
      }
    }
    setLocalInputValue(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalInputValue(String(value));
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#8B949E]">{label}</span>
        {allowInput ? (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsEditing(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-20 px-2 py-0.5 text-right text-[#E6EDF3] font-mono bg-[#21262D] border border-[#30363D] rounded text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          />
        ) : (
          <span className="text-[#E6EDF3] font-mono">
            {value}{unit}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-[#6E7681]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function BrushSettings({
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
}: Pick<ViewerContextPanelProps, 'brushSize' | 'onBrushSizeChange' | 'brushOpacity' | 'onBrushOpacityChange'>) {
  const quickSizes = [
    { label: 'S', value: 5 },
    { label: 'M', value: 15 },
    { label: 'L', value: 30 },
    { label: 'XL', value: 50 },
  ];

  return (
    <div className="space-y-4">
      <Slider
        label="Size"
        value={brushSize || 10}
        min={1}
        max={100}
        unit="px"
        onChange={onBrushSizeChange || (() => {})}
      />

      <Slider
        label="Opacity"
        value={Math.round((brushOpacity || 1) * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => onBrushOpacityChange?.(v / 100)}
      />

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-2">Quick Sizes</p>
        <div className="flex gap-2">
          {quickSizes.map((size) => (
            <button
              key={size.label}
              onClick={() => onBrushSizeChange?.(size.value)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-md transition-colors',
                brushSize === size.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-[#21262D] text-[#8B949E] hover:text-white hover:bg-[#30363D]'
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-2">Keyboard Hints</p>
        <div className="space-y-1 text-xs text-[#8B949E]">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">+</kbd>
            <span>Increase size</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">-</kbd>
            <span>Decrease size</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">Shift</kbd>
            <span>Straight line</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WindowLevelSettings({
  windowWidth,
  windowCenter,
  onWindowLevelChange,
  modality = 'MR',
}: Pick<ViewerContextPanelProps, 'windowWidth' | 'windowCenter' | 'onWindowLevelChange' | 'modality'>) {
  const presets = WINDOW_LEVEL_PRESETS[modality] || WINDOW_LEVEL_PRESETS.MR || WINDOW_LEVEL_PRESETS.CT;

  // Use modality-appropriate defaults when values are null
  // MRI typically uses positive values, CT uses Hounsfield units (can be negative)
  const isMRI = modality === 'MR' || modality === 'MRI';
  const defaultWidth = isMRI ? 400 : 1500;
  const defaultCenter = isMRI ? 200 : -600;

  // Dynamic slider ranges based on modality
  const widthMin = 1;
  const widthMax = isMRI ? 2000 : 4000;
  const centerMin = isMRI ? -500 : -1000;
  const centerMax = isMRI ? 1500 : 1000;

  // Effective values (use defaults if null)
  const effectiveWidth = windowWidth ?? defaultWidth;
  const effectiveCenter = windowCenter ?? defaultCenter;

  // Show loading state if values haven't been initialized
  if (windowWidth === null || windowCenter === null) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-[#8B949E]">Loading image values...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Slider
        label="Window Width"
        value={effectiveWidth}
        min={widthMin}
        max={widthMax}
        onChange={(w) => onWindowLevelChange?.(w, effectiveCenter)}
        allowInput
      />

      <Slider
        label="Window Level"
        value={effectiveCenter}
        min={centerMin}
        max={centerMax}
        onChange={(l) => onWindowLevelChange?.(effectiveWidth, l)}
        allowInput
      />

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-2">Presets</p>
        <div className="space-y-1">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onWindowLevelChange?.(preset.windowWidth, preset.windowCenter)}
              className={cn(
                'w-full px-3 py-2 text-left text-xs rounded-md transition-colors',
                windowWidth === preset.windowWidth && windowCenter === preset.windowCenter
                  ? 'bg-primary/15 text-primary'
                  : 'text-[#8B949E] hover:text-white hover:bg-white/5'
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onWindowLevelChange?.(defaultWidth, defaultCenter)}
        className="w-full px-3 py-2 text-xs text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
      >
        <RotateCcw className="h-3 w-3 inline mr-2" />
        Reset to Default
      </button>
    </div>
  );
}

function ZoomPanSettings({ onResetView }: { onResetView?: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8B949E]">
        Click and drag on the image to zoom or pan.
      </p>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-3">Keyboard Shortcuts</p>
        <div className="space-y-2 text-xs text-[#8B949E]">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">Ctrl + Scroll</kbd>
            <span>Zoom in/out</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">Shift + Drag</kbd>
            <span>Pan image</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">Scroll</kbd>
            <span>Navigate slices</span>
          </div>
        </div>
      </div>

      <button
        onClick={onResetView}
        className="w-full px-3 py-2 text-xs text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors"
      >
        <RotateCcw className="h-3 w-3 inline mr-2" />
        Reset View
      </button>
    </div>
  );
}

function MeasurementSettings() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8B949E]">
        Click and drag on the image to create measurements.
      </p>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-3">How to Use</p>
        <div className="space-y-2 text-xs text-[#8B949E]">
          <p>• Click to start, drag to measure, release to finish</p>
          <p>• Measurements are saved with the annotation</p>
          <p>• Press ESC to cancel current measurement</p>
        </div>
      </div>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-3">Keyboard Shortcuts</p>
        <div className="space-y-2 text-xs text-[#8B949E]">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">L</kbd>
            <span>Length tool</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">R</kbd>
            <span>Rectangle ROI</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">A</kbd>
            <span>Angle tool</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#21262D] rounded text-[10px]">D</kbd>
            <span>Bidirectional</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultInfo({
  currentSlice,
  totalSlices,
  zoom,
  windowWidth,
  windowCenter,
  onResetView,
  onToggleRuler,
  onCenterImage,
}: Pick<ViewerContextPanelProps, 'currentSlice' | 'totalSlices' | 'zoom' | 'windowWidth' | 'windowCenter' | 'onResetView' | 'onToggleRuler' | 'onCenterImage'>) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8B949E]">
        Select a tool from the toolbar to see its settings here.
      </p>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-3">Quick Actions</p>
        <div className="space-y-2">
          <button 
            onClick={onResetView}
            className="w-full px-3 py-2 text-xs text-left text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset View
          </button>
          <button 
            onClick={onToggleRuler}
            className="w-full px-3 py-2 text-xs text-left text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors flex items-center gap-2"
          >
            <Ruler className="h-4 w-4" />
            Toggle Ruler
          </button>
          <button 
            onClick={onCenterImage}
            className="w-full px-3 py-2 text-xs text-left text-[#8B949E] hover:text-white bg-[#21262D] hover:bg-[#30363D] rounded-md transition-colors flex items-center gap-2"
          >
            <Crosshair className="h-4 w-4" />
            Center Image
          </button>
        </div>
      </div>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-3">Current View Info</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8B949E]">Slice</span>
            <span className="text-[#E6EDF3] font-mono">
              {currentSlice || 1}/{totalSlices || 1}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B949E]">Zoom</span>
            <span className="text-[#E6EDF3] font-mono">{zoom || 100}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B949E]">W/L</span>
            <span className="text-[#E6EDF3] font-mono">
              {windowWidth !== null ? windowWidth : '...'}/{windowCenter !== null ? windowCenter : '...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const toolConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  WindowLevel: { icon: <Contrast className="h-4 w-4" />, label: 'Window/Level' },
  Pan: { icon: <Move className="h-4 w-4" />, label: 'Pan Tool' },
  Zoom: { icon: <ZoomIn className="h-4 w-4" />, label: 'Zoom Tool' },
  Crosshairs: { icon: <Crosshair className="h-4 w-4" />, label: 'Crosshairs' },
  Length: { icon: <Ruler className="h-4 w-4" />, label: 'Length Tool' },
  RectangleROI: { icon: <RectangleHorizontal className="h-4 w-4" />, label: 'Rectangle ROI' },
  EllipticalROI: { icon: <Circle className="h-4 w-4" />, label: 'Ellipse ROI' },
  Angle: { icon: <ArrowUpRight className="h-4 w-4" />, label: 'Angle Tool' },
  Bidirectional: { icon: <MoveHorizontal className="h-4 w-4" />, label: 'Bidirectional' },
};

/**
 * Labels Panel for selecting annotation labels
 */
function LabelsPanel() {
  const { labels, selectedLabelId, selectLabel } = useAnnotationStore();

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8B949E]">
        Select a label to apply to new annotations.
      </p>

      <div className="space-y-1">
        {labels.map((label) => (
          <button
            key={label.id}
            onClick={() => selectLabel(label.id === selectedLabelId ? null : label.id)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm rounded-md transition-colors flex items-center gap-3',
              label.id === selectedLabelId
                ? 'bg-[#21262D] ring-1 ring-primary'
                : 'hover:bg-[#21262D]'
            )}
          >
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: label.color }}
            />
            <span className="text-white flex-1">{label.name}</span>
            {label.shortcut && (
              <kbd className="px-1.5 py-0.5 bg-[#30363D] rounded text-[10px] text-[#8B949E]">
                {label.shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>

      <div className="border-t border-[#30363D] pt-4">
        <p className="text-xs text-[#6E7681] mb-2">Selected</p>
        {selectedLabelId ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#21262D] rounded-md">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: labels.find(l => l.id === selectedLabelId)?.color }}
            />
            <span className="text-sm text-white">
              {labels.find(l => l.id === selectedLabelId)?.name}
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#6E7681] px-3 py-2">No label selected</p>
        )}
      </div>
    </div>
  );
}

/**
 * Annotations Panel with list and actions
 */
function AnnotationsPanel({
  seriesInstanceUID,
  onDeleteAnnotation,
}: {
  seriesInstanceUID?: string;
  onDeleteAnnotation?: (id: string) => void;
}) {
  const { annotations, clearAnnotations, undo, redo } = useAnnotationStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const annotationCount = seriesInstanceUID
    ? annotations.filter(a => a.seriesInstanceUID === seriesInstanceUID).length
    : annotations.length;

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8B949E]">
          {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'p-1.5 rounded transition-colors',
              canUndo
                ? 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
                : 'text-[#30363D] cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'p-1.5 rounded transition-colors',
              canRedo
                ? 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'
                : 'text-[#30363D] cursor-not-allowed'
            )}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete all annotations?')) {
                clearAnnotations();
              }
            }}
            disabled={annotationCount === 0}
            className={cn(
              'p-1.5 rounded transition-colors',
              annotationCount > 0
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'text-[#30363D] cursor-not-allowed'
            )}
            title="Clear All"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Annotation List */}
      <AnnotationList
        seriesInstanceUID={seriesInstanceUID}
        groupByImage={true}
        onDeleteAnnotation={onDeleteAnnotation}
      />
    </div>
  );
}

export default function ViewerContextPanel({
  activeTool,
  modality,
  isCollapsed = false,
  onCollapse,
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
  windowWidth,
  windowCenter,
  onWindowLevelChange,
  currentSlice,
  totalSlices,
  zoom,
  studyInstanceUID,
  seriesInstanceUID,
  onDeleteAnnotation,
  onResetView,
  onToggleRuler,
  onCenterImage,
  onToolChange,
  className,
}: ViewerContextPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('tools');
  const config = activeTool ? (toolConfig[activeTool] || { icon: <Info className="h-4 w-4" />, label: 'Information' }) : { icon: <Info className="h-4 w-4" />, label: 'Information' };

  // Mask operations hook for MaskOperationsPanel
  const {
    morphRadius,
    setMorphRadius,
    hasAnnotations,
    executeMorphOperation,
    invertMask,
    clearAll,
  } = useMaskOperations({
    sliceIndex: currentSlice || 0,
    imageWidth: 512, // TODO: Get actual image dimensions
    imageHeight: 512,
  });

  // Get annotations for current slice to check if there are any
  const { annotations: canvasAnnotations } = useCanvasAnnotationStore();
  const sliceKey = String(currentSlice || 0);
  const sliceHasAnnotations = (canvasAnnotations.get(sliceKey)?.length || 0) > 0;

  const tabs: { id: PanelTab; icon: React.ReactNode; label: string }[] = [
    { id: 'tools', icon: <Settings className="h-4 w-4" />, label: 'Tools' },
    { id: 'annotations', icon: <List className="h-4 w-4" />, label: 'Annotations' },
    { id: 'labels', icon: <Tags className="h-4 w-4" />, label: 'Labels' },
    { id: 'advanced', icon: <Sliders className="h-4 w-4" />, label: 'Advanced' },
  ];

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center bg-[#161B22] border-l border-[#30363D] py-2">
        <button
          onClick={onCollapse}
          className="p-2 text-[#8B949E] hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
          title="Expand Panel"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
        <div className="mt-2 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onCollapse?.();
              }}
              className={cn(
                'p-2 rounded-lg transition-colors',
                activeTab === tab.id
                  ? 'text-primary bg-primary/10'
                  : 'text-[#8B949E] hover:text-white hover:bg-white/5'
              )}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'w-[220px] bg-[#161B22] border-l border-[#30363D] flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-[#30363D] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[60px] px-2 py-2.5 text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-[#8B949E] hover:text-white hover:bg-white/5'
            )}
            title={tab.label}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="px-2 text-[#8B949E] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <>
            {/* Tool Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#30363D]">
              {config.icon}
              <h2 className="text-sm font-semibold text-white">{config.label}</h2>
            </div>

            {activeTool === 'WindowLevel' && (
              <WindowLevelSettings
                windowWidth={windowWidth}
                windowCenter={windowCenter}
                onWindowLevelChange={onWindowLevelChange}
                modality={modality}
              />
            )}

            {activeTool && ['Brush', 'Eraser'].includes(activeTool) && (
              <BrushSettings
                brushSize={brushSize}
                onBrushSizeChange={onBrushSizeChange}
                brushOpacity={brushOpacity}
                onBrushOpacityChange={onBrushOpacityChange}
              />
            )}

            {activeTool && ['Zoom', 'Pan'].includes(activeTool) && (
              <ZoomPanSettings onResetView={onResetView} />
            )}

            {activeTool && ['Length', 'RectangleROI', 'EllipticalROI', 'Angle', 'Bidirectional'].includes(activeTool) && (
              <MeasurementSettings />
            )}

            {(!activeTool || !['WindowLevel', 'Brush', 'Eraser', 'Zoom', 'Pan', 'Length', 'RectangleROI', 'EllipticalROI', 'Angle', 'Bidirectional'].includes(activeTool)) && (
              <DefaultInfo
                currentSlice={currentSlice}
                totalSlices={totalSlices}
                zoom={zoom}
                windowWidth={windowWidth}
                windowCenter={windowCenter}
                onResetView={onResetView}
                onToggleRuler={onToggleRuler}
                onCenterImage={onCenterImage}
              />
            )}
          </>
        )}

        {/* Annotations Tab */}
        {activeTab === 'annotations' && (
          <AnnotationsPanel
            seriesInstanceUID={seriesInstanceUID}
            onDeleteAnnotation={onDeleteAnnotation}
          />
        )}

        {/* Labels Tab - Using Phase 6 LabelManagementPanel */}
        {activeTab === 'labels' && (
          <LabelManagementPanel className="bg-transparent" />
        )}

        {/* Advanced Tab - Phase 1-6 Tools */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Progress Panel (Phase 3/6) - Shows progress tracking */}
            <div className="border border-[#30363D] rounded-lg overflow-hidden">
              <AnnotationProgressPanel
                totalSlices={totalSlices || 1}
                currentSlice={currentSlice || 0}
                className="bg-transparent"
              />
            </div>

            {/* Brush Settings Panel - Only show when brush/eraser active */}
            <div className="border border-[#30363D] rounded-lg overflow-hidden">
              <BrushSettingsPanel />
            </div>

            {/* Mask Operations Panel */}
            <div className="border border-[#30363D] rounded-lg overflow-hidden">
              <MaskOperationsPanel
                onMorphOperation={executeMorphOperation}
                onClearAll={clearAll}
                onInvert={invertMask}
                hasAnnotations={sliceHasAnnotations}
                morphRadius={morphRadius}
                onMorphRadiusChange={setMorphRadius}
              />
            </div>

            {/* Annotation Persistence Panel (Phase 2) - Save/Export */}
            <div className="border border-[#30363D] rounded-lg overflow-hidden">
              <AnnotationPersistencePanel 
                studyUid={studyInstanceUID || ''}
                seriesUid={seriesInstanceUID || ''}
                totalSlices={totalSlices}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
