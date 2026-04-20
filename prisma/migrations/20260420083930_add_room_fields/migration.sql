/*
  Warnings:

  - You are about to drop the column `capacity` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `coupleRow` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `vipRows` on the `Room` table. All the data in the column will be lost.
  - Added the required column `layoutSeat` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "capacity",
DROP COLUMN "coupleRow",
DROP COLUMN "vipRows",
ADD COLUMN     "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowSeatSelection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "buildYear" INTEGER,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "lastRenovated" INTEGER,
ADD COLUMN     "layoutSeat" JSONB NOT NULL,
ADD COLUMN     "maxBookingDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "maxSeatsPerTransaction" INTEGER NOT NULL DEFAULT 10;
