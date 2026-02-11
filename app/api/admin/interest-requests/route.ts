import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { sendInterestAssignmentEmail } from '@/lib/email';
import { requireSessionPolicy } from '@/lib/security/policy';
import { logError, logInfo } from '@/lib/observability/logger';
import { bindRequestContextToSentry, getRequestContext, withRequestId } from '@/lib/observability/request-context';

const interestStatusSchema = z.enum(['PENDING', 'SCHEDULED', 'APPROVED', 'REJECTED']);

const interestListQuerySchema = z.object({
  status: interestStatusSchema.optional(),
});

const interestPatchSchema = z.union([
  z.object({
    id: z.string().min(1),
    action: z.literal('ASSIGN'),
    agentUserId: z.string().min(1),
  }).strict(),
  z.object({
    id: z.string().min(1),
    action: z.literal('REJECT'),
  }).strict(),
]);

export async function GET(request: Request) {
  const requestContext = getRequestContext(request);
  bindRequestContextToSentry(requestContext);
  const respond = (body: unknown, init?: ResponseInit) =>
    withRequestId(NextResponse.json(body, init), requestContext.requestId);

  const auth = await requireSessionPolicy({ allowedRoles: ['admin'] });
  if (!auth.ok) {
    return withRequestId(auth.response, requestContext.requestId);
  }

  const parsedQuery = parseQuery(request, interestListQuerySchema);
  if (!parsedQuery.success) {
    return withRequestId(parsedQuery.response, requestContext.requestId);
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
        assignedAt: true,
        user: { select: { userId: true, name: true } },
        property: { select: { name: true } },
        assignedAgent: { select: { id: true, userId: true, name: true, email: true } },
      },
    }),
    prisma.interestRequest.count({ where }),
  ]);

  return respond({
    requests,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

export async function PATCH(request: Request) {
  const requestContext = getRequestContext(request);
  bindRequestContextToSentry(requestContext);
  const respond = (body: unknown, init?: ResponseInit) =>
    withRequestId(NextResponse.json(body, init), requestContext.requestId);

  const auth = await requireSessionPolicy({ allowedRoles: ['admin'] });
  if (!auth.ok) {
    return withRequestId(auth.response, requestContext.requestId);
  }

  const parsedBody = await parseJsonBody(request, interestPatchSchema);
  if (!parsedBody.success) {
    return withRequestId(parsedBody.response, requestContext.requestId);
  }
  const body = parsedBody.data;

  const current = await prisma.interestRequest.findUnique({
    where: { id: body.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: { select: { userId: true, name: true } },
      property: { select: { name: true } },
    },
  });

  if (!current) {
    return respond({ error: 'Request not found' }, { status: 404 });
  }

  try {
    if (body.action === 'REJECT') {
      const requestRecord = await prisma.interestRequest.update({
        where: { id: body.id },
        data: {
          status: 'REJECTED',
          assignedAgentId: null,
          assignedAt: null,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          assignedAt: true,
          user: { select: { userId: true, name: true } },
          property: { select: { name: true } },
          assignedAgent: { select: { id: true, userId: true, name: true, email: true } },
        },
      });

      await deleteCacheKeys([CACHE_KEYS.adminOverview]);
      logInfo('admin.interest_request.rejected', {
        requestId: requestContext.requestId,
        interestRequestId: requestRecord.id,
        previousStatus: current.status,
      });
      return respond({ request: requestRecord });
    }

    const agent = await prisma.user.findFirst({
      where: {
        id: body.agentUserId,
        role: 'AGENT',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
      },
    });

    if (!agent) {
      return respond({ error: 'Active agent not found' }, { status: 404 });
    }

    if (current.status === 'REJECTED') {
      return respond({ error: 'Rejected requests cannot be assigned' }, { status: 409 });
    }

    const assignedAt = new Date();
    const transactionResult = await prisma.$transaction(async (tx) => {
      const updated = await tx.interestRequest.update({
        where: { id: body.id },
        data: {
          status: 'SCHEDULED',
          assignedAgentId: agent.id,
          assignedAt,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          assignedAt: true,
          user: { select: { userId: true, name: true } },
          property: { select: { name: true } },
          assignedAgent: { select: { id: true, userId: true, name: true, email: true } },
        },
      });

      const notification = await tx.notification.create({
        data: {
          userId: agent.id,
          type: 'INTEREST_ASSIGNED',
          title: 'New client lead assigned',
          body: `Reach out to ${current.user?.name || current.user?.userId || 'the client'} about ${current.property?.name || 'their requested property'} as soon as possible.`,
          link: '/agent',
        },
        select: {
          id: true,
        },
      });

      return {
        request: updated,
        notificationId: notification.id,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    const requestRecord = transactionResult.request;
    const notificationId = transactionResult.notificationId;

    let emailSent = false;
    if (agent.email) {
      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await sendInterestAssignmentEmail({
        to: [agent.email],
        agentName: agent.name || agent.userId,
        clientName: current.user?.name || 'Client',
        clientUserId: current.user?.userId || 'N/A',
        propertyName: current.property?.name || 'Requested Property',
        requestedAt: current.createdAt,
        dashboardUrl: `${appUrl}/agent`,
        requestId: requestContext.requestId,
      });
      emailSent = true;
    }

    await deleteCacheKeys([
      CACHE_KEYS.adminOverview,
      CACHE_KEYS.agentNotifications(agent.id),
    ]);

    logInfo('admin.interest_request.assigned', {
      requestId: requestContext.requestId,
      interestRequestId: requestRecord.id,
      agentId: agent.id,
      agentUserId: agent.userId,
      notificationId,
      notifyEmailSent: emailSent,
    });

    return respond({ request: requestRecord });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return respond({ error: 'Request not found' }, { status: 404 });
    }

    logError('admin.interest_request.update_failed', error, {
      requestId: requestContext.requestId,
      interestRequestId: body.id,
      action: body.action,
    });
    return respond({ error: 'Unable to update request' }, { status: 500 });
  }
}
