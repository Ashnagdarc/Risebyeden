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
      description: true,
      documents: {
        where: { type: 'OTHER' },
        select: { id: true, url: true },
        orderBy: { createdAt: 'asc' },
      },
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
    imageUrls?: string[];
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

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((url) => url.trim()).filter(Boolean)
    : [];

  const property = await prisma.property.create({
    data: {
      name: body.name.trim(),
      slug: body.slug ? slugify(body.slug) : slugify(body.name),
      location: body.location?.trim() || null,
      description: body.description?.trim() || null,
      status: body.status || 'AVAILABLE',
      basePrice,
      documents: imageUrls.length
        ? {
            create: imageUrls.map((url, index) => ({
              name: `${body.name?.trim() || 'Property'} Image ${index + 1}`,
              url,
              type: 'OTHER',
            })),
          }
        : undefined,
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

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    slug?: string;
    location?: string;
    description?: string;
    status?: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    basePrice?: string | number | null;
    imageUrls?: string[];
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
  }

  const basePriceRaw = body.basePrice ?? null;
  const basePrice = basePriceRaw === null
    ? null
    : Number.isFinite(Number(basePriceRaw))
      ? Number(basePriceRaw)
      : null;

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((url) => url.trim()).filter(Boolean)
    : null;

  if (imageUrls) {
    await prisma.document.deleteMany({
      where: { propertyId: body.id, type: 'OTHER' },
    });
  }

  const property = await prisma.property.update({
    where: { id: body.id },
    data: {
      name: body.name?.trim() || undefined,
      slug: body.slug ? slugify(body.slug) : undefined,
      location: body.location?.trim() || null,
      description: body.description?.trim() || null,
      status: body.status || undefined,
      basePrice,
      documents: imageUrls && imageUrls.length
        ? {
            create: imageUrls.map((url, index) => ({
              name: `${body.name?.trim() || 'Property'} Image ${index + 1}`,
              url,
              type: 'OTHER',
            })),
          }
        : undefined,
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

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };

  if (!body.id) {
    return NextResponse.json({ error: 'Property id is required' }, { status: 400 });
  }

  await prisma.document.deleteMany({ where: { propertyId: body.id } });
  await prisma.clientProperty.deleteMany({ where: { propertyId: body.id } });
  await prisma.transaction.deleteMany({ where: { propertyId: body.id } });

  await prisma.property.delete({ where: { id: body.id } });

  return NextResponse.json({ ok: true });
}
