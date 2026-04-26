"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserSettingSchema = void 0;
const zod_1 = require("zod");
exports.UpdateUserSettingSchema = zod_1.z.object({
    notifications: zod_1.z.boolean().optional(),
    marketingEmails: zod_1.z.boolean().optional(),
    pushNotifications: zod_1.z.boolean().optional(),
    smsNotifications: zod_1.z.boolean().optional(),
    shareHistory: zod_1.z.boolean().optional(),
    personalizedRecs: zod_1.z.boolean().optional(),
});
