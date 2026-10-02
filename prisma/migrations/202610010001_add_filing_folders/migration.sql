ALTER TABLE "Property" ADD COLUMN "folderId" TEXT;

CREATE TABLE "FilingFolder" (
    "id" TEXT NOT NULL,
    "officeId" TEXT,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#147d70',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FilingFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FilingFolderPin" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FilingFolderPin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FilingFolderPin_folderId_userId_key" ON "FilingFolderPin"("folderId", "userId");
CREATE INDEX "FilingFolder_officeId_parentId_sortOrder_idx" ON "FilingFolder"("officeId", "parentId", "sortOrder");
CREATE INDEX "FilingFolder_officeId_name_idx" ON "FilingFolder"("officeId", "name");
CREATE INDEX "FilingFolderPin_userId_createdAt_idx" ON "FilingFolderPin"("userId", "createdAt");
CREATE INDEX "Property_folderId_deletedAt_idx" ON "Property"("folderId", "deletedAt");

ALTER TABLE "Property" ADD CONSTRAINT "Property_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FilingFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FilingFolder" ADD CONSTRAINT "FilingFolder_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FilingFolder" ADD CONSTRAINT "FilingFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FilingFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FilingFolder" ADD CONSTRAINT "FilingFolder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FilingFolderPin" ADD CONSTRAINT "FilingFolderPin_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FilingFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FilingFolderPin" ADD CONSTRAINT "FilingFolderPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
