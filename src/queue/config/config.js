"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisConnection = exports.defaultJobOptions = exports.queuePrefix = exports.queueConnectionOptions = exports.areQueueWorkersEnabled = exports.isQueueEnabled = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const value_1 = require("../../share/common/value");
const parseQueueBoolean = (value) => value === "true";
exports.isQueueEnabled = parseQueueBoolean(process.env.QUEUE_ENABLED);
exports.areQueueWorkersEnabled = parseQueueBoolean(process.env.QUEUE_WORKERS_ENABLED);
exports.queueConnectionOptions = {
    host: value_1.ENV.REDIS_HOST,
    port: value_1.ENV.REDIS_PORT,
    username: value_1.ENV.REDIS_USERNAME,
    password: value_1.ENV.REDIS_PASSWORD,
    db: value_1.ENV.REDIS_DB,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};
exports.queuePrefix = value_1.ENV.QUEUE_PREFIX;
exports.defaultJobOptions = {
    attempts: value_1.ENV.QUEUE_JOB_ATTEMPTS,
    backoff: {
        type: "exponential",
        delay: value_1.ENV.QUEUE_JOB_BACKOFF_MS,
    },
    removeOnComplete: value_1.ENV.QUEUE_REMOVE_ON_COMPLETE_COUNT,
    removeOnFail: value_1.ENV.QUEUE_REMOVE_ON_FAIL_COUNT,
};
const createRedisConnection = () => new ioredis_1.default(exports.queueConnectionOptions);
exports.createRedisConnection = createRedisConnection;
