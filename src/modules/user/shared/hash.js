"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * HashService — implementation của IPasswordHasher dùng bcrypt
 *
 * NOTE: SALT_ROUNDS=12 là cân bằng tốt giữa security và performance.
 * Tăng lên 14+ thì an toàn hơn nhưng chậm hơn đáng kể.
 */
class HashService {
    constructor() {
        this.SALT_ROUNDS = 12;
    }
    async hash(rawValue) {
        return bcrypt_1.default.hash(rawValue, this.SALT_ROUNDS);
    }
    async compare(rawValue, hashedValue) {
        return bcrypt_1.default.compare(rawValue, hashedValue);
    }
}
exports.HashService = HashService;
