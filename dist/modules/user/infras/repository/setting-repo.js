"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSettingRepository = exports.PrismaUserSettingsRepository = void 0;
const dto_1 = require("./dto");
const DEFAULT_SETTINGS = {
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
};
function toUserSettings(raw) {
    return {
        id: raw.id,
        userId: raw.userId,
        notifications: raw.notifications ?? true,
        marketingEmails: raw.marketingEmails ?? false,
        pushNotifications: raw.pushNotifications ?? true,
        smsNotifications: raw.smsNotifications ?? false,
        autoplay: raw.autoplay ?? true,
        autoQuality: raw.autoQuality ?? true,
        alwaysSubtitle: raw.alwaysSubtitle ?? false,
        autoPreviews: raw.autoPreviews ?? true,
        publicWatchlist: raw.publicWatchlist ?? false,
        shareHistory: raw.shareHistory ?? false,
        personalizedRecs: raw.personalizedRecs ?? true,
        referralCode: raw.referralCode ?? null,
        referrals: raw.referrals ?? 0,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
}
class PrismaUserSettingsRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getUserSettingModel)(prisma);
    }
    // ── IQueryRepository ──
    async get(id) {
        const raw = await this.model.findUnique({ where: { id } });
        return raw ? toUserSettings(raw) : null;
    }
    /**
     * findByCond — tìm settings theo điều kiện
     * Thường dùng với { userId: "..." }
     */
    async findByCond(cond) {
        const raw = await this.model.findFirst({ where: cond });
        return raw ? toUserSettings(raw) : null;
    }
    async list(cond, paging) {
        const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
        const rows = await this.model.findMany({
            where: cond,
            skip,
            take: paging.limit ?? 20,
        });
        return rows.map(toUserSettings);
    }
    // ── ICommandRepository ──
    async insert(data) {
        await this.model.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.model.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, isHard) {
        if (isHard) {
            await this.model.delete({ where: { id } });
        }
        else {
            // Settings không có soft delete thực sự — reset về default
            await this.model.update({ where: { id }, data: DEFAULT_SETTINGS });
        }
        return true;
    }
    // ── Domain-specific ──
    async findByUserId(userId) {
        const raw = await this.model.findUnique({ where: { userId } });
        return raw ? toUserSettings(raw) : null;
    }
    /**
     * upsertByUserId — tạo mới nếu chưa có, cập nhật nếu đã có
     * Pattern "lazy initialization": settings chỉ được tạo khi cần
     */
    async upsertByUserId(userId, data) {
        const raw = await this.model.upsert({
            where: { userId },
            update: {
                ...(data.notifications !== undefined && { notifications: data.notifications }),
                ...(data.marketingEmails !== undefined && { marketingEmails: data.marketingEmails }),
                ...(data.pushNotifications !== undefined && { pushNotifications: data.pushNotifications }),
                ...(data.smsNotifications !== undefined && { smsNotifications: data.smsNotifications }),
                ...(data.autoplay !== undefined && { autoplay: data.autoplay }),
                ...(data.autoQuality !== undefined && { autoQuality: data.autoQuality }),
                ...(data.alwaysSubtitle !== undefined && { alwaysSubtitle: data.alwaysSubtitle }),
                ...(data.autoPreviews !== undefined && { autoPreviews: data.autoPreviews }),
                ...(data.publicWatchlist !== undefined && { publicWatchlist: data.publicWatchlist }),
                ...(data.shareHistory !== undefined && { shareHistory: data.shareHistory }),
                ...(data.personalizedRecs !== undefined && { personalizedRecs: data.personalizedRecs }),
            },
            create: {
                userId,
                ...DEFAULT_SETTINGS,
                ...data,
            },
        });
        return toUserSettings(raw);
    }
}
exports.PrismaUserSettingsRepository = PrismaUserSettingsRepository;
const createUserSettingRepository = (prisma) => new PrismaUserSettingsRepository(prisma);
exports.createUserSettingRepository = createUserSettingRepository;
