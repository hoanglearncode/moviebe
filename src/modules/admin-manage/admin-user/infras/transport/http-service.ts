import { Request, Response } from "express";
import { BaseHttpService, UnauthorizedError } from "@/share/transport/http-server";
import { IAdminUserUseCase, IUserUseCase } from "@/modules/admin-manage/admin-user/interface";
import {
  ChangePasswordDTO,
  ChangeUserStatusDTO,
  CreateReviewDTO,
  CreateReviewPayloadDTO,
  CreateUserDTO,
  GetBillingQueryPayloadSchema,
  GetSessionsQueryDTO,
  ResetUserPasswordDTO,
  UpdateProfileDTO,
  UpdateUserDTO,
  ListUsersQueryPayloadSchema,
  SeedUsersDTO,
  SeedUsersPayloadSchema,
} from "@/modules/admin-manage/admin-user/model/dto";
import { prisma } from "@/share/component/prisma";
import { writeAuditLog } from "@/modules/admin-manage/admin-audit-logs/helper";

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

  async getBilling(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query = GetBillingQueryPayloadSchema.parse(req.query);
      return this.userUseCase.getBillingHistory(this.getAuthenticatedUserId(req), query);
    });
  }

  async getBillingSummary(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.getBillingSummary(this.getAuthenticatedUserId(req));
    });
  }

  async getWatchHistory(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query = GetBillingQueryPayloadSchema.parse(req.query);
      return this.userUseCase.getWatchHistory(this.getAuthenticatedUserId(req), query);
    });
  }

  async getReviews(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query = GetBillingQueryPayloadSchema.parse(req.query);
      return this.userUseCase.getReviews(this.getAuthenticatedUserId(req), query);
    });
  }

  async createReview(req: Request<any, any, CreateReviewDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      const payload = CreateReviewPayloadDTO.parse(req.body);
      return this.userUseCase.createReview(this.getAuthenticatedUserId(req), payload);
    });
  }

  async revokeSession(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.revokeSession(
        this.getAuthenticatedUserId(req),
        String(req.params.sessionId || ""),
      );
    });
  }

  async revokeAllSessions(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.revokeAllSessions(this.getAuthenticatedUserId(req));
    });
  }

  async checkPassword(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.userUseCase.checkPassword(this.getAuthenticatedUserId(req), req.body.password);
    });
  }

  private getAuthenticatedUserId(req: Request): string {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    return userId;
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
    await this.handleRequest(res, async () => this.adminUserUseCase.create(req.body), 201);
  }

  async updateUser(req: Request<any, any, UpdateUserDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.update(String(req.params.id || ""), req.body);
    });
  }

  async changeUserStatus(req: Request<any, any, ChangeUserStatusDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      const userId = String(req.params.id || "");
      const before = await this.adminUserUseCase.getDetail(userId);
      const result = await this.adminUserUseCase.changeUserStatus(userId, req.body);
      const after = await this.adminUserUseCase.getDetail(userId);
      if (!before || !after) return result;

      const isPartner = String(after.role) === "PARTNER";
      const targetLabel = after.email ?? after.username ?? after.id;
      const statusTo = String(req.body.status ?? after.status);

      let action = isPartner ? "change_partner_status" : "change_user_status";
      let severity: "low" | "medium" | "high" | "critical" = "medium";

      if (statusTo === "BANNED") {
        action = isPartner ? "ban_partner" : "ban_user";
        severity = "high";
      } else if (String(before.status) === "BANNED" && statusTo === "ACTIVE") {
        action = isPartner ? "unban_partner" : "unban_user";
        severity = "medium";
      }

      await writeAuditLog(prisma, req, {
        action,
        description: `${action} for ${targetLabel}`,
        category: isPartner ? "partner" : "user",
        severity,
        targetType: isPartner ? "partner_user" : "user",
        targetId: after.id,
        targetLabel,
        meta: {
          role: after.role,
          fromStatus: before.status,
          toStatus: statusTo,
        },
      });

      return result;
    });
  }

  async resetUserPassword(req: Request<any, any, ResetUserPasswordDTO>, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.resetUserPassword(String(req.params.id || ""), req.body);
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

  async getUserBilling(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query = GetBillingQueryPayloadSchema.parse(req.query);
      return await this.adminUserUseCase.getUserBillingHistory(String(req.params.id || ""), query);
    });
  }

  async getUserBillingSummary(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return await this.adminUserUseCase.getUserBillingSummary(String(req.params.id || ""));
    });
  }

  async getUserWatchHistory(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const query = GetBillingQueryPayloadSchema.parse(req.query);
      return await this.adminUserUseCase.getUserWatchHistory(String(req.params.id || ""), query);
    });
  }

  async deleteUser(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      return this.adminUserUseCase.delete(String(req.params.id || ""));
    });
  }
}
