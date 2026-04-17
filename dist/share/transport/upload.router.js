"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadRouter = createUploadRouter;
const express_1 = require("express");
const upload_middleware_1 = require("../middleware/upload.middleware");
const upload_service_1 = require("../repository/upload.service");
const logger_1 = require("../../modules/system/log/logger");
const VALID_FOLDERS = ["avatars", "categories", "products", "misc"];
function createUploadRouter() {
    const router = (0, express_1.Router)();
    router.post("/upload", upload_middleware_1.uploadMiddleware.single("file"), async (req, res) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: "Không có file được gửi lên" });
                return;
            }
            const folder = (VALID_FOLDERS.includes(req.body.folder) ? req.body.folder : "misc");
            const result = await upload_service_1.uploadService.uploadBuffer(req.file.buffer, folder);
            res.status(200).json({
                data: {
                    url: result.url,
                    publicId: result.publicId,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    bytes: result.bytes,
                },
            });
        }
        catch (err) {
            logger_1.logger.error("Upload error", { error: err?.message });
            res.status(500).json({ message: err?.message ?? "Upload thất bại" });
        }
    });
    return router;
}
