import { GoalStatus, GoalType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parseJsonBody } from '@/lib/api/validation';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import { buildGoalPortfolioSnapshot, calculateGoalProgress, getGoalCountdownLabel, isSameUtcDay } from '@/lib/goals';
import { requireSessionPolicy } from '@/lib/security/policy';

const createGoalSchema = z
  .object({
    title: z.string().trim().min(3).max(140),
    description: z.string().trim().max(500).nullable().optional(),
    type: z.nativeEnum(GoalType),
    targetDate: z.coerce.date().nullable().optional(),
    targetValue: z.number().nonnegative().nullable().optional(),
    targetCount: z.number().int().positive().nullable().optional(),
    targetPercent: z.number().nonnegative().nullable().optional(),
    referencePropertyId: z.string().trim().min(1).max(64).nullable().optional(),
    referenceLabel: z.string().trim().max(120).nullable().optional(),
    currentValue: z.number().nonnegative().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === GoalType.ASSET_VALUE && (value.targetValue ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Asset value goals require a positive targetValue',
        path: ['targetValue'],
      });
    }

    if (value.type === GoalType.PROPERTY_COUNT && (value.targetCount ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Property count goals require a positive targetCount',
        path: ['targetCount'],
      });
    }

    if (value.type === GoalType.PROPERTY_APPRECIATION && (value.targetPercent ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Appreciation goals require a positive targetPercent',
        path: ['targetPercent'],
      });
    }

    if (value.type === GoalType.PROJECT_PLOT_COUNT) {
      if ((value.targetCount ?? 0) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project goals require a positive targetCount',
          path: ['targetCount'],
        });
      }

      if (!value.referenceLabel?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project goals require a project name in referenceLabel',
          path: ['referenceLabel'],
        });
      }
    }

    if (value.type === GoalType.CUSTOM) {
      const hasTarget = (value.targetValue ?? 0) > 0 || (value.targetCount ?? 0) > 0 || (value.targetPercent ?? 0) > 0;
      if (!hasTarget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom goals require at least one target field',
          path: ['targetValue'],
        });
      }
    }
  });

function toNumber(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  return Number(value);
}

async function getSnapshot(userId: string) {
  const holdings = await prisma.clientProperty.findMany({
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
          appreciation: true,
          basePrice: true,
        },
      },
    },
  });

  return buildGoalPortfolioSnapshot(
    holdings.map((entry) => ({
      quantity: entry.quantity,
      purchasePrice: entry.purchasePrice ? Number(entry.purchasePrice) : null,
      property: {
        id: entry.property.id,
        name: entry.property.name,
        location: entry.property.location,
        city: entry.property.city,
        appreciation: entry.property.appreciation,
        basePrice: entry.property.basePrice ? Number(entry.property.basePrice) : null,
      },
    }))
  );
}

export async function GET() {
  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const now = new Date();
    const [goals, snapshot] = await Promise.all([
      prisma.goal.findMany({
        where: {
          userId,
          status: {
            not: GoalStatus.ARCHIVED,
          },
        },
        include: {
          referenceProperty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: QUERY_LIMITS.clientGoals,
        orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { createdAt: 'desc' }],
      }),
      getSnapshot(userId),
    ]);

    const tx: Array<ReturnType<typeof prisma.goal.update> | ReturnType<typeof prisma.goalProgressSnapshot.create>> = [];

    const payload = goals.map((goal) => {
      const computed = calculateGoalProgress(
        {
          type: goal.type,
          targetDate: goal.targetDate,
          targetValue: toNumber(goal.targetValue),
          targetCount: goal.targetCount,
          targetPercent: goal.targetPercent,
          referencePropertyId: goal.referencePropertyId,
          referenceLabel: goal.referenceLabel,
          currentValue: toNumber(goal.currentValue),
        },
        snapshot,
        now
      );

      let nextStatus = goal.status;
      let nextCompletedAt = goal.completedAt;

      if (goal.status === GoalStatus.ACTIVE) {
        if (computed.isComplete) {
          nextStatus = GoalStatus.COMPLETED;
          nextCompletedAt = goal.completedAt || now;
        } else if (computed.isExpired) {
          nextStatus = GoalStatus.EXPIRED;
        }
      }

      const storedValue = toNumber(goal.currentValue);
      const valueChanged = Math.abs(storedValue - computed.currentValue) >= 0.01;
      const progressChanged = Math.abs(goal.progressPercent - computed.progressPercent) >= 0.1;
      const statusChanged = nextStatus !== goal.status;

      if (valueChanged || progressChanged || statusChanged) {
        tx.push(
          prisma.goal.update({
            where: { id: goal.id },
            data: {
              currentValue: computed.currentValue,
              progressPercent: computed.progressPercent,
              status: nextStatus,
              completedAt: nextCompletedAt,
            },
          })
        );

        tx.push(
          prisma.goalProgressSnapshot.create({
            data: {
              goalId: goal.id,
              currentValue: computed.currentValue,
              progressPercent: computed.progressPercent,
            },
          })
        );
      }

      const canCheckIn = nextStatus === GoalStatus.ACTIVE && (!goal.lastCheckInAt || !isSameUtcDay(goal.lastCheckInAt, now));

      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        status: nextStatus,
        targetDate: goal.targetDate,
        targetValue: toNumber(goal.targetValue),
        targetCount: goal.targetCount,
        targetPercent: goal.targetPercent,
        currentValue: computed.currentValue,
        progressPercent: computed.progressPercent,
        daysLeft: computed.daysLeft,
        countdownLabel: getGoalCountdownLabel(nextStatus, computed.daysLeft),
        streakCount: goal.streakCount,
        longestStreak: goal.longestStreak,
        lastCheckInAt: goal.lastCheckInAt,
        referenceLabel: goal.referenceLabel,
        referenceProperty: goal.referenceProperty,
        canCheckIn,
      };
    });

    if (tx.length > 0) {
      await prisma.$transaction(tx);
    }

    const activeCount = payload.filter((goal) => goal.status === GoalStatus.ACTIVE).length;
    const completedCount = payload.filter((goal) => goal.status === GoalStatus.COMPLETED).length;
    const expiredCount = payload.filter((goal) => goal.status === GoalStatus.EXPIRED).length;
    const averageProgress = payload.length
      ? payload.reduce((sum, goal) => sum + goal.progressPercent, 0) / payload.length
      : 0;

    return NextResponse.json({
      goals: payload,
      summary: {
        activeCount,
        completedCount,
        expiredCount,
        averageProgress: Math.round(averageProgress * 100) / 100,
        bestStreak: payload.reduce((max, goal) => Math.max(max, goal.longestStreak), 0),
      },
    });
  } catch (error) {
    console.error('Failed to load goals', error);
    return NextResponse.json({ error: 'Unable to load goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSessionPolicy({ requireUserId: true });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, createGoalSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const payload = parsedBody.data;

  if (payload.referencePropertyId) {
    const property = await prisma.property.findUnique({
      where: { id: payload.referencePropertyId },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json({ error: 'Reference property not found' }, { status: 404 });
    }
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        user: {
          connect: { id: userId },
        },
        title: payload.title,
        description: payload.description || null,
        type: payload.type,
        targetDate: payload.targetDate ?? null,
        targetValue: payload.targetValue ?? null,
        targetCount: payload.targetCount ?? null,
        targetPercent: payload.targetPercent ?? null,
        ...(payload.referencePropertyId
          ? {
              referenceProperty: {
                connect: { id: payload.referencePropertyId },
              },
            }
          : {}),
        referenceLabel: payload.referenceLabel || null,
        currentValue: payload.type === GoalType.CUSTOM ? payload.currentValue || 0 : 0,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, goalId: goal.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal', error);
    return NextResponse.json({ error: 'Unable to create goal' }, { status: 500 });
  }
}
