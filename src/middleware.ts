import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public paths that don't require authentication
 */
const publicPaths = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/privacy-policy',
    '/terms-and-conditions',
];

/**
 * Auth paths that authenticated users should be redirected away from
 */
const authPaths = [
    '/login',
    '/register',
];

/**
 * Check if the path matches any of the given patterns
 */
function isPathMatch(pathname: string, paths: string[]): boolean {
    return paths.some(path => {
        // Exact match
        if (pathname === path) return true;
        // Match with trailing slash
        if (pathname === `${path}/`) return true;
        // Match path prefix (for nested routes)
        if (pathname.startsWith(`${path}/`)) return true;
        return false;
    });
}

/**
 * Middleware for route protection
 * 
 * This middleware:
 * 1. Redirects unauthenticated users to login for protected routes
 * 2. Redirects authenticated users away from auth pages to dashboard
 * 3. Passes through public routes
 * 
 * Note: This uses cookie-based token detection. The actual token validation
 * happens on the client-side and API level for security.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Static files
    ) {
        return NextResponse.next();
    }

    // Check for auth token in cookies
    // Note: We're using a simple cookie check here. The actual token validation
    // is handled by RTK Query and the API.
    const accessToken = request.cookies.get('accessToken')?.value;
    const hasToken = !!accessToken;

    // Check if this is a public path
    const isPublicPath = isPathMatch(pathname, publicPaths);

    // Check if this is an auth path (login/register)
    const isAuthPath = isPathMatch(pathname, authPaths);

    // If user has token and tries to access auth pages, redirect to dashboard
    if (hasToken && isAuthPath) {
        const dashboardUrl = new URL('/dashboard', request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    // If user doesn't have token and tries to access protected route, redirect to login
    if (!hasToken && !isPublicPath) {
        const loginUrl = new URL('/login', request.url);
        // Add the original URL as a redirect parameter
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Allow the request to proceed
    return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 * 
 * We exclude:
 * - API routes
 * - Static files (images, fonts, etc.)
 * - Next.js internals
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
