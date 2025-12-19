import { 
  fetchBaseQuery, 
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/store';
import { siteConfig } from '@/config/site';

/**
 * Base query configuration for RTK Query
 * Adds authorization header from Redux state
 */
export const baseQuery = fetchBaseQuery({
  baseUrl: siteConfig.apiUrl,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.accessToken;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

/**
 * Enhanced base query with automatic token refresh
 * 
 * Flow:
 * 1. Make request with current token
 * 2. If 401, try to refresh token
 * 3. If refresh succeeds, retry original request
 * 4. If refresh fails, logout user
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Try the request
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      // Try to get a new access token
      const refreshResult = await baseQuery(
        {
          url: '/auth/v1/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store the new token
        const { setCredentials } = await import('@/features/auth/authSlice');
        api.dispatch(
          setCredentials({
            accessToken: (refreshResult.data as { access_token: string }).access_token,
          })
        );
        
        // Retry the original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed - logout
        const { logout } = await import('@/features/auth/authSlice');
        api.dispatch(logout());
      }
    } else {
      // No refresh token - logout
      const { logout } = await import('@/features/auth/authSlice');
      api.dispatch(logout());
    }
  }
  
  return result;
};
