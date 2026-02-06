import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

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

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      status: true,
      basePrice: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    location?: string;
    description?: string;
    status?: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    basePrice?: string | number | null;
  };

  if (!body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const basePriceRaw = body.basePrice ?? null;
  const basePrice = basePriceRaw === null
    ? null
    : Number.isFinite(Number(basePriceRaw))
      ? Number(basePriceRaw)
      : null;

  const property = await prisma.property.create({
    data: {
      name: body.name.trim(),
      slug: body.slug ? slugify(body.slug) : slugify(body.name),
      location: body.location?.trim() || null,
      description: body.description?.trim() || null,
      status: body.status || 'AVAILABLE',
      basePrice,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      basePrice: true,
    },
  });

  return NextResponse.json({ property });
}
