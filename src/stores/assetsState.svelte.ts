// Assets state using Svelte 5 runes
import type { CompleteAppearanceItem, AppearanceStats, ProficiencyEntry } from '../types';
import { SvelteMap } from 'svelte/reactivity';

/// Categories the staticdata browser can display. `achievements` is legacy
/// field 2 / new-client field 3 — the client has no editable "titles" asset.
export type StaticDataType =
    | 'creatures'
    | 'bosses'
    | 'quests'
    | 'achievements'
    | 'monster_classes'
    | 'houses'
    | 'map_houses';

function createAssetsState() {
    const state = $state({
        assets: [] as CompleteAppearanceItem[],

        // Static Data Entities (Cached in RAM globally)
        creatures: [] as any[],
        bosses: [] as any[],
        quests: [] as any[],
        achievements: [] as any[],
        monsterClasses: [] as any[],
        houses: [] as any[],
        mapHouses: [] as any[],
        outfitSprites: new SvelteMap<number, string>(),
        proficiencyAssets: {} as Record<number, CompleteAppearanceItem>,
        proficiencyEntries: [] as ProficiencyEntry[],
        proficiencySelectedId: null as number | null,

        currentStats: null as AppearanceStats | null,
        // Active flag-combination filter (DatEditor SearchWindow). When set,
        // loadAssetsData routes to search_appearances_by_flags instead of the
        // text/subcategory listing.
        flagFilter: null as { flags: string[]; animatedOnly: boolean } | null,
        staticDataStats: null as any,
        staticMapDataStats: null as any,
        currentCategory: 'Objects',
        currentSubcategory: 'All',
        searchQuery: '',
        currentPage: 0,
        pageSize: 100,
        totalItems: 0,
        viewMode: 'categories' as 'categories' | 'grid' | 'staticdata' | 'rcc' | 'qm' | 'proficiency' | 'dat-merge' | 'minimap' | 'client-config',
        currentStaticDataType: 'creatures' as StaticDataType,
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

export function selectStaticDataMode(dataType: StaticDataType) {
    assetsState.currentStaticDataType = dataType;
    assetsState.viewMode = 'staticdata';
}

export function updateStaticDataState(category: string, updatedList: any[]) {
    switch (category) {
        case 'creatures': assetsState.creatures = updatedList; break;
        case 'bosses': assetsState.bosses = updatedList; break;
        case 'quests': assetsState.quests = updatedList; break;
        case 'achievements': assetsState.achievements = updatedList; break;
        case 'monster_classes': assetsState.monsterClasses = updatedList; break;
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

export function selectProficiencyMode() {
    assetsState.viewMode = 'proficiency';
}

export function selectDatMergeMode() {
    assetsState.viewMode = 'dat-merge';
}

export function selectMinimapMode() {
    assetsState.viewMode = 'minimap';
}

export function selectClientConfigMode() {
    assetsState.viewMode = 'client-config';
}
