/*
  Warnings:

  - You are about to drop the column `services` on the `Room` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('TWO_D', 'THREE_D', 'IMAX', 'VIP', 'FOUR_DX');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "services";

-- AlterTable
ALTER TABLE "SeatTemplate" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomService" (
    "roomId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "RoomService_pkey" PRIMARY KEY ("roomId","serviceId")
);

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
