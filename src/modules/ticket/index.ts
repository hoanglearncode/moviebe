import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { UserTicketRepository } from "@/modules/ticket/infras/repository/repo";
import { UserTicketUseCase } from "@/modules/ticket/usecase";
import { UserTicketHttpService } from "@/modules/ticket/infras/transport/http-service";
import { authMiddleware, requireActiveUser } from "@/share/middleware/auth";
import { successResponse, errorResponse } from "@/share/transport/http-server";

export const buildTicketRouter = (prisma: PrismaClient): Router => {
  const repo = new UserTicketRepository(prisma);
  const useCase = new UserTicketUseCase(repo);
  const controller = new UserTicketHttpService(useCase);

  const router = Router();
  const guard = [authMiddleware, requireActiveUser];

  // List user's own tickets
  router.get("/", ...guard, (req: any, res: any) => controller.getMyTickets(req, res));

  // Pass history - must come before /:ticketId to avoid route conflict
  router.get("/pass-history", ...guard, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const skip = (page - 1) * limit;
      const direction = req.query.direction as string; // "sent" | "received"

      const where: any = {};
      if (direction === "sent") where.fromUserId = userId;
      else if (direction === "received") where.toUserId = userId;
      else where.OR = [{ fromUserId: userId }, { toUserId: userId }];

      const [total, items] = await Promise.all([
        prisma.passHistory.count({ where }),
        prisma.passHistory.findMany({
          where,
          skip,
          take: limit,
          orderBy: { transferredAt: "desc" },
          include: {
            ticket: {
              select: {
                id: true,
                seatNumber: true,
                qrCode: true,
                movie: { select: { id: true, title: true, posterUrl: true } },
                showtime: { select: { id: true, startTime: true, endTime: true } },
              },
            },
            fromUser: { select: { id: true, name: true, email: true, avatar: true } },
            toUser: { select: { id: true, name: true, email: true, avatar: true } },
          },
        }),
      ]);

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // Get single ticket detail
  router.get("/:ticketId", ...guard, (req: any, res: any) => controller.getTicketDetail(req, res));

  return router;
};
