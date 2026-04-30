import { ModelStatus } from "@/share/model/base-model";
import { z } from "zod";

export const CategoryCreateSchema = z.object({
  name: z.string().min(2, "name must be at least 3 characters"),
  slug: z.string().trim().min(1, "slug is required"),
  image: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
});

export type CategoryCreateDTO = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  name: z.string().min(2, "name must be at least 3 characters").optional(),
  slug: z.string().trim().min(1, "slug is required").optional(),
  image: z.string().optional(),
  description: z.string().max(255, "description must be at most 255 characters").optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
  status: z.nativeEnum(ModelStatus).optional(),
});

export type CategoryUpdateDTO = z.infer<typeof CategoryUpdateSchema>;

export const CategoryCondDTOSchema = z.object({
  name: z.string().min(2, "name must be at least 3 characters").optional(),
  slug: z.string().trim().min(1).optional(),
  parentId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ModelStatus).optional(),
});

export type CategoryCondDTO = z.infer<typeof CategoryCondDTOSchema>;
