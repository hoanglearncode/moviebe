import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { UserUseCase, AdminUserUseCase } from "./usecase";
import { AdminUserHttpService } from "./infras/transport/http-service";
import {
  createUserRepository,
  createSessionRepository,
  createUserSettingsRepository,
} from "./infras/repository/repo";
import { HashService } from "./shared/hash";
import { UserNotificationService } from "./shared/notification";
import { IUserUseCase, IAdminUserUseCase } from "./interface";
import { prisma } from "../../share/component/prisma";

/**
 * ==========================================
 * BUILD USER ROUTES
 * ==========================================
 */

// const buildUserRouter = (useCase: IUserUseCase) => {
//   const httpService = new UserHttpService(useCase);
//   const router = Router();

//   // Profile routes
//   router.get("/user/me", httpService.getProfile.bind(httpService));
//   router.put("/user/me", httpService.updateProfile.bind(httpService));
//   router.delete("/user/me", httpService.deleteAccount.bind(httpService));

//   // Password routes
//   router.post("/user/change-password", httpService.changePassword.bind(httpService));

//   // Session management routes
//   router.get("/user/sessions", httpService.getSessions.bind(httpService));
//   router.delete("/user/sessions/:sessionId", httpService.revokeSession.bind(httpService));
//   router.delete("/user/sessions", httpService.revokeAllSessions.bind(httpService));

//   // Settings routes
//   router.get("/user/settings", httpService.getSettings.bind(httpService));
//   router.put("/user/settings", httpService.updateSettings.bind(httpService));

//   return router;
// };

/**
 * ==========================================
 * BUILD ADMIN USER ROUTES
 * ==========================================
 */

const buildAdminUserRouter = (useCase: IAdminUserUseCase) => {
  const httpService = new AdminUserHttpService(useCase);
  const router = Router();

  // User management routes
  router.get("/admin/users", httpService.listUsers.bind(httpService));
  router.get("/admin/users/:id", httpService.getUser.bind(httpService));
  router.post("/admin/users", httpService.createUser.bind(httpService));
  router.put("/admin/users/:id", httpService.updateUser.bind(httpService));
  router.delete("/admin/users/:id", httpService.deleteUser.bind(httpService));

  // User status & security routes
  router.patch(
    "/admin/users/:id/status",
    httpService.changeUserStatus.bind(httpService)
  );
  router.post(
    "/admin/users/:id/reset-password",
    httpService.resetUserPassword.bind(httpService)
  );
  router.post(
    "/admin/users/:id/verify-email",
    httpService.verifyUserEmail.bind(httpService)
  );
  router.delete(
    "/admin/users/:id/sessions",
    httpService.revokeAllUserSessions.bind(httpService)
  );

  return router;
};

/**
 * ==========================================
 * SETUP USER HEXAGON
 * ==========================================
 */

export const setupUserHexagon = (prismaClient: PrismaClient = prisma) => {
  const userRepository = createUserRepository(prismaClient);
  const sessionRepository = createSessionRepository(prismaClient);
  const userSettingsRepository = createUserSettingsRepository(prismaClient);

  // Initialize services
  const passwordHasher = new HashService();
  const notificationService = new UserNotificationService();

  // Create dependencies object
  const dependencies = {
    userRepository,
    sessionRepository,
    userSettingsRepository,
    passwordHasher,
    notificationService,
  };

  // Create use cases
  const userUseCase = new UserUseCase(dependencies);
  const adminUserUseCase = new AdminUserUseCase(dependencies);

  // Create router with combined routes
  const router = Router();
//   router.use(buildUserRouter(userUseCase));
  router.use(buildAdminUserRouter(adminUserUseCase));

  return router;
};

/**
 * ==========================================
 * EXPORT FOR TESTING
 * ==========================================
 */

export const setupUserHexagonWithUseCase = (userUseCase: IUserUseCase, adminUseCase: IAdminUserUseCase) => {
  const router = Router();
//   router.use(buildUserRouter(userUseCase));
  router.use(buildAdminUserRouter(adminUseCase));
  return router;
};
