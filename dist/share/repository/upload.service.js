import { cloudinary } from "@/share/common/cloudinary";
import { Readable } from "stream";
export class UploadService {
    /**
     * Upload buffer lên Cloudinary.
     * Dùng stream để tránh ghi file tạm ra disk.
     */
    async uploadBuffer(buffer, folder = "misc", options) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder,
                public_id: options?.publicId,
                transformation: options?.transformation ?? [
                    { quality: "auto", fetch_format: "auto" }, // auto-optimize
                ],
                overwrite: true,
            }, (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Upload thất bại"));
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
            Readable.from(buffer).pipe(uploadStream);
        });
    }
    /** Xoá file khỏi Cloudinary theo publicId */
    async delete(publicId) {
        await cloudinary.uploader.destroy(publicId);
    }
}
// Singleton dùng chung toàn app
export const uploadService = new UploadService();
