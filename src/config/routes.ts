/**
 * Application routes configuration
 * Centralizes all route paths for easy maintenance
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_AND_CONDITIONS: '/terms-and-conditions',

  // OAuth routes
  OAUTH_GOOGLE_CALLBACK: '/auth/callback/google',

  // Protected routes
  DASHBOARD: '/dashboard',

  // Courses
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}` as const,
  LESSON: (courseId: string, lessonId: string) =>
    `/courses/${courseId}/lesson/${lessonId}` as const,

  // Annotation
  ANNOTATION: '/annotation',
  ANNOTATION_WORKSPACE: (caseId: string) => `/annotation/workspace/${caseId}` as const,
  ANNOTATION_REVIEW: (sessionId: string) => `/annotation/review/${sessionId}` as const,

  // DICOM Viewer
  STUDIES: '/studies',
  VIEWER: (studyId: string) => `/viewer/${studyId}` as const,

  // Assessments
  ASSESSMENTS: '/assessments',
  ASSESSMENT_DETAIL: (id: string) => `/assessments/${id}` as const,

  // Profile
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings',

  // Instructor
  INSTRUCTOR: '/instructor',
  INSTRUCTOR_COURSES: '/instructor/courses',
  INSTRUCTOR_REVIEW: '/instructor/review',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DICOM: '/admin/dicom',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

/**
 * Routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.PRIVACY_POLICY,
  ROUTES.TERMS_AND_CONDITIONS,
  ROUTES.OAUTH_GOOGLE_CALLBACK,
] as const;

/**
 * Routes that require specific roles
 */
export const ROLE_ROUTES = {
  instructor: [ROUTES.INSTRUCTOR, ROUTES.INSTRUCTOR_COURSES],
  admin: [ROUTES.ADMIN, ROUTES.ADMIN_USERS, ROUTES.ADMIN_DICOM],
} as const;
