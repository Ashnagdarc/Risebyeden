import { GoalStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parseJsonBody } from '@/lib/api/validation';
import { requireSessionPolicy } from '@/lib/security/policy';

const updateGoalSchema = z
  .object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    targetDate: z.coerce.date().nullable().optional(),
    targetValue: z.number().nonnegative().nullable().optional(),
    targetCount: z.number().int().positive().nullable().optional(),
    targetPercent: z.number().nonnegative().nullable().optional(),
    referencePropertyId: z.string().trim().min(1).max(64).nullable().optional(),
    referenceLabel: z.string().trim().max(120).nullable().optional(),
    currentValue: z.number().nonnegative().nullable().optional(),
    status: z.nativeEnum(GoalStatus).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = (await params) ?? {};
  if (!id) {
    return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
  }

  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, updateGoalSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const body = parsedBody.data;

  const existing = await prisma.goal.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  if (body.referencePropertyId) {
    const property = await prisma.property.findUnique({
      where: { id: body.referencePropertyId },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json({ error: 'Reference property not found' }, { status: 404 });
    }
  }

  const nextStatus = body.status;
  const shouldSetCompletedAt = nextStatus === GoalStatus.COMPLETED;

  try {
    await prisma.goal.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        targetDate: body.targetDate,
        targetValue: body.targetValue,
        targetCount: body.targetCount,
        targetPercent: body.targetPercent,
        referencePropertyId: body.referencePropertyId,
        referenceLabel: body.referenceLabel,
        currentValue: existing.type === 'CUSTOM' ? body.currentValue : undefined,
        status: body.status,
        completedAt: shouldSetCompletedAt ? new Date() : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to update goal', error);
    return NextResponse.json({ error: 'Unable to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = (await params) ?? {};
  if (!id) {
    return NextResponse.json({ error: 'Missing goal id' }, { status: 400 });
  }

  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const result = await prisma.goal.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        status: GoalStatus.ARCHIVED,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to archive goal', error);
    return NextResponse.json({ error: 'Unable to archive goal' }, { status: 500 });
  }
}
