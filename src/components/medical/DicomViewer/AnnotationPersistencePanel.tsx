/**
 * AnnotationPersistencePanel
 * UI component for annotation save/load/export controls
 * 
 * Features:
 * - Save status indicator
 * - Manual save button
 * - Export dropdown (JSON, CSV)
 * - Import button
 * - Clear annotations button
 * - Progress indicator showing annotated slices
 */

'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Save,
  Download,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  FileJson,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAnnotationPersistence, type SaveStatus } from '@/lib/annotation';

interface AnnotationPersistencePanelProps {
  studyUid: string;
  seriesUid: string;
  userId?: string;
  viewportId?: string;
  totalSlices?: number;
  className?: string;
}

export default function AnnotationPersistencePanel({
  studyUid,
  seriesUid,
  userId,
  viewportId = 'main-viewport',
  totalSlices = 0,
  className,
}: AnnotationPersistencePanelProps) {
  const {
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    isLoading,
    error,
    annotatedSlices,
    totalAnnotations,
    save,
    load,
    clear,
    exportAnnotations,
    importAnnotations,
  } = useAnnotationPersistence({
    studyUid,
    seriesUid,
    userId,
    viewportId,
    autoSave: true,
    autoLoadOnMount: true,
  });

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status icon based on save state
  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'saved':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'unsaved':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Save className="h-4 w-4 text-[#8B949E]" />;
    }
  };

  // Status text
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return 'No changes';
    }
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSavedAt.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastSavedAt.toLocaleDateString();
  };

  // Handle file import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importAnnotations(file);
      e.target.value = ''; // Reset input
    }
  };

  // Handle clear with confirmation
  const handleClear = () => {
    if (showClearConfirm) {
      clear();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  // Calculate progress percentage
  const progressPercent = totalSlices > 0 
    ? Math.round((annotatedSlices.length / totalSlices) * 100) 
    : 0;

  return (
    <div className={cn('flex flex-col gap-3 p-3 bg-[#161B22] rounded-lg border border-[#30363D]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Annotations</h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-[#8B949E]">{getStatusText()}</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0D1117] rounded p-2">
          <div className="text-[#8B949E]">Total Annotations</div>
          <div className="text-white font-medium">{totalAnnotations}</div>
        </div>
        <div className="bg-[#0D1117] rounded p-2">
          <div className="text-[#8B949E]">Annotated Slices</div>
          <div className="text-white font-medium">
            {annotatedSlices.length}{totalSlices > 0 ? ` / ${totalSlices}` : ''}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalSlices > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#8B949E]">Progress</span>
            <span className="text-white">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Saved */}
      <div className="text-xs text-[#8B949E]">
        Last saved: {formatLastSaved()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 rounded p-2">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Save Button */}
        <button
          onClick={() => save()}
          disabled={isLoading || saveStatus === 'saving'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            hasUnsavedChanges
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-[#21262D] hover:bg-[#30363D] text-[#8B949E]'
          )}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={totalAnnotations === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              'bg-[#21262D] hover:bg-[#30363D] text-[#8B949E]',
              totalAnnotations === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Download className="h-3 w-3" />
            Export
            <ChevronDown className="h-3 w-3" />
          </button>

          {showExportMenu && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-[#21262D] border border-[#30363D] rounded shadow-lg z-10">
              <button
                onClick={() => {
                  exportAnnotations('json');
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-[#30363D] text-[#C9D1D9]"
              >
                <FileJson className="h-3 w-3" />
                Export as JSON
              </button>
              <button
                onClick={() => {
                  exportAnnotations('csv');
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-[#30363D] text-[#C9D1D9]"
              >
                <FileText className="h-3 w-3" />
                Export as CSV
              </button>
              <button
                onClick={() => {
                  exportAnnotations('contours-csv');
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-[#30363D] text-[#C9D1D9]"
              >
                <FileText className="h-3 w-3" />
                Export Contours
              </button>
            </div>
          )}
        </div>

        {/* Import Button */}
        <button
          onClick={handleImportClick}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] transition-colors"
        >
          <Upload className="h-3 w-3" />
          Import
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={totalAnnotations === 0 && !hasUnsavedChanges}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            showClearConfirm
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-[#21262D] hover:bg-[#30363D] text-[#8B949E]',
            (totalAnnotations === 0 && !hasUnsavedChanges) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Trash2 className="h-3 w-3" />
          {showClearConfirm ? 'Confirm Clear' : 'Clear'}
        </button>
      </div>

      {/* Annotated Slices Preview */}
      {annotatedSlices.length > 0 && annotatedSlices.length <= 20 && (
        <div className="text-xs">
          <div className="text-[#8B949E] mb-1">Annotated slices:</div>
          <div className="flex flex-wrap gap-1">
            {annotatedSlices.map(slice => (
              <span 
                key={slice}
                className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded"
              >
                {slice}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
