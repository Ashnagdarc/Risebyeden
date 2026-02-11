import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { getCachedJson, setCachedJson } from '@/lib/cache/valkey';

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

  const cached = await getCachedJson<{ properties: unknown[] }>(CACHE_KEYS.clientPropertiesAvailable);
  if (cached) {
    return NextResponse.json(cached);
  }

  const properties = await prisma.property.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      basePrice: true,
      location: true,
      city: true,
      state: true,
      propertyType: true,
      appreciation: true,
      bedrooms: true,
      bathrooms: true,
      squareFeet: true,
      documents: {
        where: { type: 'OTHER' },
        select: { url: true },
        take: 1,
      },
    },
  });

  const payload = { properties };
  await setCachedJson(CACHE_KEYS.clientPropertiesAvailable, payload, 120);

  return NextResponse.json(payload);
}
