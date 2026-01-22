/**
 * Dashboard RTK Query API
 * Handles dashboard-specific aggregated data
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface DashboardStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  annotationsCompleted: number;
  totalAnnotations: number;
  averageScore: number;
  certificatesEarned: number;
  streak: number;
  hoursLearned: number;
}

export interface QuickAction {
  id: string;
  type: 'course' | 'annotation' | 'assessment' | 'review';
  title: string;
  description: string;
  icon: string;
  link: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface RecentActivityItem {
  id: string;
  type: 'course_progress' | 'annotation' | 'assessment' | 'certificate' | 'enrollment';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'new';
  createdAt: string;
  expiresAt?: string;
  link?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  quickActions: QuickAction[];
  recentActivity: RecentActivityItem[];
  announcements: Announcement[];
  continueItems: {
    id: string;
    type: 'course' | 'annotation';
    title: string;
    subtitle: string;
    progress: number;
    link: string;
  }[];
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'Activity'],
  endpoints: (builder) => ({
    /**
     * Get complete dashboard data for logged in user
     * GET /dashboard/v1/
     */
    getDashboardData: builder.query<DashboardData, void>({
      query: () => ENDPOINTS.DASHBOARD.DATA,
      providesTags: [{ type: 'Dashboard', id: 'DATA' }],
    }),

    /**
     * Get user's dashboard statistics
     * GET /dashboard/v1/stats
     */
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ENDPOINTS.DASHBOARD.STATS,
      providesTags: [{ type: 'Dashboard', id: 'STATS' }],
    }),

    /**
     * Get quick actions for the user
     * GET /dashboard/v1/quick-actions
     */
    getQuickActions: builder.query<QuickAction[], void>({
      query: () => ENDPOINTS.DASHBOARD.QUICK_ACTIONS,
      providesTags: [{ type: 'Dashboard', id: 'ACTIONS' }],
    }),

    /**
     * Get user's recent activity
     * GET /dashboard/v1/activity
     */
    getRecentActivity: builder.query<RecentActivityItem[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: ENDPOINTS.DASHBOARD.ACTIVITY,
        params: { limit },
      }),
      providesTags: [{ type: 'Activity', id: 'LIST' }],
    }),

    /**
     * Get active announcements
     * GET /dashboard/v1/announcements
     */
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => ENDPOINTS.DASHBOARD.ANNOUNCEMENTS,
      providesTags: [{ type: 'Dashboard', id: 'ANNOUNCEMENTS' }],
    }),

    /**
     * Dismiss an announcement
     * POST /dashboard/v1/announcements/:id/dismiss
     */
    dismissAnnouncement: builder.mutation<void, string>({
      query: (announcementId) => ({
        url: ENDPOINTS.DASHBOARD.DISMISS_ANNOUNCEMENT(announcementId),
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Dashboard', id: 'ANNOUNCEMENTS' }],
    }),
  }),
});

export const {
  useGetDashboardDataQuery,
  useGetDashboardStatsQuery,
  useGetQuickActionsQuery,
  useGetRecentActivityQuery,
  useGetAnnouncementsQuery,
  useDismissAnnouncementMutation,
} = dashboardApi;
