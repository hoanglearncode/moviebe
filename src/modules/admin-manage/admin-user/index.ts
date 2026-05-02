import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AdminUserUseCase } from "@/modules/admin-manage/admin-user/usecase/admin-user.usecase";
import { UserUseCase } from "@/modules/admin-manage/admin-user/usecase/user.usecase";
import {
  UserHttpService,
  AdminUserHttpService,
} from "@/modules/admin-manage/admin-user/infras/transport/http-service";
import { createSessionRepository } from "@/modules/admin-manage/admin-user/infras/repository/session-repo";
import { createUserRepository } from "@/modules/admin-manage/admin-user/infras/repository/user-repo";
import { HashService } from "@/modules/admin-manage/admin-user/shared/hash";
import { UserNotificationService } from "@/modules/admin-manage/admin-user/shared/notification";
import { AvatarColorService } from "@/share/common/avatar-color";
import { IUserUseCase, IAdminUserUseCase } from "@/modules/admin-manage/admin-user/interface";
import { prisma } from "@/share/component/prisma";
import { mailService } from "@/share/component/mail";
import { authenticate, protect, requirePermission } from "@/share/middleware/auth";
import { setupSettingHexagon, createSettingUseCase } from "@/modules/system/setting";
import { PERMISSIONS } from "@/share/security/permissions";
import { AuthNotificationService } from "@/modules/auth/shared/notification";
import { TokenService } from "@/modules/auth/shared/token";

const buildUserRouter = (useCase: IUserUseCase) => {
  const httpService = new UserHttpService(useCase);
  const router = Router();

  router.get(
    "/me",
    ...authenticate(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.getProfile.bind(httpService),
  );
  router.put(
    "/me",
    ...protect(requirePermission(PERMISSIONS.UPDATE_OWN_PROFILE)),
    httpService.updateProfile.bind(httpService),
  );
  router.delete(
    "/me",
    ...protect(requirePermission(PERMISSIONS.DELETE_OWN_ACCOUNT)),
    httpService.deleteAccount.bind(httpService),
  );
  router.post("/confirm-password", ...protect(), httpService.checkPassword.bind(httpService));
  router.post(
    "/change-password",
    ...protect(requirePermission(PERMISSIONS.CHANGE_OWN_PASSWORD)),
    httpService.changePassword.bind(httpService),
  );
  router.get(
    "/billing",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.getBilling.bind(httpService),
  );
  router.get(
    "/billing/summary",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.getBillingSummary.bind(httpService),
  );
  router.get(
    "/watch-history",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.getWatchHistory.bind(httpService),
  );
  router.get(
    "/reviews",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.getReviews.bind(httpService),
  );
  router.post(
    "/reviews",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_PROFILE)),
    httpService.createReview.bind(httpService),
  );
  router.get(
    "/sessions",
    ...protect(requirePermission(PERMISSIONS.VIEW_OWN_SESSIONS)),
    httpService.getSessions.bind(httpService),
  );
  router.delete(
    "/sessions/:sessionId",
    ...protect(requirePermission(PERMISSIONS.REVOKE_OWN_SESSIONS)),
    httpService.revokeSession.bind(httpService),
  );
  router.delete(
    "/sessions",
    ...protect(requirePermission(PERMISSIONS.REVOKE_OWN_SESSIONS)),
    httpService.revokeAllSessions.bind(httpService),
  );

  return router;
};

const buildAdminUserRouter = (useCase: IAdminUserUseCase) => {
  const httpService = new AdminUserHttpService(useCase);
  const router = Router();
  router.use(...protect());

  // analytic
  router.get(
    "/users/stats",
    requirePermission(PERMISSIONS.VIEW_USER_STATS),
    httpService.getStats.bind(httpService),
  );

  router.get(
    "/users",
    requirePermission(PERMISSIONS.VIEW_USERS),
    httpService.list.bind(httpService),
  );
  router.get(
    "/users/:id",
    requirePermission(PERMISSIONS.VIEW_USER_DETAIL),
    httpService.getUser.bind(httpService),
  );
  router.get(
    "/users/:id/billing",
    requirePermission(PERMISSIONS.VIEW_USER_DETAIL),
    httpService.getUserBilling.bind(httpService),
  );
  router.get(
    "/users/:id/billing/summary",
    requirePermission(PERMISSIONS.VIEW_USER_STATS),
    httpService.getUserBillingSummary.bind(httpService),
  );
  router.get(
    "/users/:id/watch-history",
    requirePermission(PERMISSIONS.VIEW_USER_DETAIL),
    httpService.getUserWatchHistory.bind(httpService),
  );
  router.post(
    "/users",
    requirePermission(PERMISSIONS.CREATE_USER),
    httpService.createUser.bind(httpService),
  );
  router.put(
    "/users/:id",
    requirePermission(PERMISSIONS.UPDATE_USER),
    httpService.updateUser.bind(httpService),
  );
  router.delete(
    "/users/:id",
    requirePermission(PERMISSIONS.DELETE_USER),
    httpService.deleteUser.bind(httpService),
  );
  router.patch(
    "/users/:id/status",
    requirePermission(PERMISSIONS.CHANGE_USER_STATUS),
    httpService.changeUserStatus.bind(httpService),
  );
  router.post(
    "/users/:id/reset-password",
    requirePermission(PERMISSIONS.RESET_USER_PASSWORD),
    httpService.resetUserPassword.bind(httpService),
  );
  router.post(
    "/users/:id/verify-email",
    requirePermission(PERMISSIONS.VERIFY_USER_EMAIL),
    httpService.verifyUserEmail.bind(httpService),
  );
  router.delete(
    "/users/:id/sessions",
    requirePermission(PERMISSIONS.REVOKE_USER_SESSIONS),
    httpService.revokeAllUserSessions.bind(httpService),
  );

  // Seed routes
  router.post(
    "/users/seed",
    requirePermission(PERMISSIONS.SEED_USERS),
    httpService.seedUsers.bind(httpService),
  );
  router.get(
    "/users/seed/stats",
    requirePermission(PERMISSIONS.SEED_USERS),
    httpService.getSeedStatistics.bind(httpService),
  );
  router.delete(
    "/users/seed",
    requirePermission(PERMISSIONS.SEED_USERS),
    httpService.clearSeedUsers.bind(httpService),
  );

  return router;
};

export const setupUserHexagon = (prismaClient: PrismaClient = prisma) => {
  const userRepository = createUserRepository(prismaClient);
  const sessionRepository = createSessionRepository(prismaClient);
  const passwordHasher = new HashService();
  const notificationService = new UserNotificationService(mailService);
  const authNotificationService = new AuthNotificationService();
  const avatarColorService = new AvatarColorService();
  const userSettingService = createSettingUseCase(prismaClient);
  const tokenService = new TokenService(prismaClient);

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
  const adminUserUseCase = new AdminUserUseCase(
    dependencies as any,
    authNotificationService,
    tokenService,
  );

  const router = Router();
  router.use("/user", buildUserRouter(userUseCase));
  router.use("/admin", buildAdminUserRouter(adminUserUseCase));

  const { router: settingRouter } = setupSettingHexagon(prismaClient, userSettingService);
  router.use("/user", settingRouter);

  return router;
};
