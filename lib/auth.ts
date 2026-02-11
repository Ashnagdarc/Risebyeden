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

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value;
}

function resolveClientIp(req: unknown): string {
  const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)?.headers;
  const forwarded = normalizeHeaderValue(headers?.['x-forwarded-for']);
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = normalizeHeaderValue(headers?.['x-real-ip']);
  return realIp.trim() || 'unknown';
}

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
      async authorize(credentials, req) {
        const identifier = String(credentials?.identifier || '').trim().toUpperCase();
        const accessKey = String(credentials?.accessKey || '').trim();
        const adminOnly = String(credentials?.adminOnly || '').trim() === 'true';
        const clientIp = resolveClientIp(req);
        const identifierKey = `auth:identifier:${identifier || 'unknown'}`;
        const ipKey = `auth:ip:${clientIp}`;
        const pairKey = `auth:pair:${identifier || 'unknown'}:${clientIp}`;

        const [identifierLimit, ipLimit, pairLimit] = await Promise.all([
          consumeRateLimit(identifierKey, AUTH_RATE_LIMIT),
          consumeRateLimit(ipKey, AUTH_RATE_LIMIT),
          consumeRateLimit(pairKey, AUTH_RATE_LIMIT),
        ]);

        const retryAfterSeconds = Math.max(
          identifierLimit.retryAfterSeconds,
          ipLimit.retryAfterSeconds,
          pairLimit.retryAfterSeconds
        );

        if (!identifierLimit.allowed || !ipLimit.allowed || !pairLimit.allowed) {
          console.warn('auth:rate-limited', { identifier, clientIp, retryAfterSeconds });
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

        await Promise.all([
          resetRateLimit(identifierKey),
          resetRateLimit(pairKey),
        ]);

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
