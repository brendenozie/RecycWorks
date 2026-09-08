import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Safely decodes base64 JWT payload in Next.js Edge Runtime without Node crypto dependencies.
 */
function parseJwtPayload(token: string): { userId?: string; email?: string; role?: string; isAdmin?: boolean; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// All protected dashboard route prefixes
const DASHBOARD_ROUTES = [
  '/admindashboard',
  '/operationsdashboard',
  '/supplierdashboard',
  '/driverdashboard',
  '/fieldOfficerdashboard',
  '/partnerdashboard',
  '/profile',
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Bypass webhooks and static assets
  if (pathname.startsWith('/api/webhooks/whop')) {
    return NextResponse.next();
  }

  // 2. Referral redirection support
  if (pathname.startsWith('/ref/')) {
    const segments = pathname.split('/');
    const refCode = segments[segments.length - 1];

    if (refCode) {
      const response = NextResponse.redirect(new URL('/register', request.url));
      response.cookies.set('refereer_code', refCode, {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
      return response;
    }
  }

  // 3. Protected Dashboard Routes Check
  const isDashboardRoute = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isDashboardRoute) {
    const tokenCookie = request.cookies.get('token')?.value || request.cookies.get('recyc_token')?.value;
    const nextAuthCookie =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    const token = tokenCookie || nextAuthCookie;

    // Not logged in -> Redirect to login with intended return destination
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    // If it is a JWT token, check expiration & role
    if (tokenCookie) {
      const payload = parseJwtPayload(tokenCookie);
      if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname + search);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('token');
        return response;
      }

      const userRole = (payload.role || '').toLowerCase().replace('-', '_');
      const isAdmin = payload.isAdmin || userRole === 'admin';

      // Restrict Admin Dashboard to Admin and Operations roles
      if (pathname.startsWith('/admindashboard') && !isAdmin && userRole !== 'operations') {
        let dest = '/supplierdashboard';
        if (userRole === 'driver') dest = '/driverdashboard';
        else if (userRole === 'field_officer') dest = '/fieldOfficerdashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/ref/:path*',
    '/admindashboard/:path*',
    '/operationsdashboard/:path*',
    '/supplierdashboard/:path*',
    '/driverdashboard/:path*',
    '/fieldOfficerdashboard/:path*',
    '/partnerdashboard/:path*',
    '/profile/:path*',
  ],
};
