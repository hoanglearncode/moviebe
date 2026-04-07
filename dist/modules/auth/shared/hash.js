"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
class HashService {
    async hash(rawValue) {
        return bcrypt_1.default.hash(rawValue, saltRounds);
    }
    async compare(rawValue, hashedValue) {
        return bcrypt_1.default.compare(rawValue, hashedValue);
    }
}
exports.HashService = HashService;
