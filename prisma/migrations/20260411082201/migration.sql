-- CreateEnum
CREATE TYPE "EmailNotificationEvent" AS ENUM ('WELCOME_NEW_ACCOUNT', 'WELCOME_SOCIAL_LOGIN', 'ACCOUNT_UPDATED_BY_ADMIN', 'PASSWORD_CHANGED', 'ACCOUNT_DELETED', 'LOGIN_WARNING', 'PROMO_CAMPAIGN');

-- CreateEnum
CREATE TYPE "EmailNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SCHEDULED');

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "event" "EmailNotificationEvent" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledEmailNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "status" "EmailNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledEmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_event_key" ON "EmailTemplate"("event");

-- CreateIndex
CREATE INDEX "EmailTemplate_event_idx" ON "EmailTemplate"("event");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ScheduledEmailNotification_userId_idx" ON "ScheduledEmailNotification"("userId");

-- CreateIndex
CREATE INDEX "ScheduledEmailNotification_status_idx" ON "ScheduledEmailNotification"("status");

-- CreateIndex
CREATE INDEX "ScheduledEmailNotification_scheduledFor_idx" ON "ScheduledEmailNotification"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledEmailNotification_createdAt_idx" ON "ScheduledEmailNotification"("createdAt");
