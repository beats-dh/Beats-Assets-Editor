import { invoke } from '@tauri-apps/api/core';
import { getAppearanceSprites, createSpriteImage, createPlaceholderImage } from './spriteCache';
import { stopAllAnimationPlayers, initAssetCardAutoAnimation } from './animation';

let currentCategory = 'Objects';
let currentSubcategory = 'All';
let currentPage = 0;
let currentPageSize = 50;
let currentSearch = '';
let totalItems = 0;

let autoAnimateGridEnabled = localStorage.getItem('autoAnimateGridEnabled') === 'true';

// DOM element references
let assetsGrid: HTMLElement | null = null;
let assetSearch: HTMLInputElement | null = null;
let itemsCount: HTMLElement | null = null;
let pageInfo: HTMLElement | null = null;
let prevPageBtn: HTMLButtonElement | null = null;
let nextPageBtn: HTMLButtonElement | null = null;
let pageSizeSelect: HTMLSelectElement | null = null;

export function initAssetUIElements(): void {
  assetsGrid = document.querySelector('#assets-grid');
  assetSearch = document.querySelector('#asset-search');
  itemsCount = document.querySelector('#results-count');
  pageInfo = document.querySelector('#page-info');
  prevPageBtn = document.querySelector('#prev-page');
  nextPageBtn = document.querySelector('#next-page');
  pageSizeSelect = document.querySelector('#page-size');
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

export function getAutoAnimateGridEnabled(): boolean {
  return autoAnimateGridEnabled;
}

export function setAutoAnimateGridEnabled(enabled: boolean): void {
  autoAnimateGridEnabled = enabled;
}

export async function loadAssets(): Promise<void> {
  if (!assetsGrid) return;

  try {
    showLoadingState();

    if (currentCategory === 'Sounds') {
      // Determine subcategory
      const sub = currentSubcategory;

      if (sub === 'Ambience Streams') {
        const totalCount = await invoke('get_ambience_stream_count');
        totalItems = totalCount as number;
        const assets = await invoke('list_ambience_streams', {
          page: currentPage,
          pageSize: currentPageSize
        });
        displayAmbienceStreams(assets as any[]);
        updatePaginationInfo();
      } else if (sub === 'Ambience Object Streams') {
        const totalCount = await invoke('get_ambience_object_stream_count');
        totalItems = totalCount as number;
        const assets = await invoke('list_ambience_object_streams', {
          page: currentPage,
          pageSize: currentPageSize
        });
        displayAmbienceObjectStreams(assets as any[]);
        updatePaginationInfo();
      } else if (sub === 'Music Templates') {
        const totalCount = await invoke('get_music_template_count');
        totalItems = totalCount as number;
        const assets = await invoke('list_music_templates', {
          page: currentPage,
          pageSize: currentPageSize
        });
        displayMusicTemplates(assets as any[]);
        updatePaginationInfo();
      } else {
        // Numeric sound effects (All or specific type)
        const totalCount = await invoke('get_sound_effect_count');
        totalItems = totalCount as number;

        const soundType = currentSubcategory !== 'All' ? currentSubcategory : null;
        const assets = await invoke('list_numeric_sound_effects', {
          page: currentPage,
          pageSize: currentPageSize,
          soundType
        });

        displaySounds(assets as any[]);
        updatePaginationInfo();
      }
    } else {
      // Get total count
      const totalCount = await invoke('get_appearance_count', {
        category: currentCategory,
        search: currentSearch || null,
        subcategory: currentCategory === 'Objects' && currentSubcategory !== 'All' ? currentSubcategory : null
      });
      totalItems = totalCount as number;

      // Load assets for current page
      const assets = await invoke('list_appearances_by_category', {
        category: currentCategory,
        page: currentPage,
        pageSize: currentPageSize,
        search: currentSearch || null,
        subcategory: currentCategory === 'Objects' && currentSubcategory !== 'All' ? currentSubcategory : null
      });

      displayAssets(assets as any[]);
      updatePaginationInfo();
    }
  } catch (error) {
    console.error('Error loading assets:', error);
    showErrorState(error as string);
  }
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

async function displayAssets(assets: any[]): Promise<void> {
  if (!assetsGrid) return;

  if (assets.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Assets Found</h3>
        <p>No assets match your current search criteria.</p>
      </div>
    `;
    return;
  }

  // Create asset items with placeholders first
  assetsGrid.innerHTML = assets.map(asset => `
    <div class="asset-item" data-asset-id="${asset.id}" data-category="${currentCategory}">
      <div class="asset-item-header">
        <span class="asset-id">#${asset.id}</span>
        <div class="asset-flags">
          ${asset.has_flags ? '<div class="flag-indicator" title="Has flags"></div>' : ''}
        </div>
      </div>
      <div class="asset-image-container" id="sprite-${asset.id}">
        <div class="sprite-loading">🔄</div>
      </div>
      <div class="asset-name">${asset.name || 'Unnamed'}</div>
      <div class="asset-description">${asset.description || 'No description'}</div>
      <div class="asset-meta">
        <span>Sprites: ${asset.sprite_count}</span>
        <span>${currentCategory.slice(0, -1)}</span>
      </div>
    </div>
  `).join('');

  // Load sprites asynchronously
  loadSpritesForAssets(assets);
}

async function loadSpritesForAssets(assets: any[]): Promise<void> {
  for (const asset of assets) {
    try {
      const sprites = await getAppearanceSprites(currentCategory, asset.id);
      const container = document.getElementById(`sprite-${asset.id}`);

      if (container) {
        if (sprites.length > 0) {
          const img = createSpriteImage(sprites[0]);
          container.innerHTML = '';
          container.appendChild(img);
          initAssetCardAutoAnimation(currentCategory, asset.id, sprites, autoAnimateGridEnabled);
        } else {
          const placeholder = createPlaceholderImage();
          container.innerHTML = '';
          container.appendChild(placeholder);
        }
      }
    } catch (error) {
      console.warn(`Failed to load sprite for asset ${asset.id}:`, error);
      const container = document.getElementById(`sprite-${asset.id}`);
      if (container) {
        const placeholder = createPlaceholderImage();
        container.innerHTML = '';
        container.appendChild(placeholder);
      }
    }
  }
}

function displaySounds(sounds: any[]): void {
  if (!assetsGrid) return;

  if (sounds.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Sounds Found</h3>
        <p>No sounds match your current filter criteria.</p>
      </div>
    `;
    return;
  }

  // Create sound items
  assetsGrid.innerHTML = sounds.map(sound => {
    const soundType = sound.sound_type || 'Unknown';
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
}

function displayAmbienceStreams(streams: any[]): void {
  if (!assetsGrid) return;

  if (streams.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Ambience Streams Found</h3>
        <p>No ambience streams in current page.</p>
      </div>
    `;
    return;
  }

  assetsGrid.innerHTML = streams.map(stream => {
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
}

function displayAmbienceObjectStreams(streams: any[]): void {
  if (!assetsGrid) return;

  if (streams.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Ambience Object Streams Found</h3>
        <p>No ambience object streams in current page.</p>
      </div>
    `;
    return;
  }

  assetsGrid.innerHTML = streams.map(stream => {
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
}

function displayMusicTemplates(templates: any[]): void {
  if (!assetsGrid) return;

  if (templates.length === 0) {
    assetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>📭 No Music Templates Found</h3>
        <p>No music templates in current page.</p>
      </div>
    `;
    return;
  }

  assetsGrid.innerHTML = templates.map(t => {
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
          Type: ${t.music_type || 'Unknown'}
        </div>
      </div>
    `;
  }).join('');
}

function updatePaginationInfo(): void {
  const totalPages = Math.ceil(totalItems / currentPageSize);

  if (itemsCount) {
    itemsCount.textContent = `${totalItems} itens`;
  }

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 0;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages - 1;
  }
}

export function changePage(newPage: number): void {
  const totalPages = Math.ceil(totalItems / currentPageSize);
  if (newPage >= 0 && newPage < totalPages) {
    currentPage = newPage;
    loadAssets();
  }
}

export function performSearch(): void {
  if (assetSearch) {
    currentSearch = assetSearch.value.trim();
    currentPage = 0;
    loadAssets();
  }
}

export function clearSearch(): void {
  if (assetSearch) {
    assetSearch.value = '';
    currentSearch = '';
    currentPage = 0;
    loadAssets();
  }
}

export function switchCategory(category: string): void {
  currentCategory = category;
  currentPage = 0;
  currentSearch = '';
  currentSubcategory = 'All';

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
  document.querySelector('#search-btn')?.addEventListener('click', performSearch);
  document.querySelector('#clear-search')?.addEventListener('click', clearSearch);
  assetSearch?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
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
