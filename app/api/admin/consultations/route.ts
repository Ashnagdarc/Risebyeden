import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { requireSessionPolicy } from '@/lib/security/policy';

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
  const auth = await requireSessionPolicy({ allowedRoles: ['admin'] });
  if (!auth.ok) {
    return auth.response;
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
          select: { id: true, userId: true, name: true, email: true, advisorTitle: true, advisorStatus: true },
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
  const auth = await requireSessionPolicy({ allowedRoles: ['admin'] });
  if (!auth.ok) {
    return auth.response;
  }

  const parsedBody = await parseJsonBody(request, consultationPatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    if (body.advisorId) {
      const advisor = await prisma.user.findFirst({
        where: {
          id: body.advisorId,
          role: 'AGENT',
          status: 'ACTIVE',
        },
        select: { id: true, advisorStatus: true },
      });

      if (!advisor) {
        return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
      }
      if (advisor.advisorStatus === 'INACTIVE') {
        return NextResponse.json({ error: 'Advisor is inactive' }, { status: 409 });
      }
    }

    const consultation = await prisma.consultationRequest.update({
      where: { id: body.id },
      data: {
        status: body.status || undefined,
        advisorId: body.advisorId === undefined ? undefined : body.advisorId,
      },
      select: {
        id: true,
        status: true,
        advisor: { select: { id: true, userId: true, name: true, email: true, advisorTitle: true, advisorStatus: true } },
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
