/**
 * In-memory TTL cache. Same get/set surface a Redis-backed cache will implement later,
 * so lanes can stay cache-agnostic.
 */
export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  delete(key: string): void;
  clear(): void;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCache implements Cache {
  private readonly store = new Map<string, Entry>();

  constructor(private readonly defaultTtlSeconds: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = this.defaultTtlSeconds): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
