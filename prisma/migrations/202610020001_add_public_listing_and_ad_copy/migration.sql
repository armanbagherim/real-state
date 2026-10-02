-- Enum types
CREATE TYPE "AdCopyVariant" AS ENUM ('DIVAR', 'INSTAGRAM', 'WHATSAPP', 'CUSTOMER');
CREATE TYPE "PublicListingEventType" AS ENUM ('VIEW', 'GALLERY', 'PHONE_CLICK', 'VISIT_REQUEST');

-- Shareable public page for a property
CREATE TABLE "PropertyPublicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "phoneClicks" INTEGER NOT NULL DEFAULT 0,
    "visitRequests" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyPublicLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicListingEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "type" "PublicListingEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicListingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyAdCopy" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "variant" "AdCopyVariant" NOT NULL DEFAULT 'DIVAR',
    "content" TEXT NOT NULL,
    "generator" TEXT NOT NULL DEFAULT '',
    "editedByUser" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyAdCopy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyPublicLink_token_key" ON "PropertyPublicLink"("token");
CREATE UNIQUE INDEX "PropertyPublicLink_propertyId_key" ON "PropertyPublicLink"("propertyId");
CREATE INDEX "PropertyPublicLink_isActive_idx" ON "PropertyPublicLink"("isActive");
CREATE INDEX "PublicListingEvent_linkId_type_idx" ON "PublicListingEvent"("linkId", "type");
CREATE INDEX "PublicListingEvent_linkId_createdAt_idx" ON "PublicListingEvent"("linkId", "createdAt");
CREATE UNIQUE INDEX "PropertyAdCopy_propertyId_variant_key" ON "PropertyAdCopy"("propertyId", "variant");
CREATE INDEX "PropertyAdCopy_propertyId_idx" ON "PropertyAdCopy"("propertyId");

ALTER TABLE "PropertyPublicLink" ADD CONSTRAINT "PropertyPublicLink_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyPublicLink" ADD CONSTRAINT "PropertyPublicLink_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublicListingEvent" ADD CONSTRAINT "PublicListingEvent_linkId_fkey"
  FOREIGN KEY ("linkId") REFERENCES "PropertyPublicLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyAdCopy" ADD CONSTRAINT "PropertyAdCopy_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyAdCopy" ADD CONSTRAINT "PropertyAdCopy_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
