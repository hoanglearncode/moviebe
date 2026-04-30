import { Request, Response, Router } from "express";
import { protect, requireRole } from "../../../../share/middleware/auth";
import { successResponse, errorResponse, ValidationError, NotFoundError } from "../../../../share/transport/http-server";
import type { BroadcastNotificationUseCase } from "@/modules/admin-manage/admin-notifications/usecase";
import { PrismaClient, BroadcastStatus, BroadcastType } from "@prisma/client";
import { writeAuditLog } from "@/modules/admin-manage/admin-audit-logs/helper";

const adminGuard = [...protect(requireRole("ADMIN"))];

export class BroadcastNotificationHttpService {
  constructor(
    private readonly useCase: BroadcastNotificationUseCase,
    private readonly prisma: PrismaClient,
  ) {}

  buildRouter(): Router {
    const router = Router();

    router.get("/", ...adminGuard, this.list.bind(this));
    router.post("/", ...adminGuard, this.create.bind(this));
    router.delete("/:id", ...adminGuard, this.remove.bind(this));

    return router;
  }

  private async list(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.useCase.list({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status as BroadcastStatus | undefined,
        type: req.query.type as BroadcastType | undefined,
      });
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    try {
      const broadcast = await this.useCase.create(req.body, req.user!.id);

      if (broadcast.status === "SENT") {
        await writeAuditLog(this.prisma, req, {
          action: "send_broadcast_notification",
          description: `Sent broadcast notification "${broadcast.title}"`,
          category: "notification",
          severity: "medium",
          targetType: "broadcast_notification",
          targetId: broadcast.id,
          targetLabel: broadcast.title,
          meta: {
            target: broadcast.target,
            channel: broadcast.channel,
            totalSent: broadcast.totalSent,
            type: broadcast.type,
          },
        });
      }

      successResponse(res, broadcast, "Notification created", 201);
    } catch (err: any) {
      if (err instanceof ValidationError) {
        errorResponse(res, 400, err.message);
      } else {
        errorResponse(res, 500, err.message);
      }
    }
  }

  private async remove(req: Request, res: Response): Promise<void> {
    try {
      await this.useCase.delete(String(req.params.id));
      successResponse(res, null, "Notification deleted");
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        errorResponse(res, 404, err.message);
      } else {
        errorResponse(res, 500, err.message as string);
      }
    }
  }
}
