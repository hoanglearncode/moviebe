"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pusherAuthRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const config_1 = require("../../socket/config");
const http_server_1 = require("./http-server");
const router = (0, express_1.Router)();
exports.pusherAuthRouter = router;
router.post("/pusher/auth", auth_1.authMiddleware, (req, res) => {
    if (!config_1.isPusherConfigured || !config_1.pusher) {
        return (0, http_server_1.errorResponse)(res, 503, "Pusher not configured");
    }
    const { socket_id, channel_name } = req.body;
    if (!socket_id || !channel_name) {
        return (0, http_server_1.errorResponse)(res, 400, "socket_id and channel_name are required");
    }
    const userId = req.user.id;
    const allowedChannel = `private-user-${userId}`;
    if (channel_name !== allowedChannel) {
        return (0, http_server_1.errorResponse)(res, 403, "Channel access denied");
    }
    try {
        const auth = config_1.pusher.authorizeChannel(socket_id, channel_name);
        res.json(auth);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Pusher auth failed";
        (0, http_server_1.errorResponse)(res, 500, message);
    }
});
