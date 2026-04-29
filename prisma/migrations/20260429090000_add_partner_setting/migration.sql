-- CreateTable
CREATE TABLE "PartnerSetting" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "notifyNewBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyWithdrawal" BOOLEAN NOT NULL DEFAULT true,
    "notifyMovieStatus" BOOLEAN NOT NULL DEFAULT true,
    "notifySystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "notifyRevenueReport" BOOLEAN NOT NULL DEFAULT true,
    "emailNewBooking" BOOLEAN NOT NULL DEFAULT false,
    "emailDailyReport" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyReport" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "autoWithdrawEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoWithdrawThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5000000,
    "reportTimezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSetting_partnerId_key" ON "PartnerSetting"("partnerId");

-- AddForeignKey
ALTER TABLE "PartnerSetting" ADD CONSTRAINT "PartnerSetting_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
