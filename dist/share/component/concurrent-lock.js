"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concurrentLockService = exports.InMemoryConcurrentLockService = void 0;
const error_code_1 = require("../model/error-code");
const http_server_1 = require("../transport/http-server");
class InMemoryConcurrentLockService {
    constructor() {
        this.locks = new Map();
    }
    async runExclusive(keys, task, options = {}) {
        const normalizedKeys = this.normalizeKeys(keys);
        const ttlMs = options.ttlMs ?? 5000;
        const acquiredKeys = [];
        for (const key of normalizedKeys) {
            if (!this.acquire(key, ttlMs)) {
                this.releaseMany(acquiredKeys);
                throw new http_server_1.ConflictError(options.conflictMessage ?? "A similar request is already being processed", error_code_1.ErrorCode.CONCURRENT_TASK_LOCKED, {
                    keys: normalizedKeys,
                    ...(options.conflictDetails ?? {}),
                });
            }
            acquiredKeys.push(key);
        }
        try {
            return await task();
        }
        finally {
            this.releaseMany(acquiredKeys);
        }
    }
    isLocked(key) {
        const normalizedKey = this.normalizeKeys(key)[0];
        if (!normalizedKey) {
            return false;
        }
        this.pruneExpired(normalizedKey);
        return this.locks.has(normalizedKey);
    }
    acquire(key, ttlMs) {
        this.pruneExpired(key);
        if (this.locks.has(key)) {
            return false;
        }
        const timeout = setTimeout(() => {
            this.forceRelease(key);
        }, ttlMs);
        timeout.unref?.();
        this.locks.set(key, {
            expiresAt: Date.now() + ttlMs,
            timeout,
        });
        return true;
    }
    releaseMany(keys) {
        for (const key of keys) {
            this.forceRelease(key);
        }
    }
    forceRelease(key) {
        const entry = this.locks.get(key);
        if (!entry) {
            return;
        }
        clearTimeout(entry.timeout);
        this.locks.delete(key);
    }
    pruneExpired(key) {
        const entry = this.locks.get(key);
        if (!entry) {
            return;
        }
        if (entry.expiresAt <= Date.now()) {
            this.forceRelease(key);
        }
    }
    normalizeKeys(keys) {
        const values = Array.isArray(keys) ? keys : [keys];
        return Array.from(new Set(values.map((key) => key.trim()).filter(Boolean))).sort();
    }
}
exports.InMemoryConcurrentLockService = InMemoryConcurrentLockService;
exports.concurrentLockService = new InMemoryConcurrentLockService();
