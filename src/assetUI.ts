import { invoke } from '@tauri-apps/api/core';
import { getAppearancePreviewSpritesBatch, createSpriteImage, createPlaceholderImage } from './spriteCache';
import { stopAllAnimationPlayers, initAssetCardAutoAnimation } from './animation';
import { isAssetSelected } from './assetSelection';
import { translate } from './i18n';
import { updateActionButtonStates } from './importExport';
import { getDecodedSpriteBuffer, invalidateDecodedSpriteCache } from './utils/decodedSpriteCache';

let currentCategory = 'Objects';
let currentSubcategory = 'All';
let currentPage = 0;
let currentPageSize = 100;
let currentSearch = '';
let totalItems = 0;
let pendingScrollToId: number | null = null;
let currentLoadId = 0; // Track current load operation to cancel stale ones

const storedAnimationPreference = localStorage.getItem('autoAnimateGridEnabled');
let autoAnimateGridEnabled: boolean;
if (storedAnimationPreference === null) {
  // Auto animação da grade desabilitada por padrão para evitar carga pesada ao abrir a página
  autoAnimateGridEnabled = false;
  localStorage.setItem('autoAnimateGridEnabled', 'false');
} else {
  autoAnimateGridEnabled = storedAnimationPreference === 'true';
}

// DOM element references
let assetsGrid: HTMLElement | null = null;
let assetSearch: HTMLInputElement | null = null;
let itemsCount: HTMLElement | null = null;
let pageInfo: HTMLElement | null = null;
let prevPageBtn: HTMLButtonElement | null = null;
let nextPageBtn: HTMLButtonElement | null = null;
let pageSizeSelect: HTMLSelectElement | null = null;
const assetsQueryCache = new Map<string, { ids: number[]; itemsById: Map<number, any>; total: number | null }>();
const previewSpriteCache = new Map<string, Uint8Array>();
const animationQueue: Array<{ category: string; id: number }> = [];
const enqueuedAnimations = new Set<string>();
let processingAnimations = false;
const PREVIEW_BATCH_SIZE = 12;
const ANIMATION_BATCH_SIZE = 24;
const scheduleIdle = (cb: () => void): void => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout: 32 });
  } else {
    setTimeout(cb, 0);
  }
};

export interface LoadAssetsOptions {
  append?: boolean;
}

export interface AssetsGridRenderedEventDetail {
  append: boolean;
  renderedCount: number;
  totalItems: number;
  category: string;
  page: number;
  pageSize: number;
}

export function initAssetUIElements(): void {
  assetsGrid = document.querySelector('#assets-grid');
  assetSearch = document.querySelector('#asset-search');
  itemsCount = document.querySelector('#results-count');
  pageInfo = document.querySelector('#page-info');
  prevPageBtn = document.querySelector('#prev-page');
  nextPageBtn = document.querySelector('#next-page');
  pageSizeSelect = document.querySelector('#page-size');

  if (pageSizeSelect) {
    pageSizeSelect.value = String(currentPageSize);
  }
}

export function getCurrentCategory(): string {
  return currentCategory;
}

export function setCurrentCategory(category: string): void {
  currentCategory = category;
}

export function getCurrentSubcategory(): string {
  return currentSubcategory;
}

export function setCurrentSubcategory(subcategory: string): void {
  currentSubcategory = subcategory;
}

export function getCurrentPage(): number {
  return currentPage;
}

export function setCurrentPage(page: number): void {
  currentPage = page;
}

export function getCurrentPageSize(): number {
  return currentPageSize;
}

export function setCurrentPageSize(size: number): void {
  currentPageSize = size;
}

export function getCurrentSearch(): string {
  return currentSearch;
}

export function setCurrentSearch(search: string): void {
  currentSearch = search;
}

export function getTotalItemsCount(): number {
  return totalItems;
}

export function getAutoAnimateGridEnabled(): boolean {
  return autoAnimateGridEnabled;
}

export function setAutoAnimateGridEnabled(enabled: boolean): void {
  autoAnimateGridEnabled = enabled;
}


export function clearPreviewSpriteCaches(): void {
  previewSpriteCache.clear();
  invalidateDecodedSpriteCache('appearance-preview:');
}

export function clearAssetsQueryCaches(): void {
  assetsQueryCache.clear();
  enqueuedAnimations.clear();
  animationQueue.length = 0;
  processingAnimations = false;
}

function getQueryKey(): string {
  const subSel = currentCategory === 'Objects' ? currentSubcategory : 'All';
  return `${currentCategory}|${currentSearch}|${subSel}`;
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

function getCachedPage(page: number, pageSize: number): { items: any[]; total: number } | null {
  const key = getQueryKey();
  const cached = assetsQueryCache.get(key);
  if (!cached) return null;

  const start = page * pageSize;
  const end = Math.min(start + pageSize, cached.total ?? cached.ids.length);

  if (cached.ids.length < end) return null;

  const sliceIds = cached.ids.slice(start, end);
  const pageItems = sliceIds.map(id => cached.itemsById.get(id)).filter(Boolean);
  if (pageItems.length !== sliceIds.length) return null;

  return { items: pageItems, total: cached.total ?? cached.ids.length };
}

function updateQueryCache(items: any[], total: number): void {
  const key = getQueryKey();
  let cached = assetsQueryCache.get(key);
  if (!cached) {
    cached = { ids: [], itemsById: new Map<number, any>(), total: total ?? null };
  }

  for (const item of items) {
    cached.itemsById.set(item.id, item);
    if (!cached.ids.includes(item.id)) {
      cached.ids.push(item.id);
    }
  }

  cached.total = total ?? cached.total;
  cached.ids.sort((a, b) => a - b);
  assetsQueryCache.set(key, cached);
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
    const isVisible = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const verticallyVisible = rect.top < vh * 0.95 && rect.bottom > vh * 0.05;
      const horizontallyVisible = rect.left < vw && rect.right > 0;
      return verticallyVisible && horizontallyVisible;
    };

    const process = (): void => {
      let processed = 0;
      while (animationQueue.length > 0 && processed < ANIMATION_BATCH_SIZE) {
        const item = animationQueue.shift();
        if (!item) break;
        enqueuedAnimations.delete(`${item.category}:${item.id}`);
        const container = document.getElementById(`sprite-${item.id}`);
        const forceStart = !!(container && isVisible(container));
        initAssetCardAutoAnimation(item.category, item.id, autoAnimateGridEnabled, forceStart);
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

export async function loadAssets(options: LoadAssetsOptions = {}): Promise<void> {
  if (!assetsGrid) return;

  const append = options.append === true;
  let renderedCount = 0;
  const cachedPage = !append ? getCachedPage(currentPage, currentPageSize) : null;

  try {
    if (!append && !cachedPage) {
      showLoadingState();
    }

    if (currentCategory === 'Sounds') {
      // Determine subcategory
      const sub = currentSubcategory;

      if (sub === 'Ambience Streams') {
        const response = await invoke('list_ambience_streams', {
          page: currentPage,
          pageSize: currentPageSize
        }) as { total: number; items: any[] };
        totalItems = response.total;
        renderedCount = response.items.length;
        displayAmbienceStreams(response.items, append);
        updatePaginationInfo();
      } else if (sub === 'Ambience Object Streams') {
        const response = await invoke('list_ambience_object_streams', {
          page: currentPage,
          pageSize: currentPageSize
        }) as { total: number; items: any[] };
        totalItems = response.total;
        renderedCount = response.items.length;
        displayAmbienceObjectStreams(response.items, append);
        updatePaginationInfo();
      } else if (sub === 'Music Templates') {
        const response = await invoke('list_music_templates', {
          page: currentPage,
          pageSize: currentPageSize
        }) as { total: number; items: any[] };
        totalItems = response.total;
        renderedCount = response.items.length;
        displayMusicTemplates(response.items, append);
        updatePaginationInfo();
      } else {
        // Numeric sound effects (All or specific type)
        const soundType = currentSubcategory !== 'All' ? currentSubcategory : null;
        const response = await invoke('list_numeric_sound_effects', {
          page: currentPage,
          pageSize: currentPageSize,
          soundType
        }) as { total: number; items: any[] };

        totalItems = response.total;
        renderedCount = response.items.length;
        displaySounds(response.items, append);
        updatePaginationInfo();
      }
    } else {
      if (cachedPage && cachedPage.items.length > 0) {
        totalItems = cachedPage.total;
        renderedCount = cachedPage.items.length;
        displayAssets(cachedPage.items, false);
        updatePaginationInfo();
        document.dispatchEvent(new CustomEvent<AssetsGridRenderedEventDetail>('assets-grid-rendered', {
          detail: {
            append,
            renderedCount,
            totalItems,
            category: currentCategory,
            page: currentPage,
            pageSize: currentPageSize
          }
        }));
        return;
      }

      // Load assets for current page (now returns items + total in one IPC)
      const response = await invoke('list_appearances_by_category', {
        category: currentCategory,
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || null,
        subcategory: currentCategory === 'Objects' && currentSubcategory !== 'All' ? currentSubcategory : null
      }) as { total: number; items: any[] };

      totalItems = response.total;

      const appearanceAssets = response.items;
      renderedCount = appearanceAssets.length;
      displayAssets(appearanceAssets, append);
      updatePaginationInfo();
      updateQueryCache(appearanceAssets, totalItems);
    }

    const renderedEvent: AssetsGridRenderedEventDetail = {
      append,
      renderedCount,
      totalItems,
      category: currentCategory,
      page: currentPage,
      pageSize: currentPageSize
    };
    document.dispatchEvent(new CustomEvent<AssetsGridRenderedEventDetail>('assets-grid-rendered', {
      detail: renderedEvent
    }));

    if (!append && pendingScrollToId !== null) {
      const targetId = pendingScrollToId;
      pendingScrollToId = null;
      requestAnimationFrame(() => {
        focusAssetInView(targetId);
      });
    }
  } catch (error) {
    console.error('Error loading assets:', error);
    if (!append) {
      showErrorState(error as string);
    }
    pendingScrollToId = null;
  }
}

function focusAssetInView(assetId: number): void {
  if (!assetsGrid) return;
  const assetElement = assetsGrid.querySelector<HTMLElement>(`.asset-item[data-asset-id="${assetId}"]`);
  if (!assetElement) return;

  assetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

function showLoadingState(): void {
  stopAllAnimationPlayers();
  if (assetsGrid) {
    assetsGrid.innerHTML = `
      <div class="loading-spinner">
        <div>🔄 Loading assets...</div>
      </div>
    `;
  }
}

function showErrorState(error: string): void {
  if (assetsGrid) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>❌ Error Loading Assets</h3>
        <p>${error}</p>
      </div>
    `;
  }
}

async function displayAssets(assets: any[], append = false): Promise<void> {
  if (!assetsGrid) return;

  if (!append && assets.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Assets Found</h3>
        <p>No assets match your current search criteria.</p>
      </div>
    `;
    return;
  }

  // Create asset items with placeholders first
  const categoriesWithoutNames = new Set(['Effects', 'Missiles', 'Outfits']);
  const shouldShowName = !categoriesWithoutNames.has(currentCategory);

  const html = assets.map(asset => {
    const selected = isAssetSelected(currentCategory, asset.id);

    return `
    <div class="asset-item${selected ? ' is-selected' : ''}" data-asset-id="${asset.id}" data-category="${currentCategory}">
      <label class="asset-select-control" aria-label="Select appearance #${asset.id}">
        <input type="checkbox" class="asset-select-checkbox" data-asset-id="${asset.id}" data-category="${currentCategory}" ${selected ? 'checked' : ''} />
        <span class="asset-select-indicator" aria-hidden="true"></span>
      </label>
      <div class="asset-id">#${asset.id}</div>
      <div class="asset-visual-row">
        <div class="asset-image-container" id="sprite-${asset.id}">
          <div class="asset-image-overlay">
            <div class="asset-flags">
              ${asset.has_flags ? '<div class="flag-indicator" title="Has flags"></div>' : ''}
            </div>
          </div>
          <div class="sprite-loading">🔄</div>
        </div>
      </div>
      ${shouldShowName ? `<div class="asset-name">${asset.name || 'Unnamed'}</div>` : ''}
    </div>
  `; }).join('');

  if (append) {
    assetsGrid.insertAdjacentHTML('beforeend', html);
  } else {
    stopAllAnimationPlayers();
    resetAnimationQueue();
    assetsGrid.innerHTML = html;
  }

  // Load sprites asynchronously
  loadSpritesForAssets(assets);
}

async function loadSpritesForAssets(assets: any[]): Promise<void> {
  if (assets.length === 0) return;

  // Increment load ID to invalidate previous load operations
  const thisLoadId = ++currentLoadId;
  const loadCategory = currentCategory;

  // Pré-visualização: carregar apenas o primeiro sprite por asset (batch + cache backend)
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

  if (missingIds.length === 0) {
    return;
  }

  const previews = await getAppearancePreviewSpritesBatch(loadCategory, missingIds);
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

    const endIndex = Math.min(startIndex + PREVIEW_BATCH_SIZE, missingIds.length);
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
    }
  };

  void renderBatch(0);
}

export async function refreshAssetPreview(category: string, id: number): Promise<void> {
  if (!assetsGrid) return;
  const assetItem = assetsGrid.querySelector<HTMLElement>(`.asset-item[data-asset-id="${id}"]`);
  if (!assetItem) return;

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

function displaySounds(sounds: any[], append = false): void {
  if (!assetsGrid) return;

  if (!append && sounds.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Sounds Found</h3>
        <p>No sounds match your current filter criteria.</p>
      </div>
    `;
    return;
  }

  // Create sound items
  const html = sounds.map(sound => {
    const soundType = sound.sound_type || translate('general.unknown');
    const hasSoundFile = sound.sound_id !== null && sound.sound_id !== undefined;
    const hasRandomSounds = sound.random_sound_ids && sound.random_sound_ids.length > 0;

    return `
      <div class="asset-item sound-item" data-asset-id="${sound.id}" data-category="Sounds">
        <div class="asset-item-header">
          <span class="asset-id">#${sound.id}</span>
          <div class="asset-flags">
            ${hasSoundFile ? '<div class="sound-indicator" title="Has sound file">🎵</div>' : ''}
            ${hasRandomSounds ? '<div class="random-indicator" title="Random sounds">🎲</div>' : ''}
          </div>
        </div>
        <div class="asset-image-container sound-icon-container">
          <div class="sound-icon-large">🔊</div>
        </div>
        <div class="asset-name">${soundType}</div>
        <div class="asset-description">
          ${hasSoundFile ? `Sound: ${sound.sound_id}` : ''}
          ${hasRandomSounds ? `Random: ${sound.random_sound_ids.length} files` : ''}
        </div>
        <div class="asset-meta">
          ${sound.volume !== null && sound.volume !== undefined ? `<span>Vol: ${sound.volume}</span>` : ''}
          ${sound.loop ? '<span>Loop</span>' : ''}
        </div>
      </div>
    `;
  }).join('');

  if (append) {
    assetsGrid.insertAdjacentHTML('beforeend', html);
  } else {
    assetsGrid.innerHTML = html;
  }
}

function displayAmbienceStreams(streams: any[], append = false): void {
  if (!assetsGrid) return;

  if (!append && streams.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Ambience Streams Found</h3>
        <p>No ambience streams in current page.</p>
      </div>
    `;
    return;
  }

  const html = streams.map(stream => {
    const hasDelayed = stream.delayed_effects && stream.delayed_effects.length > 0;
    return `
      <div class="asset-item sound-item" data-asset-id="${stream.id}" data-category="Sounds">
        <div class="asset-item-header">
          <span class="asset-id">#${stream.id}</span>
          <div class="asset-flags">
            <div class="sound-indicator" title="Looping Sound">🔁 ${stream.looping_sound_id}</div>
            ${hasDelayed ? '<div class="random-indicator" title="Delayed effects">⏱️</div>' : ''}
          </div>
        </div>
        <div class="asset-image-container sound-icon-container">
          <div class="sound-icon-large">🌫️</div>
        </div>
        <div class="asset-name">Ambience Stream</div>
        <div class="asset-description">
          Loop: ${stream.looping_sound_id} ${hasDelayed ? ` • Delays: ${stream.delayed_effects.length}` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (append) {
    assetsGrid.insertAdjacentHTML('beforeend', html);
  } else {
    assetsGrid.innerHTML = html;
  }
}

function displayAmbienceObjectStreams(streams: any[], append = false): void {
  if (!assetsGrid) return;

  if (!append && streams.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Ambience Object Streams Found</h3>
        <p>No ambience object streams in current page.</p>
      </div>
    `;
    return;
  }

  const html = streams.map(stream => {
    const hasEffects = stream.sound_effects && stream.sound_effects.length > 0;
    return `
      <div class="asset-item sound-item" data-asset-id="${stream.id}" data-category="Sounds">
        <div class="asset-item-header">
          <span class="asset-id">#${stream.id}</span>
          <div class="asset-flags">
            ${hasEffects ? '<div class="random-indicator" title="Effects by count">🔢</div>' : ''}
            ${stream.max_sound_distance !== null && stream.max_sound_distance !== undefined ? `<div class="sound-indicator" title="Max distance">📏 ${stream.max_sound_distance}</div>` : ''}
          </div>
        </div>
        <div class="asset-image-container sound-icon-container">
          <div class="sound-icon-large">🪵</div>
        </div>
        <div class="asset-name">Ambience Object Stream</div>
        <div class="asset-description">
          Types: ${stream.counted_appearance_types.length} • Effects: ${hasEffects ? stream.sound_effects.length : 0}
        </div>
      </div>
    `;
  }).join('');

  if (append) {
    assetsGrid.insertAdjacentHTML('beforeend', html);
  } else {
    assetsGrid.innerHTML = html;
  }
}

function displayMusicTemplates(templates: any[], append = false): void {
  if (!assetsGrid) return;

  if (!append && templates.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Music Templates Found</h3>
        <p>No music templates in current page.</p>
      </div>
    `;
    return;
  }

  const html = templates.map(t => {
    return `
      <div class="asset-item sound-item" data-asset-id="${t.id}" data-category="Sounds">
        <div class="asset-item-header">
          <span class="asset-id">#${t.id}</span>
          <div class="asset-flags">
            <div class="sound-indicator" title="Sound ID">🎵 ${t.sound_id}</div>
          </div>
        </div>
        <div class="asset-image-container sound-icon-container">
          <div class="sound-icon-large">🎼</div>
        </div>
        <div class="asset-name">Music Template</div>
        <div class="asset-description">
          Type: ${t.music_type || translate('general.unknown')}
        </div>
      </div>
    `;
  }).join('');

  if (append) {
    assetsGrid.insertAdjacentHTML('beforeend', html);
  } else {
    assetsGrid.innerHTML = html;
  }
}

function updatePaginationInfo(): void {
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  const currentPageIndex = Math.min(currentPage, totalPages - 1);
  if (currentPage !== currentPageIndex) {
    currentPage = currentPageIndex;
  }
  const startItem = totalItems === 0 ? 0 : currentPageIndex * currentPageSize + 1;
  const endItem = totalItems === 0
    ? 0
    : Math.min(totalItems, (currentPageIndex + 1) * currentPageSize);

  if (itemsCount) {
    itemsCount.textContent = totalItems === 0
      ? translate('count.items', { count: 0 })
      : translate('results.range', { start: startItem, end: endItem, total: totalItems });
  }

  if (pageInfo) {
    pageInfo.textContent = translate('pagination.pageInfo', {
      current: totalItems === 0 ? 1 : currentPageIndex + 1,
      total: totalItems === 0 ? 1 : totalPages
    });
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPageIndex <= 0;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPageIndex >= totalPages - 1;
  }

  if (pageSizeSelect) {
    pageSizeSelect.value = String(currentPageSize);
  }
}

export function changePage(newPage: number): void {
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  if (newPage >= 0 && newPage < totalPages) {
    currentPage = newPage;
    loadAssets();
  }
}

export async function performSearch(): Promise<void> {
  if (!assetSearch) return;

  const rawInput = assetSearch.value.trim();
  if (!rawInput) {
    currentSearch = '';
    pendingScrollToId = null;
    currentPage = 0;
    await loadAssets();
    return;
  }

  // Set search term and filter results
  // Works for both numeric (ID) and text (name) searches
  currentSearch = rawInput;
  currentPage = 0;
  pendingScrollToId = null;
  await loadAssets();
}

export async function clearSearch(): Promise<void> {
  if (!assetSearch) return;

  assetSearch.value = '';
  currentSearch = '';
  pendingScrollToId = null;
  currentPage = 0;
  await loadAssets();
}

export function switchCategory(category: string): void {
  currentCategory = category;
  currentPage = 0;
  currentSearch = '';
  currentSubcategory = 'All';
  pendingScrollToId = null;

  if (assetSearch) {
    assetSearch.value = '';
  }

  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`)?.classList.add('active');

  // Show/hide subcategory selector based on category
  const subcategoryContainer = document.getElementById('subcategory-container');
  if (subcategoryContainer) {
    if (category === 'Objects') {
      subcategoryContainer.style.display = 'flex';
      loadSubcategories();
    } else {
      subcategoryContainer.style.display = 'none';
    }
  }

  // Update action bar visibility based on category
  updateActionButtonStates();

  loadAssets();
}

export async function loadSubcategories(): Promise<void> {
  try {
    const subcategories = await invoke('get_item_subcategories') as [string, string][];
    const subcategorySelect = document.getElementById('subcategory-select') as HTMLSelectElement;

    if (subcategorySelect) {
      subcategorySelect.innerHTML = '';

      subcategories.forEach(([value, displayName]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = displayName;
        subcategorySelect.appendChild(option);
      });

      subcategorySelect.value = currentSubcategory;
    }
  } catch (error) {
    console.error('Error loading subcategories:', error);
  }
}

export function switchSubcategory(subcategory: string): void {
  currentSubcategory = subcategory;
  currentPage = 0;
  pendingScrollToId = null;
  loadAssets();
}

export function setupAssetsPaginationListeners(): void {
  prevPageBtn?.addEventListener('click', () => changePage(currentPage - 1));
  nextPageBtn?.addEventListener('click', () => changePage(currentPage + 1));
  pageSizeSelect?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    currentPageSize = parseInt(target.value);
    currentPage = 0;
    loadAssets();
  });
}

export function setupAssetsSearchListeners(): void {
  const clearButton = document.querySelector('#clear-search') as HTMLButtonElement | null;
  const searchButton = document.querySelector('#search-btn');

  const updateClearButtonVisibility = (): void => {
    if (!assetSearch || !clearButton) return;
    clearButton.style.display = assetSearch.value.trim() ? 'flex' : 'none';
  };

  searchButton?.addEventListener('click', () => { void performSearch(); });
  clearButton?.addEventListener('click', () => { void clearSearch(); updateClearButtonVisibility(); });

  assetSearch?.addEventListener('input', updateClearButtonVisibility);
  assetSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void performSearch();
    }
  });

  updateClearButtonVisibility();
}

export function setupAssetsCategoryListeners(): void {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const category = target.dataset.category;
      if (category) {
        switchCategory(category);
      }
    });
  });

  document.querySelector('#subcategory-select')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    switchSubcategory(target.value);
  });
}
