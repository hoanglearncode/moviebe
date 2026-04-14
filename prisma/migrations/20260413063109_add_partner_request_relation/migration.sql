-- CreateIndex
CREATE INDEX "PartnerRequest_userId_idx" ON "PartnerRequest"("userId");

-- CreateIndex
CREATE INDEX "PartnerRequest_status_idx" ON "PartnerRequest"("status");

-- AddForeignKey
ALTER TABLE "PartnerRequest" ADD CONSTRAINT "PartnerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
