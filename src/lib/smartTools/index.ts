/**
 * Smart Tools - Main Export
 * Exports all smart tool algorithms and utilities
 */

// Types
export * from './types';

// Algorithms
export { magicWandSelect, maskToAnnotationPath } from './magicWand';
export { regionGrow, multiSeedRegionGrow } from './regionGrowing';
export {
  interpolateSlices,
  canvasAnnotationsToSliceAnnotations,
  calculateSliceZCoordinates,
} from './interpolation';

// AI-Enhanced API
export {
  checkSmartToolsAvailable,
  requestAIMagicWand,
  requestAIRegionGrowing,
  requestAIInterpolation,
  getAvailableSmartTools,
  decodeRLE,
} from './api';
export type {
  SmartToolResult,
  InterpolationResult as AIInterpolationResult,
  MagicWandRequest,
  RegionGrowingRequest,
  InterpolationRequest,
} from './api';

// Store
export {
  useSmartToolStore,
  useSmartTool,
  useSetSmartTool,
  useAIMode,
  useSetAIMode,
  useAIAvailable,
  useMagicWandConfig,
  useRegionGrowingConfig,
  useInterpolationConfig,
  useSmartToolProcessing,
  useSmartToolResult,
  useSmartToolError,
} from './store';

// Hook
export { useSmartTools } from './useSmartTools';
