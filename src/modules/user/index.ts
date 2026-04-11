import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AdminUserUseCase } from "./usecase/admin-user.usecase";
import { UserUseCase } from "./usecase/user.usecase";
import { UserHttpService, AdminUserHttpService } from "./infras/transport/http-service";
import { createSessionRepository } from "./infras/repository/session-repo";
import { createUserRepository } from "./infras/repository/user-repo";
import { HashService } from "./shared/hash";
import { UserNotificationService } from "./shared/notification";
import { AvatarColorService } from "./shared/avatar-color";
import { IUserUseCase, IAdminUserUseCase } from "./interface";
import { prisma } from "../../share/component/prisma";
import { mailService } from "../../share/component/mail";
import { adminMiddleware, authenticate, protect } from "../../share/middleware/auth";
import { setupSettingHexagon, createSettingUseCase } from "../system/setting";

const buildUserRouter = (useCase: IUserUseCase) => {
  const httpService = new UserHttpService(useCase);
  const router = Router();

  router.get("/me", ...authenticate(), httpService.getProfile.bind(httpService));
  router.put("/me", ...protect(), httpService.updateProfile.bind(httpService));
  router.delete("/me", ...protect(), httpService.deleteAccount.bind(httpService));
  router.post("/change-password", ...protect(), httpService.changePassword.bind(httpService));
  router.get("/sessions", ...protect(), httpService.getSessions.bind(httpService));
  router.delete("/sessions/:sessionId", ...protect(), httpService.revokeSession.bind(httpService));
  router.delete("/sessions", ...protect(), httpService.revokeAllSessions.bind(httpService));

  return router;
};

const buildAdminUserRouter = (useCase: IAdminUserUseCase) => {
  const httpService = new AdminUserHttpService(useCase);
  const router = Router();
  router.use(...protect(adminMiddleware));

  // analytic
  router.get("/users/stats", httpService.getStats.bind(httpService));

  router.get("/users", httpService.list.bind(httpService));
  router.get("/users/:id", httpService.getUser.bind(httpService));
  router.post("/users", httpService.createUser.bind(httpService));
  router.put("/users/:id", httpService.updateUser.bind(httpService));
  router.delete("/users/:id", httpService.deleteUser.bind(httpService));
  router.patch("/users/:id/status", httpService.changeUserStatus.bind(httpService));
  router.post("/users/:id/reset-password", httpService.resetUserPassword.bind(httpService));
  router.post("/users/:id/verify-email", httpService.verifyUserEmail.bind(httpService));
  router.delete("/users/:id/sessions", httpService.revokeAllUserSessions.bind(httpService));

  // Seed routes
  router.post("/users/seed", httpService.seedUsers.bind(httpService));
  router.get("/users/seed/stats", httpService.getSeedStatistics.bind(httpService));
  router.delete("/users/seed", httpService.clearSeedUsers.bind(httpService));

  return router;
};

export const setupUserHexagon = (prismaClient: PrismaClient = prisma) => {
  const userRepository = createUserRepository(prismaClient);
  const sessionRepository = createSessionRepository(prismaClient);
  const passwordHasher = new HashService();
  const notificationService = new UserNotificationService(mailService);
  const avatarColorService = new AvatarColorService();
  const userSettingService = createSettingUseCase(prismaClient);

  const dependencies = {
    userRepository,
    sessionRepository,
    userSettingsRepository: {} as any, 
    passwordHasher,
    notificationService,
    avatarColorService,
    prisma: prismaClient,
    userSettingService,
  };

  const userUseCase = new UserUseCase(dependencies);
  const adminUserUseCase = new AdminUserUseCase(dependencies as any);

  const router = Router();
  router.use("/user", buildUserRouter(userUseCase));
  router.use("/admin", buildAdminUserRouter(adminUserUseCase));

  const { router: settingRouter } = setupSettingHexagon(prismaClient, userSettingService);
  router.use("/user", settingRouter);

  return router;
};
