/**
 * Annotation Library - Main Export
 * Exports all annotation tools and utilities
 */

// Mask Operations
export {
  // Types
  type BinaryMask,
  type MaskOperationResult,
  
  // Boolean Operations
  maskUnion,
  maskSubtract,
  maskIntersect,
  maskXor,
  maskInvert,
  
  // Morphological Operations
  maskDilate,
  maskErode,
  maskOpen,
  maskClose,
  maskFillHoles,
  maskBoundary,
  
  // Utilities
  maskUnionMultiple,
  createEmptyMask,
  createMaskFromPolygon,
  maskToContours,
} from './maskOperations';

// Threshold Segmentation
export {
  type ThresholdConfig,
  type ThresholdResult,
  type AdaptiveThresholdConfig,
  thresholdSegment,
  adaptiveThreshold,
  otsuThreshold,
  calculateHistogram,
  multiOtsuThreshold,
  hysteresisThreshold,
} from './thresholdSegmentation';

// Brush Tools
export {
  type BrushConfig,
  type Brush3DConfig,
  type AdaptiveBrushConfig,
  type BrushStroke,
  type BrushPreset,
  DEFAULT_BRUSH_PRESETS,
  generateBrushMask,
  applyBrushStroke,
  apply3DBrushStroke,
  createAdaptiveBrush,
  applyAdaptiveBrushStroke,
  interpolateStrokePoints,
  smoothStrokePath,
  brushStamp,
} from './brushTools';

// Measurement Tools
export {
  type MeasurementResult,
  type VolumeResult,
  type PixelSpacing,
  type DistanceMeasurement,
  type AngleMeasurement,
  type ExportFormat,
  type MeasurementExportEntry,
  calculateArea,
  calculateVolume,
  calculatePerimeter,
  calculateCentroid,
  calculateBoundingBox,
  calculateMeasurements,
  calculateDistance,
  calculateAngle,
  exportMeasurements,
  createMeasurementDownload,
  formatMeasurement,
  formatArea,
  formatVolume,
} from './measurementTools';

// Store
export {
  type AnnotationToolType,
  type SegmentToolType,
  type MaskOperationType,
  type AnnotationToolsState,
  type AnnotationToolsActions,
  useAnnotationToolsStore,
  useActiveTool,
  useBrushConfig,
  useBrush3DConfig,
  useAdaptiveBrushConfig,
  useThresholdConfig,
  useMaskOperationMode,
  useHasSelection,
  useCanUndo,
  useCanRedo,
  useIsProcessing,
} from './store';

// Mask Operations Hook
export { useMaskOperations } from './useMaskOperations';

// Persistence (Phase 2)
export {
  // Types
  type SerializableAnnotation,
  type AnnotationSession,
  type AutoSaveConfig,
  
  // Serialization
  serializeAnnotation,
  deserializeAnnotation,
  serializeSession,
  deserializeSession,
  
  // LocalStorage Operations
  saveToLocalStorage,
  loadFromLocalStorage,
  hasLocalStorageAnnotations,
  deleteFromLocalStorage,
  getAllLocalStorageSessions,
  
  // Export Functions
  exportAsJSON,
  exportAsCSV,
  exportContoursAsCSV,
  createDownloadBlob,
  downloadFile,
  exportAndDownload,
  
  // Import Functions
  importFromJSON,
  importFromFile,
  
  // DICOM SEG (placeholder)
  type DicomSegExportOptions,
  exportAsDicomSeg,
  
  // Auto-Save
  AutoSaveManager,
  getAutoSaveManager,
} from './persistence';

// Persistence Hook
export {
  type SaveStatus,
  type PersistenceState,
  type UsePersistenceOptions,
  type UsePersistenceReturn,
  useAnnotationPersistence,
} from './useAnnotationPersistence';

// Progress Tracking (Phase 3)
export {
  // Types
  type SliceProgress,
  type AnnotationStats,
  type SliceStats,
  type StudyProgress,
  type ProgressUpdateEvent,
  type SliceIndicator,
  type AnnotationRequirements,
  
  // Calculation Functions
  calculateSliceProgress,
  calculateAnnotationStats,
  calculateSliceStats,
  calculateStudyProgress,
  
  // Visualization Helpers
  generateSliceIndicators,
  getSliceIndicatorColor,
  formatProgress,
  formatAnnotationCount,
  formatAreaDisplay,
  
  // Summary & Validation
  generateProgressSummary,
  checkRequirements,
} from './progressTracking';

// Progress Tracking Hook
export {
  type UseProgressTrackingOptions,
  type UseProgressTrackingResult,
  useProgressTracking,
} from './useProgressTracking';

// 3D Labelmap (Phase 4)
export {
  // Types
  type Labelmap3D,
  type LabelInfo,
  type LabelmapOptions,
  type Segment,
  type LabelmapStats,
  type CornerstoneSegmentationData,
  
  // Creation Functions
  createEmptyLabelmap,
  annotationsToLabelmap,
  
  // Labelmap Operations
  getLabelmapStats,
  extractLabel,
  mergeLabelmaps,
  getLabelmapSlice,
  setLabelmapSlice,
  
  // Cornerstone3D Integration
  toCornerstoneSegmentation,
  fromCornerstoneVolume,
} from './labelmap3D';

// Volume Rendering (Phase 4)
export {
  // Types
  type ColorPoint,
  type OpacityPoint,
  type VolumeRenderConfig,
  type SegmentationDisplayConfig,
  type SegmentDisplayConfig,
  type CornerstoneSegmentationRepresentationConfig,
  type SegmentColorLUT,
  type CameraPreset,
  
  // Default Configurations
  DEFAULT_LABELMAP_RENDER_CONFIG,
  DEFAULT_SEGMENTATION_DISPLAY,
  SEGMENTATION_COLORS,
  
  // Color & Transfer Functions
  getLabelColor,
  createColorTransferFunction,
  createOpacityTransferFunction,
  interpolateColor,
  
  // Cornerstone3D Integration
  createCornerstoneSegmentationConfig,
  createSegmentColorLUT,
  generateDefaultColorLUT,
  
  // Presets
  PRESET_CT_SOFT_TISSUE,
  PRESET_MRI_BRAIN,
  PRESET_MIP,
  
  // Camera
  CAMERA_PRESETS,
  calculateVolumeCenter,
} from './volumeRendering';

// MPR Overlay (Phase 4)
export {
  // Types
  type MPROrientation,
  type MPRSlice,
  type CrossReferenceLine,
  type MPROverlayConfig,
  type MPRViewState,
  
  // Default Configuration
  DEFAULT_MPR_CONFIG,
  ORIENTATION_LABELS,
  
  // Slice Extraction
  extractAxialSlice,
  extractSagittalSlice,
  extractCoronalSlice,
  extractMPRSlice,
  
  // Cross-Reference
  calculateCrossReferenceLines,
  
  // Overlay Rendering
  createMPROverlayImage,
  drawMPROverlay,
  drawCrossReferenceLines,
  drawOrientationLabels,
  
  // View State
  createDefaultMPRState,
  getSliceRange,
  updateSliceIndex,
  
  // Coordinate Conversion
  imageToWorld,
  worldToImage,
} from './mprOverlay';

// DICOM SEG Export (Phase 6)
export {
  // Types
  type DicomSegment,
  type DicomSegResult,
  type DicomDataset,
  
  // Constants
  ANATOMIC_REGIONS,
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  SEGMENTATION_SOP_CLASS_UID,
  
  // Export Functions
  generateDicomSeg,
  exportAsDicomSegBlob,
  downloadDicomSeg,
  createDcmjsSegmentationConfig,
} from './dicomSegExport';

// Multi-Label Segmentation Store (Phase 6)
export {
  // Types
  type SegmentationLabel,
  type LabelPreset,
  type MultiLabelState,
  type MultiLabelActions,
  
  // Presets
  LABEL_PRESETS,
  
  // Store
  useMultiLabelStore,
  
  // Selector Hooks (use with useMemo for array/object selectors)
  useLabels,
  useActiveLabelId,
  useLabelOpacity,
  useOutlineMode,
  useMultiLabelEnabled,
  
  // Utilities
  getActiveLabelColor,
  getLabelIdFromShortcut,
  canEditLabel,
} from './multiLabelStore';
