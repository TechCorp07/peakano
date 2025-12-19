/**
 * User roles in the system
 */
export type UserRole = 'student' | 'instructor' | 'admin' | 'reviewer';

/**
 * Permission types for fine-grained access control
 */
export type Permission =
  | 'courses:view'
  | 'courses:create'
  | 'courses:edit'
  | 'courses:delete'
  | 'annotation:view'
  | 'annotation:create'
  | 'annotation:review'
  | 'users:view'
  | 'users:manage'
  | 'admin:access';

/**
 * User object returned from API
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  isActive: boolean;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organizationCode?: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Auth response from login/register
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Auth state in Redux store
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
