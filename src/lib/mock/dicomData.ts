/**
 * Static DICOM Data
 * References actual DICOM files in public/dicom/ directory
 * These files are served by Next.js and persist across reloads
 */

import type { Study, Series, Instance } from '@/types/dicom';

/**
 * Helper to generate file paths for multi-slice series
 * Series folders contain Image 0001.dcm through Image XXXX.dcm
 */
function generateSeriesFilePaths(seriesFolder: string, sliceCount: number): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= sliceCount; i++) {
    const paddedNum = String(i).padStart(4, '0');
    // URL encode the spaces in the path - files are directly in the series folder
    paths.push(`/dicom/${encodeURIComponent(seriesFolder)}/Image%20${paddedNum}.dcm`);
  }
  return paths;
}

/**
 * Helper to generate instance entries for a multi-slice series
 */
function generateSeriesInstances(
  seriesId: string,
  seriesInstanceUID: string,
  filePaths: string[],
  baseWindowCenter: number = 400,
  baseWindowWidth: number = 800
): (Instance & { _staticUrl: string })[] {
  const sliceThickness = 3.0; // 3mm slice thickness
  return filePaths.map((path, index) => ({
    id: `instance-${seriesId}-${String(index + 1).padStart(4, '0')}`,
    sopInstanceUID: `${seriesInstanceUID}-instance-${index + 1}`,
    seriesInstanceUID: seriesInstanceUID,
    instanceNumber: index + 1,
    rows: 256,
    columns: 256,
    bitsAllocated: 16,
    bitsStored: 12,
    pixelRepresentation: 0,
    windowCenter: baseWindowCenter,
    windowWidth: baseWindowWidth,
    rescaleIntercept: 0,
    rescaleSlope: 1,
    sliceThickness: sliceThickness,
    sliceLocation: index * sliceThickness,
    imagePositionPatient: `0\\0\\${index * sliceThickness}`,
    imageOrientationPatient: '1\\0\\0\\0\\1\\0',
    pixelSpacing: '0.9375\\0.9375',
    createdAt: new Date().toISOString(),
    _staticUrl: path,
  }));
}

// =============================================================================
// SERIES CONFIGURATION - 3 MRI Series (30-40 slices each)
// =============================================================================

// Patient 1 Series 0002 - 34 slices
const PATIENT_1_SERIES_PATHS = generateSeriesFilePaths('Patient 1 Series 0002', 34);
const PATIENT_1_SERIES_INSTANCES = generateSeriesInstances(
  'patient-1-series-0002',
  'static-patient-1-series-0002-series-1',
  PATIENT_1_SERIES_PATHS,
  400,
  800
);

// Patient 2 Series 0004 - 38 slices
const PATIENT_2_SERIES_PATHS = generateSeriesFilePaths('Patient 2 Series 0004', 38);
const PATIENT_2_SERIES_INSTANCES = generateSeriesInstances(
  'patient-2-series-0004',
  'static-patient-2-series-0004-series-1',
  PATIENT_2_SERIES_PATHS,
  400,
  800
);

// Patient 3 Series 0004 - 38 slices
const PATIENT_3_SERIES_PATHS = generateSeriesFilePaths('Patient 3 Series 0004', 38);
const PATIENT_3_SERIES_INSTANCES = generateSeriesInstances(
  'patient-3-series-0004',
  'static-patient-3-series-0004-series-1',
  PATIENT_3_SERIES_PATHS,
  400,
  800
);

/**
 * Static DICOM studies - 3 MRI studies from public/dicom/
 */
export const staticStudies: Study[] = [
  {
    id: 'static-patient-1',
    studyInstanceUID: 'static-patient-1-series-0002',
    studyDate: '20250113',
    studyTime: '100000',
    studyDescription: 'Patient 1 - PELVIC MRI Series 0002',
    accessionNumber: 'STATIC-P1-S0002',
    patientId: 'PATIENT-001',
    patientName: 'Patient 1',
    patientBirthDate: '19800101',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-patient-2',
    studyInstanceUID: 'static-patient-2-series-0004',
    studyDate: '20250113',
    studyTime: '110000',
    studyDescription: 'Patient 2 - PELVIC MRISeries 0004',
    accessionNumber: 'STATIC-P2-S0004',
    patientId: 'PATIENT-002',
    patientName: 'Patient 2',
    patientBirthDate: '19850615',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-patient-3',
    studyInstanceUID: 'static-patient-3-series-0004',
    studyDate: '20250113',
    studyTime: '120000',
    studyDescription: 'Patient 3 - PELVIC MRI Series 0004',
    accessionNumber: 'STATIC-P3-S0004',
    patientId: 'PATIENT-003',
    patientName: 'Patient 3',
    patientBirthDate: '19900320',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Static series data - maps to actual DICOM files
 */
export const staticSeries: Series[] = [
  {
    id: 'series-patient-1',
    seriesInstanceUID: 'static-patient-1-series-0002-series-1',
    studyInstanceUID: 'static-patient-1-series-0002',
    seriesNumber: 1,
    seriesDescription: 'Pelvic MRI Axial T2 - 34 Slices',
    modality: 'MR',
    bodyPart: 'PELVIS',
    numberOfInstances: 34,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-patient-2',
    seriesInstanceUID: 'static-patient-2-series-0004-series-1',
    studyInstanceUID: 'static-patient-2-series-0004',
    seriesNumber: 1,
    seriesDescription: 'Pelvic MRI Axial T2 - 38 Slices',
    modality: 'MR',
    bodyPart: 'PELVIS',
    numberOfInstances: 38,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-patient-3',
    seriesInstanceUID: 'static-patient-3-series-0004-series-1',
    studyInstanceUID: 'static-patient-3-series-0004',
    seriesNumber: 1,
    seriesDescription: 'Pelvic MRI Axial T2 - 38 Slices',
    modality: 'MR',
    bodyPart: 'PELVIS',
    numberOfInstances: 38,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Static instances - maps series to actual DICOM file URLs
 * Total: 34 + 38 + 38 = 110 instances
 */
export const staticInstances: (Instance & { _staticUrl: string })[] = [
  ...PATIENT_1_SERIES_INSTANCES,
  ...PATIENT_2_SERIES_INSTANCES,
  ...PATIENT_3_SERIES_INSTANCES,
];

/**
 * Check if a study is a static (pre-loaded) study
 */
export function isStaticStudy(studyInstanceUID: string): boolean {
  return studyInstanceUID.startsWith('static-');
}

/**
 * Get static study by UID
 */
export function getStaticStudy(studyInstanceUID: string): Study | undefined {
  return staticStudies.find((s) => s.studyInstanceUID === studyInstanceUID);
}

/**
 * Get static series for a study
 */
export function getStaticSeriesForStudy(studyInstanceUID: string): Series[] {
  return staticSeries.filter((s) => s.studyInstanceUID === studyInstanceUID);
}

/**
 * Get static instances for a series
 */
export function getStaticInstancesForSeries(seriesInstanceUID: string): (Instance & { _staticUrl: string })[] {
  return staticInstances.filter((i) => i.seriesInstanceUID === seriesInstanceUID);
}

/**
 * Get the static file URL for an instance
 */
export function getStaticInstanceUrl(sopInstanceUID: string): string | undefined {
  const instance = staticInstances.find((i) => i.sopInstanceUID === sopInstanceUID);
  return instance?._staticUrl;
}

/**
 * Get study with embedded series (for viewer compatibility)
 */
export function getStaticStudyWithSeries(studyInstanceUID: string): (Study & { series: Series[] }) | undefined {
  const study = getStaticStudy(studyInstanceUID);
  if (!study) return undefined;

  const series = getStaticSeriesForStudy(studyInstanceUID);
  return { ...study, series };
}

// ============================================
// Legacy mock data exports (for backward compatibility)
// ============================================

/**
 * @deprecated Use staticStudies instead
 */
export const mockStudies = staticStudies;

/**
 * @deprecated Use staticSeries instead
 */
export const mockSeries = staticSeries;

/**
 * @deprecated Use staticInstances instead
 */
export const mockInstances = staticInstances;

/**
 * @deprecated Use getStaticStudy instead
 */
export function getMockStudy(studyInstanceUID: string): Study | undefined {
  return getStaticStudy(studyInstanceUID);
}

/**
 * @deprecated Use getStaticSeriesForStudy instead
 */
export function getMockSeriesForStudy(studyInstanceUID: string): Series[] {
  return getStaticSeriesForStudy(studyInstanceUID);
}

/**
 * @deprecated Use getStaticInstancesForSeries instead
 */
export function getMockInstancesForSeries(seriesInstanceUID: string): Instance[] {
  return getStaticInstancesForSeries(seriesInstanceUID);
}

// Export helper functions for adding new series
export { generateSeriesFilePaths, generateSeriesInstances };
