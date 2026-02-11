import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { buildPaginationMeta, parsePagination } from '@/lib/api/pagination';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

const priceUpdateListQuerySchema = z.object({
  propertyId: z.string().min(1).optional(),
});

const createPriceUpdateSchema = z.object({
  propertyId: z.string().min(1),
  price: z.union([z.number(), z.string().trim().min(1)]),
  effectiveDate: z.string().trim().min(1),
  source: z.string().trim().min(1).max(200).optional(),
}).strict();

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedQuery = parseQuery(request, priceUpdateListQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }
  const pagination = parsePagination(request, { defaultLimit: 50, maxLimit: 200 });
  const where = parsedQuery.data.propertyId ? { propertyId: parsedQuery.data.propertyId } : undefined;

  const [updates, total] = await prisma.$transaction([
    prisma.priceUpdate.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        price: true,
        effectiveDate: true,
        source: true,
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.priceUpdate.count({ where }),
  ]);

  return NextResponse.json({
    updates,
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

  const parsedBody = await parseJsonBody(request, createPriceUpdateSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

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
