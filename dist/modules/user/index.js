"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUserHexagonWithUseCase = exports.setupUserHexagon = void 0;
const express_1 = require("express");
const usecase_1 = require("./usecase");
const http_service_1 = require("./infras/transport/http-service");
const repo_1 = require("./infras/repository/repo");
const hash_1 = require("./shared/hash");
const notification_1 = require("./shared/notification");
const prisma_1 = require("../../share/component/prisma");
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
const buildAdminUserRouter = (useCase) => {
    const httpService = new http_service_1.AdminUserHttpService(useCase);
    const router = (0, express_1.Router)();
    // User management routes
    router.get("/admin/users", httpService.listUsers.bind(httpService));
    router.get("/admin/users/:id", httpService.getUser.bind(httpService));
    router.post("/admin/users", httpService.createUser.bind(httpService));
    router.put("/admin/users/:id", httpService.updateUser.bind(httpService));
    router.delete("/admin/users/:id", httpService.deleteUser.bind(httpService));
    // User status & security routes
    router.patch("/admin/users/:id/status", httpService.changeUserStatus.bind(httpService));
    router.post("/admin/users/:id/reset-password", httpService.resetUserPassword.bind(httpService));
    router.post("/admin/users/:id/verify-email", httpService.verifyUserEmail.bind(httpService));
    router.delete("/admin/users/:id/sessions", httpService.revokeAllUserSessions.bind(httpService));
    return router;
};
/**
 * ==========================================
 * SETUP USER HEXAGON
 * ==========================================
 */
const setupUserHexagon = (prismaClient = prisma_1.prisma) => {
    const userRepository = (0, repo_1.createUserRepository)(prismaClient);
    const sessionRepository = (0, repo_1.createSessionRepository)(prismaClient);
    const userSettingsRepository = (0, repo_1.createUserSettingsRepository)(prismaClient);
    // Initialize services
    const passwordHasher = new hash_1.HashService();
    const notificationService = new notification_1.UserNotificationService();
    // Create dependencies object
    const dependencies = {
        userRepository,
        sessionRepository,
        userSettingsRepository,
        passwordHasher,
        notificationService,
    };
    // Create use cases
    const userUseCase = new usecase_1.UserUseCase(dependencies);
    const adminUserUseCase = new usecase_1.AdminUserUseCase(dependencies);
    // Create router with combined routes
    const router = (0, express_1.Router)();
    //   router.use(buildUserRouter(userUseCase));
    router.use(buildAdminUserRouter(adminUserUseCase));
    return router;
};
exports.setupUserHexagon = setupUserHexagon;
/**
 * ==========================================
 * EXPORT FOR TESTING
 * ==========================================
 */
const setupUserHexagonWithUseCase = (userUseCase, adminUseCase) => {
    const router = (0, express_1.Router)();
    //   router.use(buildUserRouter(userUseCase));
    router.use(buildAdminUserRouter(adminUseCase));
    return router;
};
exports.setupUserHexagonWithUseCase = setupUserHexagonWithUseCase;
