import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { PaymentRepository } from "@/modules/payment/infras/repository/repo";
import { PaymentUseCase } from "@/modules/payment/usecase";
import { PaymentHttpService } from "@/modules/payment/infras/transport/http-service";
import { authMiddleware, requireActiveUser } from "@/share/middleware/auth";

export const buildPaymentRouter = (prisma: PrismaClient): Router => {
  const repo = new PaymentRepository(prisma);
  const useCase = new PaymentUseCase(repo);
  const controller = new PaymentHttpService(useCase);

  const router = Router();
  const guard = [authMiddleware, requireActiveUser];

  // Initiate payment for an order (requires auth)
  router.post("/create", ...guard, (req: any, res: any) => controller.createPayment(req, res));

  // Get payment / order status (requires auth)
  router.get("/status/:orderId", ...guard, (req: any, res: any) =>
    controller.getPaymentStatus(req, res),
  );

  // Confirm mock payment (called from mock gateway callback, requires auth)
  router.post("/confirm-mock", ...guard, (req: any, res: any) =>
    controller.confirmMockPayment(req, res),
  );

  return router;
};
