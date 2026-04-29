import { Router, Request, Response } from "express";
import { logger } from "../../../system/log/logger";
import {
  authMiddleware,
  requireActiveUser,
  requirePermission,
} from "../../../../share/middleware/auth";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { PERMISSIONS } from "../../../../share/security/permissions";
import type { EmailNotificationService } from "../../usecase/service";

export interface AdminEmailRouterDependencies {
  emailNotificationService: EmailNotificationService;
  findUserById(userId: string): Promise<{ id: string; email: string; name?: string | null } | null>;
  findUsersByIds(userIds: string[]): Promise<Array<{ id: string; email: string; name?: string | null }>>;
}

export function buildAdminEmailRouter(deps: AdminEmailRouterDependencies): Router {
  const router = Router();
  const { emailNotificationService, findUserById, findUsersByIds } = deps;

  router.get("/templates", async (req: Request, res: Response) => {
    try {
      const templates = await emailNotificationService.listActiveTemplates();
      successResponse(res, { items: templates, total: templates.length });
    } catch (error: any) {
      logger.error("Failed to list email templates", { error });
      errorResponse(res, 500, "Failed to fetch templates");
    }
  });

router.get(
  "/templates/:templateId",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.MANAGE_EMAIL_TEMPLATES),
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params as { templateId: string };
      const template = await emailNotificationService.getTemplateById(templateId);

      if (!template) {
        return errorResponse(res, 404, "Template not found");
      }

      successResponse(res, template);
    } catch (error: any) {
      logger.error("Failed to get email template", { error });
      errorResponse(res, 500, "Failed to fetch template");
    }
  },
);

router.patch(
  "/templates/:templateId",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.MANAGE_EMAIL_TEMPLATES),
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params as { templateId: string };
      const { subject, body, isActive, description } = req.body;

      const updated = await emailNotificationService.updateTemplate(templateId, {
        subject,
        body,
        isActive,
        description,
      });

      logger.info("Email template updated", { templateId, updatedBy: req.user?.id });

      successResponse(res, updated, "Template updated successfully");
    } catch (error: any) {
      logger.error("Failed to update email template", { error });
      errorResponse(res, 500, "Failed to update template");
    }
  },
);

// ────────────────────────────────────────────────────────────────────
// GET: List scheduled emails for a user
// ────────────────────────────────────────────────────────────────────

router.get(
  "/users/:userId/scheduled-emails",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.VIEW_SCHEDULED_EMAILS),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params as { userId: string };
      const emails = await emailNotificationService.getScheduledEmails(userId);

      successResponse(res, { items: emails, total: emails.length });
    } catch (error: any) {
      logger.error("Failed to get scheduled emails", { error });
      errorResponse(res, 500, "Failed to fetch scheduled emails");
    }
  },
);

// ────────────────────────────────────────────────────────────────────
// POST: Schedule email for specific user
// ────────────────────────────────────────────────────────────────────

router.post(
  "/users/:userId/schedule-email",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.SCHEDULE_USER_EMAILS),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params as { userId: string };
      const { email, subject, body, scheduledFor } = req.body;

      if (!email || !subject || !body) {
        return errorResponse(res, 400, "Missing required fields: email, subject, body");
      }

      await emailNotificationService.scheduleEmailForUser({
        userId,
        email,
        subject,
        body,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      });

      logger.info("Email scheduled", { userId, email, scheduledBy: req.user?.id });

      successResponse(res, null, "Email scheduled successfully");
    } catch (error: any) {
      logger.error("Failed to schedule email", { error });
      errorResponse(res, 500, "Failed to schedule email");
    }
  },
);

// ────────────────────────────────────────────────────────────────────
// POST: Send welcome email to user (manual trigger)
// ────────────────────────────────────────────────────────────────────

router.post(
  "/send-welcome/:userId",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.SEND_SYSTEM_EMAILS),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params as { userId: string };
      const user = await findUserById(userId);

      if (!user) {
        return errorResponse(res, 404, "User not found");
      }

      await emailNotificationService.sendWelcomeEmail({
        email: user.email,
        name: user.name || undefined,
      });

      logger.info("Welcome email sent", { userId, sentBy: req.user?.id });

      successResponse(res, null, "Welcome email sent successfully");
    } catch (error: any) {
      logger.error("Failed to send welcome email", { error });
      errorResponse(res, 500, "Failed to send email");
    }
  },
);

// ────────────────────────────────────────────────────────────────────
// POST: Send promotional email to multiple users
// ────────────────────────────────────────────────────────────────────

router.post(
  "/send-promo-campaign",
  authMiddleware,
  requireActiveUser,
  requirePermission(PERMISSIONS.SEND_SYSTEM_EMAILS),
  async (req: Request, res: Response) => {
    try {
      const { userIds, subject, body, promotionDetail } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return errorResponse(res, 400, "userIds must be a non-empty array");
      }

      if (!subject || !body) {
        return errorResponse(res, 400, "Missing required fields: subject, body");
      }

      const users = await findUsersByIds(userIds);
      let successCount = 0;
      let failureCount = 0;

      for (const user of users) {
        try {
          await emailNotificationService.scheduleEmailForUser({
            userId: user.id,
            email: user.email,
            subject,
            body,
          });
          successCount++;
        } catch (error: any) {
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

      successResponse(
        res,
        {
          totalUsers: users.length,
          successCount,
          failureCount,
        },
        `Promo campaign scheduled for ${successCount} users`,
      );
    } catch (error: any) {
      logger.error("Failed to schedule promo campaign", { error });
      errorResponse(res, 500, "Failed to schedule campaign");
    }
  },
);

  return router;
}
