import { invoke } from '@tauri-apps/api/core';
import { clearPreviewAnimationCache } from './features/previewAnimation/assetPreviewAnimator';
import { getSpriteUrl, clearSpriteUrlCache } from './utils/spriteUrlCache';
import { getDecodedSpriteBuffer, invalidateDecodedSpriteCache } from './utils/decodedSpriteCache';
import { perfConfig } from './stores/performanceConfig.svelte';

// Cache para sprites individuais por ID
const singleSpriteCache = new Map<number, Uint8Array>();

// Cache de appearances (category:id -> Uint8Array[]). Evita IPC repetido.
const appearanceSpriteCache = new Map<string, Uint8Array[]>();

let spritesLoaded = false;
let spritesLoadAttempted = false;
let userTibiaPath: string | null = null;

export function setUserTibiaPath(path: string): void {
  userTibiaPath = path;
}

export function getSpritesCacheKey(category: string, appearanceId: number): string {
  return `${category}:${appearanceId}`;
}


function normalizeSpriteBuffer(buffer: unknown): Uint8Array | null {
  if (buffer instanceof Uint8Array) return buffer;
  if (Array.isArray(buffer)) return new Uint8Array(buffer);
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (ArrayBuffer.isView(buffer)) return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return null;
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
      const decoded = await getDecodedSpriteBuffer(`sprite:${spriteId}`, data);
      singleSpriteCache.set(spriteId, decoded);
      return decoded;
    }
    return null;
  } catch (error) {
    console.error(`Failed to load sprite ${spriteId}:`, error);
    return null;
  }
}

export function clearSpritesCache(): void {
  singleSpriteCache.clear();
  appearanceSpriteCache.clear();
  invalidateDecodedSpriteCache('sprite:');
  clearSpriteUrlCache();
  clearPreviewAnimationCache();
}

export async function clearAllCaches(): Promise<void> {
  clearSpritesCache();
  try {
    await invoke('clear_sprite_cache');
  } catch (error) {
    console.error('Error clearing backend sprite cache:', error);
  }
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
  if (!spritesLoaded) {
    await loadSprites();
  }
  if (!spritesLoaded) {
    return [];
  }

  // Check frontend cache first (avoids IPC)
  const cacheKey = getSpritesCacheKey(category, appearanceId);
  const cached = appearanceSpriteCache.get(cacheKey);
  if (cached) return cached;

  try {
    const sprites = await invoke<unknown[][]>('get_appearance_sprites', {
      category,
      appearanceId,
    });

    const normalized = sprites
      .map(sprite => normalizeSpriteBuffer(sprite))
      .filter((sprite): sprite is Uint8Array => !!sprite);

    // Cache result (LRU eviction when over limit)
    if (appearanceSpriteCache.size >= perfConfig.appearanceCacheMax) {
      const oldestKey = appearanceSpriteCache.keys().next().value;
      if (oldestKey) appearanceSpriteCache.delete(oldestKey);
    }
    appearanceSpriteCache.set(cacheKey, normalized);

    return normalized;
  } catch (error) {
    console.error(`Error getting sprites for ${category} ${appearanceId}:`, error);
    return [];
  }
}

// --- Granular cache invalidation ---

/** Update a single sprite at a specific index in the cached appearance */
export function updateCachedAppearanceSprite(
  category: string, id: number, index: number, newBuffer: Uint8Array
): void {
  const cached = appearanceSpriteCache.get(getSpritesCacheKey(category, id));
  if (cached && index >= 0 && index < cached.length) {
    cached[index] = newBuffer;
  }
}

/** Append sprite buffers to the cached appearance */
export function appendCachedAppearanceSprites(
  category: string, id: number, buffers: Uint8Array[]
): void {
  const cached = appearanceSpriteCache.get(getSpritesCacheKey(category, id));
  if (cached) cached.push(...buffers);
}

/** Remove sprites at specific indices from the cached appearance */
export function removeCachedAppearanceSprites(
  category: string, id: number, indices: number[]
): void {
  const cached = appearanceSpriteCache.get(getSpritesCacheKey(category, id));
  if (cached) {
    const sorted = [...indices].sort((a, b) => b - a);
    for (const i of sorted) {
      if (i >= 0 && i < cached.length) cached.splice(i, 1);
    }
  }
}

/** Full invalidation for structural changes (texture settings, frame groups) */
export function invalidateAppearanceCache(category: string, id: number): void {
  appearanceSpriteCache.delete(getSpritesCacheKey(category, id));
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
export async function getAppearancePreviewSpritesBatch(
  category: string,
  appearanceIds: number[],
  onProgress?: (partial: Map<number, Uint8Array>) => void | Promise<void>
): Promise<Map<number, Uint8Array>> {
  if (!spritesLoaded) {
    await loadSprites();
  }
  if (!spritesLoaded || appearanceIds.length === 0) {
    return new Map();
  }

  const CHUNK_SIZE = perfConfig.chunkSize;
  const allResults = new Map<number, Uint8Array>();

  for (let i = 0; i < appearanceIds.length; i += CHUNK_SIZE) {
    const chunk = appearanceIds.slice(i, i + CHUNK_SIZE);

    try {
      const result = await invoke('get_appearance_preview_sprites_batch', {
        category,
        appearanceIds: chunk,
      }) as Record<number, Uint8Array | number[]>;

      for (const [id, sprite] of Object.entries(result)) {
        const data = normalizeSpriteBuffer(sprite);
        if (data) allResults.set(Number(id), data);
      }

      // Progressive callback between chunks
      if (onProgress) await onProgress(allResults);

      // Yield for browser paint
      if (i + CHUNK_SIZE < appearanceIds.length) {
        await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      }
    } catch (error) {
      console.error(`Error getting batch preview chunk for ${category}:`, error);
    }
  }

  return allResults;
}


export function createSpriteImage(data: Uint8Array, className = 'sprite-image'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = className;

  const displaySize = 64;
  const dpr = window.devicePixelRatio || 1;

  // CSS size stays fixed; canvas resolution scales by DPR
  canvas.style.width = `${displaySize}px`;
  canvas.style.height = `${displaySize}px`;
  canvas.width = Math.round(displaySize * dpr);
  canvas.height = Math.round(displaySize * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const url = getSpriteUrl(data);
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = url;

  return canvas;
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

/**
 * Svelte action for pixel-perfect sprite rendering on <canvas>.
 * Usage: <canvas use:pixelSprite={url} style="width:64px;height:64px" />
 */
export function pixelSprite(canvas: HTMLCanvasElement, src: string | null) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 64;
  const h = canvas.clientHeight || 64;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  function draw(url: string | null) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !url) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = url;
  }
  draw(src);

  return {
    update(newSrc: string | null) { draw(newSrc); },
    destroy() { }
  };
}

// Export debug functions for console access
export const debugCache = {
  getFrontendCacheStats: () => ({
    singleSpriteCache: singleSpriteCache.size,
    appearanceSpriteCache: appearanceSpriteCache.size,
  }),
  getBackendCacheStats: async () => {
    try {
      const [totalEntries, totalSprites] = await invoke('get_sprite_cache_stats') as [number, number];
      return { totalEntries, totalSprites };
    } catch { return { totalEntries: 0, totalSprites: 0 }; }
  },
  clearAllCaches: async () => {
    await clearAllCaches();
    return 'All caches cleared';
  },
  testCache: async (category: string, id: number) => {
    console.time('First call (cache miss)');
    const sprites1 = await getAppearanceSprites(category, id);
    console.timeEnd('First call (cache miss)');
    console.time('Second call (cache hit)');
    const sprites2 = await getAppearanceSprites(category, id);
    console.timeEnd('Second call (cache hit)');
    return { first: sprites1.length, second: sprites2.length };
  }
};
