/**
 * Cache Factory with Closures
 *
 * Creates encapsulated cache instances where the internal Map is private
 * (captured by closure) and only accessible through the returned API.
 * This prevents external code from directly mutating the cache.
 */

export interface ClosureCache<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  delete: (key: K) => boolean;
  clear: () => void;
  readonly size: number;
  keys: () => IterableIterator<K>;
}

/**
 * Creates a cache with automatic LRU eviction via closure.
 * The internal Map is completely private — only the returned methods can access it.
 *
 * @param maxSize - Maximum number of entries before eviction
 * @returns An encapsulated cache API
 */
export function createCacheWithEviction<K, V>(maxSize: number): ClosureCache<K, V> {
  const cache = new Map<K, V>();

  return {
    get(key: K): V | undefined {
      return cache.get(key);
    },

    set(key: K, value: V): void {
      if (cache.size >= maxSize && !cache.has(key)) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, value);
    },

    has(key: K): boolean {
      return cache.has(key);
    },

    delete(key: K): boolean {
      return cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    get size(): number {
      return cache.size;
    },

    keys(): IterableIterator<K> {
      return cache.keys();
    },
  };
}

/**
 * Creates an unbounded cache via closure (no eviction).
 * Useful when you control invalidation manually.
 */
export function createSimpleCache<K, V>(): ClosureCache<K, V> {
  const cache = new Map<K, V>();

  return {
    get: (key: K) => cache.get(key),
    set: (key: K, value: V) => { cache.set(key, value); },
    has: (key: K) => cache.has(key),
    delete: (key: K) => cache.delete(key),
    clear: () => cache.clear(),
    get size() { return cache.size; },
    keys: () => cache.keys(),
  };
}
