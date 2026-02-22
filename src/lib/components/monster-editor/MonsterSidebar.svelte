<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { monsterState } from '../../../stores/monsterState.svelte';
  import { invoke } from '../../../utils/invoke';
  import MonsterCategoryList from './MonsterCategoryList.svelte';
  import type { MonsterListEntry } from '../../../monsterTypes';

  let searchInput: HTMLInputElement;

  async function loadMonsters(forceReload = false) {
    const path = monsterState.monstersRootPath;
    if (!path) return;

    if (!forceReload && monsterState.cachedMonstersPath === path && monsterState.monsterList.length > 0) {
      console.log('Monster list already cached, skipping reload');
      return;
    }

    monsterState.isLoading = true;
    try {
      const [entries, classes] = await Promise.all([
        invoke<MonsterListEntry[]>('list_monster_files', { monstersPath: path }),
        invoke<string[]>('list_bestiary_classes', { monstersPath: path }).catch(() => []),
      ]);
      monsterState.monsterList = entries;
      monsterState.bestiaryClassOrder = normalizeBestiaryOrder(classes);
      monsterState.cachedMonstersPath = path;
    } catch (err) {
      console.error('Failed to load monsters:', err);
      monsterState.monsterList = [];
    } finally {
      monsterState.isLoading = false;
    }
  }

  function normalizeBestiaryOrder(order?: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];
    const UNKNOWN_CLASS_NAME = 'Unknown';

    (order ?? []).forEach((name) => {
      const formatted = formatBestiaryClassName(name);
      if (!formatted) return;
      const key = formatted.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(formatted);
      }
    });

    if (!seen.has(UNKNOWN_CLASS_NAME.toLowerCase())) {
      normalized.push(UNKNOWN_CLASS_NAME);
    }
    return normalized;
  }

  function formatBestiaryClassName(raw?: string | null): string | null {
    if (!raw) return null;
    const cleaned = raw.replace(/_/g, ' ').trim();
    if (!cleaned) return null;
    return cleaned.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }

  function handleReloadEvent() {
    loadMonsters(true);
  }

  onMount(() => {
    window.addEventListener('reload-monster-list', handleReloadEvent);
    if (monsterState.monstersRootPath) loadMonsters();
  });

  onDestroy(() => {
    window.removeEventListener('reload-monster-list', handleReloadEvent);
  });

  // React to path changes
  let lastReactivePath = $state<string | null>(null);
  $effect(() => {
    if (monsterState.monstersRootPath && monsterState.monstersRootPath !== lastReactivePath) {
      lastReactivePath = monsterState.monstersRootPath;
      loadMonsters();
    }
  });

  function handleSearch(e: Event) {
    monsterState.monsterSearchQuery = (e.target as HTMLInputElement).value;
  }
</script>

<aside class="monster-sidebar">
  <input
    bind:this={searchInput}
    type="text"
    class="monster-search"
    placeholder="Search monsters..."
    value={monsterState.monsterSearchQuery}
    oninput={handleSearch}
  />

  <div class="monster-list">
    {#if monsterState.isLoading}
      <div class="loading">Loading monsters...</div>
    {:else if !monsterState.monstersRootPath}
      <div class="empty">Please select a monster directory</div>
    {:else if monsterState.monsterList.length === 0}
      <div class="empty">No monsters found</div>
    {:else}
      <MonsterCategoryList />
    {/if}
  </div>
</aside>
