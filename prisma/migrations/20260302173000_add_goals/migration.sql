-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('ASSET_VALUE', 'PROPERTY_COUNT', 'PROPERTY_APPRECIATION', 'PROJECT_PLOT_COUNT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetDate" TIMESTAMP(3) NOT NULL,
    "targetValue" DECIMAL(18,2),
    "targetCount" INTEGER,
    "targetPercent" DOUBLE PRECISION,
    "referencePropertyId" TEXT,
    "referenceLabel" TEXT,
    "currentValue" DECIMAL(18,2),
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalCheckIn" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgressSnapshot" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL,
    "currentValue" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_status_targetDate_idx" ON "Goal"("userId", "status", "targetDate");

-- CreateIndex
CREATE INDEX "Goal_referencePropertyId_idx" ON "Goal"("referencePropertyId");

-- CreateIndex
CREATE INDEX "GoalCheckIn_goalId_createdAt_idx" ON "GoalCheckIn"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "GoalProgressSnapshot_goalId_createdAt_idx" ON "GoalProgressSnapshot"("goalId", "createdAt");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_referencePropertyId_fkey" FOREIGN KEY ("referencePropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCheckIn" ADD CONSTRAINT "GoalCheckIn_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressSnapshot" ADD CONSTRAINT "GoalProgressSnapshot_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
