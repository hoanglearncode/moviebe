import { PrismaClient } from "@prisma/client";
import { IUserUseCase, UserHexagonDependencies } from "@/modules/admin-manage/admin-user/interface";
import {
  ChangePasswordDTO,
  CreateReviewDTO,
  GetBillingQueryDTO,
  GetSessionsQueryDTO,
  UpdateProfileDTO,
} from "@/modules/admin-manage/admin-user/model/dto";
import {
  ErrPasswordInvalid,
  ErrPasswordUnchangeable,
  ErrSessionNotFound,
  ErrSessionUnauthorized,
  ErrUserNotFound,
} from "@/modules/admin-manage/admin-user/model/errors";
import {
  OwnUserProfile,
  SessionListResponse,
  UserReviewItem,
  UserReviewListResponse,
} from "@/modules/admin-manage/admin-user/model/model";
import { TicketListResult } from "@/modules/ticket/model/model";
import { AuthorizationUseCase } from "@/modules/admin-manage/admin-user/usecase/authorization.usecase";

export class UserUseCase implements IUserUseCase {
  private readonly userRepo: UserHexagonDependencies["userRepository"];
  private readonly sessionRepo: UserHexagonDependencies["sessionRepository"];
  private readonly hasher: UserHexagonDependencies["passwordHasher"];
  private readonly notifier: UserHexagonDependencies["notificationService"];
  private readonly authorizationUseCase = new AuthorizationUseCase();
  private readonly prisma: PrismaClient;

  constructor(deps: UserHexagonDependencies) {
    this.userRepo = deps.userRepository;
    this.sessionRepo = deps.sessionRepository;
    this.hasher = deps.passwordHasher;
    this.notifier = deps.notificationService;
    this.prisma = deps.prisma;
  }

  async getProfile(userId: string): Promise<OwnUserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;
    return this.toOwnProfile(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<OwnUserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    const updated = await this.userRepo.updateProfile(userId, data);
    return this.toOwnProfile(updated);
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    await this.sessionRepo.revokeAllSessionsByUserId(userId);
    // Hard delete vì user tự xoá tài khoản của mình
    await this.userRepo.delete(userId, false);

    this.notifier
      .sendAccountDeletedNotification({ email: user.email, name: user.name ?? user.email })
      .catch(console.error);

    return { message: "Account deleted successfully" };
  }

  async changePassword(userId: string, data: ChangePasswordDTO): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    // Social login users không có password
    if (!user.password) throw ErrPasswordUnchangeable;

    const isValid = await this.hasher.compare(data.currentPassword, user.password);
    if (!isValid) throw ErrPasswordInvalid;

    const newHash = await this.hasher.hash(data.newPassword);
    await this.userRepo.updatePassword(userId, newHash);
    await this.sessionRepo.revokeAllSessionsByUserId(userId);

    this.notifier
      .sendPasswordChangeConfirmation({ email: user.email, name: user.name ?? user.email })
      .catch(console.error);

    return { message: "Password changed successfully" };
  }

  async getSessions(userId: string, query?: GetSessionsQueryDTO): Promise<SessionListResponse> {
    const sessions = await this.sessionRepo.findByUserId(userId);
    // Ẩn refreshToken khỏi response
    const items = sessions.map(({ refreshToken, ...rest }) => rest);
    return { items, total: items.length, page: 1, limit: items.length, totalPages: 1 };
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw ErrSessionNotFound;

    // Security: chỉ được revoke session của chính mình
    if (session.userId !== userId) throw ErrSessionUnauthorized;

    await this.sessionRepo.revokeSession(sessionId);
    return { message: "Session revoked successfully" };
  }

  async revokeAllSessions(userId: string): Promise<{ message: string }> {
    const count = await this.sessionRepo.revokeAllSessionsByUserId(userId);
    return { message: `Revoked ${count} session(s)` };
  }

  async checkPassword(userId: string, password: string): Promise<boolean> {
    const oldPassword = await this.userRepo.checkPassword(userId);
    return this.hasher.compare(password, oldPassword);
  }

  async getBillingHistory(userId: string, query?: GetBillingQueryDTO) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              status: true,
              amount: true,
              paymentMethod: true,
              paymentGatewayRef: true,
              createdAt: true,
            },
          },
          tickets: {
            select: {
              purchasePrice: true,
              partnerAmount: true,
              platformFee: true,
            },
          },
        },
      }),
    ]);

    const items = orders.map((order) => {
      const ticketCount = order.tickets.length;
      const partnerAmount = order.tickets.reduce((sum, ticket) => sum + ticket.partnerAmount, 0);
      const platformFee = order.tickets.reduce((sum, ticket) => sum + ticket.platformFee, 0);
      const description = order.couponCode
        ? `Đơn hàng ${order.id} - mã khuyến mãi ${order.couponCode}`
        : `Đơn hàng ${order.id}`;

      return {
        orderId: order.id,
        date: order.createdAt,
        description,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        couponCode: order.couponCode,
        status: this.mapOrderStatus(order.status),
        transactionCount: order.transactions.length,
        ticketCount,
        partnerAmount,
        platformFee,
        transactions: order.transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
          paymentGatewayRef: transaction.paymentGatewayRef,
          createdAt: transaction.createdAt,
        })),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getWatchHistory(userId: string, query?: GetBillingQueryDTO): Promise<TicketListResult> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = { userId, status: "USED" as const };

    const [total, tickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        orderBy: { purchasedAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          showtime: {
            include: {
              movie: {
                select: {
                  id: true,
                  title: true,
                  posterUrl: true,
                  genre: true,
                  duration: true,
                  rating: true,
                  language: true,
                },
              },
              partner: {
                select: { cinemaName: true, city: true, address: true, phone: true },
              },
            },
          },
          seat: {
            select: { seatNumber: true, rowLabel: true, columnNumber: true, seatType: true },
          },
          checkIn: {
            select: { scannedAt: true, scannedBy: true },
          },
        },
      }),
    ]);

    return {
      items: tickets as unknown as any,
      total,
      page,
      limit,
    };
  }

  async getReviews(userId: string, query?: GetBillingQueryDTO): Promise<UserReviewListResponse> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where: { userId } }),
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          movie: { select: { id: true, title: true, posterUrl: true } },
        },
      }),
    ]);

    return {
      items: reviews.map((review) => ({
        id: review.id,
        score: review.score,
        content: review.content,
        status: review.status,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        movie: {
          id: review.movie.id,
          title: review.movie.title,
          posterUrl: review.movie.posterUrl,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createReview(userId: string, data: CreateReviewDTO): Promise<UserReviewItem> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: data.movieId },
      select: { id: true, title: true, posterUrl: true },
    });

    if (!movie) {
      throw new Error("Movie not found");
    }

    const hasWatched = await this.prisma.ticket.findFirst({
      where: { userId, movieId: data.movieId, status: "USED" },
    });

    const review = await this.prisma.review.upsert({
      where: {
        movieId_userId: {
          movieId: data.movieId,
          userId,
        },
      },
      update: {
        score: data.score,
        content: data.content,
        verifiedPurchase: Boolean(hasWatched),
      },
      create: {
        movieId: data.movieId,
        userId,
        score: data.score,
        content: data.content,
        verifiedPurchase: Boolean(hasWatched),
      },
    });

    return {
      id: review.id,
      score: review.score,
      content: review.content,
      status: review.status,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      movie: {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
      },
    };
  }

  async getBillingSummary(userId: string) {
    const [
      orderTotals,
      paidTotals,
      refundedTotals,
      pendingTotals,
      transactionCount,
      refundTransactionCount,
      ticketTotals,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { userId },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { userId, status: "COMPLETED" },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { userId, status: "REFUNDED" },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          userId,
          status: {
            in: ["PENDING", "PAYMENT_PROCESSING", "REFUND_REQUESTED"],
          },
        },
        _sum: { finalAmount: true },
      }),
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.transaction.count({
        where: { userId, type: "REFUND", status: "COMPLETED" },
      }),
      this.prisma.ticket.aggregate({
        where: { userId },
        _sum: { partnerAmount: true, platformFee: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalOrders: orderTotals._count.id,
      totalAmount: orderTotals._sum.finalAmount ?? 0,
      totalPaidAmount: paidTotals._sum.finalAmount ?? 0,
      totalRefundedAmount: refundedTotals._sum.finalAmount ?? 0,
      totalPendingAmount: pendingTotals._sum.finalAmount ?? 0,
      totalTransactions: transactionCount,
      totalRefundTransactions: refundTransactionCount,
      totalTickets: ticketTotals._count.id,
      totalPartnerAmount: ticketTotals._sum.partnerAmount ?? 0,
      totalPlatformFee: ticketTotals._sum.platformFee ?? 0,
    };
  }

  private mapOrderStatus(status: string): "paid" | "pending" | "failed" {
    switch (status) {
      case "COMPLETED":
        return "paid";
      case "PENDING":
      case "PAYMENT_PROCESSING":
      case "REFUND_REQUESTED":
        return "pending";
      case "EXPIRED":
      case "CANCELLED":
      case "REFUNDED":
      default:
        return "failed";
    }
  }

  private toOwnProfile(user: any): OwnUserProfile {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      bio: user.bio,
      location: user.location,
      avatarColor: user.avatarColor,
      phone: user.phone,
      emailVerified: user.emailVerified,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      permissionsOverride: user.permissionsOverride,
      permissions: this.authorizationUseCase.resolvePermissions({
        role: user.role,
        permissionsOverride: user.permissionsOverride,
      }),
      provider: user.provider || "local",
    };
  }
}
