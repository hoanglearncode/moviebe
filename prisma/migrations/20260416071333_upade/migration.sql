/*
  Warnings:

  - The `genre` column on the `Movie` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `referralCode` on the `UserSetting` table. All the data in the column will be lost.
  - You are about to drop the column `referrals` on the `UserSetting` table. All the data in the column will be lost.
  - You are about to drop the `_RoomToService` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[partnerId,name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `partnerId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Room` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `partnerId` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'SCANNER', 'STAFF');

-- DropForeignKey
ALTER TABLE "_RoomToService" DROP CONSTRAINT "_RoomToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToService" DROP CONSTRAINT "_RoomToService_B_fkey";

-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "genre",
ADD COLUMN     "genre" TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "partnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "approvedBy" TEXT;

-- AlterTable
ALTER TABLE "PartnerRequest" ADD COLUMN     "approvedPartnerId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "type",
ADD COLUMN     "type" "RoomType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RoomStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "partnerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserSetting" DROP COLUMN "referralCode",
DROP COLUMN "referrals";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "_RoomToService";

-- CreateTable
CREATE TABLE "PartnerStaff" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomService" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToMovie" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToMovie_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerStaff_partnerId_userId_key" ON "PartnerStaff"("partnerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomService_roomId_serviceId_key" ON "RoomService"("roomId", "serviceId");

-- CreateIndex
CREATE INDEX "_CategoryToMovie_B_index" ON "_CategoryToMovie"("B");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Room_partnerId_name_key" ON "Room"("partnerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "PartnerRequest" ADD CONSTRAINT "PartnerRequest_approvedPartnerId_fkey" FOREIGN KEY ("approvedPartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStaff" ADD CONSTRAINT "PartnerStaff_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerStaff" ADD CONSTRAINT "PartnerStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEmailNotification" ADD CONSTRAINT "ScheduledEmailNotification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMovie" ADD CONSTRAINT "_CategoryToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToMovie" ADD CONSTRAINT "_CategoryToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
