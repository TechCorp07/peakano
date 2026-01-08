/**
 * Mock DICOM Data
 * Used for development when backend is not connected
 */

import type { Study, Series, Instance } from '@/types/dicom';

/**
 * Mock DICOM studies
 */
export const mockStudies: Study[] = [
  {
    id: 'study-001',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123',
    studyDate: '20241215',
    studyTime: '103045',
    studyDescription: 'MRI Brain with Contrast',
    accessionNumber: 'ACC001234',
    patientId: 'PAT001',
    patientName: 'John Doe',
    patientBirthDate: '19850315',
    patientSex: 'M',
    modality: 'MR',
    numberOfSeries: 3,
    numberOfInstances: 156,
    createdAt: '2024-12-15T10:30:45Z',
    updatedAt: '2024-12-15T10:30:45Z',
  },
  {
    id: 'study-002',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.456',
    studyDate: '20241214',
    studyTime: '141530',
    studyDescription: 'CT Chest Abdomen Pelvis',
    accessionNumber: 'ACC001235',
    patientId: 'PAT002',
    patientName: 'Jane Smith',
    patientBirthDate: '19900722',
    patientSex: 'F',
    modality: 'CT',
    numberOfSeries: 5,
    numberOfInstances: 423,
    createdAt: '2024-12-14T14:15:30Z',
    updatedAt: '2024-12-14T14:15:30Z',
  },
  {
    id: 'study-003',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.789',
    studyDate: '20241213',
    studyTime: '091200',
    studyDescription: 'Chest X-Ray PA and Lateral',
    accessionNumber: 'ACC001236',
    patientId: 'PAT003',
    patientName: 'Robert Johnson',
    patientBirthDate: '19751108',
    patientSex: 'M',
    modality: 'XR',
    numberOfSeries: 1,
    numberOfInstances: 2,
    createdAt: '2024-12-13T09:12:00Z',
    updatedAt: '2024-12-13T09:12:00Z',
  },
  {
    id: 'study-004',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.101',
    studyDate: '20241212',
    studyTime: '160000',
    studyDescription: 'MRI Lumbar Spine',
    accessionNumber: 'ACC001237',
    patientId: 'PAT004',
    patientName: 'Emily Davis',
    patientBirthDate: '19880430',
    patientSex: 'F',
    modality: 'MR',
    numberOfSeries: 4,
    numberOfInstances: 98,
    createdAt: '2024-12-12T16:00:00Z',
    updatedAt: '2024-12-12T16:00:00Z',
  },
  {
    id: 'study-005',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.102',
    studyDate: '20241211',
    studyTime: '083000',
    studyDescription: 'CT Head without Contrast',
    accessionNumber: 'ACC001238',
    patientId: 'PAT005',
    patientName: 'Michael Brown',
    patientBirthDate: '19650912',
    patientSex: 'M',
    modality: 'CT',
    numberOfSeries: 2,
    numberOfInstances: 64,
    createdAt: '2024-12-11T08:30:00Z',
    updatedAt: '2024-12-11T08:30:00Z',
  },
];

/**
 * Mock series for the first study
 */
export const mockSeries: Series[] = [
  {
    id: 'series-001',
    seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123.1',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123',
    seriesNumber: 1,
    seriesDescription: 'T1 Axial',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 52,
    createdAt: '2024-12-15T10:30:45Z',
  },
  {
    id: 'series-002',
    seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123.2',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123',
    seriesNumber: 2,
    seriesDescription: 'T2 Axial FLAIR',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 52,
    createdAt: '2024-12-15T10:35:00Z',
  },
  {
    id: 'series-003',
    seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123.3',
    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123',
    seriesNumber: 3,
    seriesDescription: 'T1 Post Contrast',
    modality: 'MR',
    bodyPart: 'BRAIN',
    numberOfInstances: 52,
    createdAt: '2024-12-15T10:45:00Z',
  },
];

/**
 * Mock instances (simplified - just metadata, no actual images)
 */
export const mockInstances: Instance[] = Array.from({ length: 52 }, (_, i) => ({
  id: `instance-${i + 1}`,
  sopInstanceUID: `1.2.840.113619.2.55.3.604688119.969.1234567890.123.1.${i + 1}`,
  seriesInstanceUID: '1.2.840.113619.2.55.3.604688119.969.1234567890.123.1',
  instanceNumber: i + 1,
  rows: 512,
  columns: 512,
  bitsAllocated: 16,
  bitsStored: 12,
  pixelRepresentation: 0,
  windowCenter: 40,
  windowWidth: 400,
  rescaleIntercept: 0,
  rescaleSlope: 1,
  sliceThickness: 3,
  sliceLocation: -75 + i * 3,
  imagePositionPatient: `0\\0\\${-75 + i * 3}`,
  imageOrientationPatient: '1\\0\\0\\0\\1\\0',
  pixelSpacing: '0.5\\0.5',
  createdAt: '2024-12-15T10:30:45Z',
}));

/**
 * Get mock study by UID
 */
export function getMockStudy(studyInstanceUID: string): Study | undefined {
  return mockStudies.find((s) => s.studyInstanceUID === studyInstanceUID);
}

/**
 * Get mock series for a study
 */
export function getMockSeriesForStudy(studyInstanceUID: string): Series[] {
  return mockSeries.filter((s) => s.studyInstanceUID === studyInstanceUID);
}

/**
 * Get mock instances for a series
 */
export function getMockInstancesForSeries(seriesInstanceUID: string): Instance[] {
  return mockInstances.filter((i) => i.seriesInstanceUID === seriesInstanceUID);
}
