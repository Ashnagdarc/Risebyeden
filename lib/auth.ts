import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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

        if (!identifier || !accessKey) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { userId: identifier },
        });

        if (!user) {
          return null;
        }

        // Must be ACTIVE to log in
        if (user.status !== 'ACTIVE') {
          return null;
        }

        const isValid = await bcrypt.compare(accessKey, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        if (adminOnly && user.role !== 'ADMIN') {
          return null;
        }

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
        token.role = (user as { role?: string }).role || 'client';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
