import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
    select: {
      quantity: true,
      purchasePrice: true,
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
        },
      },
    },
  });

  const assets = clientProperties.map((entry) => ({
    id: entry.property.id,
    name: entry.property.name,
    location: entry.property.location || '',
    city: entry.property.city || '',
    state: entry.property.state || '',
    type: entry.property.propertyType || 'Residential',
    appreciation: entry.property.appreciation || 0,
    capRate: entry.property.capRate || 0,
    valuation: entry.property.basePrice ? Number(entry.property.basePrice) : 0,
    occupancy: entry.property.occupancy || 0,
    acquired: entry.property.basePrice ? '—' : '—',
    imageUrl: entry.property.documents[0]?.url || null,
  }));

  const totalValue = assets.reduce((sum, asset) => sum + asset.valuation, 0);
  const avgOccupancy = assets.length ? assets.reduce((sum, asset) => sum + asset.occupancy, 0) / assets.length : 0;
  const avgCapRate = assets.length ? assets.reduce((sum, asset) => sum + asset.capRate, 0) / assets.length : 0;
  const avgAppreciation = assets.length ? assets.reduce((sum, asset) => sum + asset.appreciation, 0) / assets.length : 0;

  return NextResponse.json({
    stats: {
      totalValue,
      avgOccupancy,
      avgCapRate,
      avgAppreciation,
    },
    assets,
  });
}
