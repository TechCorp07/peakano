/**
 * Frame-Aware Image IDs Hook
 * Generates imageIds that properly handle multi-frame DICOM files
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateImageIdsFromDicom, getCachedFrameInfo, type DicomFrameInfo } from './frameDetection';

export interface FrameAwareImageIdsResult {
  /** Array of imageIds (one per frame/slice) */
  imageIds: string[];
  /** Total number of frames/slices */
  totalFrames: number;
  /** Whether the images are still loading */
  isLoading: boolean;
  /** Error if any occurred during loading */
  error: Error | null;
  /** Frame info for the primary DICOM file */
  frameInfo: DicomFrameInfo | null;
  /** Force refresh the imageIds */
  refresh: () => void;
}

/**
 * Hook to generate frame-aware imageIds from DICOM file URLs
 * Automatically detects multi-frame DICOM files and generates appropriate imageIds
 *
 * @param fileUrls - Array of DICOM file URLs (without wadouri: prefix)
 * @param enabled - Whether to enable loading (default: true)
 * @returns FrameAwareImageIdsResult
 */
export function useFrameAwareImageIds(
  fileUrls: string[],
  enabled: boolean = true
): FrameAwareImageIdsResult {
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [frameInfo, setFrameInfo] = useState<DicomFrameInfo | null>(null);

  // Track previous URLs to avoid unnecessary re-fetches
  const prevUrlsRef = useRef<string>('');
  const loadingRef = useRef(false);

  const loadImageIds = useCallback(async () => {
    console.log('[useFrameAwareImageIds] loadImageIds called, enabled:', enabled, 'fileUrls:', fileUrls);

    if (!enabled || fileUrls.length === 0) {
      console.log('[useFrameAwareImageIds] Skipping - not enabled or no URLs');
      setImageIds([]);
      setTotalFrames(0);
      setFrameInfo(null);
      return;
    }

    const urlsKey = JSON.stringify(fileUrls);
    if (urlsKey === prevUrlsRef.current && imageIds.length > 0) {
      console.log('[useFrameAwareImageIds] Skipping - already loaded these URLs');
      return; // Already loaded these URLs
    }

    if (loadingRef.current) {
      console.log('[useFrameAwareImageIds] Skipping - already loading');
      return; // Already loading
    }

    console.log('[useFrameAwareImageIds] Starting to load imageIds for', fileUrls.length, 'URLs');
    loadingRef.current = true;
    prevUrlsRef.current = urlsKey;
    setIsLoading(true);
    setError(null);

    try {
      // Deduplicate URLs to avoid generating duplicate frame sets
      const uniqueUrls = [...new Set(fileUrls)];
      console.log('[useFrameAwareImageIds] Unique URLs:', uniqueUrls);

      // For each unique URL, fetch frame info and generate imageIds
      const allImageIds: string[] = [];
      let primaryFrameInfo: DicomFrameInfo | null = null;

      for (const url of uniqueUrls) {
        const ids = await generateImageIdsFromDicom(url);
        allImageIds.push(...ids);

        // Store frame info from first file
        if (!primaryFrameInfo) {
          primaryFrameInfo = await getCachedFrameInfo(url);
        }
      }

      console.log('[useFrameAwareImageIds] Successfully generated', allImageIds.length, 'imageIds');
      setImageIds(allImageIds);
      setTotalFrames(allImageIds.length);
      setFrameInfo(primaryFrameInfo);
    } catch (err) {
      console.error('[useFrameAwareImageIds] Error loading imageIds:', err);
      setError(err instanceof Error ? err : new Error('Failed to load DICOM frames'));

      // Fallback: generate simple imageIds without frame detection
      const fallbackIds = fileUrls.map(url => `wadouri:${url}`);
      console.log('[useFrameAwareImageIds] Using fallback, generated', fallbackIds.length, 'imageIds');
      setImageIds(fallbackIds);
      setTotalFrames(fallbackIds.length);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [fileUrls, enabled, imageIds.length]);

  useEffect(() => {
    loadImageIds();
  }, [loadImageIds]);

  const refresh = useCallback(() => {
    prevUrlsRef.current = ''; // Reset cache key to force reload
    loadImageIds();
  }, [loadImageIds]);

  return {
    imageIds,
    totalFrames,
    isLoading,
    error,
    frameInfo,
    refresh,
  };
}

/**
 * Simpler version that just returns imageIds from static/local instance data
 * with frame detection for each file
 */
export function useStaticFrameAwareImageIds(
  instances: Array<{ _staticUrl?: string; _localUrl?: string }>,
  enabled: boolean = true
): FrameAwareImageIdsResult {
  // Extract URLs from instances
  const fileUrls = instances
    .map(inst => {
      if (inst._staticUrl) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}${inst._staticUrl}`;
      }
      if (inst._localUrl) {
        return inst._localUrl;
      }
      return '';
    })
    .filter(url => url !== '');

  return useFrameAwareImageIds(fileUrls, enabled);
}
