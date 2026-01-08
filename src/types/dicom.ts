/**
 * DICOM TypeScript type definitions
 */

/**
 * DICOM modality types
 */
export type Modality = 'CT' | 'MR' | 'XR' | 'US' | 'NM' | 'PT' | 'CR' | 'DX' | 'MG' | 'OT';

/**
 * DICOM Study from API
 */
export interface Study {
  id: string;
  studyInstanceUID: string;
  studyDate: string | null;
  studyTime: string | null;
  studyDescription: string | null;
  accessionNumber: string | null;
  patientId: string | null;
  patientName: string | null;
  patientBirthDate: string | null;
  patientSex: string | null;
  modality: Modality;
  numberOfSeries: number;
  numberOfInstances: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DICOM Series from API
 */
export interface Series {
  id: string;
  seriesInstanceUID: string;
  studyInstanceUID: string;
  seriesNumber: number | null;
  seriesDescription: string | null;
  modality: Modality;
  bodyPart: string | null;
  numberOfInstances: number;
  createdAt: string;
}

/**
 * DICOM Instance from API
 */
export interface Instance {
  id: string;
  sopInstanceUID: string;
  seriesInstanceUID: string;
  instanceNumber: number | null;
  rows: number;
  columns: number;
  bitsAllocated: number;
  bitsStored: number;
  pixelRepresentation: number;
  windowCenter: number | null;
  windowWidth: number | null;
  rescaleIntercept: number | null;
  rescaleSlope: number | null;
  sliceThickness: number | null;
  sliceLocation: number | null;
  imagePositionPatient: string | null;
  imageOrientationPatient: string | null;
  pixelSpacing: string | null;
  createdAt: string;
}

/**
 * Study with series included
 */
export interface StudyWithSeries extends Study {
  series: SeriesWithInstances[];
}

/**
 * Series with instances included
 */
export interface SeriesWithInstances extends Series {
  instances: Instance[];
}

/**
 * Study list filters
 */
export interface StudyFilters {
  patientName?: string;
  patientId?: string;
  modality?: Modality;
  studyDateFrom?: string;
  studyDateTo?: string;
  accessionNumber?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DICOM upload request
 */
export interface DicomUploadRequest {
  files: File[];
  projectId?: string;
}

/**
 * DICOM upload response
 */
export interface DicomUploadResponse {
  studyInstanceUID: string;
  numberOfFilesProcessed: number;
  numberOfSeriesCreated: number;
  numberOfInstancesCreated: number;
}

/**
 * WADO-RS metadata request
 */
export interface WadoMetadataRequest {
  studyInstanceUID: string;
  seriesInstanceUID?: string;
  sopInstanceUID?: string;
}

/**
 * Viewport display state
 */
export interface ViewportDisplayState {
  windowCenter: number;
  windowWidth: number;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  invert: boolean;
}

/**
 * DICOM Redux state
 */
export interface DicomState {
  // Currently loaded study/series
  currentStudy: Study | null;
  currentSeries: Series | null;
  currentInstances: Instance[];

  // Studies list
  studies: Study[];
  studiesLoading: boolean;
  studiesError: string | null;

  // Pagination
  totalStudies: number;
  currentPage: number;
  pageSize: number;

  // Filters
  filters: StudyFilters;

  // Viewport state
  activeViewportId: string | null;
  viewportStates: Record<string, ViewportDisplayState>;

  // Image loading
  imageLoadingProgress: number;
  isLoadingImages: boolean;
}

/**
 * Initial DICOM state
 */
export const initialDicomState: DicomState = {
  currentStudy: null,
  currentSeries: null,
  currentInstances: [],
  studies: [],
  studiesLoading: false,
  studiesError: null,
  totalStudies: 0,
  currentPage: 1,
  pageSize: 20,
  filters: {},
  activeViewportId: null,
  viewportStates: {},
  imageLoadingProgress: 0,
  isLoadingImages: false,
};
