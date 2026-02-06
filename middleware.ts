import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      const path = req.nextUrl.pathname;

      // Admin routes require admin role
      if (path.startsWith('/admin')) {
        return token?.role === 'admin';
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
    '/performance/:path*',
    '/admin/:path*',
  ],
};
