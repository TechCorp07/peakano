import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, Permission } from '@/types/auth';
import { mockUser, mockTokens } from '@/lib/mock/authData';

/**
 * Use mock auth data for demo/testing deployment
 * Set to false when backend authentication is ready
 */
const useMockAuth = true;

/**
 * Initial authentication state
 * Uses mock data in development for easier testing
 */
const initialState: AuthState = useMockAuth
  ? {
      user: mockUser,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: mockUser.permissions,
    }
  : {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: [],
    };

/**
 * Authentication slice
 * Manages user authentication state
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user credentials after login/register
     */
    setCredentials: (
      state,
      action: PayloadAction<{
        user?: User;
        accessToken?: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;

      if (user) {
        state.user = user;
        // Also populate permissions from user object
        state.permissions = user.permissions || [];
      }
      if (accessToken) state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;

      state.isAuthenticated = !!(state.user && state.accessToken);
      state.error = null;
    },

    /**
     * Update user profile
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Update permissions if provided
        if (action.payload.permissions) {
          state.permissions = action.payload.permissions;
        }
      }
    },

    /**
     * Set permissions explicitly
     */
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Logout - clear all auth state
     */
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      state.permissions = [];
    },
  },
});

// Export actions
export const {
  setCredentials,
  updateUser,
  setPermissions,
  setLoading,
  setError,
  logout
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;
