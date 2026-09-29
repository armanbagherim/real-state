ALTER TABLE "Property" ADD COLUMN "source" TEXT;
ALTER TABLE "Property" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN "contactPhone" TEXT;
CREATE UNIQUE INDEX "Property_source_sourceUrl_key" ON "Property"("source", "sourceUrl");
