"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRealtimeService = void 0;
const config_1 = require("../../../socket/config");
const services_1 = require("../../../socket/services");
class AuthRealtimeService {
    async emitLoginEvent(userId) {
        const event = {
            channel: `private-user-${userId}`,
            name: "auth.login",
            payload: {
                userId,
                loginTime: new Date().toISOString(),
                socketUrl: (0, config_1.getPusherSocketUrl)(),
            },
        };
        await services_1.PusherService.trigger(event.channel, event.name, event.payload);
        return event;
    }
}
exports.AuthRealtimeService = AuthRealtimeService;
