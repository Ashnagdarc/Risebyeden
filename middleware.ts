import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      if (!req.nextUrl.pathname.startsWith('/admin')) {
        return true;
      }

      return token?.role === 'admin';
    },
  },
  pages: {
    signIn: '/auth',
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};
