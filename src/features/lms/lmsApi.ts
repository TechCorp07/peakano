/**
 * LMS RTK Query API
 * Handles all learning management system API calls (courses, learning paths, lessons)
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: string;
  lessonCount: number;
  completedLessons?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  modules: Module[];
  tags?: string[];
  price?: number;
  isFree?: boolean;
  isEnrolled?: boolean;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  courseCount: number;
  courses: Course[];
  estimatedDuration: string;
  level: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  progress: number;
  currentModuleId?: string;
  currentLessonId?: string;
  enrolledAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  certificateUrl?: string;
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
  pathId?: string;
  instructor?: boolean; // Filter courses created by current user
}

export interface PaginatedCoursesResponse {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseProgress {
  courseId: string;
  progress: number;
  completedModules: string[];
  completedLessons: string[];
  currentModuleId: string;
  currentLessonId: string;
  timeSpentMinutes: number;
}

export const lmsApi = createApi({
  reducerPath: 'lmsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Course', 'LearningPath', 'Enrollment', 'Progress'],
  endpoints: (builder) => ({
    /**
     * Get all courses with pagination and filters
     * GET /lms/v1/courses
     */
    getCourses: builder.query<PaginatedCoursesResponse, CourseFilters>({
      query: (filters) => ({
        url: ENDPOINTS.LMS.COURSES,
        params: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.category && { category: filters.category }),
          ...(filters.level && { level: filters.level }),
          ...(filters.search && { search: filters.search }),
          ...(filters.pathId && { path_id: filters.pathId }),
          ...(filters.instructor && { instructor: filters.instructor }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Course' as const, id })),
              { type: 'Course', id: 'LIST' },
            ]
          : [{ type: 'Course', id: 'LIST' }],
    }),

    /**
     * Get a single course by ID
     * GET /lms/v1/courses/:id
     */
    getCourse: builder.query<Course, string>({
      query: (courseId) => ENDPOINTS.LMS.COURSE(courseId),
      providesTags: (result, error, courseId) => [{ type: 'Course', id: courseId }],
    }),

    /**
     * Get all learning paths
     * GET /lms/v1/learning-paths
     */
    getLearningPaths: builder.query<LearningPath[], void>({
      query: () => ENDPOINTS.LMS.LEARNING_PATHS,
      providesTags: [{ type: 'LearningPath', id: 'LIST' }],
    }),

    /**
     * Get a single learning path with its courses
     * GET /lms/v1/learning-paths/:id
     */
    getLearningPath: builder.query<LearningPath, string>({
      query: (pathId) => ENDPOINTS.LMS.LEARNING_PATH(pathId),
      providesTags: (result, error, pathId) => [{ type: 'LearningPath', id: pathId }],
    }),

    /**
     * Get user's enrollments
     * GET /lms/v1/enrollments
     */
    getEnrollments: builder.query<Enrollment[], void>({
      query: () => ENDPOINTS.LMS.ENROLLMENTS,
      providesTags: [{ type: 'Enrollment', id: 'LIST' }],
    }),

    /**
     * Enroll in a course
     * POST /lms/v1/courses/:id/enroll
     */
    enrollCourse: builder.mutation<Enrollment, string>({
      query: (courseId) => ({
        url: ENDPOINTS.LMS.ENROLL(courseId),
        method: 'POST',
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: 'Course', id: courseId },
        { type: 'Enrollment', id: 'LIST' },
      ],
    }),

    /**
     * Unenroll from a course
     * DELETE /lms/v1/courses/:id/enroll
     */
    unenrollCourse: builder.mutation<void, string>({
      query: (courseId) => ({
        url: ENDPOINTS.LMS.ENROLL(courseId),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: 'Course', id: courseId },
        { type: 'Enrollment', id: 'LIST' },
      ],
    }),

    /**
     * Get course progress for current user
     * GET /lms/v1/courses/:id/progress
     */
    getCourseProgress: builder.query<CourseProgress, string>({
      query: (courseId) => ENDPOINTS.LMS.COURSE_PROGRESS(courseId),
      providesTags: (result, error, courseId) => [{ type: 'Progress', id: courseId }],
    }),

    /**
     * Update lesson progress
     * POST /lms/v1/courses/:courseId/lessons/:lessonId/complete
     */
    completeLesson: builder.mutation<CourseProgress, { courseId: string; lessonId: string }>({
      query: ({ courseId, lessonId }) => ({
        url: ENDPOINTS.LMS.COMPLETE_LESSON(courseId, lessonId),
        method: 'POST',
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Progress', id: courseId },
        { type: 'Enrollment', id: 'LIST' },
      ],
    }),

    /**
     * Get featured courses for home/dashboard
     * GET /lms/v1/courses/featured
     */
    getFeaturedCourses: builder.query<Course[], { limit?: number }>({
      query: ({ limit = 4 }) => ({
        url: ENDPOINTS.LMS.FEATURED_COURSES,
        params: { limit },
      }),
      providesTags: [{ type: 'Course', id: 'FEATURED' }],
    }),

    /**
     * Get user's continue learning items
     * GET /lms/v1/continue-learning
     */
    getContinueLearning: builder.query<Enrollment[], { limit?: number } | void>({
      query: (args) => ({
        url: ENDPOINTS.LMS.CONTINUE_LEARNING,
        params: { limit: args?.limit ?? 3 },
      }),
      providesTags: [{ type: 'Enrollment', id: 'CONTINUE' }],
    }),

    // ==================== INSTRUCTOR ENDPOINTS ====================

    /**
     * Get instructor's courses
     * GET /lms/v1/instructor/courses
     */
    getInstructorCourses: builder.query<InstructorCourse[], { status?: 'all' | 'published' | 'draft' } | void>({
      query: (args) => ({
        url: ENDPOINTS.LMS.INSTRUCTOR_COURSES,
        params: args?.status && args.status !== 'all' ? { status: args.status } : {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Course' as const, id })),
              { type: 'Course', id: 'INSTRUCTOR_LIST' },
            ]
          : [{ type: 'Course', id: 'INSTRUCTOR_LIST' }],
    }),

    /**
     * Get instructor stats
     * GET /lms/v1/instructor/stats
     */
    getInstructorStats: builder.query<InstructorStats, void>({
      query: () => ENDPOINTS.LMS.INSTRUCTOR_STATS,
      providesTags: [{ type: 'Course', id: 'INSTRUCTOR_STATS' }],
    }),

    /**
     * Create a new course
     * POST /lms/v1/instructor/courses
     */
    createCourse: builder.mutation<InstructorCourse, CreateCourseInput>({
      query: (body) => ({
        url: ENDPOINTS.LMS.CREATE_COURSE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Course', id: 'INSTRUCTOR_LIST' }, { type: 'Course', id: 'INSTRUCTOR_STATS' }],
    }),

    /**
     * Update a course
     * PUT /lms/v1/instructor/courses/:id
     */
    updateCourse: builder.mutation<InstructorCourse, { id: string; data: Partial<CreateCourseInput> }>({
      query: ({ id, data }) => ({
        url: ENDPOINTS.LMS.UPDATE_COURSE(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Course', id },
        { type: 'Course', id: 'INSTRUCTOR_LIST' },
      ],
    }),

    /**
     * Delete a course
     * DELETE /lms/v1/instructor/courses/:id
     */
    deleteCourse: builder.mutation<void, string>({
      query: (id) => ({
        url: ENDPOINTS.LMS.DELETE_COURSE(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Course', id: 'INSTRUCTOR_LIST' }, { type: 'Course', id: 'INSTRUCTOR_STATS' }],
    }),

    /**
     * Publish a course
     * POST /lms/v1/instructor/courses/:id/publish
     */
    publishCourse: builder.mutation<InstructorCourse, string>({
      query: (id) => ({
        url: ENDPOINTS.LMS.PUBLISH_COURSE(id),
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Course', id },
        { type: 'Course', id: 'INSTRUCTOR_LIST' },
        { type: 'Course', id: 'INSTRUCTOR_STATS' },
      ],
    }),
  }),
});

// Instructor-specific types
export interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  status: 'published' | 'draft';
  enrollments: number;
  rating: number;
  reviews: number;
  modules: number;
  duration: string;
  lastUpdated: string;
  revenue: number;
}

export interface InstructorStats {
  totalCourses: number;
  totalEnrollments: number;
  averageRating: number;
  totalRevenue: number;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
}

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetLearningPathsQuery,
  useGetLearningPathQuery,
  useGetEnrollmentsQuery,
  useEnrollCourseMutation,
  useUnenrollCourseMutation,
  useGetCourseProgressQuery,
  useCompleteLessonMutation,
  useGetFeaturedCoursesQuery,
  useGetContinueLearningQuery,
  // Instructor hooks
  useGetInstructorCoursesQuery,
  useGetInstructorStatsQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
} = lmsApi;
