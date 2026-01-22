/**
 * Smart Tools - Zustand Store
 * State management for Magic Wand, Region Growing, and Interpolation tools
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  SmartToolType,
  SmartToolState,
  MagicWandConfig,
  RegionGrowingConfig,
  InterpolationConfig,
  MagicWandResult,
  RegionGrowingResult,
  InterpolationResult,
  DEFAULT_MAGIC_WAND_CONFIG,
  DEFAULT_REGION_GROWING_CONFIG,
  DEFAULT_INTERPOLATION_CONFIG,
} from './types';

interface SmartToolActions {
  // Tool selection
  setActiveTool: (tool: SmartToolType) => void;
  
  // AI Mode toggle
  setAIMode: (enabled: boolean) => void;
  setAIAvailable: (available: boolean) => void;
  
  // Configuration updates
  setMagicWandConfig: (config: Partial<MagicWandConfig>) => void;
  setRegionGrowingConfig: (config: Partial<RegionGrowingConfig>) => void;
  setInterpolationConfig: (config: Partial<InterpolationConfig>) => void;
  
  // Processing state
  setProcessing: (isProcessing: boolean) => void;
  setResult: (result: MagicWandResult | RegionGrowingResult | InterpolationResult | null) => void;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

const defaultMagicWandConfig: MagicWandConfig = {
  tolerance: 32,
  eightConnected: true,
  maxPixels: 1000000,
  smoothEdges: true,
};

const defaultRegionGrowingConfig: RegionGrowingConfig = {
  intensityTolerance: 25,
  gradientThreshold: 50,
  maxIterations: 10000,
  minRegionSize: 10,
  useAdaptiveThreshold: true,
};

const defaultInterpolationConfig: InterpolationConfig = {
  method: 'linear',
  maxGapSlices: 10,
  autoApply: false,
  smoothingFactor: 0.5,
};

const initialState: SmartToolState = {
  activeTool: 'none',
  aiModeEnabled: false,
  aiServiceAvailable: false,
  magicWandConfig: defaultMagicWandConfig,
  regionGrowingConfig: defaultRegionGrowingConfig,
  interpolationConfig: defaultInterpolationConfig,
  isProcessing: false,
  lastResult: null,
  error: null,
};

export const useSmartToolStore = create<SmartToolState & SmartToolActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setActiveTool: (tool) => set({ activeTool: tool, error: null }),
      
      setAIMode: (enabled) => set({ aiModeEnabled: enabled }),
      
      setAIAvailable: (available) => set({ aiServiceAvailable: available }),
      
      setMagicWandConfig: (config) => set((state) => ({
        magicWandConfig: { ...state.magicWandConfig, ...config },
      })),
      
      setRegionGrowingConfig: (config) => set((state) => ({
        regionGrowingConfig: { ...state.regionGrowingConfig, ...config },
      })),
      
      setInterpolationConfig: (config) => set((state) => ({
        interpolationConfig: { ...state.interpolationConfig, ...config },
      })),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setResult: (result) => set({ lastResult: result, isProcessing: false }),
      
      setError: (error) => set({ error, isProcessing: false }),
      
      reset: () => set(initialState),
    }),
    { name: 'smart-tools' }
  )
);

// Selector hooks
export const useSmartTool = () => useSmartToolStore((state) => state.activeTool);
export const useSetSmartTool = () => useSmartToolStore((state) => state.setActiveTool);
export const useAIMode = () => useSmartToolStore((state) => state.aiModeEnabled);
export const useSetAIMode = () => useSmartToolStore((state) => state.setAIMode);
export const useAIAvailable = () => useSmartToolStore((state) => state.aiServiceAvailable);
export const useMagicWandConfig = () => useSmartToolStore((state) => state.magicWandConfig);
export const useRegionGrowingConfig = () => useSmartToolStore((state) => state.regionGrowingConfig);
export const useInterpolationConfig = () => useSmartToolStore((state) => state.interpolationConfig);
export const useSmartToolProcessing = () => useSmartToolStore((state) => state.isProcessing);
export const useSmartToolResult = () => useSmartToolStore((state) => state.lastResult);
export const useSmartToolError = () => useSmartToolStore((state) => state.error);
