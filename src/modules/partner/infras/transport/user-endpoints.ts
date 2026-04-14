import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { authMiddleware, requireActiveUser } from "../../../../share/middleware/auth";
import { createPartnerRequestRepository } from "../repository/partner-request-repo";
import { createPartnerRepository } from "../repository/repo";
import { PartnerRequestHttpService } from "./partner-request-http";

export const buildPartnerRequestUserRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const service = new PartnerRequestHttpService(
    createPartnerRequestRepository(prisma),
    createPartnerRepository(prisma),
    prisma,
  );
  const userGuard = [authMiddleware, requireActiveUser];

  router.post("/partner-request", ...userGuard, (req, res) => service.submit(req, res));
  router.patch("/partner-request", ...userGuard, (req, res) => service.editSubmit(req, res));
  router.get("/partner-request", ...userGuard, (req, res) => service.getMyRequest(req, res));

  return router;
};

export default buildPartnerRequestUserRouter;
