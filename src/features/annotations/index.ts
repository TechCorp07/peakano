/**
 * Annotations Feature
 * Export all annotation-related modules
 */

// Store
export {
  useAnnotationStore,
  useAnnotations,
  useActiveAnnotation,
  useLabels,
  useSelectedLabel,
  useAnnotationTool,
  useIsDirty,
  useCanUndo,
  useCanRedo,
} from './store';

// Hooks
export { useCornerstoneAnnotations } from './hooks';

// Types re-export for convenience
export type {
  Annotation,
  AnnotationToolType,
  AnnotationState,
  Label,
  AnnotationEvent,
  OnAnnotationChange,
} from '@/types/annotation';
