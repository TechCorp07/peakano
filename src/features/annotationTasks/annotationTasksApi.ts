/**
 * Annotation Tasks RTK Query API
 * Handles all annotation task management API calls
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface AnnotationChecklist {
  id: string;
  label: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface AnnotationTask {
  id: string;
  caseId: string;
  title: string;
  type: string;
  modality: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected';
  deadline: string;
  estimatedTime: string;
  assignedBy?: string;
  sliceCount?: number;
  progress?: number;
  lastEdited?: string;
  feedback?: string;
  checklist?: AnnotationChecklist[];
}

export interface AnnotationTaskStats {
  pending: number;
  inProgress: number;
  submitted: number;
  approved: number;
  thisMonth: number;
}

export interface AnnotationTaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  modality?: string;
}

export interface PaginatedAnnotationTasksResponse {
  items: AnnotationTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StartTaskResponse {
  sessionId: string;
  task: AnnotationTask;
  startedAt: string;
}

export interface SaveProgressRequest {
  taskId: string;
  progress: number;
  checklist?: AnnotationChecklist[];
}

export interface SubmitTaskRequest {
  taskId: string;
  annotations: unknown[]; // This would be the annotation data structure
  notes?: string;
}

// Review types
export interface ReviewItem {
  id: string;
  studyId: string;
  annotator: string;
  submittedAt: string;
  modality: string;
  bodyPart: string;
  annotationCount: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_requested';
  priority: 'high' | 'normal' | 'low';
  estimatedTime: string;
  comments?: ReviewComment[];
}

export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ReviewStats {
  pendingReviews: number;
  inReview: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface ReviewQueueFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface PaginatedReviewQueueResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApproveReviewRequest {
  reviewId: string;
  comment?: string;
}

export interface RejectReviewRequest {
  reviewId: string;
  reason: string;
  comment?: string;
}

export interface RequestRevisionRequest {
  reviewId: string;
  feedback: string;
}

export interface AddCommentRequest {
  reviewId: string;
  text: string;
}

export const annotationTasksApi = createApi({
  reducerPath: 'annotationTasksApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AnnotationTask', 'AnnotationStats', 'ReviewItem', 'ReviewStats'],
  endpoints: (builder) => ({
    /**
     * Get all annotation tasks with pagination and filters
     * GET /annotation/v1/tasks
     */
    getAnnotationTasks: builder.query<PaginatedAnnotationTasksResponse, AnnotationTaskFilters>({
      query: (filters) => ({
        url: ENDPOINTS.ANNOTATION.TASKS,
        params: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority }),
          ...(filters.modality && { modality: filters.modality }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'AnnotationTask' as const, id })),
              { type: 'AnnotationTask', id: 'LIST' },
            ]
          : [{ type: 'AnnotationTask', id: 'LIST' }],
    }),

    /**
     * Get a single annotation task by ID
     * GET /annotation/v1/tasks/:id
     */
    getAnnotationTask: builder.query<AnnotationTask, string>({
      query: (taskId) => ENDPOINTS.ANNOTATION.TASK(taskId),
      providesTags: (result, error, taskId) => [{ type: 'AnnotationTask', id: taskId }],
    }),

    /**
     * Get annotation task statistics
     * GET /annotation/v1/stats
     */
    getAnnotationStats: builder.query<AnnotationTaskStats, void>({
      query: () => ENDPOINTS.ANNOTATION.STATS,
      providesTags: [{ type: 'AnnotationStats', id: 'STATS' }],
    }),

    /**
     * Start an annotation task
     * POST /annotation/v1/tasks/:id/start
     */
    startTask: builder.mutation<StartTaskResponse, string>({
      query: (taskId) => ({
        url: ENDPOINTS.ANNOTATION.START_TASK(taskId),
        method: 'POST',
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: 'AnnotationTask', id: taskId },
        { type: 'AnnotationTask', id: 'LIST' },
        { type: 'AnnotationStats', id: 'STATS' },
      ],
    }),

    /**
     * Save task progress
     * PUT /annotation/v1/tasks/:id/progress
     */
    saveProgress: builder.mutation<AnnotationTask, SaveProgressRequest>({
      query: ({ taskId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.SAVE_PROGRESS(taskId),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'AnnotationTask', id: taskId },
        { type: 'AnnotationStats', id: 'STATS' },
      ],
    }),

    /**
     * Submit annotation task for review
     * POST /annotation/v1/tasks/:id/submit
     */
    submitTask: builder.mutation<AnnotationTask, SubmitTaskRequest>({
      query: ({ taskId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.SUBMIT_TASK(taskId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'AnnotationTask', id: taskId },
        { type: 'AnnotationTask', id: 'LIST' },
        { type: 'AnnotationStats', id: 'STATS' },
      ],
    }),

    // ======= REVIEW ENDPOINTS =======

    /**
     * Get review queue for instructor/reviewer
     * GET /annotation/v1/reviews
     */
    getReviewQueue: builder.query<PaginatedReviewQueueResponse, ReviewQueueFilters>({
      query: (filters) => ({
        url: ENDPOINTS.ANNOTATION.REVIEW_QUEUE,
        params: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'ReviewItem' as const, id })),
              { type: 'ReviewItem', id: 'LIST' },
            ]
          : [{ type: 'ReviewItem', id: 'LIST' }],
    }),

    /**
     * Get review statistics
     * GET /annotation/v1/reviews/stats
     */
    getReviewStats: builder.query<ReviewStats, void>({
      query: () => ENDPOINTS.ANNOTATION.REVIEW_STATS,
      providesTags: [{ type: 'ReviewStats', id: 'STATS' }],
    }),

    /**
     * Approve a review
     * POST /annotation/v1/reviews/:id/approve
     */
    approveReview: builder.mutation<ReviewItem, ApproveReviewRequest>({
      query: ({ reviewId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.APPROVE_REVIEW(reviewId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'ReviewItem', id: reviewId },
        { type: 'ReviewItem', id: 'LIST' },
        { type: 'ReviewStats', id: 'STATS' },
      ],
    }),

    /**
     * Reject a review
     * POST /annotation/v1/reviews/:id/reject
     */
    rejectReview: builder.mutation<ReviewItem, RejectReviewRequest>({
      query: ({ reviewId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.REJECT_REVIEW(reviewId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'ReviewItem', id: reviewId },
        { type: 'ReviewItem', id: 'LIST' },
        { type: 'ReviewStats', id: 'STATS' },
      ],
    }),

    /**
     * Request revision
     * POST /annotation/v1/reviews/:id/revision
     */
    requestRevision: builder.mutation<ReviewItem, RequestRevisionRequest>({
      query: ({ reviewId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.REQUEST_REVISION(reviewId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'ReviewItem', id: reviewId },
        { type: 'ReviewItem', id: 'LIST' },
        { type: 'ReviewStats', id: 'STATS' },
      ],
    }),

    /**
     * Add comment to review
     * POST /annotation/v1/reviews/:id/comment
     */
    addReviewComment: builder.mutation<ReviewItem, AddCommentRequest>({
      query: ({ reviewId, ...body }) => ({
        url: ENDPOINTS.ANNOTATION.ADD_COMMENT(reviewId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'ReviewItem', id: reviewId },
      ],
    }),
  }),
});

export const {
  useGetAnnotationTasksQuery,
  useGetAnnotationTaskQuery,
  useGetAnnotationStatsQuery,
  useStartTaskMutation,
  useSaveProgressMutation,
  useSubmitTaskMutation,
  // Review hooks
  useGetReviewQueueQuery,
  useGetReviewStatsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
  useRequestRevisionMutation,
  useAddReviewCommentMutation,
} = annotationTasksApi;
