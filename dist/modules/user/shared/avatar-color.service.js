"use strict";
/**
 * Avatar Color Service
 * Generates and manages default avatar color themes for users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarColorService = void 0;
const constants_1 = require("../model/constants");
class AvatarColorService {
    /**
     * Generate deterministic avatar color based on email/username
     * Ensures same user always gets same color
     */
    generateAvatarColor(identifier) {
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
            const char = identifier.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % constants_1.AVATAR_COLORS.length;
        return constants_1.AVATAR_COLORS[index];
    }
    /**
     * Get random avatar color from palette
     */
    getRandomAvatarColor() {
        const randomIndex = Math.floor(Math.random() * constants_1.AVATAR_COLORS.length);
        return constants_1.AVATAR_COLORS[randomIndex];
    }
}
exports.AvatarColorService = AvatarColorService;
