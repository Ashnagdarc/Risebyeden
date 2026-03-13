import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import { buildPortfolioMonthlyHistory } from '@/lib/portfolio-history';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const clientProperties = await prisma.clientProperty.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'desc' },
    take: QUERY_LIMITS.clientProperties,
    select: {
      quantity: true,
      purchasePrice: true,
      purchasedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          propertyType: true,
          appreciation: true,
          capRate: true,
          occupancy: true,
          basePrice: true,
          documents: {
            where: { type: 'OTHER' },
            select: { url: true },
            take: 1,
          },
          priceUpdates: {
            orderBy: { effectiveDate: 'asc' },
            select: {
              price: true,
              effectiveDate: true,
            },
          },
        },
      },
    },
  });

  const assets = clientProperties.map((entry) => ({
    id: entry.property.id,
    name: entry.property.name,
    quantity: entry.quantity || 1,
    location: entry.property.location || '',
    city: entry.property.city || '',
    state: entry.property.state || '',
    type: entry.property.propertyType || 'Residential',
    appreciation: entry.property.appreciation || 0,
    capRate: entry.property.capRate || 0,
    valuation: entry.property.basePrice ? Number(entry.property.basePrice) : 0,
    occupancy: entry.property.occupancy || 0,
    acquired: entry.purchasedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    imageUrl: entry.property.documents[0]?.url || null,
  }));

  const totalUnits = clientProperties.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
  const totalValue = assets.reduce((sum, asset) => sum + asset.valuation * asset.quantity, 0);
  const investedBasis = clientProperties.reduce((sum, entry) => {
    const quantity = entry.quantity || 1;
    const purchasePrice = entry.purchasePrice ? Number(entry.purchasePrice) : null;
    const basePrice = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
    return sum + quantity * (purchasePrice ?? basePrice);
  }, 0);
  const avgOccupancy = assets.length ? assets.reduce((sum, asset) => sum + asset.occupancy, 0) / assets.length : 0;
  const avgCapRate = assets.length ? assets.reduce((sum, asset) => sum + asset.capRate, 0) / assets.length : 0;
  const avgAppreciation = assets.length ? assets.reduce((sum, asset) => sum + asset.appreciation, 0) / assets.length : 0;
  const portfolioDeltaPercent =
    investedBasis > 0
      ? ((totalValue - investedBasis) / investedBasis) * 100
      : avgAppreciation;
  const monthlyHistory = buildPortfolioMonthlyHistory(
    clientProperties.map((entry) => ({
      quantity: entry.quantity,
      purchasePrice: entry.purchasePrice ? Number(entry.purchasePrice) : null,
      purchasedAt: entry.purchasedAt,
      property: {
        basePrice: entry.property.basePrice ? Number(entry.property.basePrice) : null,
        priceUpdates: entry.property.priceUpdates.map((update) => ({
          price: Number(update.price),
          effectiveDate: update.effectiveDate,
        })),
      },
    }))
  );

  return NextResponse.json({
    stats: {
      totalUnits,
      totalValue,
      portfolioDeltaPercent,
      avgOccupancy,
      avgCapRate,
      avgAppreciation,
      monthlyHistory,
    },
    assets,
  });
}
