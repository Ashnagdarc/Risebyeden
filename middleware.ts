import { withAuth } from 'next-auth/middleware';
import { isAdminRole } from '@/lib/security/role';

export default withAuth({
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
});

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
    '/agent/:path*',
    '/performance/:path*',
    '/admin/:path*',
  ],
};
