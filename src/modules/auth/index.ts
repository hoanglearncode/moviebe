import { Router } from "express";
import {
  AuthHexagonDependencies,
  IAuthUseCase,
} from "./interface";
import { AuthHttpService } from "./infras/transport/http-service";
import { AuthUseCase } from "./usecase";

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

export const setupAuthHexagon = (dependencies: AuthHexagonDependencies) => {
  const useCase = new AuthUseCase(dependencies);
  return buildRouter(useCase);
};

export const setupAuthHexagonWithUseCase = (useCase: IAuthUseCase) =>
  buildRouter(useCase);
