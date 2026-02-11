import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { hashToken } from '@/lib/security/token';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';

function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars[crypto.randomInt(chars.length)];
  }
  return `RBE-${result}`;
}

function generateAccessKey(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

function generateAccessToken(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

type CreateUserPayload = {
  role: 'ADMIN' | 'CLIENT';
  name?: string;
  email?: string;
};

// POST — Admin provisions a new user (generates userId, accessKey, accessToken)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role || '').toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CreateUserPayload>;

  if (!body.role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }

  const userId = generateShortId();
  const accessKey = generateAccessKey();
  const accessToken = generateAccessToken();
  const hashedPassword = await bcrypt.hash(accessKey, 12);
  const hashedAccessToken = await hashToken(accessToken);

  try {
    const user = await prisma.user.create({
      data: {
        userId,
        name: body.name || null,
        email: body.email?.toLowerCase() || null,
        hashedPassword,
        accessToken: hashedAccessToken,
        role: body.role,
        status: body.role === 'ADMIN' ? 'ACTIVE' : 'PENDING',
      },
      select: {
        id: true,
        userId: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Return plain-text credentials (only shown once)
    return NextResponse.json({
      user,
      credentials: {
        userId,
        accessKey,
        accessToken,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to create user' }, { status: 500 });
  }
}

// GET — Admin fetches all users
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role || '').toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const users = await prisma.user.findMany({
    where: status ? { status: status as 'PENDING' | 'ACTIVE' | 'REJECTED' } : undefined,
    select: {
      id: true,
      userId: true,
      name: true,
      organization: true,
      role: true,
      status: true,
      tokenUsed: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

// PATCH — Admin approves or rejects a user
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role || '').toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { id: string; action: 'approve' | 'reject' };

  if (!body.id || !body.action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  const newStatus = body.action === 'approve' ? 'ACTIVE' : 'REJECTED';

  try {
    const user = await prisma.user.update({
      where: { id: body.id },
      data: { status: newStatus },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.adminOverview]);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 });
  }
}
