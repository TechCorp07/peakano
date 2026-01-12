/**
 * DICOM Utilities
 * Frame detection and image ID generation for multi-frame DICOM support
 */

export {
  parseDicomFrameInfo,
  fetchDicomFrameInfo,
  generateFrameImageIds,
  getCachedFrameInfo,
  clearFrameInfoCache,
  generateImageIdsFromDicom,
  generateImageIdsFromMultipleDicoms,
  type DicomFrameInfo,
} from './frameDetection';

export {
  useFrameAwareImageIds,
  useStaticFrameAwareImageIds,
  type FrameAwareImageIdsResult,
} from './useFrameAwareImageIds';
