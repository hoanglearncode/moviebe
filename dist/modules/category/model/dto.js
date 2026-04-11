"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryCondDTOSchema = exports.CategoryUpdateSchema = exports.CategoryCreateSchema = void 0;
const base_model_1 = require("../../../share/model/base-model");
const zod_1 = require("zod");
exports.CategoryCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "name must be at least 3 characters"),
    image: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    parentId: zod_1.z.string().uuid().nullable().optional(),
});
exports.CategoryUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "name must be at least 3 characters").optional(),
    image: zod_1.z.string().optional(),
    description: zod_1.z.string().max(255, "description must be at most 255 characters").optional(),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.nativeEnum(base_model_1.ModelStatus).optional(),
});
exports.CategoryCondDTOSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "name must be at least 3 characters").optional(),
    parentId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(base_model_1.ModelStatus).optional(),
});
