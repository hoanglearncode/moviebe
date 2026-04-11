import { Router, Request, Response } from "express";
import {
  EmailTemplateRepository,
  ScheduledEmailRepository,
  EmailNotificationService,
} from "../../index";
import { prisma } from "../../../../share/component/prisma";
import { logger } from "../../../system/log/logger";
import { authMiddleware, requirePermission } from "../../../../share/middleware/auth";
import { PERMISSIONS } from "../../../../share/security/permissions";

/**
 * Admin Email Template Management Routes
 *
 * Dễ hiểu: Các endpoint cho Admin quản lý template email
 * - Xem tất cả templates
 * - Cập nhật template
 * - Xem email đã lên lịch
 * - Gửi email cho người dùng
 */

const router = Router();

const emailTemplateRepo = new EmailTemplateRepository(prisma);
const scheduledEmailRepo = new ScheduledEmailRepository(prisma);
const emailNotificationService = new EmailNotificationService(
  emailTemplateRepo,
  scheduledEmailRepo,
);

// ────────────────────────────────────────────────────────────────────
// PUBLIC: Get all active email templates (không cần admin)
// ────────────────────────────────────────────────────────────────────

router.get("/templates", async (req: Request, res: Response) => {
  try {
    const templates = await emailTemplateRepo.getActiveTemplates();
    res.json({
      status: "success",
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    logger.error("Failed to list email templates", { error });
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// ────────────────────────────────────────────────────────────────────
// ADMIN ROUTES ────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────
// GET: Get single template by ID (admin)
// ────────────────────────────────────────────────────────────────────

router.get(
  "/templates/:templateId",
  authMiddleware,
  requirePermission(PERMISSIONS.MANAGE_EMAIL_TEMPLATES),
  async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params as { templateId: string };
    const template = await emailTemplateRepo.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({
      status: "success",
      data: template,
    });
  } catch (error) {
    logger.error("Failed to get email template", { error });
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// ────────────────────────────────────────────────────────────────────
// PATCH: Update email template
// ────────────────────────────────────────────────────────────────────

router.patch(
  "/templates/:templateId",
  authMiddleware,
  requirePermission(PERMISSIONS.MANAGE_EMAIL_TEMPLATES),
  async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params as { templateId: string };
    const { subject, body, isActive, description } = req.body;

    const updated = await emailTemplateRepo.updateTemplate(templateId, {
      subject,
      body,
      isActive,
      description,
    });

    logger.info("Email template updated", { templateId, updatedBy: req.user?.id });

    res.json({
      status: "success",
      message: "Template updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update email template", { error });
    res.status(500).json({ error: "Failed to update template" });
  }
});

// ────────────────────────────────────────────────────────────────────
// GET: List scheduled emails for a user
// ────────────────────────────────────────────────────────────────────

router.get(
  "/users/:userId/scheduled-emails",
  authMiddleware,
  requirePermission(PERMISSIONS.VIEW_SCHEDULED_EMAILS),
  async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const emails = await scheduledEmailRepo.getScheduledEmails(userId);

    res.json({
      status: "success",
      data: emails,
      count: emails.length,
    });
  } catch (error) {
    logger.error("Failed to get scheduled emails", { error });
    res.status(500).json({ error: "Failed to fetch scheduled emails" });
  }
});

// ────────────────────────────────────────────────────────────────────
// POST: Schedule email for specific user
// ────────────────────────────────────────────────────────────────────

router.post(
  "/users/:userId/schedule-email",
  authMiddleware,
  requirePermission(PERMISSIONS.SCHEDULE_USER_EMAILS),
  async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
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

    logger.info("Email scheduled", { userId, email, scheduledBy: req.user?.id });

    res.json({
      status: "success",
      message: "Email scheduled successfully",
    });
  } catch (error) {
    logger.error("Failed to schedule email", { error });
    res.status(500).json({ error: "Failed to schedule email" });
  }
});

// ────────────────────────────────────────────────────────────────────
// POST: Send welcome email to user (manual trigger)
// ────────────────────────────────────────────────────────────────────

router.post(
  "/send-welcome/:userId",
  authMiddleware,
  requirePermission(PERMISSIONS.SEND_SYSTEM_EMAILS),
  async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await emailNotificationService.sendWelcomeEmail({
      email: user.email,
      name: user.name || undefined,
    });

    logger.info("Welcome email sent", { userId, sentBy: req.user?.id });

    res.json({
      status: "success",
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    logger.error("Failed to send welcome email", { error });
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ────────────────────────────────────────────────────────────────────
// POST: Send promotional email to multiple users
// ────────────────────────────────────────────────────────────────────

router.post(
  "/send-promo-campaign",
  authMiddleware,
  requirePermission(PERMISSIONS.SEND_SYSTEM_EMAILS),
  async (req: Request, res: Response) => {
  try {
    const { userIds, subject, body, promotionDetail } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds must be a non-empty array" });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: "Missing required fields: subject, body" });
    }

    // Get user emails
    const users = await prisma.user.findMany({
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
      } catch (error) {
        failureCount++;
        logger.error("Failed to schedule promo email", { userId: user.id, error });
      }
    }

    logger.info("Promo campaign scheduled", {
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
  } catch (error) {
    logger.error("Failed to schedule promo campaign", { error });
    res.status(500).json({ error: "Failed to schedule campaign" });
  }
});

export default router;
