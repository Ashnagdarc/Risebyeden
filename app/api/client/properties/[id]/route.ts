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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = (await params) ?? {};
  if (!id) {
    return NextResponse.json({ error: 'Missing property id' }, { status: 400 });
  }

  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = CACHE_KEYS.clientPropertyById(id);
  const cached = await getCachedJson<{ property: unknown }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const property = await prisma.property.findUnique({
    where: { id },
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
      yearBuilt: true,
      capRate: true,
      description: true,
      documents: {
        where: { type: 'OTHER' },
        select: { url: true },
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payload = { property };
  await setCachedJson(cacheKey, payload, 120);

  return NextResponse.json(payload);
}
