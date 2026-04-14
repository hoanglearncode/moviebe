-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAYMENT_PROCESSING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "orderId" TEXT;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "finalAmount" INTEGER NOT NULL,
    "couponCode" TEXT,
    "idempotencyKey" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_showtimeId_idx" ON "Order"("showtimeId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_expiresAt_idx" ON "Order"("expiresAt");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
