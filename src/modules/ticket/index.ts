import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { protect } from "../../share/middleware/auth";
import { logger } from "../system/log/logger";

export function setupTicketRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // All ticket routes require auth
  router.use(...protect());

  // ── GET /tickets ───────────────────────────────────────────────────────────
  router.get("/tickets", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10)));
      const skip = (page - 1) * limit;
      const status = req.query.status as string | undefined;

      const where: any = { userId };
      if (status && status !== "all") where.status = status;

      const [tickets, total] = await Promise.all([
        (prisma.ticket as any).findMany({
          where,
          skip,
          take: limit,
          orderBy: { purchasedAt: "desc" },
          include: {
            showtime: {
              include: {
                movie: {
                  select: { id: true, title: true, posterUrl: true, genre: true, duration: true },
                },
                partner: { select: { cinemaName: true, city: true, address: true } },
              },
            },
            seat: { select: { seatNumber: true, rowLabel: true, seatType: true } },
          },
        }),
        (prisma.ticket as any).count({ where }),
      ]);

      successResponse(res, { items: tickets, total, page, limit }, "Danh sách vé");
    } catch (err: any) {
      logger.error("[Ticket] list error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /tickets/:ticketId ─────────────────────────────────────────────────
  router.get("/tickets/:ticketId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { ticketId } = req.params;

      const ticket = await (prisma.ticket as any).findUnique({
        where: { id: ticketId },
        include: {
          showtime: {
            include: {
              movie: {
                select: {
                  id: true,
                  title: true,
                  posterUrl: true,
                  genre: true,
                  duration: true,
                  rating: true,
                  language: true,
                },
              },
              partner: { select: { cinemaName: true, city: true, address: true, phone: true } },
            },
          },
          seat: {
            select: { seatNumber: true, rowLabel: true, columnNumber: true, seatType: true },
          },
          checkIn: { select: { scannedAt: true, scannedBy: true } },
        },
      });

      if (!ticket) return errorResponse(res, 404, "Vé không tồn tại");
      if (ticket.userId !== userId) return errorResponse(res, 403, "Bạn không có quyền xem vé này");

      successResponse(res, ticket, "Chi tiết vé");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
