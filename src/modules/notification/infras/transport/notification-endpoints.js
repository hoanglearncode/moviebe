"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../../../share/middleware/auth");
const http_server_1 = require("../../../../share/transport/http-server");
const push_notification_1 = require("../../usecase/push-notification");
const router = (0, express_1.Router)();
const guard = [auth_1.authMiddleware, auth_1.requireActiveUser];
/**
 * GET /v1/notifications
 * List authenticated user's notifications (paginated).
 *
 * Query: page, limit, onlyUnread=true|false
 */
router.get("/", ...guard, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const onlyUnread = req.query.onlyUnread === "true";
        const result = await push_notification_1.pushNotificationService.list(userId, { page, limit, onlyUnread });
        (0, http_server_1.successResponse)(res, result);
    }
    catch (err) {
        (0, http_server_1.errorResponse)(res, 500, err.message);
    }
});
/**
 * GET /v1/notifications/unread-count
 * Lightweight unread badge count — suitable for frequent polling.
 */
router.get("/unread-count", ...guard, async (req, res) => {
    try {
        const result = await push_notification_1.pushNotificationService.unreadCount(req.user.id);
        (0, http_server_1.successResponse)(res, result);
    }
    catch (err) {
        (0, http_server_1.errorResponse)(res, 500, err.message);
    }
});
/**
 * PUT /v1/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
router.put("/read-all", ...guard, async (req, res) => {
    try {
        const result = await push_notification_1.pushNotificationService.markAllRead(req.user.id);
        (0, http_server_1.successResponse)(res, result, `${result.updated} notification(s) marked as read`);
    }
    catch (err) {
        (0, http_server_1.errorResponse)(res, 500, err.message);
    }
});
/**
 * PUT /v1/notifications/:id/read
 * Mark a single notification as read.
 */
router.put("/:id/read", ...guard, async (req, res) => {
    try {
        await push_notification_1.pushNotificationService.markRead(String(req.params.id), req.user.id);
        (0, http_server_1.successResponse)(res, null, "Notification marked as read");
    }
    catch (err) {
        (0, http_server_1.errorResponse)(res, 500, err.message);
    }
});
/**
 * DELETE /v1/notifications/:id
 * Delete a single notification (owner only).
 */
router.delete("/:id", ...guard, async (req, res) => {
    try {
        await push_notification_1.pushNotificationService.delete(String(req.params.id), req.user.id);
        (0, http_server_1.successResponse)(res, null, "Notification deleted");
    }
    catch (err) {
        (0, http_server_1.errorResponse)(res, 500, err.message);
    }
});
exports.default = router;
