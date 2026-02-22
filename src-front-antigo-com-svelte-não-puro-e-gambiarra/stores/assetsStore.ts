import { writable } from 'svelte/store';
import type { CompleteAppearanceItem, AppearanceStats } from '../types';

export const assets = writable<CompleteAppearanceItem[]>([]);
export const currentStats = writable<AppearanceStats | null>(null);

export const currentCategory = writable<string>('Objects');
export const currentSubcategory = writable<string>('All');
export const searchQuery = writable<string>('');

export const currentPage = writable<number>(0);
export const pageSize = writable<number>(100);
export const totalItems = writable<number>(0);

export const viewMode = writable<'categories' | 'grid'>('categories');

// Helper for loading state
export const isLoading = writable<boolean>(false);
export const loadingProgress = writable<number>(0);
export const loadingText = writable<string>('');

export function updateAsset(updated: CompleteAppearanceItem) {
  assets.update(items => {
    return items.map(item => item.id === updated.id ? updated : item);
  });
}

// Reset filters when category changes
currentCategory.subscribe(() => {
  // Only reset if value actually changes, but here we just ensure consistent state
  // Don't reset to 'All' if it's already set to something specific via the action
  // We can let the UI action handle subcategory setting
  // But we must reset page and search
  searchQuery.set('');
  currentPage.set(0);
});
