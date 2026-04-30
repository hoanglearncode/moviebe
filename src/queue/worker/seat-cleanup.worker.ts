import { Queue, Worker, QueueEvents } from "bullmq";
import { prisma } from "@/share/component/prisma";
import { logger } from "@/modules/system/log/logger";
import { queueConnectionOptions, queuePrefix, areQueueWorkersEnabled } from "@/queue/config/config";

const QUEUE_NAME = `${queuePrefix}-seat-cleanup`;

let seatCleanupQueue: Queue | null = null;
let seatCleanupWorker: Worker | null = null;

const processSeatCleanup = async (): Promise<void> => {
  const now = new Date();

  try {
    // Find expired seat locks
    const expiredSeats = await prisma.seat.findMany({
      where: {
        status: "LOCKED",
        lockedUntil: { lt: now },
      },
      select: { id: true, lockedBy: true },
    });

    if (expiredSeats.length === 0) return;

    const seatIds = expiredSeats.map((s) => s.id);

    // Release expired seats
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: "AVAILABLE", lockedUntil: null, lockedBy: null },
    });

    // Cancel RESERVED tickets linked to expired seats
    await (prisma.ticket as any).updateMany({
      where: {
        seatId: { in: seatIds },
        status: "RESERVED",
      },
      data: { status: "CANCELLED", cancelledAt: now },
    });

    // Expire PENDING orders that have passed expiresAt
    await (prisma.order as any).updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    logger.info("[SeatCleanup] Released expired locks", {
      releasedSeats: seatIds.length,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    logger.error("[SeatCleanup] Error", { error: err.message });
    throw err;
  }
};

export const startSeatCleanupWorker = (): void => {
  if (!areQueueWorkersEnabled) return;

  // Create queue with repeatable job
  seatCleanupQueue = new Queue(QUEUE_NAME, { connection: queueConnectionOptions });

  // Add repeatable job: run every 60 seconds
  seatCleanupQueue
    .add("cleanup", {}, { repeat: { every: 60_000 }, removeOnComplete: 10, removeOnFail: 5 })
    .catch((err) =>
      logger.error("[SeatCleanup] Failed to schedule repeatable job", { error: err.message }),
    );

  // Start worker
  seatCleanupWorker = new Worker(
    QUEUE_NAME,
    async (_job) => {
      await processSeatCleanup();
    },
    { connection: queueConnectionOptions, concurrency: 1 },
  );

  seatCleanupWorker.on("completed", () => {
    logger.debug("[SeatCleanup] Job completed");
  });

  seatCleanupWorker.on("failed", (_job, err) => {
    logger.error("[SeatCleanup] Job failed", { error: err.message });
  });

  logger.info("[SeatCleanup] Worker started — runs every 60s");
};

export const closeSeatCleanupWorker = async (): Promise<void> => {
  await seatCleanupWorker?.close();
  await seatCleanupQueue?.close();
};
