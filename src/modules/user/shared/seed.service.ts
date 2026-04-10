/**
 * Seed Service - Xử lý logic bulk create users
 * Tạo nhiều users cùng lúc trong database
 */

import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { SeedGenerator } from "../../../share/common/seed-generator";
import { HashService } from "../../auth/shared/hash";

export interface SeedProgressCallback {
  onProgress?: (created: number, total: number, percentage: number) => void;
  onError?: (error: string) => void;
  onComplete?: (summary: SeedSummary) => void;
}

export interface SeedSummary {
  totalRequested: number;
  totalCreated: number;
  totalFailed: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface SeedOptions {
  count: number; // Số users cần tạo
  batchSize?: number; // Kích thước mỗi batch (default: 100)
  includePhone?: boolean; // Có sinh phone không (default: true)
  includeBio?: boolean; // Có sinh bio không (default: true)
  includeLocation?: boolean; // Có sinh location không (default: true)
  defaultRole?: "USER" | "ADMIN" | "PARTNER"; // Role mặc định (default: USER)
  defaultStatus?: "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING"; // Status mặc định (default: ACTIVE)
}

export class SeedService {
  private readonly prisma: PrismaClient;
  private readonly hasher: HashService;

  constructor(prisma: PrismaClient, hasher: HashService) {
    this.prisma = prisma;
    this.hasher = hasher;
  }

  /**
   * Tạo bulk users với progress tracking
   */
  async seedUsers(
    options: SeedOptions,
    progressCallback?: SeedProgressCallback
  ): Promise<SeedSummary> {
    const startTime = new Date();
    const batchSize = options.batchSize || 100;
    const errors: string[] = [];
    let totalCreated = 0;
    let totalFailed = 0;

    const defaultRole = (options.defaultRole || "USER") as Role;
    const defaultStatus =
      (options.defaultStatus || "ACTIVE") as UserStatus;

    try {
      const totalBatches = Math.ceil(options.count / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const startIndex = batch * batchSize;
        const currentBatchSize = Math.min(
          batchSize,
          options.count - startIndex
        );

        try {
          const users = SeedGenerator.generateUserBatch(
            currentBatchSize,
            startIndex
          );

          // Hash passwords trước khi insert
          const now = new Date();
          const usersWithHashedPassword = await Promise.all(
            users.map(async (user) => ({
              id: crypto.randomUUID(),
              email: user.email,
              username: user.username,
              name: user.name,
              password: await this.hasher.hash(user.password),
              phone: user.phone || null,
              bio: user.bio || null,
              location: user.location || null,
              avatar: null,
              avatarColor: null,
              role: defaultRole,
              status: defaultStatus,
              provider: "local",
              emailVerified: false,
              mustChangePassword: false,
              lastLoginAt: null,
              createdAt: now,
              updatedAt: now,
            }))
          );

          // Insert batch vào database
          try {
            await this.prisma.user.createMany({
              data: usersWithHashedPassword,
              skipDuplicates: true, // Bỏ qua nếu email/username bị trùng
            });

            totalCreated += currentBatchSize;

            // Gọi callback progress
            const progress = Math.round(
              ((batch + 1) / totalBatches) * 100
            );
            progressCallback?.onProgress?.(
              totalCreated,
              options.count,
              progress
            );
          } catch (batchError) {
            const errorMsg = `Batch ${batch + 1} failed: ${
              batchError instanceof Error
                ? batchError.message
                : String(batchError)
            }`;
            errors.push(errorMsg);
            totalFailed += currentBatchSize;
            progressCallback?.onError?.(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Error generating batch ${batch + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          errors.push(errorMsg);
          totalFailed += currentBatchSize;
          progressCallback?.onError?.(errorMsg);
        }
      }

      // Tạo UserSettings cho mỗi user
      try {
        const users = await this.prisma.user.findMany({
          select: { id: true },
          orderBy: { createdAt: "desc" },
          take: totalCreated,
        });

        const now = new Date();
        await this.prisma.userSetting.createMany({
          data: users.map((user) => ({
            id: crypto.randomUUID(),
            userId: user.id,
            notifications: true,
            marketingEmails: false,
            pushNotifications: true,
            smsNotifications: false,
            autoplay: true,
            autoQuality: true,
            alwaysSubtitle: false,
            autoPreviews: true,
            publicWatchlist: false,
            shareHistory: false,
            personalizedRecs: true,
            referralCode: null,
            referrals: 0,
            createdAt: now,
            updatedAt: now,
          })),
          skipDuplicates: true,
        });
      } catch (error) {
        const errorMsg = `Error creating user settings: ${
          error instanceof Error ? error.message : String(error)
        }`;
        errors.push(errorMsg);
        progressCallback?.onError?.(errorMsg);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      progressCallback?.onError?.(errorMsg);
    }

    const endTime = new Date();
    const summary: SeedSummary = {
      totalRequested: options.count,
      totalCreated,
      totalFailed,
      errors,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
    };

    progressCallback?.onComplete?.(summary);

    return summary;
  }

  /**
   * Xóa tất cả seed users (để testing/reset)
   */
  async clearSeedUsers(): Promise<{ deletedCount: number }> {
    // Xóa users có email từ seed-generator domain
    const result = await this.prisma.user.deleteMany({
      where: {
        email: {
          endsWith: "@seeduser.local",
        },
      },
    });

    return { deletedCount: result.count };
  }

  /**
   * Get seed statistics
   */
  async getSeedStatistics(): Promise<{
    totalSeedUsers: number;
    roles: Record<string, number>;
    statuses: Record<string, number>;
  }> {
    const seedUsers = await this.prisma.user.findMany({
      where: {
        email: {
          endsWith: "@seeduser.local",
        },
      },
      select: { role: true, status: true },
    });

    const roles: Record<string, number> = {};
    const statuses: Record<string, number> = {};

    seedUsers.forEach((user) => {
      roles[user.role] = (roles[user.role] || 0) + 1;
      statuses[user.status] = (statuses[user.status] || 0) + 1;
    });

    return {
      totalSeedUsers: seedUsers.length,
      roles,
      statuses,
    };
  }
}
