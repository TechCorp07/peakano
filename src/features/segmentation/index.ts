/**
 * Segmentation Feature
 * Export all segmentation-related modules
 */

// Store
export {
  useSegmentationStore,
  useBrushSize,
  useBrushOpacity,
  useIsEraserMode,
  useActiveLayerId,
  useSelectedLabelId,
  type SegmentationLayer,
} from './store';

// Hooks
export { useSegmentation } from './hooks';
