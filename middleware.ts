import { NextResponse } from 'next/server';
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';
import { isAdminRole } from '@/lib/security/role';
import { REQUEST_ID_HEADER } from '@/lib/observability/request-context';

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const path = request.nextUrl.pathname;
    const token = request.nextauth.token as { role?: string; onboardingCompleted?: boolean } | null;
    const role = typeof token?.role === 'string' ? token.role : '';
    const isClient = role === 'client';
    const onboardingCompleted = token?.onboardingCompleted === true;

    if (isClient && !onboardingCompleted && !path.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    if (isClient && onboardingCompleted && path.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const requestId = request.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(REQUEST_ID_HEADER, requestId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const path = req.nextUrl.pathname;

        // Admin routes require admin role
        if (path.startsWith('/admin')) {
          return isAdminRole(typeof token?.role === 'string' ? token.role : undefined);
        }

        // All other matched routes require any valid session
        return !!token;
      },
    },
    pages: {
      signIn: '/auth',
    },
  },
);

export const config = {
  matcher: [
    '/',
    '/analytics/:path*',
    '/assets/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/consultation/:path*',
    '/acquire/:path*',
    '/updates/:path*',
    '/onboarding/:path*',
    '/agent/:path*',
    '/performance/:path*',
    '/admin/:path*',
  ],
};
