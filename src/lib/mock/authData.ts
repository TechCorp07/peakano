/**
 * Mock Authentication Data
 * Used for development when backend is not connected
 */

import type { User } from '@/types/auth';

/**
 * Mock user for development
 */
export const mockUser: User = {
  id: 'mock-user-001',
  email: 'demo@peakpoint.africa',
  firstName: 'Demo',
  lastName: 'User',
  role: 'admin', // Admin role to access all pages
  permissions: [
    'courses:view',
    'courses:create',
    'courses:edit',
    'courses:delete',
    'annotation:view',
    'annotation:create',
    'annotation:review',
    'users:view',
    'users:manage',
    'admin:access',
  ],
  avatarUrl: undefined,
  organizationId: 'org-001',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  emailVerified: true,
  isActive: true,
};

/**
 * Mock tokens for development
 */
export const mockTokens = {
  accessToken: 'mock-access-token-for-development',
  refreshToken: 'mock-refresh-token-for-development',
  expiresIn: 3600,
};

/**
 * Check if we should use mock data
 * Returns true if no backend URL is configured or in development
 */
export function shouldUseMockAuth(): boolean {
  // Always use mock in development for now
  // You can change this logic later
  if (typeof window === 'undefined') return false;

  // Check if API is reachable (simple check)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return true;

  // For development, default to mock
  return process.env.NODE_ENV === 'development';
}
