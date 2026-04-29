import { ModelStatus } from "../../../share/model/base-model";
import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3, "name must be at least 3 characters"),
  slug: z.string().trim().min(1, "slug is required"),
  image: z.string().optional(),
  description: z.string().optional(),
  position: z.number().min(0, "invalid position").default(0),
  parentId: z.string().trim().min(1).nullable().optional(),
  status: z.nativeEnum(ModelStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof CategorySchema> & { children?: Category[] };
