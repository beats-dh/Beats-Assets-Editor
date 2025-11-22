/**
 * LRU (Least Recently Used) Cache
 * 
 * A cache with a maximum size that evicts the least recently used items
 * when the size limit is reached.
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * Updates the timestamp to mark it as recently used
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Update timestamp to mark as recently used
    entry.timestamp = Date.now();
    return entry.value;
  }

  /**
   * Set a value in the cache
   * Evicts least recently used items if size limit is reached
   */
  set(key: K, value: V): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, { value, timestamp: Date.now() });
      return;
    }

    // If cache is full, evict least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize) * 100,
    };
  }

  /**
   * Evict the least recently used item
   */
  private evictLRU(): void {
    let oldestKey: K | null = null;
    let oldestTimestamp = Infinity;

    // Find the least recently used entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    // Remove the oldest entry
    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get all keys in the cache
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all values in the cache
   */
  values(): IterableIterator<V> {
    return Array.from(this.cache.values()).map(entry => entry.value)[Symbol.iterator]();
  }

  /**
   * Iterate over all entries
   */
  forEach(callback: (value: V, key: K) => void): void {
    for (const [key, entry] of this.cache.entries()) {
      callback(entry.value, key);
    }
  }
}

/**
 * Create a simple LRU cache with string keys
 */
export function createLRUCache<V>(maxSize: number): LRUCache<string, V> {
  return new LRUCache<string, V>(maxSize);
}
