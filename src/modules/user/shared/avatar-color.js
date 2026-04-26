"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarColorService = void 0;
const constants_1 = require("../model/constants");
class AvatarColorService {
    generateAvatarColor(identifier) {
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
            const char = identifier.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        const index = Math.abs(hash) % constants_1.AVATAR_COLORS.length;
        return constants_1.AVATAR_COLORS[index];
    }
    getRandomAvatarColor() {
        const randomIndex = Math.floor(Math.random() * constants_1.AVATAR_COLORS.length);
        return constants_1.AVATAR_COLORS[randomIndex];
    }
}
exports.AvatarColorService = AvatarColorService;
