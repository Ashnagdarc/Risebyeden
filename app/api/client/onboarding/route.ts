import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { parseJsonBody } from '@/lib/api/validation';
import { getOnboardingGoalTemplate, ONBOARDING_GOAL_CATALOG } from '@/lib/onboarding-goals';
import { getUserOnboardingState } from '@/lib/onboarding-state';
import { requireSessionPolicy } from '@/lib/security/policy';

const onboardingSubmitSchema = z.object({
  investorProfile: z.object({
    experience: z.enum(['new', 'starter', 'growing', 'established']).optional(),
    focus: z.array(z.enum(['residential', 'commercial', 'land', 'mixed'])).optional(),
  }).optional(),
  goals: z.array(z.object({
    goalId: z.string().trim().min(1),
  })).min(3).max(5),
}).strict();

export async function GET() {
  const auth = await requireSessionPolicy({ requireUserId: true, allowedRoles: ['client'] });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = await getUserOnboardingState(userId);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    onboardingCompleted: user.onboardingCompleted,
    onboardingCompletedAt: user.onboardingCompletedAt,
    goalCatalog: ONBOARDING_GOAL_CATALOG,
  });
}

export async function POST(request: Request) {
  const auth = await requireSessionPolicy({ requireUserId: true, allowedRoles: ['client'] });
  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, onboardingSubmitSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const body = parsedBody.data;
  const uniqueGoalIds = new Set(body.goals.map((entry) => entry.goalId));
  if (uniqueGoalIds.size !== body.goals.length) {
    return NextResponse.json({ error: 'Duplicate goals are not allowed' }, { status: 400 });
  }

  const templates = body.goals.map((entry) => {
    const template = getOnboardingGoalTemplate(entry.goalId);
    return {
      entry,
      template,
    };
  });

  const missingTemplate = templates.find((entry) => !entry.template);
  if (missingTemplate) {
    return NextResponse.json({ error: 'One or more goals are invalid' }, { status: 400 });
  }

  const existingUser = await getUserOnboardingState(userId);

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (existingUser.onboardingCompleted) {
    return NextResponse.json({ error: 'Onboarding already completed' }, { status: 409 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (body.investorProfile?.experience || body.investorProfile?.focus?.length) {
        await tx.clientProfile.upsert({
          where: { userId },
          update: { riskProfile: body.investorProfile?.experience ?? undefined },
          create: { userId, riskProfile: body.investorProfile?.experience ?? null },
        });
      }

      if (body.investorProfile?.focus?.length) {
        await tx.userSettings.upsert({
          where: { userId },
          update: { portfolioStrategy: body.investorProfile.focus.join(',') },
          create: { userId, portfolioStrategy: body.investorProfile.focus.join(',') },
        });
      }

      for (const item of templates) {
        const template = item.template!;

        await tx.goal.create({
          data: {
            user: {
              connect: { id: userId },
            },
            title: template.title,
            description: template.description,
            type: template.type,
            targetDate: null,
            targetValue: template.targetValue ?? null,
            targetCount: template.targetCount ?? null,
            targetPercent: template.targetPercent ?? null,
            referenceLabel: template.referenceLabel ?? null,
            currentValue: 0,
          },
        });
      }

      const completedAt = new Date();

      await tx.$executeRaw(Prisma.sql`
        UPDATE "User"
        SET
          "onboardingCompleted" = true,
          "onboardingCompletedAt" = ${completedAt},
          "updatedAt" = ${completedAt}
        WHERE "id" = ${userId}
      `);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to complete onboarding', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A conflicting profile record exists. Please retry.' }, { status: 409 });
      }

      if (error.code === 'P2003') {
        return NextResponse.json({ error: 'A required related record is missing. Please retry onboarding.' }, { status: 400 });
      }

      if (error.code === 'P2022') {
        return NextResponse.json({ error: 'Database schema mismatch detected. Run migrations and try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unable to complete onboarding right now. Please try again.' }, { status: 500 });
  }
}
