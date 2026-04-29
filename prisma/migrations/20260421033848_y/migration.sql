-- DropForeignKey
ALTER TABLE "RoomService" DROP CONSTRAINT "RoomService_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomService" DROP CONSTRAINT "RoomService_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
