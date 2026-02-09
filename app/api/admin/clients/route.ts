import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientQuery = {
    where: { role: 'CLIENT' },
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
      clientProperties: {
        select: {
          quantity: true,
          purchasePrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  } satisfies Prisma.UserFindManyArgs;

  const users = await prisma.user.findMany(clientQuery);

  const clients = (users as Prisma.UserGetPayload<typeof clientQuery>[]).map((user) => {
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

  return NextResponse.json({ clients });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    name?: string | null;
    organization?: string | null;
    status?: 'PENDING' | 'ACTIVE' | 'REJECTED';
    tierOverride?: string | null;
    tierOverrideEnabled?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Client id is required' }, { status: 400 });
  }

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

  const body = (await request.json()) as { id?: string };

  if (!body.id) {
    return NextResponse.json({ error: 'Client id is required' }, { status: 400 });
  }

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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete client' }, { status: 500 });
  }
}
