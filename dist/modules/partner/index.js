"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPartnerRequestRoutes = exports.setupPartnerHexagon = void 0;
const partner_endpoints_1 = __importDefault(require("./infras/transport/partner-endpoints"));
const admin_endpoints_1 = require("./infras/transport/admin-endpoints");
const user_endpoints_1 = require("./infras/transport/user-endpoints");
/**
 * Partner module composition root.
 *
 * Main partner portal:
 *   app.use("/v1/partner", setupPartnerHexagon(prisma))
 *
 * Partner registration flow:
 *   app.use("/v1/user", setupPartnerRequestRoutes(prisma).userRouter)
 *   app.use("/v1/admin", setupPartnerRequestRoutes(prisma).adminRouter)
 */
const setupPartnerHexagon = (prisma) => {
    return (0, partner_endpoints_1.default)(prisma);
};
exports.setupPartnerHexagon = setupPartnerHexagon;
const setupPartnerRequestRoutes = (prisma) => {
    return {
        adminRouter: (0, admin_endpoints_1.buildPartnerRequestAdminRouter)(prisma),
        userRouter: (0, user_endpoints_1.buildPartnerRequestUserRouter)(prisma),
    };
};
exports.setupPartnerRequestRoutes = setupPartnerRequestRoutes;
