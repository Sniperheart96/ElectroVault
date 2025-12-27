/**
 * Next.js Middleware
 * Handles authentication and route protection
 */
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes: { path: string; roles?: string[] }[] = [
  // Admin routes - require admin or moderator role
  { path: '/admin', roles: ['admin', 'moderator'] },
  // Profile routes - require authentication only
  { path: '/profile' },
  // Contribution routes - require contributor or higher
  { path: '/contribute', roles: ['admin', 'moderator', 'contributor'] },
];

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // Check if the current path matches a protected route
    const matchedRoute = protectedRoutes.find(
      (route) =>
        pathname === route.path || pathname.startsWith(`${route.path}/`)
    );

    if (matchedRoute && matchedRoute.roles) {
      // Check if user has required role
      const userRoles = (token?.roles as string[]) || [];
      const hasRequiredRole = matchedRoute.roles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        // Redirect to unauthorized page or home
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Check if the current path requires authentication
        const requiresAuth = protectedRoutes.some(
          (route) =>
            pathname === route.path || pathname.startsWith(`${route.path}/`)
        );

        // Allow access if route doesn't require auth or user has token
        return !requiresAuth || !!token;
      },
    },
  }
);

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Protected routes
    '/admin/:path*',
    '/profile/:path*',
    '/contribute/:path*',
    // Don't run on static files or API routes (except auth)
    '/((?!_next/static|_next/image|favicon.ico|api/(?!auth)).*)',
  ],
};
