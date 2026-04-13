"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUserHexagon = void 0;
const express_1 = require("express");
const admin_user_usecase_1 = require("./usecase/admin-user.usecase");
const user_usecase_1 = require("./usecase/user.usecase");
const http_service_1 = require("./infras/transport/http-service");
const session_repo_1 = require("./infras/repository/session-repo");
const user_repo_1 = require("./infras/repository/user-repo");
const hash_1 = require("./shared/hash");
const notification_1 = require("./shared/notification");
const avatar_color_1 = require("./shared/avatar-color");
const prisma_1 = require("../../share/component/prisma");
const mail_1 = require("../../share/component/mail");
const auth_1 = require("../../share/middleware/auth");
const setting_1 = require("../system/setting");
const permissions_1 = require("../../share/security/permissions");
const notification_2 = require("../auth/shared/notification");
const token_1 = require("../auth/shared/token");
const buildUserRouter = (useCase) => {
    const httpService = new http_service_1.UserHttpService(useCase);
    const router = (0, express_1.Router)();
    router.get("/me", ...(0, auth_1.authenticate)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_OWN_PROFILE)), httpService.getProfile.bind(httpService));
    router.put("/me", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.UPDATE_OWN_PROFILE)), httpService.updateProfile.bind(httpService));
    router.delete("/me", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.DELETE_OWN_ACCOUNT)), httpService.deleteAccount.bind(httpService));
    router.post("/change-password", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.CHANGE_OWN_PASSWORD)), httpService.changePassword.bind(httpService));
    router.get("/sessions", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_OWN_SESSIONS)), httpService.getSessions.bind(httpService));
    router.delete("/sessions/:sessionId", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.REVOKE_OWN_SESSIONS)), httpService.revokeSession.bind(httpService));
    router.delete("/sessions", ...(0, auth_1.protect)((0, auth_1.requirePermission)(permissions_1.PERMISSIONS.REVOKE_OWN_SESSIONS)), httpService.revokeAllSessions.bind(httpService));
    return router;
};
const buildAdminUserRouter = (useCase) => {
    const httpService = new http_service_1.AdminUserHttpService(useCase);
    const router = (0, express_1.Router)();
    router.use(...(0, auth_1.protect)());
    // analytic
    router.get("/users/stats", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_USER_STATS), httpService.getStats.bind(httpService));
    router.get("/users", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_USERS), httpService.list.bind(httpService));
    router.get("/users/:id", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VIEW_USER_DETAIL), httpService.getUser.bind(httpService));
    router.post("/users", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.CREATE_USER), httpService.createUser.bind(httpService));
    router.put("/users/:id", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.UPDATE_USER), httpService.updateUser.bind(httpService));
    router.delete("/users/:id", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.DELETE_USER), httpService.deleteUser.bind(httpService));
    router.patch("/users/:id/status", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.CHANGE_USER_STATUS), httpService.changeUserStatus.bind(httpService));
    router.post("/users/:id/reset-password", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.RESET_USER_PASSWORD), httpService.resetUserPassword.bind(httpService));
    router.post("/users/:id/verify-email", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.VERIFY_USER_EMAIL), httpService.verifyUserEmail.bind(httpService));
    router.delete("/users/:id/sessions", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.REVOKE_USER_SESSIONS), httpService.revokeAllUserSessions.bind(httpService));
    // Seed routes
    router.post("/users/seed", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SEED_USERS), httpService.seedUsers.bind(httpService));
    router.get("/users/seed/stats", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SEED_USERS), httpService.getSeedStatistics.bind(httpService));
    router.delete("/users/seed", (0, auth_1.requirePermission)(permissions_1.PERMISSIONS.SEED_USERS), httpService.clearSeedUsers.bind(httpService));
    return router;
};
const setupUserHexagon = (prismaClient = prisma_1.prisma) => {
    const userRepository = (0, user_repo_1.createUserRepository)(prismaClient);
    const sessionRepository = (0, session_repo_1.createSessionRepository)(prismaClient);
    const passwordHasher = new hash_1.HashService();
    const notificationService = new notification_1.UserNotificationService(mail_1.mailService);
    const authNotificationService = new notification_2.AuthNotificationService();
    const avatarColorService = new avatar_color_1.AvatarColorService();
    const userSettingService = (0, setting_1.createSettingUseCase)(prismaClient);
    const tokenService = new token_1.TokenService(prismaClient);
    const dependencies = {
        userRepository,
        sessionRepository,
        userSettingsRepository: {},
        passwordHasher,
        notificationService,
        avatarColorService,
        prisma: prismaClient,
        userSettingService,
    };
    const userUseCase = new user_usecase_1.UserUseCase(dependencies);
    const adminUserUseCase = new admin_user_usecase_1.AdminUserUseCase(dependencies, authNotificationService, tokenService);
    const router = (0, express_1.Router)();
    router.use("/user", buildUserRouter(userUseCase));
    router.use("/admin", buildAdminUserRouter(adminUserUseCase));
    const { router: settingRouter } = (0, setting_1.setupSettingHexagon)(prismaClient, userSettingService);
    router.use("/user", settingRouter);
    return router;
};
exports.setupUserHexagon = setupUserHexagon;
