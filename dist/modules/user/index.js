"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUserHexagon = void 0;
const express_1 = require("express");
const admin_user_usecase_1 = require("./usecase/admin-user.usecase");
const user_usecase_1 = require("./usecase/user.usecase");
const http_service_1 = require("./infras/transport/http-service");
const session_repo_1 = require("./infras/repository/session-repo");
const user_repo_1 = require("./infras/repository/user-repo");
const setting_repo_1 = require("./infras/repository/setting-repo");
const hash_1 = require("./shared/hash");
const notification_1 = require("./shared/notification");
const avatar_color_service_1 = require("./shared/avatar-color.service");
const prisma_1 = require("../../share/component/prisma");
const auth_1 = require("../../share/middleware/auth");
const buildUserRouter = (useCase) => {
    const httpService = new http_service_1.UserHttpService(useCase);
    const router = (0, express_1.Router)();
    router.use(...(0, auth_1.protect)());
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
const buildAdminUserRouter = (useCase) => {
    const httpService = new http_service_1.AdminUserHttpService(useCase);
    const router = (0, express_1.Router)();
    router.use(...(0, auth_1.protect)(auth_1.adminMiddleware));
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
const setupUserHexagon = (prismaClient = prisma_1.prisma) => {
    const userRepository = (0, user_repo_1.createUserRepository)(prismaClient);
    const sessionRepository = (0, session_repo_1.createSessionRepository)(prismaClient);
    const userSettingsRepository = (0, setting_repo_1.createUserSettingRepository)(prismaClient);
    const passwordHasher = new hash_1.HashService();
    const notificationService = new notification_1.UserNotificationService();
    const avatarColorService = new avatar_color_service_1.AvatarColorService();
    const dependencies = {
        userRepository,
        sessionRepository,
        userSettingsRepository,
        passwordHasher,
        notificationService,
        avatarColorService,
        prisma: prismaClient,
    };
    const userUseCase = new user_usecase_1.UserUseCase(dependencies);
    const adminUserUseCase = new admin_user_usecase_1.AdminUserUseCase(dependencies);
    const router = (0, express_1.Router)();
    router.use("/user", buildUserRouter(userUseCase));
    router.use("/admin", buildAdminUserRouter(adminUserUseCase));
    return router;
};
exports.setupUserHexagon = setupUserHexagon;
