import { ErrorCode } from "@/share/model/error-code";
import { ConflictError } from "@/share/transport/http-server";
export class InMemoryConcurrentLockService {
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
                throw new ConflictError(options.conflictMessage ?? "A similar request is already being processed", ErrorCode.CONCURRENT_TASK_LOCKED, {
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
export const concurrentLockService = new InMemoryConcurrentLockService();
