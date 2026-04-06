-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('active', 'inactive', 'deleted');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "parent_id" TEXT,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "ModelStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
