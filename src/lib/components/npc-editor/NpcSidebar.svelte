<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { npcState } from '../../../stores/npcState.svelte';
  import { invoke } from '../../../utils/invoke';
  import NpcCategoryList from './NpcCategoryList.svelte';
  import type { NpcListEntry } from '../../../npcTypes';

  let searchInput: HTMLInputElement;

  async function loadNpcs(forceReload = false) {
    const path = npcState.npcsRootPath;
    if (!path) return;

    if (!forceReload && npcState.cachedNpcsPath === path && npcState.npcList.length > 0) {
      console.log('NPC list already cached, skipping reload');
      return;
    }

    npcState.isLoading = true;
    try {
      const [entries] = await Promise.all([
        invoke<NpcListEntry[]>('list_npc_files', { npcsPath: path }),
      ]);
      npcState.npcList = entries;
      npcState.cachedNpcsPath = path;
    } catch (err) {
      console.error('Failed to load npcs:', err);
      npcState.npcList = [];
    } finally {
      npcState.isLoading = false;
    }
  }

  function handleReloadEvent() {
    loadNpcs(true);
  }

  onMount(() => {
    window.addEventListener('reload-npc-list', handleReloadEvent);
    if (npcState.npcsRootPath) loadNpcs();
  });

  onDestroy(() => {
    window.removeEventListener('reload-npc-list', handleReloadEvent);
  });

  let lastReactivePath = $state<string | null>(null);
  $effect(() => {
    if (npcState.npcsRootPath && npcState.npcsRootPath !== lastReactivePath) {
      lastReactivePath = npcState.npcsRootPath;
      loadNpcs();
    }
  });

  function handleSearch(e: Event) {
    npcState.npcSearchQuery = (e.target as HTMLInputElement).value;
  }
</script>

<aside class="monster-sidebar">
  <input
    bind:this={searchInput}
    type="text"
    class="monster-search"
    placeholder="Buscar NPCs..."
    value={npcState.npcSearchQuery}
    oninput={handleSearch}
  />

  <div class="monster-list">
    {#if npcState.isLoading}
      <div class="loading">Carregando NPCs...</div>
    {:else if !npcState.npcsRootPath}
      <div class="empty">Por favor selecione a pasta de NPCs em data/npc</div>
    {:else if npcState.npcList.length === 0}
      <div class="empty">Nenhum NPC encontrado</div>
    {:else}
      <NpcCategoryList />
    {/if}
  </div>
</aside>
