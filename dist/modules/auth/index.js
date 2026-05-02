import { Router } from "express";
import { AuthHttpService } from "@/modules/auth/infras/transport/http-service";
import { createAuthUserRepository } from "@/modules/auth/infras/repository/repo";
import { AuthUseCase } from "@/modules/auth/usecase";
import { HashService } from "@/modules/auth/shared/hash";
import { TokenService } from "@/modules/auth/shared/token";
import { AuthNotificationService } from "@/modules/auth/shared/notification";
import { SocialAuthService } from "@/modules/auth/shared/social-auth";
import { AvatarColorService } from "@/share/common/avatar-color";
import { prisma } from "@/share/component/prisma";
import { concurrentLockService } from "@/share/component/concurrent-lock";
import { createSettingUseCase } from "@/modules/system/setting";
const buildRouter = (useCase) => {
    const httpService = new AuthHttpService(useCase);
    const router = Router();
    router.post("/auth/register", httpService.register.bind(httpService));
    router.post("/auth/login", httpService.login.bind(httpService));
    router.post("/auth/google/callback", httpService.loginGoogle.bind(httpService));
    router.post("/auth/google/callback/token", httpService.loginGoogleTokenCallback.bind(httpService));
    router.post("/auth/facebook/callback", httpService.loginFacebook.bind(httpService));
    router.post("/auth/refresh-token", httpService.refreshToken.bind(httpService));
    router.post("/auth/verify-email", httpService.verifyEmail.bind(httpService));
    router.post("/auth/resend-verification", httpService.resendVerification.bind(httpService));
    router.post("/auth/forgot-password", httpService.forgotPassword.bind(httpService));
    router.post("/auth/change-password", httpService.changePassword.bind(httpService));
    return router;
};
export const setupAuthHexagon = (prismaClient = prisma) => {
    const userRepository = createAuthUserRepository(prismaClient);
    const passwordHasher = new HashService();
    const tokenService = new TokenService(prismaClient);
    const notificationService = new AuthNotificationService();
    const socialAuthService = new SocialAuthService();
    const avatarColorService = new AvatarColorService();
    const userSettingService = createSettingUseCase(prismaClient);
    const dependencies = {
        userRepository,
        passwordHasher,
        tokenService,
        notificationService,
        socialAuthService,
        concurrentLockService,
        avatarColorService,
        userSettingService,
    };
    const useCase = new AuthUseCase(dependencies);
    return buildRouter(useCase);
};
export const setupAuthHexagonWithUseCase = (useCase) => buildRouter(useCase);
