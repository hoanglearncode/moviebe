/*
  Warnings:

  - You are about to drop the `RoomService` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoomService" DROP CONSTRAINT "RoomService_roomId_fkey";

-- DropTable
DROP TABLE "RoomService";

-- CreateTable
CREATE TABLE "_RoomToService" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoomToService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoomToService_B_index" ON "_RoomToService"("B");

-- CreateIndex
CREATE INDEX "Service_id_idx" ON "Service"("id");

-- AddForeignKey
ALTER TABLE "_RoomToService" ADD CONSTRAINT "_RoomToService_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToService" ADD CONSTRAINT "_RoomToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
