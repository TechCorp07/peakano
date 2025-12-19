import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation
} from './authApi';
import { logout as logoutAction } from './authSlice';
import type { LoginRequest, RegisterRequest, Permission } from '@/types/auth';
import { ROUTES } from '@/config/routes';

/**
 * Cookie utilities for auth state persistence
 * These are used by middleware for server-side route protection
 */
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

/**
 * Main authentication hook
 * Provides auth state and actions
 */
export function useAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Auth state from Redux
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // RTK Query mutations
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

  /**
   * Login user and redirect to dashboard
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const result = await loginMutation(credentials).unwrap();
        // Set cookie for middleware route protection
        setCookie('accessToken', result.accessToken, credentials.rememberMe ? 30 : 1);
        router.push(ROUTES.DASHBOARD);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { data?: { message?: string } };
        return {
          success: false,
          error: err.data?.message || 'Login failed'
        };
      }
    },
    [loginMutation, router]
  );

  /**
   * Register new user and redirect to dashboard
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const result = await registerMutation(data).unwrap();
        // Set cookie for middleware route protection
        setCookie('accessToken', result.accessToken, 1);
        router.push(ROUTES.DASHBOARD);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { data?: { message?: string } };
        return {
          success: false,
          error: err.data?.message || 'Registration failed'
        };
      }
    },
    [registerMutation, router]
  );

  /**
   * Logout user and redirect to login
   */
  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Still clear local state even if API fails
    } finally {
      // Clear auth cookie
      deleteCookie('accessToken');
      dispatch(logoutAction());
      router.push(ROUTES.LOGIN);
    }
  }, [logoutMutation, dispatch, router]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || isLoggingIn || isRegistering || isLoggingOut,
    error,

    // Actions
    login,
    register,
    logout,
  };
}

/**
 * Permission checking hook
 */
export function usePermissions() {
  const { user } = useAppSelector((state) => state.auth);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false;
      return permissions.every((p) => user.permissions.includes(p));
    },
    [user]
  );

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.role === role;
    },
    [user]
  );

  /**
   * Check if user is admin
   */
  const isAdmin = user?.role === 'admin';

  /**
   * Check if user is instructor or admin
   */
  const isInstructor = user?.role === 'instructor' || isAdmin;

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isInstructor,
  };
}
