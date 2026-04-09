"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherService = void 0;
const config_1 = require("../config");
class PusherService {
    static async trigger(channel, event, data) {
        try {
            if (!config_1.pusher) {
                console.warn(`[Pusher] Skipping "${event}" on "${channel}" because realtime is not configured.`);
                return;
            }
            await config_1.pusher.trigger(channel, event, data);
        }
        catch (error) {
            console.error(`[Pusher] Failed to trigger "${event}" on "${channel}":`, error);
            throw new Error(`Pusher trigger failed: ${error.message}`);
        }
    }
    static async triggerBatch(channels, event, data) {
        try {
            if (!config_1.pusher) {
                console.warn(`[Pusher] Skipping batch "${event}" because realtime is not configured.`);
                return;
            }
            await config_1.pusher.triggerBatch(channels.map((channel) => ({ channel, name: event, data })));
        }
        catch (error) {
            console.error(`[Pusher] Batch trigger failed:`, error);
            throw error;
        }
    }
}
exports.PusherService = PusherService;
