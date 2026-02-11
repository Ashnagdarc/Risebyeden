-- AlterTable
ALTER TABLE "User"
ADD COLUMN "advisorTitle" TEXT,
ADD COLUMN "advisorSpecialty" TEXT,
ADD COLUMN "advisorStatus" "AdvisorStatus" NOT NULL DEFAULT 'AVAILABLE';

-- DropForeignKey
ALTER TABLE "ConsultationRequest" DROP CONSTRAINT "ConsultationRequest_advisorId_fkey";

-- Backfill: existing advisor IDs that are not valid User IDs are cleared.
UPDATE "ConsultationRequest" AS cr
SET "advisorId" = NULL
WHERE cr."advisorId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS u
    WHERE u."id" = cr."advisorId"
  );

-- AddForeignKey
ALTER TABLE "ConsultationRequest"
ADD CONSTRAINT "ConsultationRequest_advisorId_fkey"
FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
