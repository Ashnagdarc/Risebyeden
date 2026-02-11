import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = await prisma.priceUpdate.findMany({
    orderBy: { effectiveDate: 'desc' },
    select: {
      id: true,
      price: true,
      effectiveDate: true,
      source: true,
      property: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ updates });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    propertyId?: string;
    price?: string | number;
    effectiveDate?: string;
    source?: string;
  };

  if (!body.propertyId || !body.price || !body.effectiveDate) {
    return NextResponse.json({ error: 'Property, price, and date are required' }, { status: 400 });
  }

  const price = Number(body.price);
  const effectiveDate = new Date(body.effectiveDate);

  if (!Number.isFinite(price) || Number.isNaN(effectiveDate.getTime())) {
    return NextResponse.json({ error: 'Invalid price or date' }, { status: 400 });
  }

  const update = await prisma.priceUpdate.create({
    data: {
      propertyId: body.propertyId,
      price,
      effectiveDate,
      source: body.source?.trim() || null,
    },
    select: {
      id: true,
      price: true,
      effectiveDate: true,
      source: true,
      property: { select: { id: true, name: true } },
    },
  });

  await deleteCacheKeys([CACHE_KEYS.adminOverview]);

  return NextResponse.json({ update });
}
