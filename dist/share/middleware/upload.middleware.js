import multer from "multer";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Chỉ chấp nhận: ${ALLOWED_MIME.join(", ")}`));
        }
    },
});
