import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/modules/system/log/logger";
import { AppError, errorResponse, successResponse } from "@/share/transport/http-server";
import { IPartnerRequestUseCase } from "@/modules/partner/interface/partner-request.interface";
import { RequestCondDTOSchema } from "@/modules/partner/model/dto";
import { writeAuditLog } from "@/modules/admin-manage/admin-audit-logs/helper";
import { PusherService } from "@/socket/services";
import { pushNotificationService, NotificationFactory } from "@/modules/notification";
import { mailService } from "@/share/component/mail";
import { enqueueEmailJob, isQueueEnabled } from "@/queue";

export class PartnerRequestHttpService {
  constructor(
    private readonly requestUseCase: IPartnerRequestUseCase,
    private readonly prisma?: PrismaClient,
  ) {}

  private async broadcastAdminBadgeUpdate(
    changedField: "pendingPartners" | "reportedContent" | "flaggedComments" | "pendingPayouts" | "pendingReviews",
    delta: number,
  ): Promise<void> {
    if (!this.prisma) return;
    try {
      const [pendingPartners, reportedContent, flaggedComments, pendingPayouts, pendingReviews] =
        await Promise.all([
          this.prisma.partnerRequest.count({ where: { status: "PENDING" } }),
          this.prisma.report.count({
            where: { status: { in: ["PENDING", "REVIEWING"] }, target: { in: ["MOVIE", "REVIEW", "USER", "OWNER"] } },
          }),
          this.prisma.report.count({
            where: { status: { in: ["PENDING", "REVIEWING"] }, target: "COMMENT" },
          }),
          this.prisma.withdrawal.count({ where: { status: "PENDING" } }),
          this.prisma.review.count({ where: { status: "PENDING" } }),
        ]);

      await PusherService.trigger("private-admin", "admin.badges.updated", {
        badges: { pendingPartners, reportedContent, flaggedComments, pendingPayouts, pendingReviews },
        changedKeys: [changedField],
        delta: { [changedField]: delta },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn("[PartnerRequest] broadcastAdminBadgeUpdate failed", { err });
    }
  }

  private async dispatchEmail(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      if (isQueueEnabled) {
        await enqueueEmailJob(input, { jobId: `partner-mail:${input.to}:${Date.now()}` });
      } else {
        await mailService.send(input);
      }
    } catch (err) {
      logger.warn("[PartnerRequest] email dispatch failed", { to: input.to, err });
    }
  }

  private async notifyAdmins(cinemaName: string, requestId: string): Promise<void> {
    if (!this.prisma) return;
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true, email: true },
      });
      await Promise.all(
        admins.map(async (admin) => {
          await pushNotificationService
            .send(NotificationFactory.newPartnerRequestAdmin(admin.id, cinemaName, requestId))
            .catch((err) => logger.warn("[PartnerRequest] admin push failed", { err: err.message }));

          await this.dispatchEmail({
            to: admin.email,
            subject: `[CineVN] Đơn đăng ký đối tác mới: ${cinemaName}`,
            html: `<p>Xin chào Admin,</p>
<p>Một đơn đăng ký đối tác mới vừa được nộp:</p>
<ul>
  <li><strong>Tên rạp:</strong> ${cinemaName}</li>
  <li><strong>Mã đơn:</strong> ${requestId}</li>
</ul>
<p>Vui lòng đăng nhập vào trang quản trị để xem xét và phê duyệt.</p>`,
            text: `Có đơn đăng ký đối tác mới: ${cinemaName} (ID: ${requestId}). Vui lòng đăng nhập để xem xét.`,
          });
        }),
      );
    } catch (err) {
      logger.warn("[PartnerRequest] notifyAdmins failed", { err });
    }
  }

  private handleError(res: Response, error: unknown, fallbackStatus: number = 500): void {
    if (error instanceof AppError) {
      errorResponse(res, error.status, error.message, String(error.code), error.details);
      return;
    }

    const fallbackError = error as {
      status?: number;
      statusCode?: number;
      message?: string;
      code?: string;
      details?: unknown;
    };

    errorResponse(
      res,
      fallbackError.status ?? fallbackError.statusCode ?? fallbackStatus,
      fallbackError.message ?? "Internal server error",
      fallbackError.code ? String(fallbackError.code) : undefined,
      fallbackError.details,
    );
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const data = req.body;
      const insert = await this.requestUseCase.submit(userId, data);

      const now = new Date().toISOString();
      const request = insert as any;

      const cinemaName = request.cinemaName ?? "";
      const email = request.email ?? "";
      const requestId = request.id;

      // Socket event tới kênh admin
      await PusherService.trigger("private-admin", "partner.request.submitted", {
        requestId,
        userId: request.userId ?? userId,
        cinemaName,
        email,
        submittedAt: now,
        timestamp: now,
      });

      // Badge admin (pendingPartners +1)
      await this.broadcastAdminBadgeUpdate("pendingPartners", 1);

      // Push notification + email tới tất cả admin
      await this.notifyAdmins(cinemaName, requestId);

      // Push notification xác nhận tới user
      await pushNotificationService
        .send(NotificationFactory.partnerRequestReceived(userId, cinemaName))
        .catch((err) => logger.warn("[PartnerRequest] user push failed", { err: err.message }));

      // Email xác nhận tới user
      if (email) {
        await this.dispatchEmail({
          to: email,
          subject: "[CineVN] Đơn đăng ký đối tác đã được tiếp nhận",
          html: `<p>Xin chào,</p>
<p>Chúng tôi đã nhận được đơn đăng ký đối tác của <strong>${cinemaName}</strong>.</p>
<p>Đội ngũ CineVN sẽ xem xét và phản hồi cho bạn trong thời gian sớm nhất. Bạn có thể theo dõi trạng thái đơn trong tài khoản của mình.</p>
<p>Trân trọng,<br/>Đội ngũ CineVN</p>`,
          text: `Chúng tôi đã nhận đơn đăng ký đối tác của ${cinemaName}. Chúng tôi sẽ liên hệ lại sớm.`,
        });
      }

      successResponse(res, insert, "Partner request submitted successfully", 201);
    } catch (error: any) {
      logger.error("[PartnerRequest] submit error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async editSubmit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const data = req.body;
      const insert = await this.requestUseCase.editSubmit(userId, data);
      successResponse(res, insert, "Partner request updated successfully");
    } catch (error: any) {
      logger.error("[PartnerRequest] edit submit error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async getMyRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const insert = await this.requestUseCase.getMyRequest(userId);
      successResponse(res, insert, "Partner request status");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async adminListRequests(req: Request, res: Response): Promise<void> {
    try {
      const cound = RequestCondDTOSchema.parse(req.query);
      const result = await this.requestUseCase.adminListRequests(cound);
      successResponse(res, result.data, "Partner request list", 200, result.paging);
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async stats(req: Request, res: Response): Promise<void> {
    try {
      const insert = await this.requestUseCase.getStats();
      successResponse(res, insert, "Partner request list");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async adminGetRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const insert = await this.requestUseCase.adminGetRequest(id);
      successResponse(res, insert, "Partner request detail");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async adminApprove(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminId = req.user?.id ?? "system-admin";

      // Lấy thông tin request trước khi duyệt (để gửi notification)
      const requestData = this.prisma
        ? await this.prisma.partnerRequest.findUnique({
            where: { id },
            select: { userId: true, email: true, cinemaName: true },
          })
        : null;

      const insert = await this.requestUseCase.adminApprove(id);

      if (this.prisma) {
        await writeAuditLog(this.prisma, req, {
          action: "approve_partner_request",
          description: `Approved partner request ${id}`,
          category: "partner",
          severity: "high",
          targetType: "partner_request",
          targetId: id,
          targetLabel: String((insert as any)?.cinemaName ?? requestData?.cinemaName ?? id),
          meta: {
            status: (insert as any)?.status,
            approvedPartnerId: (insert as any)?.approvedPartnerId,
          },
        });
      }

      if (requestData) {
        const now = new Date().toISOString();

        await pushNotificationService
          .send(NotificationFactory.partnerRequestApproved(requestData.userId, requestData.cinemaName))
          .catch((err) => logger.warn("[PartnerRequest] partner push failed", { err: err.message }));

        await PusherService.pushToUser(requestData.userId, "partner.request.approved", {
          requestId: id,
          userId: requestData.userId,
          partnerName: requestData.cinemaName,
          email: requestData.email,
          approvedBy: adminId,
          approvedAt: now,
          timestamp: now,
        });

        await this.dispatchEmail({
          to: requestData.email,
          subject: "[CineVN] Đơn đăng ký đối tác đã được phê duyệt",
          html: `<p>Xin chào,</p>
<p>Chúc mừng! Đơn đăng ký đối tác của <strong>${requestData.cinemaName}</strong> đã được chấp thuận.</p>
<p>Bạn có thể đăng nhập và bắt đầu sử dụng trang quản lý đối tác ngay bây giờ.</p>
<p>Trân trọng,<br/>Đội ngũ CineVN</p>`,
          text: `Chúc mừng! Đơn đăng ký của ${requestData.cinemaName} đã được phê duyệt.`,
        });

        await this.broadcastAdminBadgeUpdate("pendingPartners", -1);
      }

      successResponse(res, insert, "Partner request approved");
    } catch (error: any) {
      logger.error("[PartnerRequest] approve error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async adminReject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const reason = req.body.reason as string;
      const adminId = req.user?.id ?? "system-admin";

      // Lấy thông tin request trước khi từ chối
      const requestData = this.prisma
        ? await this.prisma.partnerRequest.findUnique({
            where: { id },
            select: { userId: true, email: true, cinemaName: true },
          })
        : null;

      const insert = await this.requestUseCase.adminReject(id, reason);

      if (this.prisma) {
        await writeAuditLog(this.prisma, req, {
          action: "reject_partner_request",
          description: `Rejected partner request ${id}`,
          category: "partner",
          severity: "high",
          targetType: "partner_request",
          targetId: id,
          targetLabel: String((insert as any)?.cinemaName ?? requestData?.cinemaName ?? id),
          meta: {
            status: (insert as any)?.status,
            reason,
          },
        });
      }

      if (requestData) {
        const now = new Date().toISOString();

        await pushNotificationService
          .send(NotificationFactory.partnerRequestRejected(requestData.userId, requestData.cinemaName, reason))
          .catch((err) => logger.warn("[PartnerRequest] partner push failed", { err: err.message }));

        await PusherService.pushToUser(requestData.userId, "partner.request.rejected", {
          requestId: id,
          userId: requestData.userId,
          rejectedBy: adminId,
          rejectedAt: now,
          reason,
          timestamp: now,
        });

        await this.dispatchEmail({
          to: requestData.email,
          subject: "[CineVN] Đơn đăng ký đối tác chưa được chấp thuận",
          html: `<p>Xin chào,</p>
<p>Sau khi xem xét, đơn đăng ký đối tác của <strong>${requestData.cinemaName}</strong> chưa được chấp thuận lúc này.</p>
${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ""}
<p>Bạn có thể chỉnh sửa và nộp lại đơn sau khi khắc phục các vấn đề trên.</p>
<p>Trân trọng,<br/>Đội ngũ CineVN</p>`,
          text: `Đơn đăng ký của ${requestData.cinemaName} chưa được chấp thuận. Lý do: ${reason ?? "Không có"}`,
        });

        await this.broadcastAdminBadgeUpdate("pendingPartners", -1);
      }

      successResponse(res, insert, "Partner request rejected");
    } catch (error: any) {
      logger.error("[PartnerRequest] reject error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async adminReset(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const insert = await this.requestUseCase.adminReset(id);

      // Cập nhật badge (đơn trở về PENDING → pendingPartners +1)
      await this.broadcastAdminBadgeUpdate("pendingPartners", 1);

      successResponse(res, insert, "Partner request reset to pending");
    } catch (error: any) {
      logger.error("[PartnerRequest] reset error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }
}
