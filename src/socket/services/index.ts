import { pusher } from "../config";

export type PusherChannel =
  | "public-auth"
  | `private-user-${string}`
  | `presence-room-${string}`
  | "public-notifications";

export type PusherEventMap = {
  "auth.login": { userId: string; loginTime: string; socketUrl: string | null };
  "order.updated": { orderId: string; status: string; updatedAt: string };
  "notification.new": { title: string; message: string; type: "info" | "warning" | "error" };
  "chat.message": { senderId: string; content: string; sentAt: string };
};

export type PusherEvent = keyof PusherEventMap;

export class PusherService {
  static async trigger<E extends PusherEvent>(
    channel: PusherChannel,
    event: E,
    data: PusherEventMap[E],
  ): Promise<void> {
    try {
      if (!pusher) {
        console.warn(
          `[Pusher] Skipping "${event}" on "${channel}" because realtime is not configured.`,
        );
        return;
      }

      await pusher.trigger(channel, event, data);
    } catch (error) {
      console.error(`[Pusher] Failed to trigger "${event}" on "${channel}":`, error);
      throw new Error(`Pusher trigger failed: ${(error as Error).message}`);
    }
  }

  static async triggerBatch<E extends PusherEvent>(
    channels: PusherChannel[],
    event: E,
    data: PusherEventMap[E],
  ): Promise<void> {
    try {
      if (!pusher) {
        console.warn(`[Pusher] Skipping batch "${event}" because realtime is not configured.`);
        return;
      }

      await pusher.triggerBatch(channels.map((channel) => ({ channel, name: event, data })));
    } catch (error) {
      console.error(`[Pusher] Batch trigger failed:`, error);
      throw error;
    }
  }
}
