-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "tierOverride" TEXT,
ADD COLUMN     "tierOverrideEnabled" BOOLEAN NOT NULL DEFAULT false;
