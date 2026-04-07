import { Request, Response } from "express";
import { BaseHttpService } from "../../../../share/transport/http-server";
import { IAuthUseCase } from "../../interface";
import {
  ChangePasswordDTO,
  FacebookTO,
  ForgotPasswordDTO,
  GoogleDTO,
  GoogleTokenDTO,
  LoginDTO,
  RefreshDTO,
  RegisterDTO,
  ResendVerificationDTO,
  VerifyEmailDTO,
} from "../../model/dto";

export class AuthHttpService extends BaseHttpService<any, RegisterDTO, any, any> {
  private readonly authUseCase: IAuthUseCase;

  constructor(useCase: IAuthUseCase) {
    super(useCase as any);
    this.authUseCase = useCase;
  }

  async register(req: Request<any, any, RegisterDTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.register(req.body), 201);
  }

  async login(req: Request<any, any, LoginDTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.login(req.body));
  }

  async refreshToken(req: Request<any, any, RefreshDTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.refreshToken(req.body));
  }

  async loginGoogle(req: Request<any, any, GoogleDTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.loginGoogle(req.body));
  }

  async loginGoogleTokenCallback(
    req: Request<any, any, GoogleTokenDTO>,
    res: Response
  ) {
    await this.handleRequest(res, () =>
      this.authUseCase.loginGoogleTokenCallback(req.body)
    );
  }

  async loginFacebook(req: Request<any, any, FacebookTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.loginFacebook(req.body));
  }

  async verifyEmail(req: Request<any, any, VerifyEmailDTO>, res: Response) {
    await this.handleRequest(res, () => this.authUseCase.verifyEmail(req.body));
  }

  async resendVerification(
    req: Request<any, any, ResendVerificationDTO>,
    res: Response
  ) {
    await this.handleRequest(res, () => this.authUseCase.resendVerification(req.body));
  }

  async forgotPassword(
    req: Request<any, any, ForgotPasswordDTO>,
    res: Response
  ) {
    await this.handleRequest(res, () => this.authUseCase.forgotPassword(req.body));
  }

  async changePassword(
    req: Request<any, any, ChangePasswordDTO>,
    res: Response
  ) {
    await this.handleRequest(res, () => this.authUseCase.changePassword(req.body));
  }
}
