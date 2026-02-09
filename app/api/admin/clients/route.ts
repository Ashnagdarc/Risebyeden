import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      userId: true,
      name: true,
      organization: true,
      status: true,
      clientProperties: {
        select: {
          quantity: true,
          purchasePrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const clients = users.map((user) => {
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

    return {
      id: user.id,
      userId: user.userId,
      name: user.name,
      organization: user.organization,
      status: user.status,
      propertyCount: totals.propertyCount,
      portfolioValue: totals.portfolioValue,
    };
  });

  return NextResponse.json({ clients });
}
