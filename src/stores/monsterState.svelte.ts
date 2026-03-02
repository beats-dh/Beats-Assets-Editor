// Monster editor state using Svelte 5 runes
import type { Monster, MonsterListEntry } from '../monsterTypes';
import { SvelteSet } from 'svelte/reactivity';

function createMonsterState() {
    const state = $state({
        currentMonster: null as Monster | null,
        currentFilePath: null as string | null,
        monsterList: [] as MonsterListEntry[],
        monstersRootPath: null as string | null,
        isLoading: false,
        monsterSearchQuery: '',
        expandedCategories: new SvelteSet<string>(['__root__']),
        bestiaryClassOrder: [] as string[],
        cachedMonstersPath: null as string | null,
    });

    return state;
}

export const monsterState = createMonsterState();
