/**
 * Analytics RTK Query API
 * Handles all analytics and metrics API calls
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface OverviewStats {
  totalUsers: number;
  totalUsersChange: number;
  activeCourses: number;
  activeCoursesChange: number;
  annotationsCompleted: number;
  annotationsChange: number;
  imagesProcessed: number;
  imagesChange: number;
}

export interface ActivityDataPoint {
  date: string;
  day: string;
  annotations: number;
  users: number;
}

export interface TopCourse {
  id: string;
  name: string;
  enrollments: number;
  completion: number;
  rating: number;
}

export interface TopAnnotator {
  id: string;
  name: string;
  annotations: number;
  accuracy: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  userId: string;
  action: string;
  target: string;
  targetId: string;
  time: string;
  timestamp: string;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionsPerUser: number;
  averageSessionDurationMinutes: number;
  retentionRate7d: number;
  retentionRate30d: number;
}

export interface AnnotationPerformance {
  totalAnnotations: number;
  averageDiceScore: number;
  averageTimePerAnnotationMinutes: number;
  aiAssistedPercentage: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
}

export interface AnalyticsDashboardData {
  overview: OverviewStats;
  activityData: ActivityDataPoint[];
  topCourses: TopCourse[];
  topAnnotators: TopAnnotator[];
  recentActivity: RecentActivity[];
  engagement: EngagementMetrics;
  annotationPerformance: AnnotationPerformance;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  supportedFormats: string[];
}

export interface GenerateReportRequest {
  templateId: string;
  format: 'pdf' | 'excel' | 'json';
  timeRange: TimeRange;
  filters?: Record<string, unknown>;
}

export interface ReportResponse {
  reportId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
}

export const analyticsApi = createApi({
  reducerPath: 'analyticsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Analytics', 'Reports'],
  endpoints: (builder) => ({
    /**
     * Get analytics dashboard data
     * GET /metrics/v1/analytics/dashboard
     */
    getDashboardAnalytics: builder.query<AnalyticsDashboardData, { timeRange: TimeRange }>({
      query: ({ timeRange }) => ({
        url: ENDPOINTS.METRICS.DASHBOARD,
        params: { time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'DASHBOARD' }],
    }),

    /**
     * Get overview statistics
     * GET /metrics/v1/analytics/overview
     */
    getOverviewStats: builder.query<OverviewStats, { timeRange: TimeRange }>({
      query: ({ timeRange }) => ({
        url: ENDPOINTS.METRICS.OVERVIEW,
        params: { time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'OVERVIEW' }],
    }),

    /**
     * Get activity data for charts
     * GET /metrics/v1/analytics/activity
     */
    getActivityData: builder.query<ActivityDataPoint[], { timeRange: TimeRange }>({
      query: ({ timeRange }) => ({
        url: ENDPOINTS.METRICS.ACTIVITY,
        params: { time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'ACTIVITY' }],
    }),

    /**
     * Get top courses
     * GET /metrics/v1/analytics/courses/top
     */
    getTopCourses: builder.query<TopCourse[], { limit?: number; timeRange: TimeRange }>({
      query: ({ limit = 5, timeRange }) => ({
        url: ENDPOINTS.METRICS.TOP_COURSES,
        params: { limit, time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'TOP_COURSES' }],
    }),

    /**
     * Get top annotators
     * GET /metrics/v1/analytics/annotators/top
     */
    getTopAnnotators: builder.query<TopAnnotator[], { limit?: number; timeRange: TimeRange }>({
      query: ({ limit = 5, timeRange }) => ({
        url: ENDPOINTS.METRICS.TOP_ANNOTATORS,
        params: { limit, time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'TOP_ANNOTATORS' }],
    }),

    /**
     * Get recent activity
     * GET /metrics/v1/analytics/activity/recent
     */
    getRecentActivity: builder.query<RecentActivity[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: ENDPOINTS.METRICS.RECENT_ACTIVITY,
        params: { limit },
      }),
      providesTags: [{ type: 'Analytics', id: 'RECENT_ACTIVITY' }],
    }),

    /**
     * Get engagement metrics
     * GET /metrics/v1/analytics/engagement
     */
    getEngagementMetrics: builder.query<EngagementMetrics, { timeRange: TimeRange }>({
      query: ({ timeRange }) => ({
        url: ENDPOINTS.METRICS.ENGAGEMENT,
        params: { time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'ENGAGEMENT' }],
    }),

    /**
     * Get annotation performance metrics
     * GET /metrics/v1/analytics/annotations/performance
     */
    getAnnotationPerformance: builder.query<AnnotationPerformance, { timeRange: TimeRange }>({
      query: ({ timeRange }) => ({
        url: ENDPOINTS.METRICS.ANNOTATION_PERFORMANCE,
        params: { time_range: timeRange },
      }),
      providesTags: [{ type: 'Analytics', id: 'ANNOTATION_PERFORMANCE' }],
    }),

    /**
     * Get available report templates
     * GET /metrics/v1/reports/templates
     */
    getReportTemplates: builder.query<ReportTemplate[], void>({
      query: () => ENDPOINTS.METRICS.REPORT_TEMPLATES,
      providesTags: [{ type: 'Reports', id: 'TEMPLATES' }],
    }),

    /**
     * Generate a report
     * POST /metrics/v1/reports/generate
     */
    generateReport: builder.mutation<ReportResponse, GenerateReportRequest>({
      query: (request) => ({
        url: ENDPOINTS.METRICS.GENERATE_REPORT,
        method: 'POST',
        body: request,
      }),
    }),

    /**
     * Get report status
     * GET /metrics/v1/reports/:id/status
     */
    getReportStatus: builder.query<ReportResponse, string>({
      query: (reportId) => ENDPOINTS.METRICS.REPORT_STATUS(reportId),
    }),

    /**
     * Export analytics data
     * GET /metrics/v1/analytics/export
     */
    exportAnalytics: builder.query<Blob, { format: 'csv' | 'xlsx' | 'pdf'; timeRange: TimeRange }>({
      query: ({ format, timeRange }) => ({
        url: ENDPOINTS.METRICS.EXPORT,
        params: { format, time_range: timeRange },
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
  }),
});

export const {
  useGetDashboardAnalyticsQuery,
  useGetOverviewStatsQuery,
  useGetActivityDataQuery,
  useGetTopCoursesQuery,
  useGetTopAnnotatorsQuery,
  useGetRecentActivityQuery,
  useGetEngagementMetricsQuery,
  useGetAnnotationPerformanceQuery,
  useGetReportTemplatesQuery,
  useGenerateReportMutation,
  useGetReportStatusQuery,
  useLazyExportAnalyticsQuery,
} = analyticsApi;
