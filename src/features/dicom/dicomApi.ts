/**
 * DICOM RTK Query API
 * Handles all DICOM-related API calls
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Study,
  Series,
  Instance,
  StudyWithSeries,
  SeriesWithInstances,
  StudyFilters,
  PaginatedResponse,
  DicomUploadResponse,
} from '@/types/dicom';

export const dicomApi = createApi({
  reducerPath: 'dicomApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Study', 'Series', 'Instance'],
  endpoints: (builder) => ({
    // Get all studies with pagination and filters
    getStudies: builder.query<PaginatedResponse<Study>, StudyFilters>({
      query: (filters) => ({
        url: ENDPOINTS.DICOM.STUDIES,
        params: {
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ studyInstanceUID }) => ({
                type: 'Study' as const,
                id: studyInstanceUID,
              })),
              { type: 'Study', id: 'LIST' },
            ]
          : [{ type: 'Study', id: 'LIST' }],
    }),

    // Get a single study by UID
    getStudy: builder.query<Study, string>({
      query: (studyInstanceUID) => ENDPOINTS.DICOM.STUDY(studyInstanceUID),
      providesTags: (result, error, studyInstanceUID) => [
        { type: 'Study', id: studyInstanceUID },
      ],
    }),

    // Get study with all series
    getStudyWithSeries: builder.query<StudyWithSeries, string>({
      query: (studyInstanceUID) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}?include=series`,
      providesTags: (result, error, studyInstanceUID) => [
        { type: 'Study', id: studyInstanceUID },
        ...(result?.series || []).map(({ seriesInstanceUID }) => ({
          type: 'Series' as const,
          id: seriesInstanceUID,
        })),
      ],
    }),

    // Get series for a study
    getSeries: builder.query<Series[], string>({
      query: (studyInstanceUID) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}/series`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ seriesInstanceUID }) => ({
                type: 'Series' as const,
                id: seriesInstanceUID,
              })),
              { type: 'Series', id: 'LIST' },
            ]
          : [{ type: 'Series', id: 'LIST' }],
    }),

    // Get a single series by UID
    getSeriesDetail: builder.query<
      SeriesWithInstances,
      { studyInstanceUID: string; seriesInstanceUID: string }
    >({
      query: ({ studyInstanceUID, seriesInstanceUID }) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}/series/${seriesInstanceUID}?include=instances`,
      providesTags: (result, error, { seriesInstanceUID }) => [
        { type: 'Series', id: seriesInstanceUID },
        ...(result?.instances || []).map(({ sopInstanceUID }) => ({
          type: 'Instance' as const,
          id: sopInstanceUID,
        })),
      ],
    }),

    // Get instances for a series
    getInstances: builder.query<
      Instance[],
      { studyInstanceUID: string; seriesInstanceUID: string }
    >({
      query: ({ studyInstanceUID, seriesInstanceUID }) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}/series/${seriesInstanceUID}/instances`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ sopInstanceUID }) => ({
                type: 'Instance' as const,
                id: sopInstanceUID,
              })),
              { type: 'Instance', id: 'LIST' },
            ]
          : [{ type: 'Instance', id: 'LIST' }],
    }),

    // Upload DICOM files
    uploadDicom: builder.mutation<DicomUploadResponse, FormData>({
      query: (formData) => ({
        url: `${ENDPOINTS.DICOM.STUDIES}/upload`,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: [{ type: 'Study', id: 'LIST' }],
    }),

    // Delete a study
    deleteStudy: builder.mutation<void, string>({
      query: (studyInstanceUID) => ({
        url: ENDPOINTS.DICOM.STUDY(studyInstanceUID),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, studyInstanceUID) => [
        { type: 'Study', id: studyInstanceUID },
        { type: 'Study', id: 'LIST' },
      ],
    }),

    // Get WADO-RS metadata for instances
    getInstanceMetadata: builder.query<
      Record<string, unknown>,
      { studyInstanceUID: string; seriesInstanceUID: string; sopInstanceUID: string }
    >({
      query: ({ studyInstanceUID, seriesInstanceUID, sopInstanceUID }) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/metadata`,
    }),

    // Get image URL for an instance (WADO-RS)
    getInstanceImageUrl: builder.query<
      { url: string },
      { studyInstanceUID: string; seriesInstanceUID: string; sopInstanceUID: string }
    >({
      query: ({ studyInstanceUID, seriesInstanceUID, sopInstanceUID }) =>
        `${ENDPOINTS.DICOM.STUDY(studyInstanceUID)}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/image-url`,
    }),
  }),
});

export const {
  useGetStudiesQuery,
  useLazyGetStudiesQuery,
  useGetStudyQuery,
  useLazyGetStudyQuery,
  useGetStudyWithSeriesQuery,
  useLazyGetStudyWithSeriesQuery,
  useGetSeriesQuery,
  useLazyGetSeriesQuery,
  useGetSeriesDetailQuery,
  useLazyGetSeriesDetailQuery,
  useGetInstancesQuery,
  useLazyGetInstancesQuery,
  useUploadDicomMutation,
  useDeleteStudyMutation,
  useGetInstanceMetadataQuery,
  useGetInstanceImageUrlQuery,
} = dicomApi;
