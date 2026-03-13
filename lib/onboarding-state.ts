import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export type UserOnboardingState = {
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  name: string | null;
};

export async function getUserOnboardingState(userId: string): Promise<UserOnboardingState | null> {
  const rows = await prisma.$queryRaw<Array<{
    onboardingCompleted: boolean | null;
    onboardingCompletedAt: Date | null;
    name: string | null;
  }>>(Prisma.sql`
    SELECT
      COALESCE("onboardingCompleted", false) AS "onboardingCompleted",
      "onboardingCompletedAt" AS "onboardingCompletedAt",
      "name"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    onboardingCompleted: row.onboardingCompleted === true,
    onboardingCompletedAt: row.onboardingCompletedAt ?? null,
    name: row.name ?? null,
  };
}

export async function markUserOnboardingComplete(userId: string, completedAt = new Date()): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "User"
    SET
      "onboardingCompleted" = true,
      "onboardingCompletedAt" = ${completedAt},
      "updatedAt" = ${completedAt}
    WHERE "id" = ${userId}
  `);
}
