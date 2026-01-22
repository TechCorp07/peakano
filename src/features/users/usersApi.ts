/**
 * Users RTK Query API
 * Handles all user management API calls for admin
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQuery';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'instructor' | 'student';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
  organizationId?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'admin' | 'instructor' | 'student';
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'instructor' | 'student';
  isActive?: boolean;
}

export interface UsersFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  byRole: {
    admin: number;
    instructor: number;
    student: number;
  };
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'UserStats'],
  endpoints: (builder) => ({
    /**
     * Get all users with pagination and filters
     * GET /auth/v1/users
     */
    getUsers: builder.query<PaginatedUsersResponse, UsersFilters>({
      query: (filters) => ({
        url: ENDPOINTS.USERS.LIST,
        params: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.role && { role: filters.role }),
          ...(filters.isActive !== undefined && { is_active: filters.isActive }),
          ...(filters.search && { search: filters.search }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Get a single user by ID
     * GET /auth/v1/users/:id
     */
    getUser: builder.query<User, string>({
      query: (userId) => ENDPOINTS.USERS.GET(userId),
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    /**
     * Get user statistics
     * GET /auth/v1/users/stats
     */
    getUserStats: builder.query<UserStats, void>({
      query: () => ENDPOINTS.USERS.STATS,
      providesTags: [{ type: 'UserStats', id: 'STATS' }],
    }),

    /**
     * Create a new user
     * POST /auth/v1/users
     */
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (userData) => ({
        url: ENDPOINTS.USERS.CREATE,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'UserStats', id: 'STATS' }],
    }),

    /**
     * Update a user
     * PUT /auth/v1/users/:id
     */
    updateUser: builder.mutation<User, { userId: string; data: UpdateUserRequest }>({
      query: ({ userId, data }) => ({
        url: ENDPOINTS.USERS.UPDATE(userId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),

    /**
     * Delete a user
     * DELETE /auth/v1/users/:id
     */
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: ENDPOINTS.USERS.DELETE(userId),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),

    /**
     * Toggle user active status
     * PATCH /auth/v1/users/:id/status
     */
    toggleUserStatus: builder.mutation<User, { userId: string; isActive: boolean }>({
      query: ({ userId, isActive }) => ({
        url: ENDPOINTS.USERS.TOGGLE_STATUS(userId),
        method: 'PATCH',
        body: { is_active: isActive },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),

    /**
     * Resend verification email
     * POST /auth/v1/users/:id/resend-verification
     */
    resendVerification: builder.mutation<void, string>({
      query: (userId) => ({
        url: ENDPOINTS.USERS.RESEND_VERIFICATION(userId),
        method: 'POST',
      }),
    }),

    /**
     * Export users data
     * GET /auth/v1/users/export
     */
    exportUsers: builder.query<Blob, { format: 'csv' | 'xlsx' }>({
      query: ({ format }) => ({
        url: ENDPOINTS.USERS.EXPORT,
        params: { format },
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserStatsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useResendVerificationMutation,
  useLazyExportUsersQuery,
} = usersApi;
