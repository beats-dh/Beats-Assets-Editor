import { invoke } from '@tauri-apps/api/core';
import { clearPreviewAnimationCache } from './features/previewAnimation/assetPreviewAnimator';

// Sprite cache to avoid reloading the same sprites
const spriteCache = new Map<string, Uint8Array[]>();
const singleSpriteCache = new Map<number, Uint8Array>();
const spriteUrlRegistry = new Set<string>();
const spriteUrlCache = new WeakMap<Uint8Array, string>();

// Export for cache checking in other modules
export function hasCachedSprites(category: string, appearanceId: number): boolean {
  const cacheKey = getSpritesCacheKey(category, appearanceId);
  return spriteCache.has(cacheKey);
}

let spritesLoaded = false;
let spritesLoadAttempted = false;
let userTibiaPath: string | null = null;

export function setUserTibiaPath(path: string): void {
  userTibiaPath = path;
}

export function getSpritesCacheKey(category: string, appearanceId: number): string {
  return `${category}:${appearanceId}`;
}

export function invalidateAppearanceSpritesCache(category: string, appearanceId: number): void {
  const cacheKey = getSpritesCacheKey(category, appearanceId);
  spriteCache.delete(cacheKey);
}

function normalizeSpriteBuffer(buffer: unknown): Uint8Array | null {
  if (buffer instanceof Uint8Array) return buffer;
  if (Array.isArray(buffer)) return new Uint8Array(buffer);
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (ArrayBuffer.isView(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return null;
}

export function bufferToObjectUrl(buffer: Uint8Array): string {
  const cached = spriteUrlCache.get(buffer);
  if (cached) return cached;
  const url = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  spriteUrlCache.set(buffer, url);
  spriteUrlRegistry.add(url);
  return url;
}

export function getCachedSpriteById(spriteId: number): Uint8Array | null {
  return singleSpriteCache.get(spriteId) ?? null;
}

export async function getSpriteById(spriteId: number): Promise<Uint8Array | null> {
  if (!Number.isFinite(spriteId)) return null;

  if (singleSpriteCache.has(spriteId)) {
    return singleSpriteCache.get(spriteId) ?? null;
  }

  if (!spritesLoaded) {
    await loadSprites();
  }

  if (!spritesLoaded) {
    return null;
  }

  try {
    const sprite = await invoke('get_sprite_by_id', { spriteId }) as number[] | Uint8Array | null;
    const data = normalizeSpriteBuffer(sprite);
    if (data) {
      singleSpriteCache.set(spriteId, data);
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Failed to load sprite ${spriteId}:`, error);
    return null;
  }
}

export function clearSpritesCache(): void {
  spriteCache.clear();
  singleSpriteCache.clear();
  spriteUrlRegistry.forEach((url) => URL.revokeObjectURL(url));
  spriteUrlRegistry.clear();
  clearPreviewAnimationCache();
}

export function getSpriteCacheStats(): { totalEntries: number; totalSprites: number } {
  const totalEntries = spriteCache.size;
  let totalSprites = 0;
  for (const sprites of spriteCache.values()) {
    totalSprites += sprites.length;
  }
  return { totalEntries, totalSprites };
}

export async function clearBackendSpriteCache(): Promise<number> {
  try {
    const clearedEntries = await invoke('clear_sprite_cache') as number;
    return clearedEntries;
  } catch (error) {
    console.error('Error clearing backend sprite cache:', error);
    return 0;
  }
}

export async function getBackendSpriteCacheStats(): Promise<{ totalEntries: number; totalSprites: number }> {
  try {
    const [totalEntries, totalSprites] = await invoke('get_sprite_cache_stats') as [number, number];
    return { totalEntries, totalSprites };
  } catch (error) {
    console.error('Error getting backend sprite cache stats:', error);
    return { totalEntries: 0, totalSprites: 0 };
  }
}

export async function clearAllCaches(): Promise<void> {
  clearSpritesCache(); // Frontend cache
  await clearBackendSpriteCache(); // Backend cache
}

export async function loadSprites(): Promise<void> {
  if (spritesLoadAttempted) {
    return;
  }
  spritesLoadAttempted = true;
  if (spritesLoaded) return;

  try {
    // Use the user-provided Tibia path instead of calling select_tibia_directory
    const tibiaPath = userTibiaPath || await invoke('select_tibia_directory') as string;
    if (!tibiaPath) return;

    // Try to auto-load sprites from Tibia 12+ format
    try {
      const spriteCount = await invoke('auto_load_sprites', { tibiaPath }) as number;
      console.log(`Auto-loaded ${spriteCount} sprites from Tibia 12+ format`);
      spritesLoaded = true;
      return;
    } catch (error) {
      console.warn('Failed to auto-load Tibia 12+ sprites:', error);
    }

    console.warn('No compatible sprite format found in Tibia directory');
  } catch (error) {
    console.error('Error loading sprites:', error);
  }
}

export async function getAppearanceSprites(category: string, appearanceId: number): Promise<Uint8Array[]> {
  // Check cache first
  const cacheKey = getSpritesCacheKey(category, appearanceId);
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  if (!spritesLoaded) {
    await loadSprites();
  }

  if (!spritesLoaded) {
    return [];
  }

  try {
    const sprites = await invoke('get_appearance_sprites', {
      category: category,
      appearanceId: appearanceId
    }) as Array<Uint8Array | number[] | null>;

    const normalized = sprites
      .map(sprite => normalizeSpriteBuffer(sprite))
      .filter((sprite): sprite is Uint8Array => !!sprite);

    // Store in cache
    spriteCache.set(cacheKey, normalized);

    return normalized;
  } catch (error) {
    console.error(`Error getting sprites for ${category} ${appearanceId}:`, error);
    return [];
  }
}

/**
 * BATCH SPRITE LOADING - ULTRA PERFORMANCE
 * Load preview sprites for MULTIPLE appearances in a SINGLE call
 *
 * This is 10x-100x faster than individual calls due to:
 * - Single IPC call instead of N calls
 * - Backend parallel processing across all cores
 * - Automatic backend caching
 *
 * @param category - Appearance category (Objects, Outfits, Effects, Missiles)
 * @param appearanceIds - Array of appearance IDs to load
 * @returns Map of appearance ID to first sprite Uint8Array
 */
export async function getAppearancePreviewSpritesBatch(category: string, appearanceIds: number[]): Promise<Map<number, Uint8Array>> {
  if (!spritesLoaded) {
    await loadSprites();
  }

  if (!spritesLoaded || appearanceIds.length === 0) {
    return new Map();
  }

  try {
    // Call backend batch API - single IPC call for all previews!
    const result = await invoke('get_appearance_preview_sprites_batch', {
      category: category,
      appearanceIds: appearanceIds
    }) as Record<number, Uint8Array | number[]>;

    const map = new Map<number, Uint8Array>();
    for (const [id, sprite] of Object.entries(result)) {
      const data = normalizeSpriteBuffer(sprite);
      if (data) {
        map.set(Number(id), data);
      }
    }

    return map;
  } catch (error) {
    console.error(`Error getting batch preview sprites for ${category}:`, error);
    return new Map();
  }
}

/**
 * BATCH FULL SPRITE LOADING
 * Load ALL sprites for MULTIPLE appearances in a SINGLE call
 *
 * Use this for preloading full sprites in background.
 *
 * @param category - Appearance category
 * @param appearanceIds - Array of appearance IDs to load
 * @returns Map of appearance ID to array of sprite Uint8Array
 */
export async function getAppearanceSpritesBatch(category: string, appearanceIds: number[]): Promise<Map<number, Uint8Array[]>> {
  if (!spritesLoaded) {
    await loadSprites();
  }

  if (!spritesLoaded || appearanceIds.length === 0) {
    return new Map();
  }

  try {
    // Call backend batch API
    const result = await invoke('get_appearance_sprites_batch', {
      category: category,
      appearanceIds: appearanceIds
    }) as Record<number, Array<Uint8Array | number[] | null>>;

    const normalized = new Map<number, Uint8Array[]>();
    for (const [id, sprites] of Object.entries(result)) {
      const safeSprites = sprites
        .map(sprite => normalizeSpriteBuffer(sprite))
        .filter((sprite): sprite is Uint8Array => !!sprite);
      const appearanceId = Number(id);
      const cacheKey = getSpritesCacheKey(category, appearanceId);
      spriteCache.set(cacheKey, safeSprites);
      normalized.set(appearanceId, safeSprites);
    }

    return normalized;
  } catch (error) {
    console.error(`Error getting batch sprites for ${category}:`, error);
    return new Map();
  }
}

export function createSpriteImage(data: Uint8Array): HTMLImageElement {
  const img = document.createElement('img');
  img.src = bufferToObjectUrl(data);
  img.className = 'sprite-image';
  img.style.imageRendering = 'pixelated';
  return img;
}

export function createPlaceholderImage(): HTMLDivElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'sprite-placeholder';
  placeholder.style.display = 'flex';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.style.fontSize = '10px';
  placeholder.style.color = '#888';
  placeholder.textContent = '?';
  return placeholder;
}

// Export debug functions for console access
export const debugCache = {
  getFrontendCacheStats: () => getSpriteCacheStats(),
  getBackendCacheStats: async () => await getBackendSpriteCacheStats(),
  clearFrontendCache: () => {
    clearSpritesCache();
    return 'Frontend cache cleared';
  },
  clearBackendCache: async () => {
    const count = await clearBackendSpriteCache();
    return `Backend cache cleared (${count} entries)`;
  },
  clearAllCaches: async () => {
    await clearAllCaches();
    return 'All caches cleared';
  },
  testCache: async (category: string, id: number) => {
    console.log(`Testing cache for ${category} ID ${id}`);

    console.time('First call (cache miss)');
    const sprites1 = await getAppearanceSprites(category, id);
    console.timeEnd('First call (cache miss)');

    console.time('Second call (cache hit)');
    const sprites2 = await getAppearanceSprites(category, id);
    console.timeEnd('Second call (cache hit)');

    console.log('First call sprites:', sprites1.length);
    console.log('Second call sprites:', sprites2.length);
    console.log('Cache stats:', getSpriteCacheStats());

    return { sprites1, sprites2 };
  }
};
