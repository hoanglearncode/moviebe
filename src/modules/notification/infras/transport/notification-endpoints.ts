import { Router, Request, Response } from "express";
import { authMiddleware, requireActiveUser } from "../../../../share/middleware/auth";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { PushNotificationService } from "../../usecase/push-notification";

export function buildNotificationRouter(pushNotificationService: PushNotificationService): Router {
  const router = Router();
  const guard = [authMiddleware, requireActiveUser];

  router.get("/", ...guard, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const onlyUnread = req.query.onlyUnread === "true";

      const result = await pushNotificationService.list(userId, { page, limit, onlyUnread });
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/unread-count", ...guard, async (req: Request, res: Response) => {
    try {
      const result = await pushNotificationService.unreadCount(req.user!.id);
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.put("/read-all", ...guard, async (req: Request, res: Response) => {
    try {
      const result = await pushNotificationService.markAllRead(req.user!.id);
      successResponse(res, result, `${result.updated} notification(s) marked as read`);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.put("/:id/read", ...guard, async (req: Request, res: Response) => {
    try {
      await pushNotificationService.markRead(String(req.params.id), req.user!.id);
      successResponse(res, null, "Notification marked as read");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.delete("/:id", ...guard, async (req: Request, res: Response) => {
    try {
      await pushNotificationService.delete(String(req.params.id), req.user!.id);
      successResponse(res, null, "Notification deleted");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
