import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { BookingRepository } from "@/modules/booking/infras/repository/repo";
import { BookingUseCase } from "@/modules/booking/usecase";
import { BookingHttpService } from "@/modules/booking/infras/transport/http-service";
import { authMiddleware, requireActiveUser } from "@/share/middleware/auth";

export const buildBookingRouter = (prisma: PrismaClient): Router => {
  const repo = new BookingRepository(prisma);
  const useCase = new BookingUseCase(repo);
  const controller = new BookingHttpService(useCase);

  const router = Router();
  const guard = [authMiddleware, requireActiveUser];

  // Lock seats and create an order (requires auth)
  router.post("/lock-seats", ...guard, (req: any, res: any) => controller.lockSeats(req, res));

  // Get order details (requires auth + must own the order)
  router.get("/:orderId", ...guard, (req: any, res: any) => controller.getOrder(req, res));

  // Cancel order and release seats (requires auth + must own the order)
  router.delete("/:orderId", ...guard, (req: any, res: any) => controller.cancelOrder(req, res));

  return router;
};
