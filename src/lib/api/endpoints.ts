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

  // LMS Service (for later phases)
  LMS: {
    COURSES: '/lms/v1/courses',
    COURSE: (id: string) => `/lms/v1/courses/${id}`,
    ENROLL: (id: string) => `/lms/v1/courses/${id}/enroll`,
    ENROLLMENTS: '/lms/v1/enrollments',
  },

  // Annotation Service (for later phases)
  ANNOTATION: {
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
