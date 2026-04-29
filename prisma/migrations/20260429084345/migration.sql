/*
  Warnings:

  - You are about to drop the `_CategoryToMovie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CategoryToMovie" DROP CONSTRAINT "_CategoryToMovie_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToMovie" DROP CONSTRAINT "_CategoryToMovie_B_fkey";

-- DropTable
DROP TABLE "_CategoryToMovie";

-- CreateTable
CREATE TABLE "MovieCategory" (
    "movieId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovieCategory_pkey" PRIMARY KEY ("movieId","categoryId")
);

-- AddForeignKey
ALTER TABLE "MovieCategory" ADD CONSTRAINT "MovieCategory_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCategory" ADD CONSTRAINT "MovieCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
