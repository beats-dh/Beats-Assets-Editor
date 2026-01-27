import { getAppearancePreviewSpritesBatch, createSpriteImage, createPlaceholderImage, getAppearanceSprites, bufferToObjectUrl } from '../spriteCache';
import { initAssetCardAutoAnimation, initDetailSpriteCardAnimations } from '../animation'; 
import { getDecodedSpriteBuffer, invalidateDecodedSpriteCache } from './decodedSpriteCache';
import type { CompleteAppearanceItem } from '../types';
import { LRUCache } from './lruCache';
import { isElementIdInViewport } from './viewportUtils';
import { performanceMonitor } from './performanceMonitor';
import { CONSTANTS } from '../commands';

const previewSpriteCache = new LRUCache<string, Uint8Array>(
  CONSTANTS.MAX_PREVIEW_CACHE_SIZE
);

const animationQueue: Array<{ category: string; id: number }> = [];
const enqueuedAnimations = new Set<string>();
let processingAnimations = false;

const scheduleIdle = (cb: () => void): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout: CONSTANTS.IDLE_CALLBACK_TIMEOUT });
  } else {
    setTimeout(cb, 0);
  }
};

let currentLoadId = 0;

export function clearPreviewSpriteCaches(): void {
  previewSpriteCache.clear();
  invalidateDecodedSpriteCache('appearance-preview:');
}

export function clearAssetsQueryCachesForSprites(): void {
  enqueuedAnimations.clear();
  animationQueue.length = 0;
  processingAnimations = false;
}

function getPreviewCacheKey(category: string, id: number): string {
  return `${category}:${id}`;
}

function getPreviewDecodedCacheKey(category: string, id: number): string {
  return `appearance-preview:${category}:${id}`;
}

function invalidateAssetPreviewCache(category: string, id: number): void {
  const previewKey = getPreviewCacheKey(category, id);
  previewSpriteCache.delete(previewKey);
  invalidateDecodedSpriteCache(getPreviewDecodedCacheKey(category, id));
}

function enqueueAnimations(category: string, ids: number[]): void {
  for (const id of ids) {
    const key = `${category}:${id}`;
    if (enqueuedAnimations.has(key)) continue;
    enqueuedAnimations.add(key);
    animationQueue.push({ category, id });
  }

  if (!processingAnimations && animationQueue.length > 0) {
    processingAnimations = true;

    const process = (): void => {
      // ✅ OPTIMIZED: Sort queue by viewport priority before processing
      animationQueue.sort((a, b) => {
        const aElement = document.getElementById(`sprite-${a.id}`);
        const bElement = document.getElementById(`sprite-${b.id}`);
        
        if (!aElement && !bElement) return 0;
        if (!aElement) return 1;
        if (!bElement) return -1;
        
        const aInViewport = isElementIdInViewport(`sprite-${a.id}`, 0.05);
        const bInViewport = isElementIdInViewport(`sprite-${b.id}`, 0.05);
        
        // Prioritize items in viewport
        if (aInViewport && !bInViewport) return -1;
        if (!aInViewport && bInViewport) return 1;
        
        return 0;
      });

      let processed = 0;
      // We need to access autoAnimateGridEnabled. For now we assume false or get from localStorage
      const stored = localStorage.getItem(CONSTANTS.AUTO_ANIMATE_KEY);
      const autoAnimate = stored === 'true';

      while (animationQueue.length > 0 && processed < CONSTANTS.ANIMATION_BATCH_SIZE) {
        const item = animationQueue.shift();
        if (!item) break;
        enqueuedAnimations.delete(`${item.category}:${item.id}`);
        const container = document.getElementById(`sprite-${item.id}`);
        const forceStart = !!(container && isElementIdInViewport(`sprite-${item.id}`, 0.05));
        initAssetCardAutoAnimation(item.category, item.id, autoAnimate, forceStart);
        processed++;
      }
      if (animationQueue.length > 0) {
        scheduleIdle(process);
      } else {
        processingAnimations = false;
      }
    };
    scheduleIdle(process);
  }
}

function resetAnimationQueue(): void {
  enqueuedAnimations.clear();
  animationQueue.length = 0;
  processingAnimations = false;
}

export async function loadSpritesForAssets(assets: CompleteAppearanceItem[], category: string): Promise<void> {
  if (assets.length === 0) return;

  // ✅ OPTIMIZED: Performance monitoring
  performanceMonitor.mark('loadSprites');

  // Increment load ID to invalidate previous load operations
  const thisLoadId = ++currentLoadId;
  const loadCategory = category;
  
  const missingIds: number[] = [];
  const readyToAnimate: number[] = [];

  for (const asset of assets) {
    const container = document.getElementById(`sprite-${asset.id}`);
    if (!container) continue;

    container.innerHTML = '';
    const cacheKey = getPreviewCacheKey(loadCategory, asset.id);
    const cachedPreview = previewSpriteCache.get(cacheKey);
    if (cachedPreview) {
      container.appendChild(createSpriteImage(cachedPreview));
      readyToAnimate.push(asset.id);
    } else {
      container.appendChild(createPlaceholderImage());
      missingIds.push(asset.id);
    }
  }

  if (readyToAnimate.length > 0) {
    enqueueAnimations(loadCategory, readyToAnimate);
  }

  // ✅ OPTIMIZED: Track cache hit rate
  const totalRequests = assets.length;
  const cacheHits = readyToAnimate.length;
  performanceMonitor.trackCacheHitRate(cacheHits, totalRequests);

  if (missingIds.length === 0) {
    return;
  }

  performanceMonitor.mark('batchLoad');
  const previews = await getAppearancePreviewSpritesBatch(loadCategory, missingIds);
  const batchDuration = performanceMonitor.measure('batchLoad');
  if (batchDuration !== null) {
    performanceMonitor.trackBatchLoad(batchDuration);
  }
  const assetById = new Map<number, any>();
  assets.forEach(asset => assetById.set(asset.id, asset));

  // Cancel stale operations
  if (thisLoadId !== currentLoadId) {
    return;
  }

  // Render previews em lotes usando requestIdleCallback para evitar jank na UI
  const renderBatch = async (startIndex: number): Promise<void> => {
    if (thisLoadId !== currentLoadId) {
      return;
    }

    const endIndex = Math.min(startIndex + CONSTANTS.PREVIEW_BATCH_SIZE, missingIds.length);
    const batchReady: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      const assetId = missingIds[i];
      const asset = assetById.get(assetId);
      if (!asset) continue;
      const container = document.getElementById(`sprite-${asset.id}`);
      if (!container) continue;

      const previewSprite = previews.get(asset.id);
      if (previewSprite) {
        const cacheKey = getPreviewCacheKey(loadCategory, asset.id);
        const decoded = await getDecodedSpriteBuffer(
          getPreviewDecodedCacheKey(loadCategory, asset.id),
          previewSprite
        );
        previewSpriteCache.set(cacheKey, decoded);
        container.innerHTML = '';
        container.appendChild(createSpriteImage(decoded));
        batchReady.push(asset.id);
      } else {
        // Keep placeholder if preview missing
      }
    }

    if (batchReady.length > 0) {
      enqueueAnimations(loadCategory, batchReady);
    }

    if (endIndex < missingIds.length) {
      scheduleIdle(() => { void renderBatch(endIndex); });
    } else {
      // ✅ OPTIMIZED: Log performance when batch complete
      const duration = performanceMonitor.measure('loadSprites');
      if (duration !== null) {
        performanceMonitor.trackSpriteLoad(duration);
      }
    }
  };

  void renderBatch(0);
}

export async function refreshAssetPreview(category: string, id: number): Promise<void> {
  const spriteContainer = document.getElementById(`sprite-${id}`);
  if (!spriteContainer) return;

  invalidateAssetPreviewCache(category, id);
  spriteContainer.innerHTML = '';
  spriteContainer.appendChild(createPlaceholderImage());

  const previews = await getAppearancePreviewSpritesBatch(category, [id]);
  const previewSprite = previews.get(id);
  if (!previewSprite) {
    return;
  }

  const cacheKey = getPreviewCacheKey(category, id);
  const decoded = await getDecodedSpriteBuffer(getPreviewDecodedCacheKey(category, id), previewSprite);
  previewSpriteCache.set(cacheKey, decoded);
  spriteContainer.innerHTML = '';
  spriteContainer.appendChild(createSpriteImage(decoded));
  enqueueAnimations(category, [id]);
}

// ============================================================================
// Detail Sprites Loading Logic (Ported from assetDetails.ts)
// ============================================================================

const detailSpriteCache = new Map<string, Uint8Array[]>();
const detailSpritePromises = new Map<string, Promise<Uint8Array[]>>();

function getDetailSpriteCacheKey(category: string, id: number): string {
  return `${category}:${id}`;
}

export function getDetailSprites(category: string, id: number): Promise<Uint8Array[]> {
  const key = getDetailSpriteCacheKey(category, id);
  const cached = detailSpriteCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  const inflight = detailSpritePromises.get(key);
  if (inflight) {
    return inflight;
  }

  const promise = getAppearanceSprites(category, id)
    .then((sprites) => {
      detailSpriteCache.set(key, sprites);
      detailSpritePromises.delete(key);
      return sprites;
    })
    .catch((error) => {
      detailSpritePromises.delete(key);
      throw error;
    });

  detailSpritePromises.set(key, promise);
  return promise;
}

function getDecodedSpriteCacheKey(category: string, id: number, spriteIndex: number): string {
  return `appearance:${category}:${id}:${spriteIndex}`;
}

export type SpriteLoader = () => Promise<Uint8Array[]>;

export function createDetailSpriteLoader(category: string, id: number): SpriteLoader {
  const spritesPromise = getDetailSprites(category, id)
    .then(async (sprites) => {
      const decodedSprites = await Promise.all(
        sprites.map((sprite, index) =>
          getDecodedSpriteBuffer(getDecodedSpriteCacheKey(category, id, index), sprite)
        )
      );
      return decodedSprites;
    });
  return () => spritesPromise;
}

export function invalidateDetailSpriteCache(category: string, id: number): void {
  const key = getDetailSpriteCacheKey(category, id);
  detailSpriteCache.delete(key);
  detailSpritePromises.delete(key);
  invalidateDecodedSpriteCache(`appearance:${category}:${id}:`);
}

const INITIAL_SPRITE_RENDER_COUNT = 48;
const SPRITE_RENDER_CHUNK = 24;

export async function loadDetailSprites(
  category: string, 
  id: number, 
  spriteLoader?: SpriteLoader,
  details?: CompleteAppearanceItem | null
): Promise<void> {
  try {
    const container = document.getElementById(`detail-sprites-${id}`);
    if (!container) return;
    container.innerHTML = `<div class="sprite-loading">🔄 Loading sprites...</div>`;

    const loader = spriteLoader ?? createDetailSpriteLoader(category, id);
    const sprites = await loader();
    if (!container.isConnected) return;

    if (sprites.length === 0) {
      container.innerHTML = `
        <div class="no-sprites">
          <div class="sprite-placeholder"></div>
          <span>No sprites available</span>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'detail-sprites-grid';
    container.appendChild(grid);

    const totalSprites = sprites.length;
    let rendered = 0;

    const renderRange = (start: number, end: number) => {
      const fragment = document.createDocumentFragment();
      for (let i = start; i < end; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'detail-sprite-item';
        wrapper.dataset.aggIndex = String(i);

        const img = document.createElement('img');
        img.src = bufferToObjectUrl(sprites[i]);
        img.className = 'detail-sprite-image';
        img.alt = `Sprite ${i + 1}`;

        const indexTag = document.createElement('span');
        indexTag.className = 'sprite-index';
        indexTag.textContent = `#${i + 1}`;

        wrapper.appendChild(img);
        wrapper.appendChild(indexTag);
        fragment.appendChild(wrapper);
      }
      grid.appendChild(fragment);
      
      // Initialize animations if details provided
      if (details) {
         initDetailSpriteCardAnimations(id, sprites, details);
      }
    };

    const initialCount = Math.min(totalSprites, INITIAL_SPRITE_RENDER_COUNT);
    renderRange(0, initialCount);
    rendered = initialCount;

    const controls = document.createElement('div');
    controls.className = 'sprite-preview-meta';
    controls.textContent = `Mostrando ${rendered} de ${totalSprites} sprites.`;

    if (rendered < totalSprites) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'btn-secondary';
      loadMoreBtn.textContent = `Carregar restantes (${totalSprites - rendered})`;
      loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Carregando sprites...';

        const renderNextChunk = () => {
          const next = Math.min(rendered + SPRITE_RENDER_CHUNK, totalSprites);
          renderRange(rendered, next);
          rendered = next;
          controls.textContent = `Mostrando ${rendered} de ${totalSprites} sprites.`;
          if (rendered < totalSprites) {
            scheduleIdle(renderNextChunk);
          } else {
            controls.textContent = `Mostrando todos ${totalSprites} sprites.`;
            loadMoreBtn.remove();
          }
        };

        scheduleIdle(renderNextChunk);
      });

      const controlRow = document.createElement('div');
      controlRow.className = 'sprite-load-controls';
      controlRow.appendChild(loadMoreBtn);
      controlRow.appendChild(controls);
      container.appendChild(controlRow);
    } else {
      container.appendChild(controls);
    }
  } catch (error) {
    console.error(`Failed to load detail sprites for ${category} ${id}:`, error);
    const container = document.getElementById(`detail-sprites-${id}`);
    if (container) {
      container.innerHTML = `
        <div class="sprite-error">
          <span>❌ Failed to load sprites</span>
        </div>
      `;
    }
  }
}
