/*
  Warnings:

  - The values [WEBSITE,DESKTOP,MOBILE] on the enum `BroadcastChannel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BroadcastChannel_new" AS ENUM ('ALL', 'APP', 'EMAIL');
ALTER TABLE "public"."BroadcastNotification" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "BroadcastNotification" ALTER COLUMN "channel" TYPE "BroadcastChannel_new" USING ("channel"::text::"BroadcastChannel_new");
ALTER TYPE "BroadcastChannel" RENAME TO "BroadcastChannel_old";
ALTER TYPE "BroadcastChannel_new" RENAME TO "BroadcastChannel";
DROP TYPE "public"."BroadcastChannel_old";
ALTER TABLE "BroadcastNotification" ALTER COLUMN "channel" SET DEFAULT 'ALL';
COMMIT;
