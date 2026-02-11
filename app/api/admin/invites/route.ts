import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { hashToken } from '@/lib/security/token';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

const inviteListQuerySchema = z.object({
  status: z.enum(['SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED']).optional(),
});

const createInviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['ADMIN', 'CLIENT', 'AGENT']).optional(),
  organizationId: z.string().min(1).nullable().optional(),
  expiresAt: z.string().trim().min(1).nullable().optional(),
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, inviteListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.status ? { status: parsedQuery.data.status } : undefined;

  const [invites, total] = await prisma.$transaction([
    prisma.inviteRequest.findMany({
      where,
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
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.inviteRequest.count({ where }),
  ]);

  return NextResponse.json({
    invites,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, createInviteSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

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
