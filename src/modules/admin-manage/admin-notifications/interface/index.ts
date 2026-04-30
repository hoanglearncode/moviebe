import type { BroadcastStatus, BroadcastType, BroadcastTarget, BroadcastChannel } from "@prisma/client";

export interface BroadcastCreatedBy {
  id: string;
  name: string | null;
  email: string;
}

export interface BroadcastItem {
  id: string;
  title: string;
  content: string;
  type: BroadcastType;
  target: BroadcastTarget;
  channel: BroadcastChannel;
  status: BroadcastStatus;
  imageUrls: string[];
  totalSent: number;
  readCount: number;
  sentAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy: BroadcastCreatedBy | null;
}

export interface ListResult {
  items: BroadcastItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IBroadcastRepository {
  findMany(params: {
    skip: number;
    take: number;
    where: { status?: BroadcastStatus; type?: BroadcastType };
  }): Promise<[number, BroadcastItem[]]>;

  create(data: {
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
  }): Promise<BroadcastItem>;

  findById(id: string): Promise<BroadcastItem | null>;

  delete(id: string): Promise<void>;

  /** Live read-count from user Notification table — used to backfill stale readCount=0 records. */
  computeReadCount(broadcastId: string): Promise<number>;

  /** Cascade-delete all user Notifications that originated from this broadcast. */
  deleteUserNotifications(broadcastId: string): Promise<number>;
}
