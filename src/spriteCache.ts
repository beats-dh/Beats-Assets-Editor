import { invoke } from '@tauri-apps/api/core';
import { clearPreviewAnimationCache } from './features/previewAnimation/assetPreviewAnimator';
import { decodeSpriteOffThread } from './utils/imageDecodeWorkerClient';
import { perfConfig } from './stores/performanceConfig.svelte';
import { appearanceCache, spriteIdCache, spriteUrlStore, getCacheStats, clearAllCaches as clearRegistryCaches } from './utils/cacheRegistry';

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
  return spriteIdCache.get(spriteId) ?? null;
}

export async function getSpriteById(spriteId: number): Promise<Uint8Array | null> {
  if (!Number.isFinite(spriteId)) return null;

  if (spriteIdCache.has(spriteId)) {
    return spriteIdCache.get(spriteId) ?? null;
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
      let decoded = data;
      try {
        const result = await decodeSpriteOffThread(data);
        if (result) decoded = new Uint8Array(result);
      } catch { /* fallback: use raw */ }
      spriteIdCache.set(spriteId, decoded);
      return decoded;
    }
    return null;
  } catch (error) {
    console.error(`Failed to load sprite ${spriteId}:`, error);
    return null;
  }
}

export function clearSpritesCache(): void {
  clearRegistryCaches();
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
  if (spritesLoadAttempted) return;
  spritesLoadAttempted = true;
  if (spritesLoaded) return;

  try {
    const tibiaPath = userTibiaPath || await invoke('select_tibia_directory') as string;
    if (!tibiaPath) return;

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

  const cached = appearanceCache.getRawSprites(category, appearanceId);
  if (cached) return cached;

  try {
    const sprites = await invoke<unknown[][]>('get_appearance_sprites', {
      category,
      appearanceId,
    });

    const normalized = sprites
      .map(sprite => normalizeSpriteBuffer(sprite))
      .filter((sprite): sprite is Uint8Array => !!sprite);

    appearanceCache.setRawSprites(category, appearanceId, normalized);
    return normalized;
  } catch (error) {
    console.error(`Error getting sprites for ${category} ${appearanceId}:`, error);
    return [];
  }
}

// --- Granular cache invalidation (delegates to registry) ---

export function updateCachedAppearanceSprite(
  category: string, id: number, index: number, newBuffer: Uint8Array
): void {
  appearanceCache.updateSprite(category, id, index, newBuffer);
}

export function appendCachedAppearanceSprites(
  category: string, id: number, buffers: Uint8Array[]
): void {
  appearanceCache.appendSprites(category, id, buffers);
}

export function removeCachedAppearanceSprites(
  category: string, id: number, indices: number[]
): void {
  appearanceCache.removeSprites(category, id, indices);
}

export function invalidateAppearanceCache(category: string, id: number): void {
  appearanceCache.invalidate(category, id);
}

/**
 * BATCH SPRITE LOADING
 * Single IPC call for multiple appearance previews.
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

      if (onProgress) await onProgress(allResults);

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

  canvas.width = Math.round(displaySize * dpr);
  canvas.height = Math.round(displaySize * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  function loadImage(c: CanvasRenderingContext2D, retriesLeft: number) {
    const url = spriteUrlStore.get(data);
    const img = new Image();
    img.onload = () => {
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.imageSmoothingEnabled = false;
      c.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => {
      // Blob URL was revoked mid-flight — get a fresh one and retry
      if (retriesLeft > 0) loadImage(c, retriesLeft - 1);
    };
    img.src = url;
  }

  loadImage(ctx, 1);

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

// Debug functions
export const debugCache = {
  getFrontendCacheStats: () => getCacheStats(),
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
