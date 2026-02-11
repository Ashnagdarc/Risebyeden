import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { hashToken } from '@/lib/security/token';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invites = await prisma.inviteRequest.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      organization: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    email?: string;
    role?: 'ADMIN' | 'CLIENT' | 'AGENT';
    organizationId?: string | null;
    expiresAt?: string | null;
  };

  if (!body.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const token = crypto.randomBytes(16).toString('hex').toUpperCase();
  const tokenHash = await hashToken(token);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  const invite = await prisma.inviteRequest.create({
    data: {
      email: body.email.toLowerCase().trim(),
      role: body.role || 'CLIENT',
      organizationId: body.organizationId || null,
      token: tokenHash,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ invite, issuedToken: token });
}
