/**
 * Annotation Sidebar Component
 * Integrates all annotation-related panels in a unified sidebar
 * 
 * Phase 6: Integration Panel
 * 
 * @module components/AnnotationSidebar
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  BarChart3,
  Package,
  Settings,
  Download,
  Upload,
  Save,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { LabelManagementPanel } from './LabelManagementPanel';
import { Visualization3DPanel } from './Visualization3DPanel';
import { AnnotationProgressPanel } from './AnnotationProgressPanel';
import { useAnnotationPersistence, importFromFile } from '@/lib/annotation';

// ============================================================================
// Types
// ============================================================================

interface AnnotationSidebarProps {
  studyUid?: string;
  seriesUid?: string;
  currentSlice?: number;
  totalSlices?: number;
  dimensions?: [number, number, number];
  spacing?: [number, number, number];
  className?: string;
}

type TabId = 'labels' | 'progress' | '3d' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string | number;
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-gray-400">{icon}</span>
        <span className="flex-1 text-sm font-medium text-white text-left">{title}</span>
        {badge !== undefined && (
          <span className="px-2 py-0.5 text-xs bg-blue-600/30 text-blue-300 rounded-full">
            {badge}
          </span>
        )}
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ============================================================================
// Quick Actions Component
// ============================================================================

interface QuickActionsProps {
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

function QuickActions({
  onSave,
  onExport,
  onImport,
  onClear,
  isSaving,
  saveStatus,
}: QuickActionsProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-800/50 border-b border-gray-700/50">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
      >
        <Save className="w-3.5 h-3.5" />
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors cursor-pointer">
        <Upload className="w-3.5 h-3.5" />
        Import
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport();
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>

      {!showConfirmClear ? (
        <button
          onClick={() => setShowConfirmClear(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded transition-colors ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      ) : (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-red-300">Clear all?</span>
          <button
            onClick={() => {
              onClear();
              setShowConfirmClear(false);
            }}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded"
          >
            Yes
          </button>
          <button
            onClick={() => setShowConfirmClear(false)}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
          >
            No
          </button>
        </div>
      )}

      {saveStatus === 'saved' && (
        <span className="text-xs text-green-400 ml-2">✓ Saved</span>
      )}
      {saveStatus === 'error' && (
        <span className="text-xs text-red-400 flex items-center gap-1 ml-2">
          <AlertCircle className="w-3 h-3" /> Error
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AnnotationSidebar({
  studyUid = 'default',
  seriesUid = 'default',
  currentSlice = 0,
  totalSlices = 100,
  dimensions = [512, 512, 100],
  spacing = [1, 1, 1],
  className = '',
}: AnnotationSidebarProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['labels']));

  // Persistence hook
  const {
    saveStatus,
    save,
    load,
    clear,
    exportAnnotations,
  } = useAnnotationPersistence({
    studyUid,
    seriesUid,
    autoSave: true,
    autoSaveIntervalMs: 30000,
  });

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    await save();
  }, [save]);

  const handleExport = useCallback(() => {
    try {
      // Use the export utility from persistence hook
      exportAnnotations('json');
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportAnnotations]);

  const handleImport = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await importFromFile(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, []);

  const handleClear = useCallback(async () => {
    await clear();
  }, [clear]);

  return (
    <div className={`flex flex-col bg-gray-900 border-l border-gray-700/50 h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-800/50">
        <h2 className="text-sm font-semibold text-white">Annotation Tools</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Slice {currentSlice + 1} of {totalSlices}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onClear={handleClear}
        isSaving={saveStatus === 'saving'}
        saveStatus={saveStatus === 'unsaved' ? 'idle' : saveStatus}
      />

      {/* Collapsible Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Labels Section */}
        <CollapsibleSection
          title="Labels"
          icon={<Layers className="w-4 h-4" />}
          isOpen={openSections.has('labels')}
          onToggle={() => toggleSection('labels')}
        >
          <LabelManagementPanel className="mt-2" />
        </CollapsibleSection>

        {/* Progress Section */}
        <CollapsibleSection
          title="Progress"
          icon={<BarChart3 className="w-4 h-4" />}
          isOpen={openSections.has('progress')}
          onToggle={() => toggleSection('progress')}
        >
          <AnnotationProgressPanel
            totalSlices={totalSlices}
            currentSlice={currentSlice}
            className="mt-2"
          />
        </CollapsibleSection>

        {/* 3D Visualization Section */}
        <CollapsibleSection
          title="3D Visualization"
          icon={<Package className="w-4 h-4" />}
          isOpen={openSections.has('3d')}
          onToggle={() => toggleSection('3d')}
        >
          <Visualization3DPanel
            studyUid={studyUid}
            seriesUid={seriesUid}
            dimensions={dimensions}
            spacing={spacing}
            className="mt-2"
          />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/30">
        <p className="text-xs text-gray-500 text-center">
          PeakPoint Annotation v2.0
        </p>
      </div>
    </div>
  );
}

export default AnnotationSidebar;
