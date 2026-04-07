import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthHttpService } from "./infras/transport/http-service";
import { createAuthUserRepository } from "./infras/repository/repo";
import { AuthUseCase } from "./usecase";
import { HashService } from "./shared/hash";
import { TokenService } from "./shared/token";
import { AuthNotificationService } from "./shared/notification";
import { prisma } from "../../share/component/prisma";
import { IAuthUseCase } from "./interface";

const buildRouter = (useCase: IAuthUseCase) => {
  const httpService = new AuthHttpService(useCase);
  const router = Router();

  router.post("/auth/register", httpService.register.bind(httpService));
  router.post("/auth/login", httpService.login.bind(httpService));
  router.post("/auth/verify-email", httpService.verifyEmail.bind(httpService));
  router.post(
    "/auth/resend-verification",
    httpService.resendVerification.bind(httpService)
  );
  router.post(
    "/auth/forgot-password",
    httpService.forgotPassword.bind(httpService)
  );
  router.post(
    "/auth/change-password",
    httpService.changePassword.bind(httpService)
  );

  return router;
};

export const setupAuthHexagon = (prismaClient: PrismaClient = prisma) => {
  const userRepository = createAuthUserRepository(prismaClient);
  const passwordHasher = new HashService();
  const tokenService = new TokenService(prismaClient);
  const notificationService = new AuthNotificationService();

  const dependencies = {
    userRepository,
    passwordHasher,
    tokenService,
    notificationService,
  };

  const useCase = new AuthUseCase(dependencies);
  return buildRouter(useCase);
};

export const setupAuthHexagonWithUseCase = (useCase: IAuthUseCase) =>
  buildRouter(useCase);
