/*
  Warnings:

  - You are about to drop the column `durationDays` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Package` table. All the data in the column will be lost.
  - Added the required column `monthlyPrice` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearlyPrice` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "durationDays",
DROP COLUMN "price",
ADD COLUMN     "badge" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "monthlyPrice" INTEGER NOT NULL,
ADD COLUMN     "yearlyPrice" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "period" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY';
