import { Router, Request, Response } from "express";
import { authMiddleware } from "@/share/middleware/auth";
import { pusher, isPusherConfigured } from "@/socket/config";
import { errorResponse } from "@/share/transport/http-server";

const router = Router();

router.post("/pusher/auth", authMiddleware, (req: Request, res: Response) => {
  if (!isPusherConfigured || !pusher) {
    return errorResponse(res, 503, "Pusher not configured");
  }

  const { socket_id, channel_name } = req.body as {
    socket_id: string;
    channel_name: string;
  };

  if (!socket_id || !channel_name) {
    return errorResponse(res, 400, "socket_id and channel_name are required");
  }

  const userId = req.user!.id;
  const allowedChannel = `private-user-${userId}`;

  if (channel_name !== allowedChannel) {
    return errorResponse(res, 403, "Channel access denied");
  }

  try {
    const auth = pusher.authorizeChannel(socket_id, channel_name);
    res.json(auth);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Pusher auth failed";
    errorResponse(res, 500, message);
  }
});

export { router as pusherAuthRouter };
