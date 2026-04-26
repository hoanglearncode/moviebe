import { Router, Request, Response } from "express";
import {
  PrismaClient,
  BroadcastStatus,
  BroadcastTarget,
  BroadcastType,
  BroadcastChannel,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { enqueueBroadcastJob } from "../../queue/config/broadcast.queue";
import { logger } from "../system/log/logger";
import { writeAuditLog } from "../admin-audit-logs/helper";

const adminGuard = [...protect(requireRole("ADMIN"))];

async function resolveTargetSize(
  prisma: PrismaClient,
  target: BroadcastTarget,
): Promise<number> {
  if (target === "ALL") return prisma.user.count();
  if (target === "OWNERS") return prisma.user.count({ where: { role: "PARTNER" } });
  return prisma.user.count({ where: { role: "USER" } });
}

export function buildAdminNotificationsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /v1/admin/notifications — list with filter/pagination
  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as BroadcastStatus | undefined;
      const type = req.query.type as BroadcastType | undefined;

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const [total, items] = await Promise.all([
        prisma.broadcastNotification.count({ where }),
        prisma.broadcastNotification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
        }),
      ]);

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // POST /v1/admin/notifications — create (send or schedule or draft)
  router.post("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { title, content, type, target, channel, scheduleMode, scheduledAt } = req.body;

      if (!title || !content || !type || !target) {
        return errorResponse(res, 400, "title, content, type, target are required");
      }

      const validTypes = ["INFO", "SUCCESS", "WARNING", "ERROR"];
      const validTargets = ["ALL", "USERS", "OWNERS", "VIP", "PREMIUM", "FREE"];
      const validChannels = ["ALL", "WEBSITE", "EMAIL", "DESKTOP", "MOBILE"];
      if (!validTypes.includes(type)) return errorResponse(res, 400, `type must be one of: ${validTypes.join(", ")}`);
      if (!validTargets.includes(target)) return errorResponse(res, 400, `target must be one of: ${validTargets.join(", ")}`);
      if (channel && !validChannels.includes(channel)) {
        return errorResponse(res, 400, `channel must be one of: ${validChannels.join(", ")}`);
      }

      const selectedChannel = (channel ?? "ALL") as BroadcastChannel;

      const isScheduled = scheduleMode === "later" && scheduledAt;
      const status: BroadcastStatus = isScheduled ? "SCHEDULED" : "SENT";
      const sentAt = isScheduled ? undefined : new Date();
      const totalSent = isScheduled ? 0 : await resolveTargetSize(prisma, target as BroadcastTarget);

      const notification = await prisma.broadcastNotification.create({
        data: {
          title,
          content,
          type: type as BroadcastType,
          target: target as BroadcastTarget,
          channel: selectedChannel,
          status,
          scheduledAt: isScheduled ? new Date(scheduledAt) : undefined,
          sentAt,
          totalSent,
          createdById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Deliver immediately to target users via BullMQ broadcast worker
      if (status === "SENT") {
        await enqueueBroadcastJob({
          broadcastId: notification.id,
          target,
          channel: selectedChannel,
          title,
          message: content,
          traceId: randomUUID(),
        }).catch((err: Error) => {
          // Non-fatal — broadcast record exists; delivery will be retried manually
          logger.warn("[AdminNotifications] Failed to enqueue broadcast delivery", {
            broadcastId: notification.id,
            error: err.message,
          });
        });

        await writeAuditLog(prisma, req, {
          action: "send_broadcast_notification",
          description: `Sent broadcast notification "${title}"`,
          category: "notification",
          severity: "medium",
          targetType: "broadcast_notification",
          targetId: notification.id,
          targetLabel: notification.title,
          meta: {
            target,
            channel: selectedChannel,
            totalSent,
            type,
          },
        });
      }

      successResponse(res, notification, "Notification created", 201);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // DELETE /v1/admin/notifications/:id
  router.delete("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.broadcastNotification.findUnique({
        where: { id },
      });
      if (!existing) return errorResponse(res, 404, "Notification not found");

      await prisma.broadcastNotification.delete({ where: { id } });
      successResponse(res, null, "Notification deleted");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
