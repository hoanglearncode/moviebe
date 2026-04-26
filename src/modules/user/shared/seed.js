"use strict";
/**
 * Seed Service - Xử lý logic bulk create users
 * Tạo nhiều users cùng lúc trong database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const seed_generator_1 = require("../../../share/common/seed-generator");
const seed_setting_1 = require("../../../share/common/seed-setting");
class SeedService {
    constructor(prisma, hasher) {
        this.prisma = prisma;
        this.hasher = hasher;
    }
    /**
     * Tạo bulk users với progress tracking
     */
    async seedUsers(options, progressCallback) {
        const startTime = new Date();
        const batchSize = options.batchSize || 100;
        const errors = [];
        let totalCreated = 0;
        let totalFailed = 0;
        const defaultRole = (options.defaultRole || "USER");
        const defaultStatus = (options.defaultStatus || "ACTIVE");
        try {
            const totalBatches = Math.ceil(options.count / batchSize);
            for (let batch = 0; batch < totalBatches; batch++) {
                const startIndex = batch * batchSize;
                const currentBatchSize = Math.min(batchSize, options.count - startIndex);
                try {
                    const users = seed_generator_1.SeedGenerator.generateUserBatch(currentBatchSize, startIndex);
                    // Hash passwords trước khi insert
                    const now = new Date();
                    const usersWithHashedPassword = await Promise.all(users.map(async (user) => ({
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
                    })));
                    // Insert batch vào database
                    try {
                        await this.prisma.user.createMany({
                            data: usersWithHashedPassword,
                            skipDuplicates: true,
                        });
                        await this.prisma.userSetting.createMany({
                            data: usersWithHashedPassword.map((user) => ({
                                id: crypto.randomUUID(),
                                userId: user.id,
                                ...seed_setting_1.defaultSettings,
                                createdAt: now,
                                updatedAt: now,
                            })),
                            skipDuplicates: true,
                        });
                        totalCreated += currentBatchSize;
                        // Gọi callback progress
                        const progress = Math.round(((batch + 1) / totalBatches) * 100);
                        progressCallback?.onProgress?.(totalCreated, options.count, progress);
                    }
                    catch (batchError) {
                        const errorMsg = `Batch ${batch + 1} failed: ${batchError instanceof Error ? batchError.message : String(batchError)}`;
                        errors.push(errorMsg);
                        totalFailed += currentBatchSize;
                        progressCallback?.onError?.(errorMsg);
                    }
                }
                catch (error) {
                    const errorMsg = `Error generating batch ${batch + 1}: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    totalFailed += currentBatchSize;
                    progressCallback?.onError?.(errorMsg);
                }
            }
            // Tạo UserSettings cho mỗi user
            // User settings are created together with each user batch above.
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(errorMsg);
            progressCallback?.onError?.(errorMsg);
        }
        const endTime = new Date();
        const summary = {
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
    async clearSeedUsers() {
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
    async getSeedStatistics() {
        const seedUsers = await this.prisma.user.findMany({
            where: {
                email: {
                    endsWith: "@seeduser.local",
                },
            },
            select: { role: true, status: true },
        });
        const roles = {};
        const statuses = {};
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
exports.SeedService = SeedService;
