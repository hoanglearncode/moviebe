import { z } from "zod";

export const CreateBroadcastSchema = z.object({
  title: z.string().min(1, "title is required"),
  content: z.string().min(1, "content is required"),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
  target: z.enum(["ALL", "USERS", "OWNERS", "VIP", "PREMIUM", "FREE"]),
  channel: z.enum(["ALL", "WEBSITE", "EMAIL", "DESKTOP", "MOBILE"]).default("ALL"),
  imageUrls: z.array(z.string()).max(5).optional(),
  scheduleMode: z.enum(["now", "later"]).optional(),
  scheduledAt: z.string().optional(),
});

export const ListBroadcastsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["DRAFT", "SCHEDULED", "SENT", "FAILED"]).optional(),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).optional(),
});

export type CreateBroadcastDto = z.infer<typeof CreateBroadcastSchema>;
export type ListBroadcastsDto = z.infer<typeof ListBroadcastsSchema>;
