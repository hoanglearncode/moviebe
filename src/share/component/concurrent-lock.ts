import { ErrorCode } from "@/share/model/error-code";
import { ConflictError } from "@/share/transport/http-server";

export type ConcurrentLockOptions = {
  ttlMs?: number;
  conflictMessage?: string;
  conflictDetails?: Record<string, unknown>;
};

export interface IConcurrentLockService {
  runExclusive<T>(
    keys: string | string[],
    task: () => Promise<T>,
    options?: ConcurrentLockOptions,
  ): Promise<T>;
  isLocked(key: string): boolean;
}

type LockEntry = {
  expiresAt: number;
  timeout: NodeJS.Timeout;
};

export class InMemoryConcurrentLockService implements IConcurrentLockService {
  private readonly locks = new Map<string, LockEntry>();

  async runExclusive<T>(
    keys: string | string[],
    task: () => Promise<T>,
    options: ConcurrentLockOptions = {},
  ): Promise<T> {
    const normalizedKeys = this.normalizeKeys(keys);
    const ttlMs = options.ttlMs ?? 5000;
    const acquiredKeys: string[] = [];

    for (const key of normalizedKeys) {
      if (!this.acquire(key, ttlMs)) {
        this.releaseMany(acquiredKeys);
        throw new ConflictError(
          options.conflictMessage ?? "A similar request is already being processed",
          ErrorCode.CONCURRENT_TASK_LOCKED,
          {
            keys: normalizedKeys,
            ...(options.conflictDetails ?? {}),
          },
        );
      }

      acquiredKeys.push(key);
    }

    try {
      return await task();
    } finally {
      this.releaseMany(acquiredKeys);
    }
  }

  isLocked(key: string): boolean {
    const normalizedKey = this.normalizeKeys(key)[0];
    if (!normalizedKey) {
      return false;
    }

    this.pruneExpired(normalizedKey);
    return this.locks.has(normalizedKey);
  }

  private acquire(key: string, ttlMs: number): boolean {
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

  private releaseMany(keys: string[]): void {
    for (const key of keys) {
      this.forceRelease(key);
    }
  }

  private forceRelease(key: string): void {
    const entry = this.locks.get(key);
    if (!entry) {
      return;
    }

    clearTimeout(entry.timeout);
    this.locks.delete(key);
  }

  private pruneExpired(key: string): void {
    const entry = this.locks.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt <= Date.now()) {
      this.forceRelease(key);
    }
  }

  private normalizeKeys(keys: string | string[]): string[] {
    const values = Array.isArray(keys) ? keys : [keys];

    return Array.from(new Set(values.map((key) => key.trim()).filter(Boolean))).sort();
  }
}

export const concurrentLockService = new InMemoryConcurrentLockService();
