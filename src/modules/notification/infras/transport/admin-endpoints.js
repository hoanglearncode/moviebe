"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../../index");
const prisma_1 = require("../../../../share/component/prisma");
const logger_1 = require("../../../system/log/logger");
const auth_1 = require("../../../../share/middleware/auth");
const permissions_1 = require("../../../../share/security/permissions");
const router = (0, express_1.Router)();
const emailTemplateRepo = new index_1.EmailTemplateRepository(prisma_1.prisma);
const scheduledEmailRepo = new index_1.ScheduledEmailRepository(prisma_1.prisma);
const emailNotificationService = new index_1.EmailNotificationService(emailTemplateRepo, scheduledEmailRepo);
router.get("/templates", async (req, res) => {
    try {
        const templates = await emailTemplateRepo.getActiveTemplates();
        res.json({
            status: "success",
            data: templates,
            count: templates.length,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to list email templates", { error });
        res.status(500).json({ error: "Failed to fetch templates" });
    }
});
router.get("/templates/:templateId", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.MANAGE_EMAIL_TEMPLATES), async (req, res) => {
    try {
        const { templateId } = req.params;
        const template = await emailTemplateRepo.getTemplateById(templateId);
        if (!template) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.json({
            status: "success",
            data: template,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get email template", { error });
        res.status(500).json({ error: "Failed to fetch template" });
    }
});
router.patch("/templates/:templateId", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.MANAGE_EMAIL_TEMPLATES), async (req, res) => {
    try {
        const { templateId } = req.params;
        const { subject, body, isActive, description } = req.body;
        const updated = await emailTemplateRepo.updateTemplate(templateId, {
            subject,
            body,
            isActive,
            description,
        });
        logger_1.logger.info("Email template updated", { templateId, updatedBy: req.user?.id });
        res.json({
            status: "success",
            message: "Template updated successfully",
            data: updated,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to update email template", { error });
        res.status(500).json({ error: "Failed to update template" });
    }
});
// ────────────────────────────────────────────────────────────────────
// GET: List scheduled emails for a user
// ────────────────────────────────────────────────────────────────────
router.get("/users/:userId/scheduled-emails", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_SCHEDULED_EMAILS), async (req, res) => {
    try {
        const { userId } = req.params;
        const emails = await scheduledEmailRepo.getScheduledEmails(userId);
        res.json({
            status: "success",
            data: emails,
            count: emails.length,
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to get scheduled emails", { error });
        res.status(500).json({ error: "Failed to fetch scheduled emails" });
    }
});
// ────────────────────────────────────────────────────────────────────
// POST: Schedule email for specific user
// ────────────────────────────────────────────────────────────────────
router.post("/users/:userId/schedule-email", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SCHEDULE_USER_EMAILS), async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, subject, body, scheduledFor } = req.body;
        if (!email || !subject || !body) {
            return res.status(400).json({
                error: "Missing required fields: email, subject, body",
            });
        }
        const scheduled = await emailNotificationService.scheduleEmailForUser({
            userId,
            email,
            subject,
            body,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        });
        logger_1.logger.info("Email scheduled", { userId, email, scheduledBy: req.user?.id });
        res.json({
            status: "success",
            message: "Email scheduled successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to schedule email", { error });
        res.status(500).json({ error: "Failed to schedule email" });
    }
});
// ────────────────────────────────────────────────────────────────────
// POST: Send welcome email to user (manual trigger)
// ────────────────────────────────────────────────────────────────────
router.post("/send-welcome/:userId", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SEND_SYSTEM_EMAILS), async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await emailNotificationService.sendWelcomeEmail({
            email: user.email,
            name: user.name || undefined,
        });
        logger_1.logger.info("Welcome email sent", { userId, sentBy: req.user?.id });
        res.json({
            status: "success",
            message: "Welcome email sent successfully",
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to send welcome email", { error });
        res.status(500).json({ error: "Failed to send email" });
    }
});
// ────────────────────────────────────────────────────────────────────
// POST: Send promotional email to multiple users
// ────────────────────────────────────────────────────────────────────
router.post("/send-promo-campaign", auth_1.authMiddleware, auth_1.requireActiveUser, (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SEND_SYSTEM_EMAILS), async (req, res) => {
    try {
        const { userIds, subject, body, promotionDetail } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: "userIds must be a non-empty array" });
        }
        if (!subject || !body) {
            return res.status(400).json({ error: "Missing required fields: subject, body" });
        }
        // Get user emails
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true },
        });
        let successCount = 0;
        let failureCount = 0;
        // Schedule for each user
        for (const user of users) {
            try {
                await emailNotificationService.scheduleEmailForUser({
                    userId: user.id,
                    email: user.email,
                    subject,
                    body,
                });
                successCount++;
            }
            catch (error) {
                failureCount++;
                logger_1.logger.error("Failed to schedule promo email", { userId: user.id, error });
            }
        }
        logger_1.logger.info("Promo campaign scheduled", {
            totalUsers: users.length,
            successCount,
            failureCount,
            scheduledBy: req.user?.id,
        });
        res.json({
            status: "success",
            message: `Promo campaign scheduled for ${successCount} users`,
            data: {
                totalUsers: users.length,
                successCount,
                failureCount,
            },
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to schedule promo campaign", { error });
        res.status(500).json({ error: "Failed to schedule campaign" });
    }
});
exports.default = router;
