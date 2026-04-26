"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPusherSocketUrl = exports.pusher = exports.isPusherConfigured = void 0;
const pusher_1 = __importDefault(require("pusher"));
const value_1 = require("../../share/common/value");
const requiredEnvs = ["PUSHER_APP_ID", "PUSHER_KEY", "PUSHER_SECRET", "PUSHER_CLUSTER"];
exports.isPusherConfigured = requiredEnvs.every((key) => Boolean(value_1.ENV[key]));
exports.pusher = exports.isPusherConfigured
    ? new pusher_1.default({
        appId: value_1.ENV.PUSHER_APP_ID,
        key: value_1.ENV.PUSHER_KEY,
        secret: value_1.ENV.PUSHER_SECRET,
        cluster: value_1.ENV.PUSHER_CLUSTER,
        useTLS: true,
    })
    : null;
const getPusherSocketUrl = () => {
    if (!value_1.ENV.PUSHER_KEY || !value_1.ENV.PUSHER_CLUSTER) {
        return null;
    }
    return `wss://ws-${value_1.ENV.PUSHER_CLUSTER}.pusher.com/app/${value_1.ENV.PUSHER_KEY}`;
};
exports.getPusherSocketUrl = getPusherSocketUrl;
