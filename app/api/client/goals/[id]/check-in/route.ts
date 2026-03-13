import { GoalStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parseJsonBody } from '@/lib/api/validation';
import { isPreviousUtcDay, isSameUtcDay } from '@/lib/goals';
import { requireSessionPolicy } from '@/lib/security/policy';

const checkInSchema = z
  .object({
    note: z.string().trim().max(240).nullable().optional(),
  })
  .strict();

export async function POST(
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

  const parsedBody = await parseJsonBody(request, checkInSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const now = new Date();

  try {
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        status: true,
        lastCheckInAt: true,
        streakCount: true,
        longestStreak: true,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status !== GoalStatus.ACTIVE) {
      return NextResponse.json({ error: 'Only active goals can be checked in' }, { status: 400 });
    }

    if (goal.lastCheckInAt && isSameUtcDay(goal.lastCheckInAt, now)) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 409 });
    }

    const streakCount =
      goal.lastCheckInAt && isPreviousUtcDay(goal.lastCheckInAt, now)
        ? goal.streakCount + 1
        : 1;
    const longestStreak = Math.max(goal.longestStreak, streakCount);

    await prisma.$transaction([
      prisma.goalCheckIn.create({
        data: {
          goalId: goal.id,
          note: parsedBody.data.note || null,
        },
      }),
      prisma.goal.update({
        where: { id: goal.id },
        data: {
          lastCheckInAt: now,
          streakCount,
          longestStreak,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      streakCount,
      longestStreak,
      lastCheckInAt: now,
    });
  } catch (error) {
    console.error('Failed to check in goal', error);
    return NextResponse.json({ error: 'Unable to complete check-in' }, { status: 500 });
  }
}
