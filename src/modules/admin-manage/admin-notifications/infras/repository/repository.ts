import {
  PrismaClient,
  BroadcastStatus,
  BroadcastType,
  BroadcastTarget,
  BroadcastChannel,
} from "@prisma/client";
import type { IBroadcastRepository, BroadcastItem } from "@/modules/admin-manage/admin-notifications/interface";

const CREATED_BY_SELECT = { select: { id: true, name: true, email: true } };

export class PrismaBroadcastRepository implements IBroadcastRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(params: {
    skip: number;
    take: number;
    where: { status?: BroadcastStatus; type?: BroadcastType };
  }): Promise<[number, BroadcastItem[]]> {
    const [total, items] = await Promise.all([
      this.prisma.broadcastNotification.count({ where: params.where }),
      this.prisma.broadcastNotification.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: { createdBy: CREATED_BY_SELECT },
      }),
    ]);
    return [total, items as BroadcastItem[]];
  }

  async create(data: {
    title: string;
    content: string;
    type: BroadcastType;
    target: BroadcastTarget;
    channel: BroadcastChannel;
    imageUrls: string[];
    status: BroadcastStatus;
    scheduledAt?: Date;
    sentAt?: Date;
    totalSent: number;
    readCount: number;
    createdById: string;
  }): Promise<BroadcastItem> {
    const record = await this.prisma.broadcastNotification.create({
      data,
      include: { createdBy: CREATED_BY_SELECT },
    });
    return record as BroadcastItem;
  }

  async findById(id: string): Promise<BroadcastItem | null> {
    const record = await this.prisma.broadcastNotification.findUnique({
      where: { id },
      include: { createdBy: CREATED_BY_SELECT },
    });
    return record as BroadcastItem | null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.broadcastNotification.delete({ where: { id } });
  }

  async computeReadCount(broadcastId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { data: { path: ["broadcastId"], equals: broadcastId }, isRead: true },
    });
  }

  async deleteUserNotifications(broadcastId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { data: { path: ["broadcastId"], equals: broadcastId } },
    });
    return result.count;
  }
}
