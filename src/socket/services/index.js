"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherService = void 0;
const config_1 = require("../config");
// ── PusherService ──────────────────────────────────────────────────────────────
class PusherService {
    /**
     * Trigger a typed event on a single channel.
     * Silently skips (logs warn) if Pusher is not configured.
     */
    static async trigger(channel, event, data) {
        if (!config_1.pusher) {
            console.warn(`[Pusher] Skipping "${event}" on "${channel}" — not configured.`);
            return;
        }
        try {
            await config_1.pusher.trigger(channel, event, data);
        }
        catch (err) {
            // Push is best-effort — log but don't propagate
            console.error(`[Pusher] trigger "${event}" on "${channel}" failed:`, err);
        }
    }
    /**
     * Trigger the same event on multiple channels at once (batch).
     */
    static async triggerBatch(channels, event, data) {
        if (!config_1.pusher || channels.length === 0)
            return;
        try {
            await config_1.pusher.triggerBatch(channels.map((channel) => ({ channel, name: event, data: data })));
        }
        catch (err) {
            console.error(`[Pusher] triggerBatch "${event}" failed:`, err);
        }
    }
    /**
     * Convenience: push to a user's private channel.
     */
    static async pushToUser(userId, event, data) {
        return PusherService.trigger(`private-user-${userId}`, event, data);
    }
    /**
     * Push to the public broadcast channel.
     */
    static async broadcast(event, data) {
        return PusherService.trigger("public-notifications", event, data);
    }
}
exports.PusherService = PusherService;
