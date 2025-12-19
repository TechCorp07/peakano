import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types/auth';
import { setCredentials, logout, updateUser } from './authSlice';

/**
 * Auth API slice using RTK Query
 * Provides hooks for all authentication operations
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    /**
     * Login user
     * POST /auth/v1/auth/login
     */
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      // After successful login, update auth state
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );
        } catch {
          // Error handling is done by the component
        }
      },
    }),

    /**
     * Register new user
     * POST /auth/v1/auth/register
     */
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: ENDPOINTS.AUTH.REGISTER,
        method: 'POST',
        body: userData,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );
        } catch {
          // Error handling is done by the component
        }
      },
    }),

    /**
     * Logout user
     * POST /auth/v1/auth/logout
     */
    logout: builder.mutation<void, void>({
      query: () => ({
        url: ENDPOINTS.AUTH.LOGOUT,
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Always clear local state, even if API fails
          dispatch(logout());
        }
      },
    }),

    /**
     * Get current user profile
     * GET /auth/v1/auth/me
     */
    getMe: builder.query<User, void>({
      query: () => ENDPOINTS.AUTH.ME,
      providesTags: ['User'],
    }),

    /**
     * Update user profile
     * PATCH /auth/v1/auth/profile
     */
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.UPDATE_PROFILE,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(updateUser(data));
        } catch {
          // Error handling is done by the component
        }
      },
    }),

    /**
     * Change password
     * POST /auth/v1/auth/change-password
     */
    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Request password reset email
     * POST /auth/v1/auth/forgot-password
     */
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Reset password with token
     * POST /auth/v1/auth/reset-password
     */
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.RESET_PASSWORD,
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Verify email with token
     * POST /auth/v1/auth/verify-email
     */
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.VERIFY_EMAIL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * Resend verification email
     * POST /auth/v1/auth/resend-verification
     */
    resendVerification: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: ENDPOINTS.AUTH.RESEND_VERIFICATION,
        method: 'POST',
      }),
    }),

    /**
     * Initiate Google OAuth login
     * GET /auth/v1/auth/oauth/google
     * Returns redirect URL to Google
     */
    initiateGoogleOAuth: builder.query<{ url: string }, void>({
      query: () => ENDPOINTS.AUTH.OAUTH_GOOGLE,
    }),

    /**
     * Complete Google OAuth login
     * POST /auth/v1/auth/oauth/google/callback
     */
    completeGoogleOAuth: builder.mutation<AuthResponse, { code: string; state?: string }>({
      query: (data) => ({
        url: ENDPOINTS.AUTH.OAUTH_GOOGLE_CALLBACK,
        method: 'POST',
        body: data,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );
        } catch {
          // Error handling is done by the component
        }
      },
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLazyInitiateGoogleOAuthQuery,
  useCompleteGoogleOAuthMutation,
} = authApi;

