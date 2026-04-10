"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
const cloudinary_1 = require("../common/cloudinary");
const stream_1 = require("stream");
class UploadService {
    /**
     * Upload buffer lên Cloudinary.
     * Dùng stream để tránh ghi file tạm ra disk.
     */
    async uploadBuffer(buffer, folder = 'misc', options) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({
                folder,
                public_id: options?.publicId,
                transformation: options?.transformation ?? [
                    { quality: 'auto', fetch_format: 'auto' }, // auto-optimize
                ],
                overwrite: true,
            }, (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error('Upload thất bại'));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    width: result.width,
                    height: result.height,
                    format: result.format,
                    bytes: result.bytes,
                });
            });
            // Pipe buffer vào stream
            stream_1.Readable.from(buffer).pipe(uploadStream);
        });
    }
    /** Xoá file khỏi Cloudinary theo publicId */
    async delete(publicId) {
        await cloudinary_1.cloudinary.uploader.destroy(publicId);
    }
}
exports.UploadService = UploadService;
// Singleton dùng chung toàn app
exports.uploadService = new UploadService();
