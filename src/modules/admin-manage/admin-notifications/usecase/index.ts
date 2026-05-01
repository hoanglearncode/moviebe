import {
  BroadcastStatus,
  BroadcastTarget,
  BroadcastType,
  BroadcastChannel,
  Role,
  UserStatus,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { logger } from "@/modules/system/log/logger";
import {
  enqueueBroadcastJob,
  enqueueBroadcastJobWithDelay,
} from "@/queue/config/broadcast.queue";
import { ValidationError, NotFoundError } from "@/share/transport/http-server";
import { CreateBroadcastSchema, ListBroadcastsSchema } from "@/modules/admin-manage/admin-notifications/model/dto";
import type { IBroadcastRepository, ListResult } from "@/modules/admin-manage/admin-notifications/interface";

// ─── Target → user segment mapping ───────────────────────────────────────────

/**
 * Returns Prisma `where` clause for the target segment.
 * VIP/PREMIUM/FREE require User.planSlug (not yet in schema) — falls back to USER role.
 * TODO(subscription): filter by plan slug once User.planSlug is migrated.
 */
function buildTargetWhere(target: BroadcastTarget) {
  const activeOnly = { status: UserStatus.ACTIVE };
  switch (target) {
    case BroadcastTarget.ALL:     return activeOnly;
    case BroadcastTarget.OWNERS:  return { ...activeOnly, role: Role.PARTNER };
    case BroadcastTarget.USERS:   return { ...activeOnly, role: Role.USER };
    case BroadcastTarget.VIP:
    case BroadcastTarget.PREMIUM:
    case BroadcastTarget.FREE:
      logger.warn("[BroadcastUseCase] Segment target has no subscription filter yet", { target });
      return { ...activeOnly, role: Role.USER };
    default:
      return { ...activeOnly, role: Role.USER };
  }
}

// ─── Use Case ─────────────────────────────────────────────────────────────────

export class BroadcastNotificationUseCase {
  constructor(
    private readonly repo: IBroadcastRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async list(rawQuery: unknown): Promise<ListResult> {
    const query = ListBroadcastsSchema.parse(rawQuery);
    const skip = (query.page - 1) * query.limit;
    const where: { status?: BroadcastStatus; type?: BroadcastType } = {};
    if (query.status) where.status = query.status as BroadcastStatus;
    if (query.type) where.type = query.type as BroadcastType;

    const [total, items] = await this.repo.findMany({ skip, take: query.limit, where });

    // Compute live readCount — backfills historical records stuck at 0
    const liveReadCounts = await Promise.all(
      items.map((n) =>
        this.repo.computeReadCount(n.id).then((count) => ({ id: n.id, count })),
      ),
    );
    const rcMap = new Map(liveReadCounts.map(({ id, count }) => [id, count]));

    return {
      items: items.map((n) => ({ ...n, readCount: rcMap.get(n.id) ?? n.readCount })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async create(rawBody: unknown, createdById: string) {
    const dto = CreateBroadcastSchema.safeParse(rawBody);
    if (!dto.success) throw new ValidationError(dto.error.issues[0].message);

    const { title, content, type, target, channel, imageUrls, scheduleMode, scheduledAt } =
      dto.data;

    if (scheduleMode === "later" && !scheduledAt) {
      throw new ValidationError("scheduledAt is required when scheduleMode is later");
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledDate!.getTime())) {
      throw new ValidationError("scheduledAt is invalid");
    }

    const isScheduled = scheduleMode === "later" && !!scheduledDate;
    const status: BroadcastStatus = isScheduled ? BroadcastStatus.SCHEDULED : BroadcastStatus.SENT;
    const sentAt = isScheduled ? undefined : new Date();

    const totalSent = isScheduled
      ? 0
      : await this.prisma.user.count({ where: buildTargetWhere(target as BroadcastTarget) });

    const broadcast = await this.repo.create({
      title,
      content,
      type: type as BroadcastType,
      target: target as BroadcastTarget,
      channel: channel as BroadcastChannel,
      imageUrls: (imageUrls ?? []).slice(0, 5),
      status,
      scheduledAt: isScheduled ? scheduledDate! : undefined,
      sentAt,
      totalSent,
      readCount: 0,
      createdById,
    });

    const jobPayload = {
      broadcastId: broadcast.id,
      target,
      channel,
      title,
      message: content,
      imageUrls: broadcast.imageUrls,
      broadcastType: type,
      traceId: randomUUID(),
    };

    const enqueueTask = async () => {
      if (!isScheduled) {
        await enqueueBroadcastJob(jobPayload);
        return;
      }

      const delayMs = Math.max(0, scheduledDate!.getTime() - Date.now());
      await enqueueBroadcastJobWithDelay(jobPayload, delayMs);
    };

    await enqueueTask().catch((err: Error) => {
      logger.warn("[BroadcastUseCase] Failed to enqueue delivery", {
        broadcastId: broadcast.id,
        status,
        scheduledAt: scheduledDate?.toISOString(),
        error: err.message,
      });
    });

    return broadcast;
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Broadcast notification");

    // Cascade: remove user notifications originating from this broadcast
    const deletedCount = await this.repo.deleteUserNotifications(id);
    await this.repo.delete(id);

    logger.info("[BroadcastUseCase] Deleted broadcast + derived notifications", {
      broadcastId: id,
      deletedUserNotifications: deletedCount,
    });

    return existing;
  }
}
