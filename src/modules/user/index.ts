import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AdminUserUseCase } from "./usecase/admin-user.usecase";
import { UserUseCase } from "./usecase/user.usecase";
import { UserHttpService, AdminUserHttpService } from "./infras/transport/http-service";
import { createSessionRepository } from "./infras/repository/session-repo";
import { createUserRepository } from "./infras/repository/user-repo";
import { createUserSettingRepository } from "./infras/repository/setting-repo";
import { HashService } from "./shared/hash";
import { UserNotificationService } from "./shared/notification";
import { AvatarColorService } from "./shared/avatar-color.service";
import { IUserUseCase, IAdminUserUseCase } from "./interface";
import { prisma } from "../../share/component/prisma";
import { adminMiddleware, protect } from "../../share/middleware/auth";

const buildUserRouter = (useCase: IUserUseCase) => {
  const httpService = new UserHttpService(useCase);
  const router = Router();
  router.use(...protect());

  router.get("/me", httpService.getProfile.bind(httpService));
  router.put("/me", httpService.updateProfile.bind(httpService));
  router.delete("/me", httpService.deleteAccount.bind(httpService));
  router.post("/change-password", httpService.changePassword.bind(httpService));
  router.get("/sessions", httpService.getSessions.bind(httpService));
  router.delete("/sessions/:sessionId", httpService.revokeSession.bind(httpService));
  router.delete("/sessions", httpService.revokeAllSessions.bind(httpService));
  router.get("/settings", httpService.getSettings.bind(httpService));
  router.put("/settings", httpService.updateSettings.bind(httpService));

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
  const userSettingsRepository = createUserSettingRepository(prismaClient);
  const passwordHasher = new HashService();
  const notificationService = new UserNotificationService();
  const avatarColorService = new AvatarColorService();

  const dependencies = {
    userRepository,
    sessionRepository,
    userSettingsRepository,
    passwordHasher,
    notificationService,
    avatarColorService,
    prisma: prismaClient,
  };

  const userUseCase = new UserUseCase(dependencies);
  const adminUserUseCase = new AdminUserUseCase(dependencies as any);

  const router = Router();
  router.use("/user", buildUserRouter(userUseCase));
  router.use("/admin", buildAdminUserRouter(adminUserUseCase));

  return router;
};