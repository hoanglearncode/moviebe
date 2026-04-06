"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySchema = exports.CategoryStatus = void 0;
const base_model_1 = require("../../../share/model/base-model");
const zod_1 = require("zod");
// TODO: remove this enum
var CategoryStatus;
(function (CategoryStatus) {
    CategoryStatus["Active"] = "active";
    CategoryStatus["Inactive"] = "inactive";
    CategoryStatus["Deleted"] = "deleted";
})(CategoryStatus || (exports.CategoryStatus = CategoryStatus = {}));
// Business object/model/entity
exports.CategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(3, 'name must be at least 3 characters'),
    image: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    position: zod_1.z.number().min(0, 'invalid position').default(0),
    parentId: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.nativeEnum(base_model_1.ModelStatus),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
