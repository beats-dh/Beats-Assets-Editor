import { writable } from 'svelte/store';
import type { CompleteAppearanceItem, AppearanceStats } from '../types';

export const assets = writable<CompleteAppearanceItem[]>([]);
export const currentStats = writable<AppearanceStats | null>(null);

export const currentCategory = writable<string>('Objects');
export const currentSubcategory = writable<string>('All');
export const searchQuery = writable<string>('');

export const currentPage = writable<number>(1);
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
  currentSubcategory.set('All');
  searchQuery.set('');
  currentPage.set(1);
});
