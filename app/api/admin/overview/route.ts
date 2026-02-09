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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [pendingInterests, activePresets, priceUpdates, clientPortfolios] = await Promise.all([
    prisma.interestRequest.count({ where: { status: 'PENDING' } }),
    prisma.property.count({ where: { status: { not: 'SOLD' } } }),
    prisma.priceUpdate.count({ where: { effectiveDate: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { role: 'CLIENT', status: 'ACTIVE' } }),
  ]);

  const recentInterests = await prisma.interestRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: { select: { userId: true, name: true } },
      property: { select: { name: true } },
    },
  });

  const recentPriceUpdates = await prisma.priceUpdate.findMany({
    orderBy: { effectiveDate: 'desc' },
    take: 5,
    select: {
      id: true,
      price: true,
      effectiveDate: true,
      source: true,
      property: { select: { name: true } },
    },
  });

  return NextResponse.json({
    stats: {
      pendingInterests,
      activePresets,
      priceUpdates,
      clientPortfolios,
    },
    recentInterests,
    recentPriceUpdates,
  });
}
