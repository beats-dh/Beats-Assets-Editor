import { invoke } from '@tauri-apps/api/core';
import { clearPreviewAnimationCache } from './features/previewAnimation/assetPreviewAnimator';

// Sprite cache to avoid reloading the same sprites
const spriteCache = new Map<string, string[]>();

let spritesLoaded = false;
let spritesLoadAttempted = false;
let userTibiaPath: string | null = null;

export function setUserTibiaPath(path: string): void {
  userTibiaPath = path;
}

export function resetSpriteLoaderState(): void {
  spritesLoaded = false;
  spritesLoadAttempted = false;
}

export async function forceLoadSprites(tibiaPath: string): Promise<number> {
  setUserTibiaPath(tibiaPath);
  try {
    const spriteCount = await invoke('auto_load_sprites', { tibiaPath }) as number;
    spritesLoaded = true;
    spritesLoadAttempted = true;
    return spriteCount;
  } catch (error) {
    spritesLoaded = false;
    spritesLoadAttempted = false;
    throw error;
  }
}

export function getSpritesCacheKey(category: string, appearanceId: number): string {
  return `${category}:${appearanceId}`;
}

export function clearSpritesCache(): void {
  spriteCache.clear();
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
  if (spritesLoaded || spritesLoadAttempted) {
    return;
  }

  try {
    const tibiaPath = userTibiaPath || (await invoke('select_tibia_directory')) as string;
    if (!tibiaPath) {
      return;
    }

    try {
      const spriteCount = await forceLoadSprites(tibiaPath);
      console.log(`Auto-loaded ${spriteCount} sprites from Tibia assets at ${tibiaPath}`);
    } catch (error) {
      console.warn('Failed to auto-load sprites from provided directory:', error);
    }
  } catch (error) {
    console.error('Error loading sprites:', error);
  }
}

export async function getAppearanceSprites(category: string, appearanceId: number): Promise<string[]> {
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
    }) as string[];

    // Store in cache
    spriteCache.set(cacheKey, sprites);

    return sprites;
  } catch (error) {
    console.error(`Error getting sprites for ${category} ${appearanceId}:`, error);
    return [];
  }
}

export function createSpriteImage(base64Data: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = `data:image/png;base64,${base64Data}`;
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
