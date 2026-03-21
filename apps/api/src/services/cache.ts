/**
 * Cache abstraction layer.
 * In production, this connects to Redis.
 * In development, uses an in-memory Map with TTL support.
 */

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
export const cache = new MemoryCache();

// ─── Helper functions for common patterns ──────────────────

/**
 * Cache-aside pattern: get from cache or compute and store.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await cache.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const value = await compute();
  await cache.set(key, JSON.stringify(value), ttlSeconds);
  return value;
}

/**
 * Invalidate cache entries matching a pattern.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await cache.keys(pattern);
  for (const key of keys) {
    await cache.del(key);
  }
}

// ─── Cache key builders ─────────────────────────────────────

export const CacheKeys = {
  userProfile: (userId: string) => `user:${userId}:profile`,
  userTrustScore: (userId: string) => `user:${userId}:trust`,
  postDetail: (postId: string) => `post:${postId}`,
  feedPage: (userId: string, cursor: string) => `feed:${userId}:${cursor}`,
  searchResults: (query: string) => `search:${query.toLowerCase()}`,
} as const;

// ─── TTL constants (seconds) ────────────────────────────────

export const CacheTTL = {
  userProfile: 300,     // 5 minutes
  trustScore: 600,      // 10 minutes
  postDetail: 120,      // 2 minutes
  feedPage: 60,         // 1 minute
  searchResults: 30,    // 30 seconds
} as const;
