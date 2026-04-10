import { Request, Response } from "express";
import {
  BaseHttpService,
  UnauthorizedError,
} from "../../../../share/transport/http-server";
import { IAdminUserUseCase, IUserUseCase } from "../../interface";
import {
  ChangePasswordDTO,
  ChangeUserStatusDTO,
  CreateUserDTO,
  GetSessionsQueryDTO,
  ListUsersQueryDTO,
  ResetUserPasswordDTO,
  UpdateProfileDTO,
  UpdateSettingsDTO,
  UpdateUserDTO,
  ListUsersQueryPayloadSchema,
  SeedUsersDTO,
  SeedUsersPayloadSchema,
} from "../../model/dto";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

export class UserHttpService extends BaseHttpService<any, any, any, any> {
  private readonly userUseCase: IUserUseCase;

  constructor(useCase: IUserUseCase) {
    super(useCase as any);
    this.userUseCase = useCase;
  }

  async getProfile(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.getProfile(this.getAuthenticatedUserId(req));
    });
  }

  async updateProfile(req: Request<any, any, UpdateProfileDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.updateProfile(this.getAuthenticatedUserId(req), req.body);
    });
  }

  async deleteAccount(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.deleteAccount(this.getAuthenticatedUserId(req));
    });
  }

  async changePassword(req: Request<any, any, ChangePasswordDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.changePassword(this.getAuthenticatedUserId(req), req.body);
    });
  }

  async getSessions(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query: GetSessionsQueryDTO = {
        limit: 1000,
        offset: 1,
        orderBy: (req.query.orderBy as "createdAt" | "lastActivityAt") || "createdAt",
      };

      return this.userUseCase.getSessions(this.getAuthenticatedUserId(req), query);
    });
  }

  async revokeSession(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.revokeSession(
        this.getAuthenticatedUserId(req),
        String(req.params.sessionId || "")
      );
    });
  }

  async revokeAllSessions(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.revokeAllSessions(this.getAuthenticatedUserId(req));
    });
  }

  async getSettings(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.getSettings(this.getAuthenticatedUserId(req));
    });
  }

  async updateSettings(req: Request<any, any, UpdateSettingsDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.updateSettings(this.getAuthenticatedUserId(req), req.body);
    });
  }

  private getAuthenticatedUserId(req: Request): string {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    return userId;
  }

  private parseNumberQuery(
    value: string | string[] | undefined,
    fallback: number
  ): number {
    if (Array.isArray(value)) {
      return this.parseNumberQuery(value[0], fallback);
    }

    if (value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

export class AdminUserHttpService extends BaseHttpService<any, any, any, any> {
  private readonly adminUserUseCase: IAdminUserUseCase;

  constructor(useCase: IAdminUserUseCase) {
    super(useCase as any);
    this.adminUserUseCase = useCase;
  }

  async list(req: Request, res: Response) {
    try {
      const cond = ListUsersQueryPayloadSchema.parse(req.query);

      const result = await this.adminUserUseCase.listWithMeta(cond);

      res.status(200).json({
        data: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        cond,
        filter: cond,
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
      });
    }
  }


  async getUser(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.getDetail(String(req.params.id || ""));
    });
  }

  async createUser(req: Request<any, any, CreateUserDTO>, res: Response) {
    await this.handleRequest(
      res,
      async () => this.adminUserUseCase.create(req.body),
      201
    );
  }

  async updateUser(req: Request<any, any, UpdateUserDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.update(String(req.params.id || ""), req.body);
    });
  }

  async changeUserStatus(req: Request<any, any, ChangeUserStatusDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.changeUserStatus(String(req.params.id || ""), req.body);
    });
  }

  async resetUserPassword(
    req: Request<any, any, ResetUserPasswordDTO>,
    res: Response
  ) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.resetUserPassword(
        String(req.params.id || ""),
        req.body
      );
    });
  }

  async verifyUserEmail(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.verifyUserEmail(String(req.params.id || ""));
    });
  }

  async revokeAllUserSessions(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.revokeAllUserSessions(String(req.params.id || ""));
    });
  }

  /**
   * Seed users endpoint - Bulk create random users
   * POST /admin/users/seed
   * Body: { count: number, batchSize?: number, ... }
   */
  async seedUsers(req: Request<any, any, SeedUsersDTO>, res: Response) {
    try {
      const validatedData = SeedUsersPayloadSchema.parse(req.body);
      const result = await this.adminUserUseCase.seedUsers(validatedData);

      res.status(201).json({
        message: `Successfully seeded ${result.totalCreated} users`,
        data: {
          totalRequested: result.totalRequested,
          totalCreated: result.totalCreated,
          totalFailed: result.totalFailed,
          duration: `${result.duration}ms`,
          startTime: result.startTime,
          endTime: result.endTime,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
      });
    }
  }

  /**
   * Clear seed users endpoint - Delete all seed users
   * DELETE /admin/users/seed
   */
  async clearSeedUsers(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const result = await this.adminUserUseCase.clearSeedUsers();
      return {
        message: `Deleted ${result.deletedCount} seed users`,
        data: result,
      };
    });
  }

  /**
   * Get seed statistics endpoint
   * GET /admin/users/seed/stats
   */
  async getSeedStatistics(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return await this.adminUserUseCase.getSeedStatistics();
    });
  }

  /**
   * Get user statistics endpoint
   * GET /admin/users/stats
   */
  async getStats(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return await this.adminUserUseCase.getStats();
    });
  }

  async deleteUser(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.delete(String(req.params.id || ""));
    });
  }

  private parseNumberQuery(
    value: string | string[] | undefined,
    fallback: number
  ): number {
    if (Array.isArray(value)) {
      return this.parseNumberQuery(value[0], fallback);
    }

    if (value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseStringQuery(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return this.parseStringQuery(value[0]);
    }

    return value === undefined ? undefined : String(value);
  }
}
