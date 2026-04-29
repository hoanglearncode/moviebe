/*
  Warnings:

  - Added the required column `priceConfig` to the `Showtime` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "allowComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "altTitle" TEXT,
ADD COLUMN     "backdropUrl" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "Showtime" ADD COLUMN     "priceConfig" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Cast" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Cast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cast_movieId_idx" ON "Cast"("movieId");

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
