-- CreateEnum
CREATE TYPE "BroadcastChannel" AS ENUM ('ALL', 'WEBSITE', 'EMAIL', 'DESKTOP', 'MOBILE');

-- AlterTable
ALTER TABLE "BroadcastNotification" ADD COLUMN     "channel" "BroadcastChannel" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "imageUrls" TEXT[];
