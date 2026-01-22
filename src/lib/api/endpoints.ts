/**
 * API endpoint constants
 * Organized by service/domain
 */
export const ENDPOINTS = {
  // Auth Service
  AUTH: {
    LOGIN: '/auth/v1/auth/login',
    REGISTER: '/auth/v1/auth/register',
    LOGOUT: '/auth/v1/auth/logout',
    REFRESH: '/auth/v1/auth/refresh',
    ME: '/auth/v1/auth/me',
    UPDATE_PROFILE: '/auth/v1/auth/profile',
    CHANGE_PASSWORD: '/auth/v1/auth/change-password',
    FORGOT_PASSWORD: '/auth/v1/auth/forgot-password',
    RESET_PASSWORD: '/auth/v1/auth/reset-password',
    VERIFY_EMAIL: '/auth/v1/auth/verify-email',
    RESEND_VERIFICATION: '/auth/v1/auth/resend-verification',
    // OAuth endpoints
    OAUTH_GOOGLE: '/auth/v1/auth/oauth/google',
    OAUTH_GOOGLE_CALLBACK: '/auth/v1/auth/oauth/google/callback',
  },

  // Users Management (Admin)
  USERS: {
    LIST: '/auth/v1/users',
    GET: (id: string) => `/auth/v1/users/${id}`,
    CREATE: '/auth/v1/users',
    UPDATE: (id: string) => `/auth/v1/users/${id}`,
    DELETE: (id: string) => `/auth/v1/users/${id}`,
    STATS: '/auth/v1/users/stats',
    TOGGLE_STATUS: (id: string) => `/auth/v1/users/${id}/status`,
    RESEND_VERIFICATION: (id: string) => `/auth/v1/users/${id}/resend-verification`,
    EXPORT: '/auth/v1/users/export',
  },

  // Metrics/Analytics Service
  METRICS: {
    DASHBOARD: '/metrics/v1/analytics/dashboard',
    OVERVIEW: '/metrics/v1/analytics/overview',
    ACTIVITY: '/metrics/v1/analytics/activity',
    TOP_COURSES: '/metrics/v1/analytics/courses/top',
    TOP_ANNOTATORS: '/metrics/v1/analytics/annotators/top',
    RECENT_ACTIVITY: '/metrics/v1/analytics/activity/recent',
    ENGAGEMENT: '/metrics/v1/analytics/engagement',
    ANNOTATION_PERFORMANCE: '/metrics/v1/analytics/annotations/performance',
    EXPORT: '/metrics/v1/analytics/export',
    // Reports
    REPORT_TEMPLATES: '/metrics/v1/reports/templates',
    GENERATE_REPORT: '/metrics/v1/reports/generate',
    REPORT_STATUS: (id: string) => `/metrics/v1/reports/${id}/status`,
  },

  // LMS Service
  LMS: {
    COURSES: '/lms/v1/courses',
    COURSE: (id: string) => `/lms/v1/courses/${id}`,
    ENROLL: (id: string) => `/lms/v1/courses/${id}/enroll`,
    ENROLLMENTS: '/lms/v1/enrollments',
    LEARNING_PATHS: '/lms/v1/learning-paths',
    LEARNING_PATH: (id: string) => `/lms/v1/learning-paths/${id}`,
    COURSE_PROGRESS: (id: string) => `/lms/v1/courses/${id}/progress`,
    COMPLETE_LESSON: (courseId: string, lessonId: string) => `/lms/v1/courses/${courseId}/lessons/${lessonId}/complete`,
    FEATURED_COURSES: '/lms/v1/courses/featured',
    CONTINUE_LEARNING: '/lms/v1/continue-learning',
    // Instructor-specific endpoints
    INSTRUCTOR_COURSES: '/lms/v1/instructor/courses',
    INSTRUCTOR_COURSE: (id: string) => `/lms/v1/instructor/courses/${id}`,
    INSTRUCTOR_STATS: '/lms/v1/instructor/stats',
    CREATE_COURSE: '/lms/v1/instructor/courses',
    UPDATE_COURSE: (id: string) => `/lms/v1/instructor/courses/${id}`,
    DELETE_COURSE: (id: string) => `/lms/v1/instructor/courses/${id}`,
    PUBLISH_COURSE: (id: string) => `/lms/v1/instructor/courses/${id}/publish`,
  },

  // Dashboard Service
  DASHBOARD: {
    DATA: '/dashboard/v1/',
    STATS: '/dashboard/v1/stats',
    QUICK_ACTIONS: '/dashboard/v1/quick-actions',
    ACTIVITY: '/dashboard/v1/activity',
    ANNOUNCEMENTS: '/dashboard/v1/announcements',
    DISMISS_ANNOUNCEMENT: (id: string) => `/dashboard/v1/announcements/${id}/dismiss`,
  },

  // Assessments/Evaluation Service
  ASSESSMENTS: {
    LIST: '/evaluation/v1/assessments',
    GET: (id: string) => `/evaluation/v1/assessments/${id}`,
    STATS: '/evaluation/v1/stats',
    START: (id: string) => `/evaluation/v1/assessments/${id}/start`,
    SUBMIT_ANSWER: (attemptId: string) => `/evaluation/v1/attempts/${attemptId}/answer`,
    SUBMIT: (attemptId: string) => `/evaluation/v1/attempts/${attemptId}/submit`,
    RESULT: (attemptId: string) => `/evaluation/v1/attempts/${attemptId}/result`,
    RECOMMENDED: '/evaluation/v1/recommended',
    HISTORY: '/evaluation/v1/history',
  },

  // Annotation Service
  ANNOTATION: {
    // Task management
    TASKS: '/annotation/v1/tasks',
    TASK: (id: string) => `/annotation/v1/tasks/${id}`,
    STATS: '/annotation/v1/stats',
    START_TASK: (id: string) => `/annotation/v1/tasks/${id}/start`,
    SUBMIT_TASK: (id: string) => `/annotation/v1/tasks/${id}/submit`,
    SAVE_PROGRESS: (id: string) => `/annotation/v1/tasks/${id}/progress`,
    // Review management
    REVIEW_QUEUE: '/annotation/v1/reviews',
    REVIEW_STATS: '/annotation/v1/reviews/stats',
    APPROVE_REVIEW: (id: string) => `/annotation/v1/reviews/${id}/approve`,
    REJECT_REVIEW: (id: string) => `/annotation/v1/reviews/${id}/reject`,
    REQUEST_REVISION: (id: string) => `/annotation/v1/reviews/${id}/revision`,
    ADD_COMMENT: (id: string) => `/annotation/v1/reviews/${id}/comment`,
    // Projects (for later phases)
    PROJECTS: '/annotation/v1/projects',
    CASES: (projectId: string) => `/annotation/v1/projects/${projectId}/cases`,
    SESSION: (id: string) => `/annotation/v1/sessions/${id}`,
  },

  // DICOM Service
  DICOM: {
    STUDIES: '/dicom/v1/studies',
    STUDY: (uid: string) => `/dicom/v1/studies/${uid}`,
    SERIES: (studyUid: string, seriesUid: string) =>
      `/dicom/v1/studies/${studyUid}/series/${seriesUid}`,
    INSTANCE: (studyUid: string, seriesUid: string, instanceUid: string) =>
      `/dicom/v1/studies/${studyUid}/series/${seriesUid}/instances/${instanceUid}`,
    UPLOAD: '/dicom/v1/studies/upload',
    // WADO-RS endpoints
    WADO_METADATA: (studyUid: string) =>
      `/dicom/v1/wado/${studyUid}/metadata`,
    WADO_SERIES: (studyUid: string, seriesUid: string) =>
      `/dicom/v1/wado/${studyUid}/series/${seriesUid}`,
    WADO_INSTANCE: (studyUid: string, seriesUid: string, instanceUid: string) =>
      `/dicom/v1/wado/${studyUid}/series/${seriesUid}/instances/${instanceUid}`,
  },

  // AI Service (for later phases)
  AI: {
    SEGMENT_AUTO: '/ai/v1/inference/segment/auto',
    SEGMENT_INTERACTIVE: '/ai/v1/inference/segment/interactive',
    MODELS: '/ai/v1/models',
  },

  // Evaluation Service (for later phases)
  EVALUATION: {
    EVALUATE: '/evaluation/v1/evaluate',
    RESULTS: (sessionId: string) => `/evaluation/v1/sessions/${sessionId}/results`,
    PROGRESS: (userId: string) => `/evaluation/v1/users/${userId}/progress`,
  },

  // WebSocket
  WEBSOCKET: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8010',
} as const;
