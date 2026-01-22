/**
 * Label Management Panel Component
 * UI for managing segmentation labels in multi-label mode
 * 
 * Phase 6: Multi-Label Segmentation UI
 * 
 * @module components/LabelManagementPanel
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Palette,
  Tag,
  Settings2,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  useMultiLabelStore,
  LABEL_PRESETS,
  type SegmentationLabel,
  type LabelPreset,
} from '@/lib/annotation/multiLabelStore';

// ============================================================================
// Types
// ============================================================================

interface LabelManagementPanelProps {
  className?: string;
  compact?: boolean;
  onLabelChange?: (labelId: number) => void;
}

interface ColorPickerProps {
  color: [number, number, number, number];
  onChange: (color: [number, number, number, number]) => void;
  onClose: () => void;
}

// ============================================================================
// Color Picker Component
// ============================================================================

const PRESET_COLORS: Array<[number, number, number, number]> = [
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 255, 0, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [255, 128, 0, 255],
  [128, 0, 255, 255],
  [255, 128, 128, 255],
  [128, 255, 128, 255],
  [128, 128, 255, 255],
  [255, 255, 128, 255],
  [128, 128, 128, 255],
  [255, 192, 203, 255],
  [139, 69, 19, 255],
  [0, 128, 128, 255],
];

function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const [r, g, b, a] = color;
  const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.replace('#', '');
    if (hex.length === 6) {
      const newR = parseInt(hex.slice(0, 2), 16);
      const newG = parseInt(hex.slice(2, 4), 16);
      const newB = parseInt(hex.slice(4, 6), 16);
      if (!isNaN(newR) && !isNaN(newG) && !isNaN(newB)) {
        onChange([newR, newG, newB, a]);
      }
    }
  };

  return (
    <div className="absolute z-50 top-full left-0 mt-1 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <div className="grid grid-cols-4 gap-1 mb-2">
        {PRESET_COLORS.map((presetColor, idx) => (
          <button
            key={idx}
            className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
            style={{ backgroundColor: `rgba(${presetColor.join(',')})` }}
            onClick={() => onChange(presetColor)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="color"
          value={hexColor}
          onChange={(e) => {
            const hex = e.target.value.replace('#', '');
            const newR = parseInt(hex.slice(0, 2), 16);
            const newG = parseInt(hex.slice(2, 4), 16);
            const newB = parseInt(hex.slice(4, 6), 16);
            onChange([newR, newG, newB, a]);
          }}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={hexColor}
          onChange={handleHexChange}
          className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="#RRGGBB"
        />
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <Check className="w-4 h-4 text-green-400" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Label Item Component
// ============================================================================

interface LabelItemProps {
  label: SegmentationLabel;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SegmentationLabel>) => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}

function LabelItem({
  label,
  isActive,
  onSelect,
  onUpdate,
  onRemove,
  onToggleVisibility,
  onToggleLock,
}: LabelItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(label.name);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(label.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
        ${isActive 
          ? 'bg-blue-600/30 border border-blue-500' 
          : 'bg-gray-800/50 border border-transparent hover:bg-gray-700/50'}
      `}
      onClick={onSelect}
    >
      {/* Color indicator */}
      <div className="relative">
        <button
          className="w-6 h-6 rounded-full border-2 border-gray-600 hover:scale-110 transition-transform"
          style={{ backgroundColor: `rgba(${label.color.join(',')})` }}
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          title="Change color"
        />
        {showColorPicker && (
          <ColorPicker
            color={label.color}
            onChange={(color) => onUpdate({ color })}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </div>

      {/* Label name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-0.5 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            autoFocus
          />
        ) : (
          <div
            className="flex items-center gap-1"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <span className="text-sm text-white truncate">{label.name}</span>
            {label.shortcut && (
              <span className="text-xs text-gray-500 bg-gray-700 px-1 rounded">
                {label.shortcut}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={`p-1 rounded hover:bg-gray-600 ${!label.visible ? 'text-gray-500' : 'text-gray-300'}`}
          title={label.visible ? 'Hide label' : 'Show label'}
        >
          {label.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className={`p-1 rounded hover:bg-gray-600 ${label.locked ? 'text-yellow-500' : 'text-gray-300'}`}
          title={label.locked ? 'Unlock label' : 'Lock label'}
        >
          {label.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {label.id !== 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded hover:bg-red-600/50 text-gray-300 hover:text-red-400"
            title="Remove label"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Preset Selector Component
// ============================================================================

interface PresetSelectorProps {
  onApply: (preset: LabelPreset) => void;
  onClose: () => void;
}

function PresetSelector({ onApply, onClose }: PresetSelectorProps) {
  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-64 p-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <div className="text-xs text-gray-400 px-2 py-1 mb-1">Apply Preset</div>
      {Object.entries(LABEL_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          onClick={() => {
            onApply(preset);
            onClose();
          }}
          className="w-full flex flex-col items-start p-2 rounded hover:bg-gray-700 text-left"
        >
          <span className="text-sm text-white">{preset.name}</span>
          <span className="text-xs text-gray-400">{preset.description}</span>
          <div className="flex gap-1 mt-1">
            {preset.labels.slice(0, 5).map((label, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `rgba(${label.color.join(',')})` }}
              />
            ))}
            {preset.labels.length > 5 && (
              <span className="text-xs text-gray-500">+{preset.labels.length - 5}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Settings Panel Component
// ============================================================================

interface SettingsPanelProps {
  opacity: number;
  outlineMode: boolean;
  outlineWidth: number;
  onOpacityChange: (opacity: number) => void;
  onToggleOutline: () => void;
  onOutlineWidthChange: (width: number) => void;
}

function SettingsPanel({
  opacity,
  outlineMode,
  outlineWidth,
  onOpacityChange,
  onToggleOutline,
  onOutlineWidthChange,
}: SettingsPanelProps) {
  return (
    <div className="p-3 bg-gray-800/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Opacity</span>
        <span className="text-xs text-white">{Math.round(opacity * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={opacity * 100}
        onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />

      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
        <span className="text-xs text-gray-400">Outline Mode</span>
        <button
          onClick={onToggleOutline}
          className={`px-2 py-1 text-xs rounded ${outlineMode ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          {outlineMode ? 'On' : 'Off'}
        </button>
      </div>

      {outlineMode && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Width</span>
          <input
            type="number"
            min="1"
            max="10"
            value={outlineWidth}
            onChange={(e) => onOutlineWidthChange(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LabelManagementPanel({
  className = '',
  compact = false,
  onLabelChange,
}: LabelManagementPanelProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);

  // Get labels Map from store (stable reference)
  const labelsMap = useMultiLabelStore((state) => state.labels);
  const activeLabelId = useMultiLabelStore((state) => state.activeLabelId);
  
  // Derive labels array with useMemo for stable reference
  const labels = useMemo(() => Array.from(labelsMap.values()).sort((a, b) => a.id - b.id), [labelsMap]);
  const activeLabel = useMemo(() => labelsMap.get(activeLabelId), [labelsMap, activeLabelId]);

  const {
    labelOpacity,
    outlineMode,
    outlineWidth,
    addLabel,
    removeLabel,
    updateLabel,
    setActiveLabel,
    toggleLabelVisibility,
    toggleLabelLock,
    setLabelOpacity,
    toggleOutlineMode,
    setOutlineWidth,
    applyPreset,
    clearAllLabels,
  } = useMultiLabelStore();

  const handleAddLabel = useCallback(() => {
    if (newLabelName.trim()) {
      const newId = addLabel(newLabelName.trim());
      setNewLabelName('');
      setIsAddingLabel(false);
      onLabelChange?.(newId);
    }
  }, [newLabelName, addLabel, onLabelChange]);

  const handleSelectLabel = useCallback((labelId: number) => {
    setActiveLabel(labelId);
    onLabelChange?.(labelId);
  }, [setActiveLabel, onLabelChange]);

  return (
    <div className={`flex flex-col gap-3 p-3 bg-gray-900/80 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" />
          Labels
        </h3>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              title="Apply preset"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showPresets && (
              <PresetSelector
                onApply={(preset) => {
                  applyPreset(preset);
                  onLabelChange?.(1);
                }}
                onClose={() => setShowPresets(false)}
              />
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded hover:bg-gray-700 ${showSettings ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all labels and reset to default?')) {
                clearAllLabels();
                onLabelChange?.(1);
              }
            }}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
            title="Reset labels"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          opacity={labelOpacity}
          outlineMode={outlineMode}
          outlineWidth={outlineWidth}
          onOpacityChange={setLabelOpacity}
          onToggleOutline={toggleOutlineMode}
          onOutlineWidthChange={setOutlineWidth}
        />
      )}

      {/* Active Label Info */}
      {activeLabel && !compact && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-600/20 rounded border border-blue-500/30">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: `rgba(${activeLabel.color.join(',')})` }}
          />
          <span className="text-xs text-blue-300">Active: {activeLabel.name}</span>
        </div>
      )}

      {/* Labels List */}
      <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
        {labels.map((label) => (
          <LabelItem
            key={label.id}
            label={label}
            isActive={label.id === activeLabelId}
            onSelect={() => handleSelectLabel(label.id)}
            onUpdate={(updates) => updateLabel(label.id, updates)}
            onRemove={() => removeLabel(label.id)}
            onToggleVisibility={() => toggleLabelVisibility(label.id)}
            onToggleLock={() => toggleLabelLock(label.id)}
          />
        ))}
      </div>

      {/* Add Label */}
      {isAddingLabel ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLabel();
              if (e.key === 'Escape') setIsAddingLabel(false);
            }}
            placeholder="Label name"
            className="flex-1 px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500"
            autoFocus
          />
          <button
            onClick={handleAddLabel}
            className="p-1.5 rounded bg-green-600 hover:bg-green-500 text-white"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAddingLabel(false);
              setNewLabelName('');
            }}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingLabel(true)}
          className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Label</span>
        </button>
      )}

      {/* Label Count */}
      <div className="text-xs text-gray-500 text-center">
        {labels.length} label{labels.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default LabelManagementPanel;
