import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { buildPortfolioMonthlyHistory } from '@/lib/portfolio-history';

const RANGE_TO_MONTHS: Record<string, number> = {
  '3m': 3,
  '6m': 6,
  '12m': 12,
  all: 24,
};

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return userId || null;
}

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') || '6m').toLowerCase();
  const months = RANGE_TO_MONTHS[range] || RANGE_TO_MONTHS['6m'];

  const clientProperties = await prisma.clientProperty.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'asc' },
    select: {
      quantity: true,
      purchasePrice: true,
      purchasedAt: true,
      property: {
        select: {
          basePrice: true,
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

  const history = buildPortfolioMonthlyHistory(
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
    })),
    months
  );

  return NextResponse.json({ range, months, history });
}