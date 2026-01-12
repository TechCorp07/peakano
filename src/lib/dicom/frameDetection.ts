/**
 * DICOM Frame Detection Utility
 * Parses DICOM files to detect multi-frame images and generate frame-aware imageIds
 */

import dicomParser from 'dicom-parser';

/**
 * DICOM metadata extracted from file header
 */
export interface DicomFrameInfo {
  /** Number of frames in the DICOM file (1 for single-frame) */
  numberOfFrames: number;
  /** Rows (height) of each frame */
  rows: number;
  /** Columns (width) of each frame */
  columns: number;
  /** Modality (CT, MR, etc.) */
  modality?: string;
  /** Series description */
  seriesDescription?: string;
  /** SOP Instance UID */
  sopInstanceUID?: string;
  /** Series Instance UID */
  seriesInstanceUID?: string;
  /** Study Instance UID */
  studyInstanceUID?: string;
  /** Patient name */
  patientName?: string;
  /** Patient ID */
  patientId?: string;
  /** Window center (for display) */
  windowCenter?: number;
  /** Window width (for display) */
  windowWidth?: number;
  /** Bits allocated per pixel */
  bitsAllocated?: number;
  /** Bits stored per pixel */
  bitsStored?: number;
}

/**
 * Parse a DICOM file and extract frame information
 * @param arrayBuffer - The DICOM file as an ArrayBuffer
 * @returns DicomFrameInfo with extracted metadata
 */
export function parseDicomFrameInfo(arrayBuffer: ArrayBuffer): DicomFrameInfo {
  console.log('[FrameDetection] parseDicomFrameInfo called, buffer size:', arrayBuffer.byteLength);

  const byteArray = new Uint8Array(arrayBuffer);
  const dataSet = dicomParser.parseDicom(byteArray);

  // Extract NumberOfFrames (0028,0008) - defaults to 1 if not present
  const numberOfFramesStr = dataSet.string('x00280008');
  const numberOfFrames = numberOfFramesStr ? parseInt(numberOfFramesStr, 10) : 1;

  console.log('[FrameDetection] NumberOfFrames tag (0028,0008):', numberOfFramesStr, '-> parsed:', numberOfFrames);

  // Also check pixel data length to estimate frames if NumberOfFrames is missing
  const pixelDataElement = dataSet.elements.x7fe00010;
  if (pixelDataElement) {
    console.log('[FrameDetection] PixelData element found, length:', pixelDataElement.length);
  } else {
    console.log('[FrameDetection] PixelData element NOT found');
  }

  // Extract image dimensions
  const rows = dataSet.uint16('x00280010') || 0;
  const columns = dataSet.uint16('x00280011') || 0;

  // Extract modality
  const modality = dataSet.string('x00080060');

  // Extract series description
  const seriesDescription = dataSet.string('x0008103e');

  // Extract UIDs
  const sopInstanceUID = dataSet.string('x00080018');
  const seriesInstanceUID = dataSet.string('x0020000e');
  const studyInstanceUID = dataSet.string('x0020000d');

  // Extract patient info
  const patientName = dataSet.string('x00100010');
  const patientId = dataSet.string('x00100020');

  // Extract window/level
  const windowCenterStr = dataSet.string('x00281050');
  const windowWidthStr = dataSet.string('x00281051');
  const windowCenter = windowCenterStr ? parseFloat(windowCenterStr.split('\\')[0]) : undefined;
  const windowWidth = windowWidthStr ? parseFloat(windowWidthStr.split('\\')[0]) : undefined;

  // Extract bit depth
  const bitsAllocated = dataSet.uint16('x00280100');
  const bitsStored = dataSet.uint16('x00280101');

  console.log('[FrameDetection] Extracted metadata:', {
    numberOfFrames,
    rows,
    columns,
    modality,
    bitsAllocated,
    bitsStored,
  });

  return {
    numberOfFrames,
    rows,
    columns,
    modality,
    seriesDescription,
    sopInstanceUID,
    seriesInstanceUID,
    studyInstanceUID,
    patientName,
    patientId,
    windowCenter,
    windowWidth,
    bitsAllocated,
    bitsStored,
  };
}

/**
 * Fetch a DICOM file and parse its frame information
 * @param url - URL to the DICOM file
 * @returns Promise<DicomFrameInfo>
 */
export async function fetchDicomFrameInfo(url: string): Promise<DicomFrameInfo> {
  console.log('[FrameDetection] fetchDicomFrameInfo called for URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    console.error('[FrameDetection] Fetch failed:', response.status, response.statusText);
    throw new Error(`Failed to fetch DICOM file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  console.log('[FrameDetection] Fetch successful, arrayBuffer size:', arrayBuffer.byteLength);

  return parseDicomFrameInfo(arrayBuffer);
}

/**
 * Generate frame-aware imageIds for a DICOM file
 * @param baseUrl - Base URL to the DICOM file (without wadouri: prefix)
 * @param numberOfFrames - Number of frames in the file
 * @returns Array of imageIds, one per frame
 */
export function generateFrameImageIds(baseUrl: string, numberOfFrames: number): string[] {
  if (numberOfFrames <= 1) {
    // Single frame - no frame parameter needed
    return [`wadouri:${baseUrl}`];
  }

  // Multi-frame - generate one imageId per frame
  // Frame numbers are 1-based in DICOM
  const imageIds: string[] = [];
  for (let frame = 1; frame <= numberOfFrames; frame++) {
    imageIds.push(`wadouri:${baseUrl}?frame=${frame}`);
  }
  return imageIds;
}

/**
 * Cache for DICOM frame info to avoid re-parsing the same files
 */
const frameInfoCache = new Map<string, DicomFrameInfo>();

/**
 * Get frame info with caching
 * @param url - URL to the DICOM file
 * @returns Promise<DicomFrameInfo>
 */
export async function getCachedFrameInfo(url: string): Promise<DicomFrameInfo> {
  if (frameInfoCache.has(url)) {
    return frameInfoCache.get(url)!;
  }

  const frameInfo = await fetchDicomFrameInfo(url);
  frameInfoCache.set(url, frameInfo);
  return frameInfo;
}

/**
 * Clear the frame info cache
 */
export function clearFrameInfoCache(): void {
  frameInfoCache.clear();
}

/**
 * Generate frame-aware imageIds by fetching and parsing the DICOM file
 * This is the main entry point for generating imageIds that support multi-frame DICOM
 * @param url - URL to the DICOM file (full URL, not wadouri: prefixed)
 * @returns Promise<string[]> - Array of imageIds
 */
export async function generateImageIdsFromDicom(url: string): Promise<string[]> {
  console.log('[FrameDetection] generateImageIdsFromDicom called for URL:', url);

  try {
    const frameInfo = await getCachedFrameInfo(url);
    console.log('[FrameDetection] Frame info retrieved, numberOfFrames:', frameInfo.numberOfFrames);

    const imageIds = generateFrameImageIds(url, frameInfo.numberOfFrames);
    console.log('[FrameDetection] Generated imageIds count:', imageIds.length);
    if (imageIds.length <= 5) {
      console.log('[FrameDetection] Generated imageIds:', imageIds);
    } else {
      console.log('[FrameDetection] First 3 imageIds:', imageIds.slice(0, 3));
      console.log('[FrameDetection] Last 2 imageIds:', imageIds.slice(-2));
    }

    return imageIds;
  } catch (error) {
    console.error('[FrameDetection] Error parsing DICOM file:', error);
    // Fallback: return single imageId (assumes single frame)
    return [`wadouri:${url}`];
  }
}

/**
 * Batch generate imageIds for multiple DICOM files
 * Useful for loading a series where each file might be single or multi-frame
 * @param urls - Array of DICOM file URLs
 * @returns Promise<string[]> - Flattened array of all imageIds
 */
export async function generateImageIdsFromMultipleDicoms(urls: string[]): Promise<string[]> {
  const imageIdArrays = await Promise.all(
    urls.map(url => generateImageIdsFromDicom(url))
  );
  // Flatten the array of arrays into a single array
  return imageIdArrays.flat();
}
