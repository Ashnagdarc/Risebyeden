import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Prisma } from '@prisma/client';
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

function resolveTierLabel(propertyCount: number) {
  if (propertyCount >= 15) {
    return 'Oga Boss';
  }
  if (propertyCount >= 10) {
    return 'Prime';
  }
  return 'Core';
}

const clientListQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
});

const clientPatchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120).nullable().optional(),
  organization: z.string().trim().min(1).max(160).nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED']).optional(),
  tierOverride: z.string().trim().min(1).max(80).nullable().optional(),
  tierOverrideEnabled: z.boolean().optional(),
}).strict();

const clientDeleteSchema = z.object({
  id: z.string().min(1),
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, clientListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = {
    role: 'CLIENT',
    status: parsedQuery.data.status,
  } satisfies Prisma.UserWhereInput;

  const clientSelect = {
    id: true,
    userId: true,
    name: true,
    organization: true,
    status: true,
    clientProfile: {
      select: {
        tierOverride: true,
        tierOverrideEnabled: true,
      },
    },
    clientProperties: {
      select: {
        quantity: true,
        purchasePrice: true,
      },
    },
  } satisfies Prisma.UserSelect;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: clientSelect,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ]);

  const clients = (users as Prisma.UserGetPayload<{ select: typeof clientSelect }>[]).map((user) => {
    const totals = user.clientProperties.reduce<{
      propertyCount: number;
      portfolioValue: number;
    }>((acc, entry) => {
      const quantity = entry.quantity || 0;
      const price = entry.purchasePrice ? Number(entry.purchasePrice) : 0;
      acc.propertyCount += quantity;
      acc.portfolioValue += price * quantity;
      return acc;
    }, { propertyCount: 0, portfolioValue: 0 });

    const overrideEnabled = Boolean(user.clientProfile?.tierOverrideEnabled);
    const overrideLabel = user.clientProfile?.tierOverride || null;
    const computedTier = resolveTierLabel(totals.propertyCount);
    const tier = overrideEnabled && overrideLabel ? overrideLabel : computedTier;

    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      organization: user.organization,
      status: user.status,
      propertyCount: totals.propertyCount,
      portfolioValue: totals.portfolioValue,
      tier,
      tierOverride: overrideLabel,
      tierOverrideEnabled: overrideEnabled,
      tierSource: overrideEnabled && overrideLabel ? 'override' : 'auto',
    };
  });

  return NextResponse.json({
    clients,
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

  const parsedBody = await parseJsonBody(request, clientPatchSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    const updateResult = await prisma.user.updateMany({
      where: { id: body.id, role: 'CLIENT' },
      data: {
        name: body.name === undefined ? undefined : body.name?.trim() || null,
        organization: body.organization === undefined ? undefined : body.organization?.trim() || null,
        status: body.status || undefined,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (body.tierOverride !== undefined || body.tierOverrideEnabled !== undefined) {
      await prisma.clientProfile.upsert({
        where: { userId: body.id },
        create: {
          userId: body.id,
          tierOverride: body.tierOverride ?? null,
          tierOverrideEnabled: body.tierOverrideEnabled ?? false,
        },
        update: {
          tierOverride: body.tierOverride ?? undefined,
          tierOverrideEnabled: body.tierOverrideEnabled ?? undefined,
        },
      });
    }

    const client = await prisma.user.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        userId: true,
        name: true,
        organization: true,
        status: true,
        clientProfile: {
          select: {
            tierOverride: true,
            tierOverrideEnabled: true,
          },
        },
      },
    });

    await deleteCacheKeys([CACHE_KEYS.adminOverview]);

    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: 'Unable to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, clientDeleteSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const client = await prisma.user.findUnique({
    where: { id: body.id },
    select: { id: true, role: true },
  });

  if (!client || client.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  try {
    await prisma.$transaction([
      prisma.clientProperty.deleteMany({ where: { userId: client.id } }),
      prisma.payment.deleteMany({ where: { userId: client.id } }),
      prisma.transaction.deleteMany({ where: { userId: client.id } }),
      prisma.document.deleteMany({ where: { userId: client.id } }),
      prisma.organizationMember.deleteMany({ where: { userId: client.id } }),
      prisma.interestRequest.deleteMany({ where: { userId: client.id } }),
      prisma.clientProfile.deleteMany({ where: { userId: client.id } }),
      prisma.user.delete({ where: { id: client.id } }),
    ]);

    await deleteCacheKeys([CACHE_KEYS.adminOverview]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete client' }, { status: 500 });
  }
}
