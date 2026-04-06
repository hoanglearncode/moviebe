"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagingDTOSchema = void 0;
const zod_1 = require("zod");
exports.PagingDTOSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    total: zod_1.z.coerce.number().int().min(0).default(0).optional(),
});
