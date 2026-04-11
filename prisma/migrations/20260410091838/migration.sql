/*
  Warnings:

  - You are about to drop the column `alwaysSubtitle` on the `UserSetting` table. All the data in the column will be lost.
  - You are about to drop the column `autoPreviews` on the `UserSetting` table. All the data in the column will be lost.
  - You are about to drop the column `autoQuality` on the `UserSetting` table. All the data in the column will be lost.
  - You are about to drop the column `autoplay` on the `UserSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSetting" DROP COLUMN "alwaysSubtitle",
DROP COLUMN "autoPreviews",
DROP COLUMN "autoQuality",
DROP COLUMN "autoplay";
