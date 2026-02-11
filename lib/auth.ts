import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

const AUTH_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 8,
  blockMs: 15 * 60 * 1000,
} as const;

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'User ID', type: 'text' },
        accessKey: { label: 'Access Key', type: 'password' },
        adminOnly: { label: 'Admin Only', type: 'text' },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier || '').trim().toUpperCase();
        const accessKey = String(credentials?.accessKey || '').trim();
        const adminOnly = String(credentials?.adminOnly || '').trim() === 'true';
        const rateLimitKey = `auth:${identifier || 'unknown'}`;

        const limit = consumeRateLimit(rateLimitKey, AUTH_RATE_LIMIT);
        if (!limit.allowed) {
          console.warn('auth:rate-limited', { identifier, retryAfterSeconds: limit.retryAfterSeconds });
          return null;
        }

        if (!identifier || !accessKey) {
          console.warn('auth:missing-credentials', { identifierPresent: !!identifier, accessKeyPresent: !!accessKey });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { userId: identifier },
        });

        if (!user) {
          console.warn('auth:user-not-found', { identifier });
          return null;
        }

        // Must be ACTIVE to log in
        if (user.status !== 'ACTIVE') {
          console.warn('auth:user-not-active', { identifier, status: user.status });
          return null;
        }

        const isValid = await bcrypt.compare(accessKey, user.hashedPassword);
        if (!isValid) {
          console.warn('auth:invalid-access-key', { identifier });
          return null;
        }

        if (adminOnly && user.role !== 'ADMIN') {
          console.warn('auth:admin-required', { identifier, role: user.role });
          return null;
        }

        resetRateLimit(rateLimitKey);

        return {
          id: user.id,
          name: user.name || user.userId,
          email: user.email || user.userId,
          role: user.role === 'ADMIN' ? 'admin' : 'client',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role || 'client';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
