// src/stores/npcState.svelte.ts
import type { Npc, NpcListEntry } from '../npcTypes';

function createNpcState() {
    const state = $state({
        currentNpc: null as Npc | null,
        currentFilePath: null as string | null,
        npcList: [] as NpcListEntry[],
        npcsRootPath: null as string | null,
        isLoading: false,
        npcSearchQuery: '',
        cachedNpcsPath: null as string | null,
    });

    return state;
}

export const npcState = createNpcState();
