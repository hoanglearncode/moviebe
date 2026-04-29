/*
  Warnings:

  - You are about to drop the column `descriptions` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "descriptions",
ADD COLUMN     "description" TEXT;
