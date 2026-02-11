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

const advisorStatusSchema = z.enum(['AVAILABLE', 'BUSY', 'INACTIVE']);

const advisorListQuerySchema = z.object({
  status: advisorStatusSchema.optional(),
});

const advisorCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  specialty: z.string().trim().min(1).max(200).nullable().optional(),
  status: advisorStatusSchema.optional(),
}).strict();

const advisorPatchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  specialty: z.string().trim().min(1).max(200).nullable().optional(),
  status: advisorStatusSchema.optional(),
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, advisorListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.status ? { status: parsedQuery.data.status } : undefined;

  const [advisors, total] = await prisma.$transaction([
    prisma.advisor.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        name: true,
        title: true,
        specialty: true,
        status: true,
      },
    }),
    prisma.advisor.count({ where }),
  ]);

  return NextResponse.json({
    advisors,
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

  const parsedBody = await parseJsonBody(request, advisorCreateSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    const advisor = await prisma.advisor.create({
      data: {
        name: body.name.trim(),
        title: body.title.trim(),
        specialty: body.specialty?.trim() || null,
        status: body.status || 'AVAILABLE',
      },
      select: {
        id: true,
        name: true,
        title: true,
        specialty: true,
        status: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.clientAdvisorsActive, CACHE_KEYS.adminOverview]);

    return NextResponse.json({ advisor });
  } catch {
    return NextResponse.json({ error: 'Unable to create advisor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, advisorPatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    const advisor = await prisma.advisor.update({
      where: { id: body.id },
      data: {
        name: body.name === undefined ? undefined : body.name.trim(),
        title: body.title === undefined ? undefined : body.title.trim(),
        specialty: body.specialty === undefined ? undefined : body.specialty?.trim() || null,
        status: body.status || undefined,
      },
      select: {
        id: true,
        name: true,
        title: true,
        specialty: true,
        status: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.clientAdvisorsActive, CACHE_KEYS.adminOverview]);

    return NextResponse.json({ advisor });
  } catch {
    return NextResponse.json({ error: 'Unable to update advisor' }, { status: 500 });
  }
}
