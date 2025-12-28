import {
  getCurrentCategory,
  getCurrentPage,
  getCurrentPageSize,
  getTotalItemsCount,
  loadAssets,
  setCurrentPage
} from '../../assetUI';
import type { AssetsGridRenderedEventDetail, LoadAssetsOptions } from '../../assetUI';

const SENTINEL_ID = 'assets-grid-sentinel';
const OBSERVER_ROOT_MARGIN = '0px 0px 600px 0px';

let observer: IntersectionObserver | null = null;
let loading = false;
let initialized = false;
let hasMore = true;

function isCategorySupported(category: string): boolean {
  return category !== 'Sounds';
}

function getAssetsGrid(): HTMLElement | null {
  return document.getElementById('assets-grid');
}

function ensureSentinel(grid: HTMLElement): HTMLElement {
  let sentinel = document.getElementById(SENTINEL_ID) as HTMLElement | null;
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.id = SENTINEL_ID;
    sentinel.className = 'infinite-scroll-sentinel';
    grid.appendChild(sentinel);
  } else if (sentinel.parentElement !== grid) {
    grid.appendChild(sentinel);
  } else {
    grid.appendChild(sentinel);
  }
  return sentinel;
}

function updateHasMore(): void {
  const grid = getAssetsGrid();
  if (!grid) {
    hasMore = false;
    return;
  }
  const totalItems = getTotalItemsCount();
  if (totalItems === 0) {
    hasMore = false;
    return;
  }
  const rendered = grid.querySelectorAll('.asset-item').length;
  hasMore = rendered < totalItems;
}

async function loadNextPage(): Promise<void> {
  if (loading) return;
  const category = getCurrentCategory();
  if (!isCategorySupported(category)) return;

  const pageSize = getCurrentPageSize();
  const totalItems = getTotalItemsCount();
  const currentPage = getCurrentPage();
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
  if (totalPages !== 0 && currentPage >= totalPages - 1) {
    hasMore = false;
    return;
  }

  loading = true;
  const nextPage = currentPage + 1;
  const previousPage = currentPage;
  setCurrentPage(nextPage);
  const options: LoadAssetsOptions = { append: true };
  const grid = getAssetsGrid();
  const sentinel = grid ? ensureSentinel(grid) : null;
  if (sentinel) {
    sentinel.classList.add('is-loading');
  }
  try {
    await loadAssets(options);
  } catch (error) {
    setCurrentPage(previousPage);
    console.error('Failed to load next asset page:', error);
  } finally {
    loading = false;
    if (sentinel) {
      sentinel.classList.remove('is-loading');
    }
  }
}

function handleIntersect(entries: IntersectionObserverEntry[]): void {
  const category = getCurrentCategory();
  if (!isCategorySupported(category)) {
    return;
  }
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }
    if (loading || !hasMore) {
      return;
    }
    void loadNextPage();
  });
}

function attachObserver(grid: HTMLElement): void {
  const sentinel = ensureSentinel(grid);
  if (observer) {
    observer.disconnect();
  }
  observer = new IntersectionObserver(handleIntersect, {
    root: null,
    rootMargin: OBSERVER_ROOT_MARGIN,
    threshold: 0
  });
  observer.observe(sentinel);
}

function handleAssetsRendered(event: CustomEvent<AssetsGridRenderedEventDetail>): void {
  const grid = getAssetsGrid();
  if (!grid) {
    loading = false;
    return;
  }
  const sentinel = ensureSentinel(grid);
  const category = event.detail.category;
  if (!isCategorySupported(category)) {
    hasMore = false;
    loading = false;
    if (observer) {
      observer.disconnect();
    }
    sentinel.classList.add('is-hidden');
    sentinel.classList.remove('is-loading');
    sentinel.classList.add('is-complete');
    return;
  }
  sentinel.classList.remove('is-hidden');
  if (observer) {
    observer.disconnect();
    observer.observe(sentinel);
  }
  updateHasMore();
  if (!hasMore) {
    sentinel.classList.add('is-complete');
  } else {
    sentinel.classList.remove('is-complete');
  }
}

export function initializeInfiniteScroll(): void {
  if (initialized) {
    return;
  }
  const grid = getAssetsGrid();
  if (!grid) {
    return;
  }
  initialized = true;
  attachObserver(grid);
  updateHasMore();
  document.addEventListener('assets-grid-rendered', (event) => {
    handleAssetsRendered(event as CustomEvent<AssetsGridRenderedEventDetail>);
  });
}
