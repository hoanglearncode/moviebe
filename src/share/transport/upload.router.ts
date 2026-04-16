import { Router, Request, Response } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { uploadService, UploadFolder } from "../repository/upload.service";
import { logger } from "../../modules/system/log/logger";

const VALID_FOLDERS: UploadFolder[] = ["avatars", "categories", "products", "misc"];

export function createUploadRouter(): Router {
  const router = Router();
  router.post("/upload", uploadMiddleware.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "Không có file được gửi lên" });
        return;
      }

      const folder = (
        VALID_FOLDERS.includes(req.body.folder) ? req.body.folder : "misc"
      ) as UploadFolder;

      const result = await uploadService.uploadBuffer(req.file.buffer, folder);

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
    } catch (err: any) {
      logger.error("Upload error", { error: err?.message });
      res.status(500).json({ message: err?.message ?? "Upload thất bại" });
    }
  });

  return router;
}
