// Assets state using Svelte 5 runes
import type { CompleteAppearanceItem, AppearanceStats } from '../types';

function createAssetsState() {
    const state = $state({
        assets: [] as CompleteAppearanceItem[],

        // Static Data Entities (Cached in RAM globally)
        creatures: [] as any[],
        bosses: [] as any[],
        quests: [] as any[],
        titles: [] as any[],
        houses: [] as any[],
        mapHouses: [] as any[],
        outfitSprites: new Map<number, string>(),

        currentStats: null as AppearanceStats | null,
        staticDataStats: null as any | null,
        staticMapDataStats: null as any | null,
        currentCategory: 'Objects',
        currentSubcategory: 'All',
        searchQuery: '',
        currentPage: 0,
        pageSize: 100,
        totalItems: 0,
        viewMode: 'categories' as 'categories' | 'grid' | 'staticdata' | 'rcc' | 'qm',
        currentStaticDataType: 'creatures' as 'creatures' | 'bosses' | 'quests' | 'titles' | 'houses' | 'map_houses',
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

export function selectStaticDataMode(dataType: 'creatures' | 'bosses' | 'quests' | 'titles' | 'houses' | 'map_houses') {
    assetsState.currentStaticDataType = dataType;
    assetsState.viewMode = 'staticdata';
}

export function updateStaticDataState(category: string, updatedList: any[]) {
    switch (category) {
        case 'creatures': assetsState.creatures = updatedList; break;
        case 'bosses': assetsState.bosses = updatedList; break;
        case 'quests': assetsState.quests = updatedList; break;
        case 'titles': assetsState.titles = updatedList; break;
        case 'houses': assetsState.houses = updatedList; break;
        case 'map_houses': assetsState.mapHouses = updatedList; break;
    }
}

export function selectRccMode() {
    assetsState.viewMode = 'rcc';
}

export function selectQmMode() {
    assetsState.viewMode = 'qm';
}
