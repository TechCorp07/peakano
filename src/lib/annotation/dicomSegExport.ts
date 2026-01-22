/**
 * DICOM SEG Export
 * Exports annotations as DICOM Segmentation objects
 * 
 * Phase 6: DICOM SEG Export
 * - Standards-compliant DICOM SEG format
 * - Multi-frame segmentation support
 * - Label/segment metadata
 * 
 * @module annotation/dicomSegExport
 */

import type { Labelmap3D, LabelInfo } from './labelmap3D';

// ============================================================================
// Types
// ============================================================================

/**
 * DICOM SEG segment description
 */
export interface DicomSegment {
  /** Segment number (1-based) */
  segmentNumber: number;
  
  /** Segment label */
  segmentLabel: string;
  
  /** Segment description */
  segmentDescription?: string;
  
  /** Segment algorithm type */
  segmentAlgorithmType: 'AUTOMATIC' | 'SEMIAUTOMATIC' | 'MANUAL';
  
  /** Segment algorithm name */
  segmentAlgorithmName?: string;
  
  /** Recommended display CIELab color */
  recommendedDisplayCIELabValue?: [number, number, number];
  
  /** Recommended display RGB color */
  recommendedDisplayRGBValue?: [number, number, number];
  
  /** Anatomic region sequence */
  anatomicRegion?: {
    codeValue: string;
    codingSchemeDesignator: string;
    codeMeaning: string;
  };
  
  /** Segmented property category */
  segmentedPropertyCategory?: {
    codeValue: string;
    codingSchemeDesignator: string;
    codeMeaning: string;
  };
  
  /** Segmented property type */
  segmentedPropertyType?: {
    codeValue: string;
    codingSchemeDesignator: string;
    codeMeaning: string;
  };
}

/**
 * DICOM SEG export options
 */
export interface DicomSegExportOptions {
  /** Series description */
  seriesDescription?: string;
  
  /** Series number */
  seriesNumber?: number;
  
  /** Content creator name */
  contentCreatorName?: string;
  
  /** Content label */
  contentLabel?: string;
  
  /** Content description */
  contentDescription?: string;
  
  /** Segmentation type: BINARY or FRACTIONAL */
  segmentationType?: 'BINARY' | 'FRACTIONAL';
  
  /** Segment definitions */
  segments?: DicomSegment[];
  
  /** Include empty frames */
  includeEmptyFrames?: boolean;
  
  /** Source image UIDs for reference */
  sourceImageUIDs?: string[];
}

/**
 * DICOM dataset structure (simplified)
 */
export interface DicomDataset {
  [tag: string]: {
    vr: string;
    Value?: unknown[];
  };
}

/**
 * DICOM SEG result
 */
export interface DicomSegResult {
  /** Generated DICOM dataset */
  dataset: DicomDataset;
  
  /** Pixel data as Uint8Array */
  pixelData: Uint8Array;
  
  /** Number of frames */
  numberOfFrames: number;
  
  /** Frame information */
  frames: Array<{
    sliceIndex: number;
    segmentNumber: number;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

/** DICOM SEG SOP Class UID */
export const SEGMENTATION_SOP_CLASS_UID = '1.2.840.10008.5.1.4.1.1.66.4';

/** Implementation Class UID */
export const IMPLEMENTATION_CLASS_UID = '1.2.826.0.1.3680043.8.498.1';

/** Common anatomic region codes */
export const ANATOMIC_REGIONS = {
  BRAIN: { codeValue: 'T-A0100', codingSchemeDesignator: 'SRT', codeMeaning: 'Brain' },
  LIVER: { codeValue: 'T-62000', codingSchemeDesignator: 'SRT', codeMeaning: 'Liver' },
  LUNG: { codeValue: 'T-28000', codingSchemeDesignator: 'SRT', codeMeaning: 'Lung' },
  KIDNEY: { codeValue: 'T-71000', codingSchemeDesignator: 'SRT', codeMeaning: 'Kidney' },
  HEART: { codeValue: 'T-32000', codingSchemeDesignator: 'SRT', codeMeaning: 'Heart' },
  SPINE: { codeValue: 'T-11500', codingSchemeDesignator: 'SRT', codeMeaning: 'Spine' },
  PROSTATE: { codeValue: 'T-92000', codingSchemeDesignator: 'SRT', codeMeaning: 'Prostate' },
  BREAST: { codeValue: 'T-04000', codingSchemeDesignator: 'SRT', codeMeaning: 'Breast' },
};

/** Common property category codes */
export const PROPERTY_CATEGORIES = {
  TISSUE: { codeValue: 'T-D0050', codingSchemeDesignator: 'SRT', codeMeaning: 'Tissue' },
  MORPHOLOGICALLY_ABNORMAL: { codeValue: 'M-01000', codingSchemeDesignator: 'SRT', codeMeaning: 'Morphologically Abnormal Structure' },
  ANATOMICAL_STRUCTURE: { codeValue: 'T-D0010', codingSchemeDesignator: 'SRT', codeMeaning: 'Anatomical Structure' },
};

/** Common property type codes */
export const PROPERTY_TYPES = {
  NEOPLASM: { codeValue: 'M-80003', codingSchemeDesignator: 'SRT', codeMeaning: 'Neoplasm' },
  LESION: { codeValue: 'M-01100', codingSchemeDesignator: 'SRT', codeMeaning: 'Lesion' },
  ORGAN: { codeValue: 'T-D0010', codingSchemeDesignator: 'SRT', codeMeaning: 'Organ' },
  TUMOR: { codeValue: 'M-80000', codingSchemeDesignator: 'SRT', codeMeaning: 'Tumor' },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique UID
 */
export function generateUID(prefix: string = '1.2.826.0.1.3680043.8.498'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}.${timestamp}.${random}`;
}

/**
 * Convert RGB to CIELab
 */
export function rgbToCIELab(r: number, g: number, b: number): [number, number, number] {
  // Normalize RGB values
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  // Apply gamma correction
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  // Convert to XYZ
  const x = (rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375) / 0.95047;
  const y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750;
  const z = (rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041) / 1.08883;

  // Convert to Lab
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  const L = Math.round((116 * fy - 16) * 65535 / 100);
  const a = Math.round((500 * (fx - fy) + 128) * 65535 / 255);
  const bLab = Math.round((200 * (fy - fz) + 128) * 65535 / 255);

  return [L, a, bLab];
}

/**
 * Get current date/time in DICOM format
 */
export function getDicomDateTime(): { date: string; time: string } {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  return { date, time };
}

// ============================================================================
// DICOM SEG Generation
// ============================================================================

/**
 * Create segment sequence item
 */
function createSegmentSequenceItem(
  segment: DicomSegment,
  labelInfo?: LabelInfo
): DicomDataset {
  const color = labelInfo?.color || [255, 0, 0, 255];
  const [L, a, b] = rgbToCIELab(color[0], color[1], color[2]);

  const item: DicomDataset = {
    '00620004': { vr: 'US', Value: [segment.segmentNumber] }, // Segment Number
    '00620005': { vr: 'LO', Value: [segment.segmentLabel] }, // Segment Label
    '00620006': { vr: 'ST', Value: [segment.segmentDescription || ''] }, // Segment Description
    '00620008': { vr: 'CS', Value: [segment.segmentAlgorithmType] }, // Segment Algorithm Type
    '00620009': { vr: 'LO', Value: [segment.segmentAlgorithmName || 'Manual Annotation'] }, // Segment Algorithm Name
    '0062000D': { vr: 'US', Value: [L, a, b] }, // Recommended Display CIELab Value
  };

  // Add anatomic region if provided
  if (segment.anatomicRegion) {
    item['00082218'] = {
      vr: 'SQ',
      Value: [{
        '00080100': { vr: 'SH', Value: [segment.anatomicRegion.codeValue] },
        '00080102': { vr: 'SH', Value: [segment.anatomicRegion.codingSchemeDesignator] },
        '00080104': { vr: 'LO', Value: [segment.anatomicRegion.codeMeaning] },
      }],
    };
  }

  // Add segmented property category if provided
  if (segment.segmentedPropertyCategory) {
    item['00620003'] = {
      vr: 'SQ',
      Value: [{
        '00080100': { vr: 'SH', Value: [segment.segmentedPropertyCategory.codeValue] },
        '00080102': { vr: 'SH', Value: [segment.segmentedPropertyCategory.codingSchemeDesignator] },
        '00080104': { vr: 'LO', Value: [segment.segmentedPropertyCategory.codeMeaning] },
      }],
    };
  }

  // Add segmented property type if provided
  if (segment.segmentedPropertyType) {
    item['0062000F'] = {
      vr: 'SQ',
      Value: [{
        '00080100': { vr: 'SH', Value: [segment.segmentedPropertyType.codeValue] },
        '00080102': { vr: 'SH', Value: [segment.segmentedPropertyType.codingSchemeDesignator] },
        '00080104': { vr: 'LO', Value: [segment.segmentedPropertyType.codeMeaning] },
      }],
    };
  }

  return item;
}

/**
 * Create per-frame functional groups sequence item
 */
function createPerFrameItem(
  sliceIndex: number,
  segmentNumber: number,
  dimensions: [number, number, number],
  spacing: [number, number, number],
  origin: [number, number, number]
): DicomDataset {
  const position = [
    origin[0],
    origin[1],
    origin[2] + sliceIndex * spacing[2],
  ];

  return {
    // Frame Content Sequence
    '00209111': {
      vr: 'SQ',
      Value: [{
        '00209157': { vr: 'UL', Value: [sliceIndex + 1, segmentNumber] }, // Dimension Index Values
      }],
    },
    // Plane Position Sequence
    '00209113': {
      vr: 'SQ',
      Value: [{
        '00200032': { vr: 'DS', Value: position.map(String) }, // Image Position (Patient)
      }],
    },
    // Segment Identification Sequence
    '0062000A': {
      vr: 'SQ',
      Value: [{
        '0062000B': { vr: 'US', Value: [segmentNumber] }, // Referenced Segment Number
      }],
    },
  };
}

/**
 * Generate DICOM SEG from labelmap
 */
export function generateDicomSeg(
  labelmap: Labelmap3D,
  options: DicomSegExportOptions = {}
): DicomSegResult {
  const {
    seriesDescription = 'Segmentation',
    seriesNumber = 1,
    contentCreatorName = 'PeakPoint Annotation',
    contentLabel = 'SEGMENTATION',
    contentDescription = 'Manual annotation segmentation',
    segmentationType = 'BINARY',
    segments = [],
    includeEmptyFrames = false,
  } = options;

  const { date, time } = getDicomDateTime();
  const [width, height, depth] = labelmap.dimensions;
  const sliceSize = width * height;

  // Generate UIDs
  const studyUID = generateUID();
  const seriesUID = generateUID();
  const sopInstanceUID = generateUID();

  // Build segment definitions from labelmap if not provided
  const segmentDefs: DicomSegment[] = segments.length > 0 ? segments : [];
  if (segmentDefs.length === 0) {
    labelmap.labels.forEach((info, labelId) => {
      segmentDefs.push({
        segmentNumber: labelId,
        segmentLabel: info.name || `Segment ${labelId}`,
        segmentAlgorithmType: 'MANUAL',
        segmentAlgorithmName: 'Manual Annotation',
        segmentedPropertyCategory: PROPERTY_CATEGORIES.TISSUE,
        segmentedPropertyType: PROPERTY_TYPES.LESION,
      });
    });
  }

  // If no segments defined, create a default one
  if (segmentDefs.length === 0) {
    segmentDefs.push({
      segmentNumber: 1,
      segmentLabel: 'Annotation',
      segmentAlgorithmType: 'MANUAL',
      segmentAlgorithmName: 'Manual Annotation',
    });
  }

  // Collect frames with data
  const frames: Array<{ sliceIndex: number; segmentNumber: number; data: Uint8Array }> = [];
  
  for (let z = 0; z < depth; z++) {
    const sliceOffset = z * sliceSize;
    
    for (const segment of segmentDefs) {
      const frameData = new Uint8Array(sliceSize);
      let hasData = false;
      
      for (let i = 0; i < sliceSize; i++) {
        if (labelmap.data[sliceOffset + i] === segment.segmentNumber) {
          frameData[i] = 1;
          hasData = true;
        }
      }
      
      if (hasData || includeEmptyFrames) {
        frames.push({
          sliceIndex: z,
          segmentNumber: segment.segmentNumber,
          data: frameData,
        });
      }
    }
  }

  // Pack pixel data (RLE or uncompressed)
  const totalPixels = frames.length * sliceSize;
  const pixelData = new Uint8Array(Math.ceil(totalPixels / 8));
  
  let bitIndex = 0;
  for (const frame of frames) {
    for (let i = 0; i < sliceSize; i++) {
      if (frame.data[i] === 1) {
        const byteIndex = Math.floor(bitIndex / 8);
        const bitOffset = bitIndex % 8;
        pixelData[byteIndex] |= (1 << bitOffset);
      }
      bitIndex++;
    }
  }

  // Build segment sequence
  const segmentSequence = segmentDefs.map((seg) => {
    const labelInfo = labelmap.labels.get(seg.segmentNumber);
    return createSegmentSequenceItem(seg, labelInfo);
  });

  // Build per-frame functional groups
  const perFrameSequence = frames.map((frame) =>
    createPerFrameItem(
      frame.sliceIndex,
      frame.segmentNumber,
      labelmap.dimensions,
      labelmap.spacing,
      labelmap.origin
    )
  );

  // Build main dataset
  const dataset: DicomDataset = {
    // Patient Module
    '00100010': { vr: 'PN', Value: ['Anonymous'] }, // Patient's Name
    '00100020': { vr: 'LO', Value: ['ANON'] }, // Patient ID
    
    // General Study Module
    '0020000D': { vr: 'UI', Value: [studyUID] }, // Study Instance UID
    '00080020': { vr: 'DA', Value: [date] }, // Study Date
    '00080030': { vr: 'TM', Value: [time] }, // Study Time
    
    // General Series Module
    '0020000E': { vr: 'UI', Value: [seriesUID] }, // Series Instance UID
    '00080060': { vr: 'CS', Value: ['SEG'] }, // Modality
    '00200011': { vr: 'IS', Value: [String(seriesNumber)] }, // Series Number
    '0008103E': { vr: 'LO', Value: [seriesDescription] }, // Series Description
    
    // General Equipment Module
    '00080070': { vr: 'LO', Value: ['PeakPoint'] }, // Manufacturer
    
    // SOP Common Module
    '00080016': { vr: 'UI', Value: [SEGMENTATION_SOP_CLASS_UID] }, // SOP Class UID
    '00080018': { vr: 'UI', Value: [sopInstanceUID] }, // SOP Instance UID
    '00080012': { vr: 'DA', Value: [date] }, // Instance Creation Date
    '00080013': { vr: 'TM', Value: [time] }, // Instance Creation Time
    
    // Image Pixel Module
    '00280010': { vr: 'US', Value: [height] }, // Rows
    '00280011': { vr: 'US', Value: [width] }, // Columns
    '00280100': { vr: 'US', Value: [1] }, // Bits Allocated
    '00280101': { vr: 'US', Value: [1] }, // Bits Stored
    '00280102': { vr: 'US', Value: [0] }, // High Bit
    '00280103': { vr: 'US', Value: [0] }, // Pixel Representation
    '00280002': { vr: 'US', Value: [1] }, // Samples Per Pixel
    '00280004': { vr: 'CS', Value: ['MONOCHROME2'] }, // Photometric Interpretation
    
    // Multi-frame Module
    '00280008': { vr: 'IS', Value: [String(frames.length)] }, // Number of Frames
    
    // Segmentation Module
    '00620001': { vr: 'CS', Value: [segmentationType] }, // Segmentation Type
    '00620002': { vr: 'SQ', Value: segmentSequence }, // Segment Sequence
    '00700080': { vr: 'CS', Value: [contentLabel] }, // Content Label
    '00700081': { vr: 'LO', Value: [contentDescription] }, // Content Description
    '00700084': { vr: 'PN', Value: [contentCreatorName] }, // Content Creator's Name
    
    // Multi-frame Functional Groups Module
    '52009230': { vr: 'SQ', Value: perFrameSequence }, // Per-Frame Functional Groups Sequence
    
    // Shared Functional Groups Sequence
    '52009229': {
      vr: 'SQ',
      Value: [{
        // Pixel Measures Sequence
        '00289110': {
          vr: 'SQ',
          Value: [{
            '00280030': { vr: 'DS', Value: labelmap.spacing.slice(0, 2).map(String) }, // Pixel Spacing
            '00180050': { vr: 'DS', Value: [String(labelmap.spacing[2])] }, // Slice Thickness
          }],
        },
        // Plane Orientation Sequence
        '00209116': {
          vr: 'SQ',
          Value: [{
            '00200037': { vr: 'DS', Value: ['1', '0', '0', '0', '1', '0'] }, // Image Orientation (Patient)
          }],
        },
      }],
    },
    
    // Pixel Data
    '7FE00010': { vr: 'OB', Value: [pixelData] },
  };

  return {
    dataset,
    pixelData,
    numberOfFrames: frames.length,
    frames: frames.map(f => ({ sliceIndex: f.sliceIndex, segmentNumber: f.segmentNumber })),
  };
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export labelmap as DICOM SEG blob
 */
export function exportAsDicomSegBlob(
  labelmap: Labelmap3D,
  options: DicomSegExportOptions = {}
): Blob {
  const result = generateDicomSeg(labelmap, options);
  
  // Convert dataset to JSON for now (proper DICOM encoding requires dcmjs)
  const jsonString = JSON.stringify({
    ...result,
    _format: 'DICOM-SEG-JSON',
    _note: 'For full DICOM Part 10 encoding, use dcmjs library',
  });
  
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Download DICOM SEG file
 */
export function downloadDicomSeg(
  labelmap: Labelmap3D,
  filename: string = 'segmentation.dcm.json',
  options: DicomSegExportOptions = {}
): void {
  const blob = exportAsDicomSegBlob(labelmap, options);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create DICOM SEG metadata for dcmjs integration
 */
export interface DcmjsSegmentationConfig {
  segments: Array<{
    SegmentNumber: number;
    SegmentLabel: string;
    SegmentAlgorithmType: string;
    SegmentAlgorithmName: string;
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: string;
      CodingSchemeDesignator: string;
      CodeMeaning: string;
    };
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: string;
      CodingSchemeDesignator: string;
      CodeMeaning: string;
    };
    recommendedDisplayRGBValue: [number, number, number];
  }>;
}

export function createDcmjsSegmentationConfig(
  labelmap: Labelmap3D
): DcmjsSegmentationConfig {
  const segments: DcmjsSegmentationConfig['segments'] = [];
  
  labelmap.labels.forEach((info, labelId) => {
    segments.push({
      SegmentNumber: labelId,
      SegmentLabel: info.name,
      SegmentAlgorithmType: 'MANUAL',
      SegmentAlgorithmName: 'Manual Annotation',
      SegmentedPropertyCategoryCodeSequence: {
        CodeValue: PROPERTY_CATEGORIES.TISSUE.codeValue,
        CodingSchemeDesignator: PROPERTY_CATEGORIES.TISSUE.codingSchemeDesignator,
        CodeMeaning: PROPERTY_CATEGORIES.TISSUE.codeMeaning,
      },
      SegmentedPropertyTypeCodeSequence: {
        CodeValue: PROPERTY_TYPES.LESION.codeValue,
        CodingSchemeDesignator: PROPERTY_TYPES.LESION.codingSchemeDesignator,
        CodeMeaning: PROPERTY_TYPES.LESION.codeMeaning,
      },
      recommendedDisplayRGBValue: [info.color[0], info.color[1], info.color[2]],
    });
  });
  
  return { segments };
}
