-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'RENTED', 'SOLD', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'RENEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('CALL', 'FOLLOW_UP', 'CONTRACT', 'OWNER', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'COMPLETED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('CONTRACT_EXPIRY', 'FOLLOW_UP', 'CALL', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "secondMobile" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "fileCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "propertyType" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" DECIMAL(10,2) NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "floor" INTEGER NOT NULL DEFAULT 0,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "unitsPerFloor" INTEGER NOT NULL DEFAULT 1,
    "buildingAge" INTEGER NOT NULL DEFAULT 0,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "storage" BOOLEAN NOT NULL DEFAULT false,
    "elevator" BOOLEAN NOT NULL DEFAULT false,
    "balcony" BOOLEAN NOT NULL DEFAULT false,
    "salePrice" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "mortgagePrice" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "rentPrice" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "isConvertible" BOOLEAN NOT NULL DEFAULT false,
    "conversionRate" DECIMAL(8,5),
    "description" TEXT,
    "internalNotes" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastFollowUpAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseContract" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantMobile" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "mortgageAmount" DECIMAL(18,0) NOT NULL,
    "rentAmount" DECIMAL(18,0) NOT NULL,
    "description" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "previousContractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "ownerId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "FollowUpType" NOT NULL DEFAULT 'FOLLOW_UP',
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "leaseContractId" TEXT,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "type" "ReminderType" NOT NULL DEFAULT 'CUSTOM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyStatusHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "oldStatus" "PropertyStatus",
    "newStatus" "PropertyStatus" NOT NULL,
    "note" TEXT,
    "changedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'office',
    "officeName" TEXT NOT NULL DEFAULT 'املاک آشیان',
    "officePhone" TEXT NOT NULL DEFAULT '',
    "officeAddress" TEXT NOT NULL DEFAULT '',
    "conversionRate" DECIMAL(8,5) NOT NULL DEFAULT 0.03,
    "reminderDays" INTEGER[] DEFAULT ARRAY[60, 30, 14, 7]::INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Owner_mobile_idx" ON "Owner"("mobile");

-- CreateIndex
CREATE INDEX "Owner_fullName_idx" ON "Owner"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Property_sequence_key" ON "Property"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Property_fileCode_key" ON "Property"("fileCode");

-- CreateIndex
CREATE INDEX "Property_status_deletedAt_createdAt_idx" ON "Property"("status", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Property_transactionType_status_idx" ON "Property"("transactionType", "status");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "Property_neighborhood_idx" ON "Property"("neighborhood");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseContract_previousContractId_key" ON "LeaseContract"("previousContractId");

-- CreateIndex
CREATE INDEX "LeaseContract_propertyId_idx" ON "LeaseContract"("propertyId");

-- CreateIndex
CREATE INDEX "LeaseContract_ownerId_idx" ON "LeaseContract"("ownerId");

-- CreateIndex
CREATE INDEX "LeaseContract_status_endDate_idx" ON "LeaseContract"("status", "endDate");

-- CreateIndex
CREATE INDEX "FollowUp_status_followUpDate_idx" ON "FollowUp"("status", "followUpDate");

-- CreateIndex
CREATE INDEX "FollowUp_propertyId_idx" ON "FollowUp"("propertyId");

-- CreateIndex
CREATE INDEX "FollowUp_ownerId_idx" ON "FollowUp"("ownerId");

-- CreateIndex
CREATE INDEX "Reminder_status_remindAt_idx" ON "Reminder"("status", "remindAt");

-- CreateIndex
CREATE INDEX "Reminder_propertyId_idx" ON "Reminder"("propertyId");

-- CreateIndex
CREATE INDEX "Reminder_ownerId_idx" ON "Reminder"("ownerId");

-- CreateIndex
CREATE INDEX "Reminder_leaseContractId_idx" ON "Reminder"("leaseContractId");

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_propertyId_createdAt_idx" ON "PropertyStatusHistory"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseContract" ADD CONSTRAINT "LeaseContract_previousContractId_fkey" FOREIGN KEY ("previousContractId") REFERENCES "LeaseContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_leaseContractId_fkey" FOREIGN KEY ("leaseContractId") REFERENCES "LeaseContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
