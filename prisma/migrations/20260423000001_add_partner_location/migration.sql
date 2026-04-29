-- AlterTable: add location fields to Partner
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "facilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Partner_city_idx" ON "Partner"("city");
