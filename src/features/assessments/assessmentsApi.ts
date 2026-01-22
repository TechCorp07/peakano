/**
 * Assessments RTK Query API
 * Handles all assessment-related API calls (quizzes, tests, certifications)
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'exam' | 'certification' | 'practice';
  category: string;
  courseId?: string;
  courseName?: string;
  duration: number; // in minutes
  questionCount: number;
  passingScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempts?: number;
  maxAttempts?: number;
  bestScore?: number;
  lastAttemptAt?: string;
  isCompleted?: boolean;
  isPassed?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'fill-blank' | 'image-annotation';
  options?: { id: string; text: string; imageUrl?: string }[];
  imageUrl?: string;
  points: number;
  explanation?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
  answers: { questionId: string; answer: string | string[]; isCorrect?: boolean }[];
  timeSpentSeconds: number;
}

export interface AssessmentResult {
  attemptId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  correctAnswers: number;
  totalQuestions: number;
  breakdown: {
    categoryName: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
  recommendations?: string[];
}

export interface UserAssessmentStats {
  overallProficiency: number;
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  streak: number;
  rank: number;
  totalUsers: number;
  skills: {
    name: string;
    score: number;
    level: string;
    color: string;
  }[];
  recentResults: {
    assessmentId: string;
    assessmentTitle: string;
    score: number;
    date: string;
  }[];
  certificates: {
    id: string;
    name: string;
    issuedAt: string;
    url: string;
  }[];
}

export interface AssessmentFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  difficulty?: string;
  courseId?: string;
  status?: 'all' | 'completed' | 'in-progress' | 'not-started';
}

export interface PaginatedAssessmentsResponse {
  items: Assessment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StartAssessmentResponse {
  attemptId: string;
  questions: AssessmentQuestion[];
  timeLimit: number;
  startedAt: string;
}

export interface SubmitAnswerRequest {
  attemptId: string;
  questionId: string;
  answer: string | string[];
}

export interface SubmitAssessmentRequest {
  attemptId: string;
  answers: { questionId: string; answer: string | string[] }[];
}

export const assessmentsApi = createApi({
  reducerPath: 'assessmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Assessment', 'AssessmentStats', 'Attempt'],
  endpoints: (builder) => ({
    /**
     * Get all assessments with pagination and filters
     * GET /evaluation/v1/assessments
     */
    getAssessments: builder.query<PaginatedAssessmentsResponse, AssessmentFilters>({
      query: (filters) => ({
        url: ENDPOINTS.ASSESSMENTS.LIST,
        params: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.type && { type: filters.type }),
          ...(filters.category && { category: filters.category }),
          ...(filters.difficulty && { difficulty: filters.difficulty }),
          ...(filters.courseId && { course_id: filters.courseId }),
          ...(filters.status && { status: filters.status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Assessment' as const, id })),
              { type: 'Assessment', id: 'LIST' },
            ]
          : [{ type: 'Assessment', id: 'LIST' }],
    }),

    /**
     * Get a single assessment by ID
     * GET /evaluation/v1/assessments/:id
     */
    getAssessment: builder.query<Assessment, string>({
      query: (assessmentId) => ENDPOINTS.ASSESSMENTS.GET(assessmentId),
      providesTags: (result, error, assessmentId) => [{ type: 'Assessment', id: assessmentId }],
    }),

    /**
     * Get user's assessment statistics
     * GET /evaluation/v1/stats
     */
    getAssessmentStats: builder.query<UserAssessmentStats, void>({
      query: () => ENDPOINTS.ASSESSMENTS.STATS,
      providesTags: [{ type: 'AssessmentStats', id: 'STATS' }],
    }),

    /**
     * Start an assessment attempt
     * POST /evaluation/v1/assessments/:id/start
     */
    startAssessment: builder.mutation<StartAssessmentResponse, string>({
      query: (assessmentId) => ({
        url: ENDPOINTS.ASSESSMENTS.START(assessmentId),
        method: 'POST',
      }),
      invalidatesTags: (result, error, assessmentId) => [
        { type: 'Assessment', id: assessmentId },
        { type: 'AssessmentStats', id: 'STATS' },
      ],
    }),

    /**
     * Submit an answer during an assessment
     * POST /evaluation/v1/attempts/:attemptId/answer
     */
    submitAnswer: builder.mutation<void, SubmitAnswerRequest>({
      query: ({ attemptId, questionId, answer }) => ({
        url: ENDPOINTS.ASSESSMENTS.SUBMIT_ANSWER(attemptId),
        method: 'POST',
        body: { question_id: questionId, answer },
      }),
    }),

    /**
     * Complete and submit an assessment
     * POST /evaluation/v1/attempts/:attemptId/submit
     */
    submitAssessment: builder.mutation<AssessmentResult, SubmitAssessmentRequest>({
      query: ({ attemptId, answers }) => ({
        url: ENDPOINTS.ASSESSMENTS.SUBMIT(attemptId),
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: [
        { type: 'Assessment', id: 'LIST' },
        { type: 'AssessmentStats', id: 'STATS' },
      ],
    }),

    /**
     * Get assessment result
     * GET /evaluation/v1/attempts/:attemptId/result
     */
    getAssessmentResult: builder.query<AssessmentResult, string>({
      query: (attemptId) => ENDPOINTS.ASSESSMENTS.RESULT(attemptId),
      providesTags: (result, error, attemptId) => [{ type: 'Attempt', id: attemptId }],
    }),

    /**
     * Get recommended assessment based on user progress
     * GET /evaluation/v1/recommended
     */
    getRecommendedAssessment: builder.query<Assessment, void>({
      query: () => ENDPOINTS.ASSESSMENTS.RECOMMENDED,
      providesTags: [{ type: 'Assessment', id: 'RECOMMENDED' }],
    }),

    /**
     * Get user's assessment history
     * GET /evaluation/v1/history
     */
    getAssessmentHistory: builder.query<AssessmentAttempt[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: ENDPOINTS.ASSESSMENTS.HISTORY,
        params: { limit },
      }),
      providesTags: [{ type: 'Attempt', id: 'HISTORY' }],
    }),
  }),
});

export const {
  useGetAssessmentsQuery,
  useGetAssessmentQuery,
  useGetAssessmentStatsQuery,
  useStartAssessmentMutation,
  useSubmitAnswerMutation,
  useSubmitAssessmentMutation,
  useGetAssessmentResultQuery,
  useGetRecommendedAssessmentQuery,
  useGetAssessmentHistoryQuery,
} = assessmentsApi;
