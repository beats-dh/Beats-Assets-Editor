// Assets state using Svelte 5 runes
import type { CompleteAppearanceItem, AppearanceStats } from '../types';

function createAssetsState() {
    const state = $state({
        assets: [] as CompleteAppearanceItem[],
        currentStats: null as AppearanceStats | null,
        currentCategory: 'Objects',
        currentSubcategory: 'All',
        searchQuery: '',
        currentPage: 0,
        pageSize: 100,
        totalItems: 0,
        viewMode: 'categories' as 'categories' | 'grid',
        isLoading: false,
        loadingProgress: 0,
        loadingText: '',
    });

    return state;
}

export const assetsState = createAssetsState();

export function updateAsset(updated: CompleteAppearanceItem) {
    assetsState.assets = assetsState.assets.map(item =>
        item.id === updated.id ? updated : item
    );
}

// Reset filters when category changes
let lastCategory = assetsState.currentCategory;

export function setCategory(category: string) {
    if (category !== lastCategory) {
        lastCategory = category;
        assetsState.currentCategory = category;
        assetsState.searchQuery = '';
        assetsState.currentPage = 0;
    }
}
