import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
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
  const where = {
    role: 'AGENT' as const,
    status: 'ACTIVE' as const,
    advisorStatus: parsedQuery.data.status,
  };

  const [agents, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        advisorTitle: true,
        advisorSpecialty: true,
        advisorStatus: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    advisors: agents.map((agent) => ({
      id: agent.id,
      userId: agent.userId,
      name: agent.name || agent.userId,
      email: agent.email,
      title: agent.advisorTitle || 'Investment Advisor',
      specialty: agent.advisorSpecialty,
      status: agent.advisorStatus,
    })),
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

export async function POST() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'Create AGENT users from Admin Access, then manage advisor profile here.' },
    { status: 400 }
  );
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
    const existing = await prisma.user.findUnique({
      where: { id: body.id },
      select: { role: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
    }
    if (existing.role !== 'AGENT') {
      return NextResponse.json({ error: 'Only AGENT users can be advisors' }, { status: 400 });
    }

    const advisor = await prisma.user.update({
      where: { id: body.id },
      data: {
        name: body.name === undefined ? undefined : body.name.trim(),
        advisorTitle: body.title === undefined ? undefined : body.title.trim(),
        advisorSpecialty: body.specialty === undefined ? undefined : body.specialty?.trim() || null,
        advisorStatus: body.status || undefined,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        advisorTitle: true,
        advisorSpecialty: true,
        advisorStatus: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.clientAdvisorsActive, CACHE_KEYS.adminOverview]);

    return NextResponse.json({
      advisor: {
        id: advisor.id,
        userId: advisor.userId,
        name: advisor.name || advisor.userId,
        email: advisor.email,
        title: advisor.advisorTitle || 'Investment Advisor',
        specialty: advisor.advisorSpecialty,
        status: advisor.advisorStatus,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unable to update advisor' }, { status: 500 });
  }
}
