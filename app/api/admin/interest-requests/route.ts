import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
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

const interestStatusSchema = z.enum(['PENDING', 'SCHEDULED', 'APPROVED', 'REJECTED']);

const interestListQuerySchema = z.object({
  status: interestStatusSchema.optional(),
});

const interestPatchSchema = z.object({
  id: z.string().min(1),
  status: interestStatusSchema,
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, interestListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.status ? { status: parsedQuery.data.status } : undefined;

  const [requests, total] = await prisma.$transaction([
    prisma.interestRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { userId: true, name: true } },
        property: { select: { name: true } },
      },
    }),
    prisma.interestRequest.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, interestPatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const normalizedStatus = body.status;

  const current = await prisma.interestRequest.findUnique({
    where: { id: body.id },
    select: { status: true },
  });

  if (!current) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const transitions: Record<string, string[]> = {
    PENDING: ['SCHEDULED', 'APPROVED', 'REJECTED'],
    SCHEDULED: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: [],
  };

  const allowedNext = transitions[current.status] || [];
  if (normalizedStatus !== current.status && !allowedNext.includes(normalizedStatus)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 });
  }

  try {
    const requestRecord = await prisma.interestRequest.update({
      where: { id: body.id },
      data: { status: normalizedStatus as 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'REJECTED' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { userId: true, name: true } },
        property: { select: { name: true } },
      },
    });

    await deleteCacheKeys([CACHE_KEYS.adminOverview]);

    return NextResponse.json({ request: requestRecord });
  } catch {
    return NextResponse.json({ error: 'Unable to update request' }, { status: 500 });
  }
}
