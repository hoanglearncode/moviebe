"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePartnerIdMiddleware = resolvePartnerIdMiddleware;
const share_1 = require("../../../share");
function resolvePartnerIdMiddleware(partnerRepo) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                (0, share_1.errorResponse)(res, 401, "Unauthorized");
                return;
            }
            const partner = await partnerRepo.findByUserId(userId);
            if (!partner) {
                (0, share_1.errorResponse)(res, 404, "Partner profile not found for this user");
                return;
            }
            req.partnerId = partner.id;
            next();
        }
        catch (err) {
            (0, share_1.errorResponse)(res, 500, err.message);
        }
    };
}
