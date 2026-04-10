"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../modules/system/log/logger");
const index_1 = require("./index");
const shutdown = async (signal) => {
    logger_1.logger.info(`Queue worker received ${signal}`);
    await (0, index_1.shutdownQueueInfrastructure)();
    process.exit(0);
};
(async () => {
    await (0, index_1.initializeQueueInfrastructure)();
    logger_1.logger.info("Queue worker started");
})();
process.on("SIGINT", () => {
    void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});
