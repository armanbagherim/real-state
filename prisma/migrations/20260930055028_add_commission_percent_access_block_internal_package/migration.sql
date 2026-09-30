-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "internal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "accessBlockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commissionPercent" INTEGER NOT NULL DEFAULT 0;
