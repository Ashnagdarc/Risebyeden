import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { hashToken } from '@/lib/security/token';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';

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

const createUserSchema = z.object({
  role: z.enum(['ADMIN', 'CLIENT', 'AGENT']),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional(),
}).strict();

const updateUserSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['approve', 'reject']),
}).strict();

const userListQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
  role: z.enum(['ADMIN', 'CLIENT', 'AGENT']).optional(),
});

// POST — Admin provisions a new user (generates userId, accessKey, accessToken)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role || '').toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, createUserSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

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
        status: body.role === 'CLIENT' ? 'PENDING' : 'ACTIVE',
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

  const parsedQuery = parseQuery(request, userListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }

  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = {
    status: parsedQuery.data.status,
    role: parsedQuery.data.role,
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
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
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

// PATCH — Admin approves or rejects a user
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role || '').toLowerCase() !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, updateUserSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 });
  }
}
