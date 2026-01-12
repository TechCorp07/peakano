/**
 * Static DICOM Data
 * References actual DICOM files in public/dicom/ directory
 * These files are served by Next.js and persist across reloads
 */

import type { Study, Series, Instance } from '@/types/dicom';

/**
 * Static DICOM file paths (served from public/dicom/)
 */
export const STATIC_DICOM_FILES = {
  CT_SMALL: '/dicom/CT_small.dcm',
  LIVER: '/dicom/liver.dcm',
  LUNG: '/dicom/lung.dcm',
  MR_SMALL: '/dicom/MR_small.dcm',
  MR_SMALL_BIGENDIAN: '/dicom/MR_small_bigendian.dcm',
  MR_SMALL_PADDED: '/dicom/MR_small_padded.dcm',
  MR_TRUNCATED: '/dicom/MR_truncated.dcm',
} as const;

/**
 * Static DICOM studies - uses actual files from public/dicom/
 */
export const staticStudies: Study[] = [
  {
    id: 'static-ct-001',
    studyInstanceUID: 'static-ct-small',
    studyDate: '20241215',
    studyTime: '103045',
    studyDescription: 'CT Small - Sample CT Scan',
    accessionNumber: 'STATIC-CT-001',
    patientId: 'SAMPLE-001',
    patientName: 'Sample Patient CT',
    patientBirthDate: '19850101',
    patientSex: 'O',
    modality: 'CT',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-liver-001',
    studyInstanceUID: 'static-liver',
    studyDate: '20241214',
    studyTime: '141530',
    studyDescription: 'Liver CT - Abdominal Imaging',
    accessionNumber: 'STATIC-LIVER-001',
    patientId: 'SAMPLE-002',
    patientName: 'Sample Patient Liver',
    patientBirthDate: '19900315',
    patientSex: 'O',
    modality: 'CT',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-lung-001',
    studyInstanceUID: 'static-lung',
    studyDate: '20241216',
    studyTime: '102030',
    studyDescription: 'Lung CT - Chest Imaging',
    accessionNumber: 'STATIC-LUNG-001',
    patientId: 'SAMPLE-006',
    patientName: 'Sample Patient Lung',
    patientBirthDate: '19780520',
    patientSex: 'O',
    modality: 'CT',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-mr-001',
    studyInstanceUID: 'static-mr-small',
    studyDate: '20241213',
    studyTime: '091200',
    studyDescription: 'MR Small - Sample MRI Scan',
    accessionNumber: 'STATIC-MR-001',
    patientId: 'SAMPLE-003',
    patientName: 'Sample Patient MRI',
    patientBirthDate: '19880722',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-mr-002',
    studyInstanceUID: 'static-mr-bigendian',
    studyDate: '20241212',
    studyTime: '160000',
    studyDescription: 'MR Big Endian - Encoding Test',
    accessionNumber: 'STATIC-MR-002',
    patientId: 'SAMPLE-004',
    patientName: 'Sample Patient MRI BE',
    patientBirthDate: '19751108',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'static-mr-003',
    studyInstanceUID: 'static-mr-padded',
    studyDate: '20241211',
    studyTime: '083000',
    studyDescription: 'MR Padded - Padding Test',
    accessionNumber: 'STATIC-MR-003',
    patientId: 'SAMPLE-005',
    patientName: 'Sample Patient MRI Padded',
    patientBirthDate: '19650912',
    patientSex: 'O',
    modality: 'MR',
    numberOfSeries: 1,
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Static series data - maps to actual DICOM files
 */
export const staticSeries: Series[] = [
  {
    id: 'series-ct-001',
    seriesInstanceUID: 'static-ct-small-series-1',
    studyInstanceUID: 'static-ct-small',
    seriesNumber: 1,
    seriesDescription: 'CT Axial',
    modality: 'CT',
    bodyPart: 'CHEST',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-liver-001',
    seriesInstanceUID: 'static-liver-series-1',
    studyInstanceUID: 'static-liver',
    seriesNumber: 1,
    seriesDescription: 'Liver Axial',
    modality: 'CT',
    bodyPart: 'ABDOMEN',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-lung-001',
    seriesInstanceUID: 'static-lung-series-1',
    studyInstanceUID: 'static-lung',
    seriesNumber: 1,
    seriesDescription: 'Lung Axial',
    modality: 'CT',
    bodyPart: 'CHEST',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-mr-001',
    seriesInstanceUID: 'static-mr-small-series-1',
    studyInstanceUID: 'static-mr-small',
    seriesNumber: 1,
    seriesDescription: 'MR Axial T1',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-mr-002',
    seriesInstanceUID: 'static-mr-bigendian-series-1',
    studyInstanceUID: 'static-mr-bigendian',
    seriesNumber: 1,
    seriesDescription: 'MR Big Endian',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'series-mr-003',
    seriesInstanceUID: 'static-mr-padded-series-1',
    studyInstanceUID: 'static-mr-padded',
    seriesNumber: 1,
    seriesDescription: 'MR Padded',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 1,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Static instances - maps series to actual DICOM file URLs
 */
export const staticInstances: Instance[] = [
  {
    id: 'instance-ct-001',
    sopInstanceUID: 'static-ct-small-instance-1',
    seriesInstanceUID: 'static-ct-small-series-1',
    instanceNumber: 1,
    rows: 128,
    columns: 128,
    bitsAllocated: 16,
    bitsStored: 16,
    pixelRepresentation: 1,
    windowCenter: 40,
    windowWidth: 400,
    rescaleIntercept: -1024,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    // Custom field to store the static file URL
    _staticUrl: STATIC_DICOM_FILES.CT_SMALL,
  },
  {
    id: 'instance-liver-001',
    sopInstanceUID: 'static-liver-instance-1',
    seriesInstanceUID: 'static-liver-series-1',
    instanceNumber: 1,
    rows: 512,
    columns: 512,
    bitsAllocated: 16,
    bitsStored: 12,
    pixelRepresentation: 0,
    windowCenter: 40,
    windowWidth: 400,
    rescaleIntercept: -1024,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    _staticUrl: STATIC_DICOM_FILES.LIVER,
  },
  {
    id: 'instance-lung-001',
    sopInstanceUID: 'static-lung-instance-1',
    seriesInstanceUID: 'static-lung-series-1',
    instanceNumber: 1,
    rows: 512,
    columns: 512,
    bitsAllocated: 16,
    bitsStored: 12,
    pixelRepresentation: 0,
    windowCenter: -600,
    windowWidth: 1500,
    rescaleIntercept: -1024,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    _staticUrl: STATIC_DICOM_FILES.LUNG,
  },
  {
    id: 'instance-mr-001',
    sopInstanceUID: 'static-mr-small-instance-1',
    seriesInstanceUID: 'static-mr-small-series-1',
    instanceNumber: 1,
    rows: 64,
    columns: 64,
    bitsAllocated: 16,
    bitsStored: 16,
    pixelRepresentation: 1,
    windowCenter: 600,
    windowWidth: 1600,
    rescaleIntercept: 0,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    _staticUrl: STATIC_DICOM_FILES.MR_SMALL,
  },
  {
    id: 'instance-mr-002',
    sopInstanceUID: 'static-mr-bigendian-instance-1',
    seriesInstanceUID: 'static-mr-bigendian-series-1',
    instanceNumber: 1,
    rows: 64,
    columns: 64,
    bitsAllocated: 16,
    bitsStored: 16,
    pixelRepresentation: 1,
    windowCenter: 600,
    windowWidth: 1600,
    rescaleIntercept: 0,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    _staticUrl: STATIC_DICOM_FILES.MR_SMALL_BIGENDIAN,
  },
  {
    id: 'instance-mr-003',
    sopInstanceUID: 'static-mr-padded-instance-1',
    seriesInstanceUID: 'static-mr-padded-series-1',
    instanceNumber: 1,
    rows: 64,
    columns: 64,
    bitsAllocated: 16,
    bitsStored: 16,
    pixelRepresentation: 1,
    windowCenter: 600,
    windowWidth: 1600,
    rescaleIntercept: 0,
    rescaleSlope: 1,
    createdAt: new Date().toISOString(),
    _staticUrl: STATIC_DICOM_FILES.MR_SMALL_PADDED,
  },
] as (Instance & { _staticUrl: string })[];

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
  return staticInstances.filter((i) => i.seriesInstanceUID === seriesInstanceUID) as (Instance & { _staticUrl: string })[];
}

/**
 * Get the static file URL for an instance
 */
export function getStaticInstanceUrl(sopInstanceUID: string): string | undefined {
  const instance = staticInstances.find((i) => i.sopInstanceUID === sopInstanceUID) as (Instance & { _staticUrl?: string }) | undefined;
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
