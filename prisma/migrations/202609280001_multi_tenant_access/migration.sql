ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OFFICE_ADMIN';

CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'EDIT', 'MANAGE');

CREATE TABLE "Office" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "adminsCanViewAgentFiles" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Office" ("id", "name", "phone", "address", "updatedAt")
VALUES ('office-default', 'املاک آشیان', '', '', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "User" ADD COLUMN "mobile" TEXT;
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "User" ADD COLUMN "officeId" TEXT;

UPDATE "User"
SET "mobile" = regexp_replace("username", '\D', '', 'g')
WHERE "mobile" IS NULL AND regexp_replace("username", '\D', '', 'g') ~ '^09[0-9]{9}$';

UPDATE "User"
SET "mobile" = '09000000000'
WHERE "mobile" IS NULL;

UPDATE "User" SET "officeId" = 'office-default' WHERE "officeId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "mobile" SET NOT NULL;
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");
CREATE INDEX "User_officeId_idx" ON "User"("officeId");
CREATE INDEX "User_status_idx" ON "User"("status");

ALTER TABLE "User"
  ADD CONSTRAINT "User_officeId_fkey"
  FOREIGN KEY ("officeId") REFERENCES "Office"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "UserApproval" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "status" "UserStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserApproval_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserApproval_userId_createdAt_idx" ON "UserApproval"("userId", "createdAt");
ALTER TABLE "UserApproval"
  ADD CONSTRAINT "UserApproval_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApproval"
  ADD CONSTRAINT "UserApproval_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Owner" ADD COLUMN "officeId" TEXT;
ALTER TABLE "Owner" ADD COLUMN "createdByUserId" TEXT;
UPDATE "Owner" SET "officeId" = 'office-default' WHERE "officeId" IS NULL;
UPDATE "Owner" SET "createdByUserId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "createdByUserId" IS NULL;
CREATE INDEX "Owner_officeId_idx" ON "Owner"("officeId");
CREATE INDEX "Owner_createdByUserId_idx" ON "Owner"("createdByUserId");
ALTER TABLE "Owner"
  ADD CONSTRAINT "Owner_officeId_fkey"
  FOREIGN KEY ("officeId") REFERENCES "Office"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Owner"
  ADD CONSTRAINT "Owner_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property" ADD COLUMN "officeId" TEXT;
ALTER TABLE "Property" ADD COLUMN "ownerUserId" TEXT;
UPDATE "Property" SET "officeId" = 'office-default' WHERE "officeId" IS NULL;
UPDATE "Property" SET "ownerUserId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerUserId" IS NULL;
CREATE INDEX "Property_officeId_idx" ON "Property"("officeId");
CREATE INDEX "Property_ownerUserId_idx" ON "Property"("ownerUserId");
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_officeId_fkey"
  FOREIGN KEY ("officeId") REFERENCES "Office"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PropertyShare" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permission" "SharePermission" NOT NULL DEFAULT 'VIEW',
  "canUploadImages" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyShare_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyShare_propertyId_userId_key" ON "PropertyShare"("propertyId", "userId");
CREATE INDEX "PropertyShare_userId_idx" ON "PropertyShare"("userId");
ALTER TABLE "PropertyShare"
  ADD CONSTRAINT "PropertyShare_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyShare"
  ADD CONSTRAINT "PropertyShare_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Settings" ADD COLUMN "officeId" TEXT;
UPDATE "Settings" SET "officeId" = 'office-default' WHERE "officeId" IS NULL;
CREATE UNIQUE INDEX "Settings_officeId_key" ON "Settings"("officeId");
ALTER TABLE "Settings"
  ADD CONSTRAINT "Settings_officeId_fkey"
  FOREIGN KEY ("officeId") REFERENCES "Office"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Office_name_idx" ON "Office"("name");
