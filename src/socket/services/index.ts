import { pusher } from "@/socket/config";

// ── Channel Types ──────────────────────────────────────────────────────────────
export type PusherChannel =
  | "public-auth"
  | "public-notifications"
  | `private-user-${string}`
  | `presence-room-${string}`;

// ── Event Payload Map ──────────────────────────────────────────────────────────
export type PusherEventMap = {
  // Auth
  "auth.login": { userId: string; loginTime: string; socketUrl: string | null };

  // In-app notification (generic — all push notifications land here)
  "notification.new": {
    id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    createdAt: string;
  };

  // Order / Booking
  "order.updated": { orderId: string; status: string; updatedAt: string };
  "booking.confirmed": {
    bookingId: string;
    movieTitle: string;
    showtimeStart: string;
    seatNumbers: string[];
  };
  "booking.cancelled": { bookingId: string; reason?: string };

  // Partner — Withdrawal
  "partner.withdrawal.pending": {
    withdrawalId: string;
    amount: number;
    bankName: string;
  };
  "partner.withdrawal.completed": {
    withdrawalId: string;
    amount: number;
    reference: string;
  };
  "partner.withdrawal.failed": {
    withdrawalId: string;
    amount: number;
    reason: string;
  };

  // Partner — Movie
  "partner.movie.approved": { movieId: string; title: string };
  "partner.movie.rejected": { movieId: string; title: string; reason: string };

  // Showtime
  "showtime.cancelled": {
    showtimeId: string;
    movieTitle: string;
    startTime: string;
    refundedTickets: number;
  };

  // Seat
  "seat.released": { showtimeId: string; seatIds: string[] };

  // System / chat
  "system.message": { title: string; message: string; severity: "info" | "warning" | "error" };
  "chat.message": { senderId: string; content: string; sentAt: string };
};

export type PusherEvent = keyof PusherEventMap;

// ── PusherService ──────────────────────────────────────────────────────────────

export class PusherService {
  /**
   * Trigger a typed event on a single channel.
   * Silently skips (logs warn) if Pusher is not configured.
   */
  static async trigger<E extends PusherEvent>(
    channel: PusherChannel,
    event: E,
    data: PusherEventMap[E],
  ): Promise<void> {
    if (!pusher) {
      console.warn(`[Pusher] Skipping "${event}" on "${channel}" — not configured.`);
      return;
    }
    try {
      await pusher.trigger(channel, event, data);
    } catch (err) {
      // Push is best-effort — log but don't propagate
      console.error(`[Pusher] trigger "${event}" on "${channel}" failed:`, err);
    }
  }

  /**
   * Trigger the same event on multiple channels at once (batch).
   */
  static async triggerBatch<E extends PusherEvent>(
    channels: PusherChannel[],
    event: E,
    data: PusherEventMap[E],
  ): Promise<void> {
    if (!pusher || channels.length === 0) return;
    try {
      await pusher.triggerBatch(
        channels.map((channel) => ({ channel, name: event, data: data as object })),
      );
    } catch (err) {
      console.error(`[Pusher] triggerBatch "${event}" failed:`, err);
    }
  }

  /**
   * Convenience: push to a user's private channel.
   */
  static async pushToUser<E extends PusherEvent>(
    userId: string,
    event: E,
    data: PusherEventMap[E],
  ): Promise<void> {
    return PusherService.trigger(`private-user-${userId}`, event, data);
  }

  /**
   * Push to the public broadcast channel.
   */
  static async broadcast<E extends PusherEvent>(event: E, data: PusherEventMap[E]): Promise<void> {
    return PusherService.trigger("public-notifications", event, data);
  }
}
