import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
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

const consultationStatusSchema = z.enum(['PENDING', 'APPROVED', 'SCHEDULED', 'DECLINED', 'COMPLETED']);

const consultationListQuerySchema = z.object({
  status: consultationStatusSchema.optional(),
});

const consultationPatchSchema = z.object({
  id: z.string().min(1),
  status: consultationStatusSchema.optional(),
  advisorId: z.string().min(1).nullable().optional(),
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, consultationListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.status ? { status: parsedQuery.data.status } : undefined;

  const [requests, total] = await prisma.$transaction([
    prisma.consultationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        type: true,
        preferredDate: true,
        preferredTime: true,
        notes: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
          },
        },
        advisor: {
          select: { id: true, name: true, title: true },
        },
      },
    }),
    prisma.consultationRequest.count({ where }),
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

  const parsedBody = await parseJsonBody(request, consultationPatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    const consultation = await prisma.consultationRequest.update({
      where: { id: body.id },
      data: {
        status: body.status || undefined,
        advisorId: body.advisorId === undefined ? undefined : body.advisorId,
      },
      select: {
        id: true,
        status: true,
        advisor: { select: { id: true, name: true, title: true } },
      },
    });

    return NextResponse.json({ consultation });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unable to update consultation' }, { status: 500 });
  }
}
