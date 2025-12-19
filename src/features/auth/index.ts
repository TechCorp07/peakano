// Auth slice and actions
export { 
  default as authReducer,
  setCredentials,
  updateUser,
  setLoading,
  setError,
  logout,
} from './authSlice';

// Auth API and hooks
export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
} from './authApi';

// Custom hooks
export { useAuth, usePermissions } from './hooks';
