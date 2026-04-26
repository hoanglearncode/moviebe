"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieCondDTOSchema = void 0;
const zod_1 = require("zod");
exports.MovieCondDTOSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().default(1),
    limit: zod_1.z.coerce.number().default(10),
    rooms: zod_1.z.string().optional(),
    genres: zod_1.z.string().optional(),
    showtimes: zod_1.z.string().optional(),
    rates: zod_1.z.string().optional(),
    search: zod_1.z.string().optional()
});
