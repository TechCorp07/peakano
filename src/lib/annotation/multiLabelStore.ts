/**
 * Multi-Label Segmentation Store
 * Manages multiple segmentation labels/classes
 * 
 * Phase 6: Multi-Label Segmentation
 * - Label/class management
 * - Active label selection
 * - Label visibility and locking
 * - Label color assignment
 * 
 * @module annotation/multiLabelStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { SEGMENTATION_COLORS } from './volumeRendering';

// ============================================================================
// Types
// ============================================================================

/**
 * Segmentation label definition
 */
export interface SegmentationLabel {
  /** Unique label ID (1-based, 0 is reserved for background) */
  id: number;
  
  /** Label name */
  name: string;
  
  /** Label color RGBA (0-255) */
  color: [number, number, number, number];
  
  /** Whether label is visible */
  visible: boolean;
  
  /** Whether label is locked (cannot be edited) */
  locked: boolean;
  
  /** Label description */
  description?: string;
  
  /** Keyboard shortcut (1-9) */
  shortcut?: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Label preset for quick setup
 */
export interface LabelPreset {
  name: string;
  description: string;
  labels: Array<{
    name: string;
    color: [number, number, number, number];
    description?: string;
  }>;
}

/**
 * Multi-label store state
 */
export interface MultiLabelState {
  /** All defined labels */
  labels: Map<number, SegmentationLabel>;
  
  /** Currently active label ID for drawing */
  activeLabelId: number;
  
  /** Next available label ID */
  nextLabelId: number;
  
  /** Whether multi-label mode is enabled */
  multiLabelEnabled: boolean;
  
  /** Label opacity (global) */
  labelOpacity: number;
  
  /** Show label outlines only */
  outlineMode: boolean;
  
  /** Outline width */
  outlineWidth: number;
}

/**
 * Multi-label store actions
 */
export interface MultiLabelActions {
  /** Add a new label */
  addLabel: (name: string, color?: [number, number, number, number]) => number;
  
  /** Remove a label */
  removeLabel: (id: number) => void;
  
  /** Update label properties */
  updateLabel: (id: number, updates: Partial<Omit<SegmentationLabel, 'id' | 'createdAt'>>) => void;
  
  /** Set active label */
  setActiveLabel: (id: number) => void;
  
  /** Toggle label visibility */
  toggleLabelVisibility: (id: number) => void;
  
  /** Toggle label lock */
  toggleLabelLock: (id: number) => void;
  
  /** Set all labels visible/hidden */
  setAllLabelsVisible: (visible: boolean) => void;
  
  /** Set label opacity */
  setLabelOpacity: (opacity: number) => void;
  
  /** Toggle outline mode */
  toggleOutlineMode: () => void;
  
  /** Set outline width */
  setOutlineWidth: (width: number) => void;
  
  /** Enable/disable multi-label mode */
  setMultiLabelEnabled: (enabled: boolean) => void;
  
  /** Apply a label preset */
  applyPreset: (preset: LabelPreset) => void;
  
  /** Clear all labels */
  clearAllLabels: () => void;
  
  /** Get label by ID */
  getLabel: (id: number) => SegmentationLabel | undefined;
  
  /** Get all labels as array */
  getLabelsArray: () => SegmentationLabel[];
  
  /** Get visible labels */
  getVisibleLabels: () => SegmentationLabel[];
  
  /** Get active label */
  getActiveLabel: () => SegmentationLabel | undefined;
}

// ============================================================================
// Default Labels
// ============================================================================

const DEFAULT_LABEL: SegmentationLabel = {
  id: 1,
  name: 'Annotation',
  color: [255, 0, 0, 255],
  visible: true,
  locked: false,
  shortcut: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// Label Presets
// ============================================================================

export const LABEL_PRESETS: Record<string, LabelPreset> = {
  BINARY: {
    name: 'Binary Segmentation',
    description: 'Simple foreground/background segmentation',
    labels: [
      { name: 'Foreground', color: [255, 0, 0, 255], description: 'Region of interest' },
    ],
  },
  
  TUMOR: {
    name: 'Tumor Segmentation',
    description: 'Tumor and necrosis segmentation',
    labels: [
      { name: 'Tumor', color: [255, 0, 0, 255], description: 'Active tumor tissue' },
      { name: 'Necrosis', color: [128, 128, 0, 255], description: 'Necrotic core' },
      { name: 'Edema', color: [0, 255, 255, 255], description: 'Peritumoral edema' },
    ],
  },
  
  BRAIN_REGIONS: {
    name: 'Brain Regions',
    description: 'Common brain structure segmentation',
    labels: [
      { name: 'Gray Matter', color: [128, 128, 128, 255] },
      { name: 'White Matter', color: [255, 255, 255, 255] },
      { name: 'CSF', color: [0, 0, 255, 255] },
      { name: 'Lesion', color: [255, 0, 0, 255] },
    ],
  },
  
  ORGANS: {
    name: 'Abdominal Organs',
    description: 'Multi-organ abdominal segmentation',
    labels: [
      { name: 'Liver', color: [139, 69, 19, 255] },
      { name: 'Spleen', color: [128, 0, 128, 255] },
      { name: 'Kidney L', color: [255, 165, 0, 255] },
      { name: 'Kidney R', color: [255, 140, 0, 255] },
      { name: 'Pancreas', color: [255, 255, 0, 255] },
      { name: 'Stomach', color: [255, 192, 203, 255] },
    ],
  },
  
  LUNG: {
    name: 'Lung Segmentation',
    description: 'Lung structure segmentation',
    labels: [
      { name: 'Left Lung', color: [0, 128, 255, 255] },
      { name: 'Right Lung', color: [0, 255, 128, 255] },
      { name: 'Nodule', color: [255, 0, 0, 255] },
      { name: 'Ground Glass', color: [255, 255, 0, 255] },
    ],
  },
  
  CARDIAC: {
    name: 'Cardiac Segmentation',
    description: 'Heart structure segmentation',
    labels: [
      { name: 'LV Myocardium', color: [255, 0, 0, 255] },
      { name: 'LV Blood Pool', color: [255, 165, 0, 255] },
      { name: 'RV Blood Pool', color: [0, 0, 255, 255] },
      { name: 'Scar', color: [255, 255, 0, 255] },
    ],
  },
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useMultiLabelStore = create<MultiLabelState & MultiLabelActions>()(
  persist(
    (set, get) => ({
      // Initial state
      labels: new Map([[1, DEFAULT_LABEL]]),
      activeLabelId: 1,
      nextLabelId: 2,
      multiLabelEnabled: true,
      labelOpacity: 0.6,
      outlineMode: false,
      outlineWidth: 2,

      // Actions
      addLabel: (name, color) => {
        const { nextLabelId, labels } = get();
        const labelColor = color || SEGMENTATION_COLORS[(nextLabelId - 1) % SEGMENTATION_COLORS.length];
        
        const newLabel: SegmentationLabel = {
          id: nextLabelId,
          name,
          color: labelColor,
          visible: true,
          locked: false,
          shortcut: nextLabelId <= 9 ? String(nextLabelId) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const newLabels = new Map(labels);
        newLabels.set(nextLabelId, newLabel);
        
        set({ labels: newLabels, nextLabelId: nextLabelId + 1 });
        return nextLabelId;
      },

      removeLabel: (id) => {
        const { labels, activeLabelId } = get();
        if (id === 1) return; // Cannot remove default label
        
        const newLabels = new Map(labels);
        newLabels.delete(id);
        
        // If removing active label, switch to first available
        let newActiveId = activeLabelId;
        if (activeLabelId === id) {
          const remaining = Array.from(newLabels.keys());
          newActiveId = remaining.length > 0 ? remaining[0] : 1;
        }
        
        set({ labels: newLabels, activeLabelId: newActiveId });
      },

      updateLabel: (id, updates) => {
        const { labels } = get();
        const label = labels.get(id);
        if (!label) return;
        
        const newLabels = new Map(labels);
        newLabels.set(id, {
          ...label,
          ...updates,
          updatedAt: new Date(),
        });
        
        set({ labels: newLabels });
      },

      setActiveLabel: (id) => {
        const { labels } = get();
        if (labels.has(id)) {
          set({ activeLabelId: id });
        }
      },

      toggleLabelVisibility: (id) => {
        const { labels } = get();
        const label = labels.get(id);
        if (!label) return;
        
        const newLabels = new Map(labels);
        newLabels.set(id, {
          ...label,
          visible: !label.visible,
          updatedAt: new Date(),
        });
        
        set({ labels: newLabels });
      },

      toggleLabelLock: (id) => {
        const { labels } = get();
        const label = labels.get(id);
        if (!label) return;
        
        const newLabels = new Map(labels);
        newLabels.set(id, {
          ...label,
          locked: !label.locked,
          updatedAt: new Date(),
        });
        
        set({ labels: newLabels });
      },

      setAllLabelsVisible: (visible) => {
        const { labels } = get();
        const newLabels = new Map(labels);
        
        newLabels.forEach((label, id) => {
          newLabels.set(id, { ...label, visible, updatedAt: new Date() });
        });
        
        set({ labels: newLabels });
      },

      setLabelOpacity: (opacity) => {
        set({ labelOpacity: Math.max(0, Math.min(1, opacity)) });
      },

      toggleOutlineMode: () => {
        set((state) => ({ outlineMode: !state.outlineMode }));
      },

      setOutlineWidth: (width) => {
        set({ outlineWidth: Math.max(1, Math.min(10, width)) });
      },

      setMultiLabelEnabled: (enabled) => {
        set({ multiLabelEnabled: enabled });
      },

      applyPreset: (preset) => {
        const newLabels = new Map<number, SegmentationLabel>();
        let labelId = 1;
        
        for (const labelDef of preset.labels) {
          newLabels.set(labelId, {
            id: labelId,
            name: labelDef.name,
            color: labelDef.color,
            visible: true,
            locked: false,
            description: labelDef.description,
            shortcut: labelId <= 9 ? String(labelId) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          labelId++;
        }
        
        set({
          labels: newLabels,
          activeLabelId: 1,
          nextLabelId: labelId,
        });
      },

      clearAllLabels: () => {
        set({
          labels: new Map([[1, DEFAULT_LABEL]]),
          activeLabelId: 1,
          nextLabelId: 2,
        });
      },

      getLabel: (id) => {
        return get().labels.get(id);
      },

      getLabelsArray: () => {
        return Array.from(get().labels.values()).sort((a, b) => a.id - b.id);
      },

      getVisibleLabels: () => {
        return Array.from(get().labels.values())
          .filter(l => l.visible)
          .sort((a, b) => a.id - b.id);
      },

      getActiveLabel: () => {
        const { labels, activeLabelId } = get();
        return labels.get(activeLabelId);
      },
    }),
    {
      name: 'multi-label-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        labels: Array.from(state.labels.entries()),
        activeLabelId: state.activeLabelId,
        nextLabelId: state.nextLabelId,
        multiLabelEnabled: state.multiLabelEnabled,
        labelOpacity: state.labelOpacity,
        outlineMode: state.outlineMode,
        outlineWidth: state.outlineWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as unknown as { labels: unknown }).labels)) {
          const labelsArray = (state as unknown as { labels: Array<[number, SegmentationLabel]> }).labels;
          state.labels = new Map(labelsArray.map(([id, label]) => [
            id,
            {
              ...label,
              createdAt: new Date(label.createdAt),
              updatedAt: new Date(label.updatedAt),
            },
          ]));
        }
      },
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

// Direct state selectors (stable references)
export const useLabels = () => useMultiLabelStore((state) => state.labels);
export const useActiveLabelId = () => useMultiLabelStore((state) => state.activeLabelId);
export const useLabelOpacity = () => useMultiLabelStore((state) => state.labelOpacity);
export const useOutlineMode = () => useMultiLabelStore((state) => state.outlineMode);
export const useMultiLabelEnabled = () => useMultiLabelStore((state) => state.multiLabelEnabled);

// Derived selectors - these need to be used with shallow comparison or in useMemo
// Use store.getState() methods for non-reactive access
export function useActiveLabel(): SegmentationLabel | undefined {
  const labels = useMultiLabelStore((state) => state.labels);
  const activeLabelId = useMultiLabelStore((state) => state.activeLabelId);
  return labels.get(activeLabelId);
}

export function useLabelsArray(): SegmentationLabel[] {
  const labels = useMultiLabelStore((state) => state.labels);
  // Use React's useMemo equivalent by depending on the Map reference
  // The Map reference only changes when labels are added/removed
  return Array.from(labels.values());
}

export function useVisibleLabels(): SegmentationLabel[] {
  const labels = useMultiLabelStore((state) => state.labels);
  return Array.from(labels.values()).filter(l => l.visible);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get color for active label (for use in drawing tools)
 */
export function getActiveLabelColor(): string {
  const state = useMultiLabelStore.getState();
  const label = state.labels.get(state.activeLabelId);
  if (!label) return 'rgba(255, 0, 0, 0.4)';
  
  const [r, g, b] = label.color;
  return `rgba(${r}, ${g}, ${b}, ${state.labelOpacity})`;
}

/**
 * Get label ID from keyboard shortcut
 */
export function getLabelIdFromShortcut(key: string): number | null {
  const state = useMultiLabelStore.getState();
  for (const [id, label] of state.labels) {
    if (label.shortcut === key) {
      return id;
    }
  }
  return null;
}

/**
 * Check if a label can be edited
 */
export function canEditLabel(labelId: number): boolean {
  const label = useMultiLabelStore.getState().labels.get(labelId);
  return label ? !label.locked : false;
}
