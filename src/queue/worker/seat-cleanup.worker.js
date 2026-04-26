"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeSeatCleanupWorker = exports.startSeatCleanupWorker = void 0;
const bullmq_1 = require("bullmq");
const prisma_1 = require("../../share/component/prisma");
const logger_1 = require("../../modules/system/log/logger");
const config_1 = require("../config/config");
const QUEUE_NAME = `${config_1.queuePrefix}-seat-cleanup`;
let seatCleanupQueue = null;
let seatCleanupWorker = null;
const processSeatCleanup = async () => {
    const now = new Date();
    try {
        // Find expired seat locks
        const expiredSeats = await prisma_1.prisma.seat.findMany({
            where: {
                status: "LOCKED",
                lockedUntil: { lt: now },
            },
            select: { id: true, lockedBy: true },
        });
        if (expiredSeats.length === 0)
            return;
        const seatIds = expiredSeats.map((s) => s.id);
        // Release expired seats
        await prisma_1.prisma.seat.updateMany({
            where: { id: { in: seatIds } },
            data: { status: "AVAILABLE", lockedUntil: null, lockedBy: null },
        });
        // Cancel RESERVED tickets linked to expired seats
        await prisma_1.prisma.ticket.updateMany({
            where: {
                seatId: { in: seatIds },
                status: "RESERVED",
            },
            data: { status: "CANCELLED", cancelledAt: now },
        });
        // Expire PENDING orders that have passed expiresAt
        await prisma_1.prisma.order.updateMany({
            where: {
                status: "PENDING",
                expiresAt: { lt: now },
            },
            data: { status: "EXPIRED" },
        });
        logger_1.logger.info("[SeatCleanup] Released expired locks", {
            releasedSeats: seatIds.length,
            timestamp: now.toISOString(),
        });
    }
    catch (err) {
        logger_1.logger.error("[SeatCleanup] Error", { error: err.message });
        throw err;
    }
};
const startSeatCleanupWorker = () => {
    if (!config_1.areQueueWorkersEnabled)
        return;
    // Create queue with repeatable job
    seatCleanupQueue = new bullmq_1.Queue(QUEUE_NAME, { connection: config_1.queueConnectionOptions });
    // Add repeatable job: run every 60 seconds
    seatCleanupQueue
        .add("cleanup", {}, { repeat: { every: 60000 }, removeOnComplete: 10, removeOnFail: 5 })
        .catch((err) => logger_1.logger.error("[SeatCleanup] Failed to schedule repeatable job", { error: err.message }));
    // Start worker
    seatCleanupWorker = new bullmq_1.Worker(QUEUE_NAME, async (_job) => {
        await processSeatCleanup();
    }, { connection: config_1.queueConnectionOptions, concurrency: 1 });
    seatCleanupWorker.on("completed", () => {
        logger_1.logger.debug("[SeatCleanup] Job completed");
    });
    seatCleanupWorker.on("failed", (_job, err) => {
        logger_1.logger.error("[SeatCleanup] Job failed", { error: err.message });
    });
    logger_1.logger.info("[SeatCleanup] Worker started — runs every 60s");
};
exports.startSeatCleanupWorker = startSeatCleanupWorker;
const closeSeatCleanupWorker = async () => {
    await seatCleanupWorker?.close();
    await seatCleanupQueue?.close();
};
exports.closeSeatCleanupWorker = closeSeatCleanupWorker;
