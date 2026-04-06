import { Request, Response } from "express";
import { IAuthUseCase } from "../../interface";
import {
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResendVerificationDTO,
  VerifyEmailDTO,
} from "../../model/dto";

export class AuthHttpService {
  constructor(private readonly useCase: IAuthUseCase) {}

  async register(req: Request<any, any, RegisterDTO>, res: Response) {
    await this.handle(res, 201, () => this.useCase.register(req.body));
  }

  async login(req: Request<any, any, LoginDTO>, res: Response) {
    await this.handle(res, 200, () => this.useCase.login(req.body));
  }

  async verifyEmail(req: Request<any, any, VerifyEmailDTO>, res: Response) {
    await this.handle(res, 200, () => this.useCase.verifyEmail(req.body));
  }

  async resendVerification(
    req: Request<any, any, ResendVerificationDTO>,
    res: Response
  ) {
    await this.handle(res, 200, () =>
      this.useCase.resendVerification(req.body)
    );
  }

  async forgotPassword(
    req: Request<any, any, ForgotPasswordDTO>,
    res: Response
  ) {
    await this.handle(res, 200, () => this.useCase.forgotPassword(req.body));
  }

  async changePassword(
    req: Request<any, any, ChangePasswordDTO>,
    res: Response
  ) {
    await this.handle(res, 200, () => this.useCase.changePassword(req.body));
  }

  private async handle<T>(
    res: Response,
    statusCode: number,
    action: () => Promise<T>
  ) {
    try {
      const data = await action();
      res.status(statusCode).json({ data });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
      });
    }
  }
}
