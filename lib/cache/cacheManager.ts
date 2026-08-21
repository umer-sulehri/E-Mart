interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 500;

export const cache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  },

  set<T>(key: string, value: T, ttlMs: number): void {
    if (store.size >= MAX_ENTRIES) {
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) store.delete(oldestKey);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  delete(key: string): void {
    store.delete(key);
  },

  invalidatePrefix(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  clear(): void {
    store.clear();
  },

  /** Returns cached value when fresh, otherwise computes, stores and returns it. */
  async wrap<T>(key: string, compute: () => Promise<T>, ttlMs = 30_000): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  },
};
