import { invoke } from '@tauri-apps/api/core';
import { getAppearanceSprites, createSpriteImage, createPlaceholderImage, getSpritesCacheKey, clearSpritesCache } from './spriteCache';
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
