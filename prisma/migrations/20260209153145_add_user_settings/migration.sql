-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deviceApproval" BOOLEAN NOT NULL DEFAULT true,
    "weeklySecurityReports" BOOLEAN NOT NULL DEFAULT false,
    "portfolioAlerts" BOOLEAN NOT NULL DEFAULT true,
    "acquisitionOpportunities" BOOLEAN NOT NULL DEFAULT true,
    "marketReports" BOOLEAN NOT NULL DEFAULT false,
    "portfolioStrategy" TEXT,
    "defaultRegion" TEXT,
    "dataSharing" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
