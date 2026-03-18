import { getAppearancePreviewSpritesBatch, createSpriteImage, createPlaceholderImage, getAppearanceSprites } from '../spriteCache';
import { initAssetCardAutoAnimation, initDetailSpriteCardAnimations } from '../animation';
import { decodeSpriteOffThread } from './imageDecodeWorkerClient';
import { appearanceCache } from './cacheRegistry';
import type { CompleteAppearanceItem } from '../types';
import { isElementIdInViewport } from './viewportUtils';
import { performanceMonitor } from './performanceMonitor';
import { perfConfig } from '../stores/performanceConfig.svelte';

const animationQueue: Array<{ category: string; id: number }> = [];
const enqueuedAnimations = new Set<string>();
let processingAnimations = false;

const scheduleIdle = (cb: () => void): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout: perfConfig.idleCallbackTimeout });
  } else {
    setTimeout(cb, 0);
  }
};

const prefixLoadIds = new Map<string, number>();

export function clearPreviewSpriteCaches(): void {
  appearanceCache.clearAllPreviews();
}

export function clearAssetsQueryCachesForSprites(): void {
  enqueuedAnimations.clear();
  animationQueue.length = 0;
  processingAnimations = false;
}

function invalidateAssetPreviewCache(category: string, id: number): void {
  appearanceCache.clearPreview(category, id);
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
      animationQueue.sort((a, b) => {
        const aElement = document.getElementById(`sprite-${a.id}`);
        const bElement = document.getElementById(`sprite-${b.id}`);

        if (!aElement && !bElement) return 0;
        if (!aElement) return 1;
        if (!bElement) return -1;

        const aInViewport = isElementIdInViewport(`sprite-${a.id}`, 0.05);
        const bInViewport = isElementIdInViewport(`sprite-${b.id}`, 0.05);

        if (aInViewport && !bInViewport) return -1;
        if (!aInViewport && bInViewport) return 1;

        return 0;
      });

      let processed = 0;
      const stored = localStorage.getItem('autoAnimateGridEnabled');
      const autoAnimate = stored === 'true';

      while (animationQueue.length > 0 && processed < perfConfig.animationBatchSize) {
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

export async function loadSpritesForAssets(assets: CompleteAppearanceItem[], category: string, prefix: string = "sprite-", skipAnimations: boolean = false): Promise<void> {
  if (assets.length === 0) return;

  performanceMonitor.mark('loadSprites');

  const thisLoadId = (prefixLoadIds.get(prefix) || 0) + 1;
  prefixLoadIds.set(prefix, thisLoadId);
  const loadCategory = category;

  const missingIds: number[] = [];
  const readyToAnimate: number[] = [];

  for (const asset of assets) {
    const container = document.getElementById(`${prefix}${asset.id}`);
    if (!container) continue;

    if (container.querySelector('canvas') && container.dataset.spriteFor === String(asset.id)) {
      readyToAnimate.push(asset.id);
      continue;
    }

    container.innerHTML = '';
    container.dataset.spriteFor = String(asset.id);

    const cachedPreview = appearanceCache.getPreview(loadCategory, asset.id);
    if (cachedPreview) {
      container.appendChild(createSpriteImage(cachedPreview));
      readyToAnimate.push(asset.id);
    } else {
      container.appendChild(createPlaceholderImage());
      missingIds.push(asset.id);
    }
  }

  if (readyToAnimate.length > 0 && !skipAnimations) {
    enqueueAnimations(loadCategory, readyToAnimate);
  }

  const totalRequests = assets.length;
  const cacheHits = readyToAnimate.length;
  performanceMonitor.trackCacheHitRate(cacheHits, totalRequests);

  if (missingIds.length === 0) return;

  performanceMonitor.mark('batchLoad');

  const assetById = new Map<number, any>();
  assets.forEach(asset => assetById.set(asset.id, asset));

  const renderPreviews = async (previews: Map<number, Uint8Array>): Promise<void> => {
    if (thisLoadId !== prefixLoadIds.get(prefix)) return;
    const batchReady: number[] = [];
    for (const [assetId, previewSprite] of previews) {
      const asset = assetById.get(assetId);
      if (!asset) continue;
      const container = document.getElementById(`${prefix}${asset.id}`);
      if (!container || container.querySelector('canvas')) continue;

      let decoded = previewSprite;
      try {
        const result = await decodeSpriteOffThread(previewSprite);
        if (result) decoded = new Uint8Array(result);
      } catch { /* fallback: use raw */ }

      appearanceCache.setPreview(loadCategory, asset.id, decoded);

      container.innerHTML = '';
      container.appendChild(createSpriteImage(decoded));
      batchReady.push(asset.id);
    }
    if (batchReady.length > 0 && !skipAnimations) enqueueAnimations(loadCategory, batchReady);
  };

  const previews = await getAppearancePreviewSpritesBatch(loadCategory, missingIds, renderPreviews);
  await renderPreviews(previews);

  const batchDuration = performanceMonitor.measure('batchLoad');
  if (batchDuration !== null) performanceMonitor.trackBatchLoad(batchDuration);
  const duration = performanceMonitor.measure('loadSprites');
  if (duration !== null) performanceMonitor.trackSpriteLoad(duration);
}

export async function refreshAssetPreview(category: string, id: number): Promise<void> {
  const spriteContainer = document.getElementById(`sprite-${id}`);
  if (!spriteContainer) return;

  invalidateAssetPreviewCache(category, id);
  spriteContainer.innerHTML = '';
  spriteContainer.appendChild(createPlaceholderImage());

  const previews = await getAppearancePreviewSpritesBatch(category, [id]);
  const previewSprite = previews.get(id);
  if (!previewSprite) return;

  let decoded = previewSprite;
  try {
    const result = await decodeSpriteOffThread(previewSprite);
    if (result) decoded = new Uint8Array(result);
  } catch { /* fallback */ }

  appearanceCache.setPreview(category, id, decoded);
  spriteContainer.innerHTML = '';
  spriteContainer.appendChild(createSpriteImage(decoded));
  enqueueAnimations(category, [id]);
}

// ============================================================================
// Detail Sprites Loading Logic
// ============================================================================

export function getDetailSprites(category: string, id: number): Promise<Uint8Array[]> {
  const cached = appearanceCache.getRawSprites(category, id);
  if (cached) return Promise.resolve(cached);

  const inflight = appearanceCache.getInflight(category, id);
  if (inflight) return inflight;

  const promise = getAppearanceSprites(category, id)
    .then((sprites) => {
      appearanceCache.clearInflight(category, id);
      return sprites;
    })
    .catch((error) => {
      appearanceCache.clearInflight(category, id);
      throw error;
    });

  appearanceCache.setInflight(category, id, promise);
  return promise;
}

export type SpriteLoader = () => Promise<Uint8Array[]>;

export function createDetailSpriteLoader(category: string, id: number): SpriteLoader {
  const spritesPromise = getDetailSprites(category, id)
    .then(async () => {
      const decoded = await appearanceCache.getOrDecodeSprites(category, id);
      return decoded ?? [];
    });
  return () => spritesPromise;
}

export function invalidateDetailSpriteCache(category: string, id: number): void {
  appearanceCache.invalidate(category, id);
}

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

        const spriteCanvas = createSpriteImage(sprites[i], 'detail-sprite-image');

        const indexTag = document.createElement('span');
        indexTag.className = 'sprite-index';
        indexTag.textContent = `#${i + 1}`;

        wrapper.appendChild(spriteCanvas);
        wrapper.appendChild(indexTag);
        fragment.appendChild(wrapper);
      }
      grid.appendChild(fragment);

      if (details) {
        initDetailSpriteCardAnimations(id, sprites, details);
      }
    };

    const initialCount = Math.min(totalSprites, perfConfig.initialSpriteRenderCount);
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
          const next = Math.min(rendered + perfConfig.spriteRenderChunk, totalSprites);
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
