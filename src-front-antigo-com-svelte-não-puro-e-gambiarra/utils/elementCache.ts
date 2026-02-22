/**
 * Element Cache for Memoization
 * 
 * Caches rendered DOM elements to avoid unnecessary re-renders
 */

export class ElementCache<K> {
  private cache = new Map<K, HTMLElement>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): HTMLElement | undefined {
    return this.cache.get(key);
  }

  set(key: K, element: HTMLElement): void {
    // If cache is full, remove oldest entry (simple FIFO)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, element);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Update element if it exists in cache
   */
  update(key: K, updater: (element: HTMLElement) => void): boolean {
    const element = this.cache.get(key);
    if (element) {
      updater(element);
      return true;
    }
    return false;
  }

  /**
   * Get or create element
   */
  getOrCreate(key: K, creator: () => HTMLElement): HTMLElement {
    let element = this.cache.get(key);
    if (!element) {
      element = creator();
      this.set(key, element);
    }
    return element;
  }
}

/**
 * Create a cache key for asset items
 */
export function createAssetCacheKey(category: string, id: number): string {
  return `${category}:${id}`;
}
