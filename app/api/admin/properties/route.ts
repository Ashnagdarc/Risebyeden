import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';

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
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

const propertyStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'SOLD']);

const propertyListQuerySchema = z.object({
  status: propertyStatusSchema.optional(),
});

const createPropertySchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).optional(),
  location: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(3000).optional(),
  status: propertyStatusSchema.optional(),
  basePrice: z.union([z.number(), z.string(), z.null()]).optional(),
  imageUrls: z.array(z.string().trim().min(1).max(2048)).optional(),
}).strict();

const updatePropertySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(180).optional(),
  location: z.string().trim().min(1).max(200).nullable().optional(),
  description: z.string().trim().min(1).max(3000).nullable().optional(),
  status: propertyStatusSchema.optional(),
  basePrice: z.union([z.number(), z.string(), z.null()]).optional(),
  imageUrls: z.array(z.string().trim().min(1).max(2048)).optional(),
}).strict();

const deletePropertySchema = z.object({
  id: z.string().min(1),
}).strict();

function normalizePriceInput(
  value: number | string | null | undefined,
  allowUndefined: boolean
): number | null | undefined {
  if (value === undefined) {
    return allowUndefined ? undefined : null;
  }
  if (value === null) {
    return null;
  }
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return undefined;
  }
  return normalized;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, propertyListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.status ? { status: parsedQuery.data.status } : undefined;

  const [properties, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
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
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({
    properties,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, createPropertySchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const basePrice = normalizePriceInput(body.basePrice, false);
  if (basePrice === undefined) {
    return NextResponse.json({ error: 'Invalid base price' }, { status: 400 });
  }

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

  await deleteCacheKeys([
    CACHE_KEYS.clientPropertiesAvailable,
    CACHE_KEYS.adminOverview,
    CACHE_KEYS.clientPropertyById(property.id),
  ]);

  return NextResponse.json({ property });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, updatePropertySchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const basePrice = normalizePriceInput(body.basePrice, true);
  if (body.basePrice !== undefined && basePrice === undefined) {
    return NextResponse.json({ error: 'Invalid base price' }, { status: 400 });
  }

  const imageUrls = body.imageUrls?.map((url) => url.trim()).filter(Boolean);

  try {
    const property = await prisma.$transaction(async (tx) => {
      const updatedProperty = await tx.property.update({
        where: { id: body.id },
        data: {
          name: body.name?.trim() || undefined,
          slug: body.slug ? slugify(body.slug) : undefined,
          location: body.location === undefined ? undefined : body.location?.trim() || null,
          description: body.description === undefined ? undefined : body.description?.trim() || null,
          status: body.status || undefined,
          basePrice: basePrice === undefined ? undefined : basePrice,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          basePrice: true,
        },
      });

      if (imageUrls !== undefined) {
        await tx.document.deleteMany({
          where: { propertyId: body.id, type: 'OTHER' },
        });

        if (imageUrls.length > 0) {
          await tx.document.createMany({
            data: imageUrls.map((url, index) => ({
              propertyId: body.id,
              name: `${updatedProperty.name} Image ${index + 1}`,
              url,
              type: 'OTHER',
            })),
          });
        }
      }

      return updatedProperty;
    });

    await deleteCacheKeys([
      CACHE_KEYS.clientPropertiesAvailable,
      CACHE_KEYS.adminOverview,
      CACHE_KEYS.clientPropertyById(property.id),
    ]);

    return NextResponse.json({ property });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unable to update property' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, deletePropertySchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const deleted = await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUnique({
      where: { id: body.id },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    const relatedTransactions = await tx.transaction.findMany({
      where: { propertyId: body.id },
      select: { id: true },
    });

    if (relatedTransactions.length) {
      await tx.payment.deleteMany({
        where: {
          transactionId: {
            in: relatedTransactions.map((entry) => entry.id),
          },
        },
      });
    }

    await tx.document.deleteMany({ where: { propertyId: body.id } });
    await tx.interestRequest.deleteMany({ where: { propertyId: body.id } });
    await tx.clientProperty.deleteMany({ where: { propertyId: body.id } });
    await tx.priceUpdate.deleteMany({ where: { propertyId: body.id } });
    await tx.transaction.deleteMany({ where: { propertyId: body.id } });
    await tx.property.delete({ where: { id: body.id } });

    return true;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  await deleteCacheKeys([
    CACHE_KEYS.clientPropertiesAvailable,
    CACHE_KEYS.adminOverview,
    CACHE_KEYS.clientPropertyById(body.id),
  ]);

  return NextResponse.json({ ok: true });
}
