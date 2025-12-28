/**
 * Frontend Cache Service
 * 
 * Caches ALL items and sprites to avoid repeated IPC calls to the Rust backend.
 * No limits - caches everything until manually cleared or app restart.
 */

interface AppearanceItem {
    id: number;
    name?: string;
    description?: string;
    type_name?: string;
}

interface CachedPage {
    items: AppearanceItem[];
    total: number;
    timestamp: number;
}

/**
 * Frontend Cache for Appearance Items and Sprites
 * Unlimited cache - stores everything
 */
class FrontendCache {
    // Cache pages: key = "category:subcategory:page:pageSize:search"
    private pageCache = new Map<string, CachedPage>();

    // Cache sprites: key = "category:id"
    private spriteCache = new Map<string, string>(); // blob URLs

    // Track blob URLs for cleanup
    private blobUrls = new Set<string>();

    /**
     * Build cache key for a page request
     */
    private getPageKey(
        category: string,
        page: number,
        pageSize: number,
        search?: string,
        subcategory?: string
    ): string {
        return `${category}:${subcategory || ''}:${page}:${pageSize}:${search || ''}`;
    }

    /**
     * Get cached page if available
     */
    getPage(
        category: string,
        page: number,
        pageSize: number,
        search?: string,
        subcategory?: string
    ): CachedPage | undefined {
        const key = this.getPageKey(category, page, pageSize, search, subcategory);
        const cached = this.pageCache.get(key);

        if (cached) {
            console.log(`[Cache HIT] Page ${category}:${page}`);
            return cached;
        }

        console.log(`[Cache MISS] Page ${category}:${page}`);
        return undefined;
    }

    /**
     * Cache a page result
     */
    setPage(
        category: string,
        page: number,
        pageSize: number,
        items: AppearanceItem[],
        total: number,
        search?: string,
        subcategory?: string
    ): void {
        const key = this.getPageKey(category, page, pageSize, search, subcategory);
        this.pageCache.set(key, {
            items,
            total,
            timestamp: Date.now()
        });
        console.log(`[Cache SET] Page ${category}:${page} (${items.length} items, total cached: ${this.pageCache.size})`);
    }

    /**
     * Get sprite key
     */
    private getSpriteKey(category: string, id: number): string {
        return `${category}:${id}`;
    }

    /**
     * Get cached sprite blob URL
     */
    getSprite(category: string, id: number): string | undefined {
        const key = this.getSpriteKey(category, id);
        return this.spriteCache.get(key);
    }

    /**
     * Cache a sprite blob URL
     */
    setSprite(category: string, id: number, blobUrl: string): void {
        const key = this.getSpriteKey(category, id);
        this.spriteCache.set(key, blobUrl);
        this.blobUrls.add(blobUrl);
    }

    /**
     * Cache multiple sprites at once
     */
    setSprites(category: string, sprites: Map<number, string>): void {
        for (const [id, blobUrl] of sprites) {
            this.setSprite(category, id, blobUrl);
        }
        console.log(`[Cache SET] ${sprites.size} sprites for ${category} (total cached: ${this.spriteCache.size})`);
    }

    /**
     * Get multiple sprites, returning cached ones and list of missing IDs
     */
    getSprites(category: string, ids: number[]): { cached: Map<number, string>; missing: number[] } {
        const cached = new Map<number, string>();
        const missing: number[] = [];

        for (const id of ids) {
            const blobUrl = this.getSprite(category, id);
            if (blobUrl) {
                cached.set(id, blobUrl);
            } else {
                missing.push(id);
            }
        }

        if (cached.size > 0) {
            console.log(`[Cache HIT] ${cached.size}/${ids.length} sprites for ${category}`);
        }

        return { cached, missing };
    }

    /**
     * Invalidate page cache (call when data changes)
     * Keeps sprite cache intact
     */
    invalidatePages(): void {
        this.pageCache.clear();
        console.log('[Cache] Invalidated page cache');
    }

    /**
     * Invalidate specific category cache
     */
    invalidateCategory(category: string): void {
        // Clear pages for this category
        for (const key of this.pageCache.keys()) {
            if (key.startsWith(category + ':')) {
                this.pageCache.delete(key);
            }
        }
        console.log(`[Cache] Invalidated pages for ${category}`);
    }

    /**
     * Clear everything including sprites
     */
    clearAll(): void {
        this.pageCache.clear();
        this.spriteCache.clear();

        // Revoke all blob URLs to free memory
        for (const url of this.blobUrls) {
            URL.revokeObjectURL(url);
        }
        this.blobUrls.clear();

        console.log('[Cache] Cleared all caches');
    }

    /**
     * Get cache statistics
     */
    getStats(): { pages: number; sprites: number; estimatedMemoryMB: number } {
        // Rough estimate: ~50KB per sprite blob URL average
        const estimatedMemoryMB = (this.spriteCache.size * 50) / 1024;
        return {
            pages: this.pageCache.size,
            sprites: this.spriteCache.size,
            estimatedMemoryMB: Math.round(estimatedMemoryMB * 100) / 100
        };
    }
}

// Singleton instance
export const frontendCache = new FrontendCache();
