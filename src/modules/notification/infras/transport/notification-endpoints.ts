import { Router, Request, Response } from "express";
import { authMiddleware, requireActiveUser } from "../../../../share/middleware/auth";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { pushNotificationService } from "../../usecase/push-notification.service";

const router = Router();
const guard = [authMiddleware, requireActiveUser];

/**
 * GET /v1/notifications
 * List authenticated user's notifications (paginated).
 *
 * Query: page, limit, onlyUnread=true|false
 */
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

/**
 * GET /v1/notifications/unread-count
 * Lightweight unread badge count — suitable for frequent polling.
 */
router.get("/unread-count", ...guard, async (req: Request, res: Response) => {
  try {
    const result = await pushNotificationService.unreadCount(req.user!.id);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, 500, err.message);
  }
});

/**
 * PUT /v1/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
router.put("/read-all", ...guard, async (req: Request, res: Response) => {
  try {
    const result = await pushNotificationService.markAllRead(req.user!.id);
    successResponse(res, result, `${result.updated} notification(s) marked as read`);
  } catch (err: any) {
    errorResponse(res, 500, err.message);
  }
});

/**
 * PUT /v1/notifications/:id/read
 * Mark a single notification as read.
 */
router.put("/:id/read", ...guard, async (req: Request, res: Response) => {
  try {
    await pushNotificationService.markRead(String(req.params.id), req.user!.id);
    successResponse(res, null, "Notification marked as read");
  } catch (err: any) {
    errorResponse(res, 500, err.message);
  }
});

/**
 * DELETE /v1/notifications/:id
 * Delete a single notification (owner only).
 */
router.delete("/:id", ...guard, async (req: Request, res: Response) => {
  try {
    await pushNotificationService.delete(String(req.params.id), req.user!.id);
    successResponse(res, null, "Notification deleted");
  } catch (err: any) {
    errorResponse(res, 500, err.message);
  }
});

export default router;