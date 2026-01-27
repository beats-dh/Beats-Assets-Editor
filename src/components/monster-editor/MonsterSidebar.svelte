<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    monsterList, 
    monstersRootPath, 
    monsterSearchQuery, 
    bestiaryClassOrder,
    isLoading
  } from '../../stores/monsterStore';
  import { invoke } from '../../utils/invoke';
  import MonsterCategoryList from './MonsterCategoryList.svelte';
  import type { MonsterListEntry } from '../../monsterTypes';

  let searchInput: HTMLInputElement;

  async function loadMonsters() {
    if (!$monstersRootPath) return;
    
    isLoading.set(true);
    try {
      // Ensure appearances are loaded first (legacy requirement)
      // await invoke('ensure_appearances_loaded'); // If needed

      const [entries, classes] = await Promise.all([
        invoke<MonsterListEntry[]>("list_monster_files", { monstersPath: $monstersRootPath }),
        invoke<string[]>("list_bestiary_classes", { monstersPath: $monstersRootPath }).catch(() => [])
      ]);

      monsterList.set(entries);
      bestiaryClassOrder.set(normalizeBestiaryOrder(classes));
    } catch (err) {
      console.error("Failed to load monsters:", err);
      monsterList.set([]);
    } finally {
      isLoading.set(false);
    }
  }

  function normalizeBestiaryOrder(order?: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];
    const UNKNOWN_CLASS_NAME = "Unknown";

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
    const cleaned = raw.replace(/_/g, " ").trim();
    if (!cleaned) return null;
    return cleaned
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  // Reload listener
  function handleReloadEvent() {
    loadMonsters();
  }

  onMount(() => {
    window.addEventListener('reload-monster-list', handleReloadEvent);
    if ($monstersRootPath) {
        loadMonsters();
    }
  });

  onDestroy(() => {
    window.removeEventListener('reload-monster-list', handleReloadEvent);
  });

  // Reactive load
  $: if ($monstersRootPath) {
    loadMonsters();
  }

  function handleSearch(e: Event) {
    monsterSearchQuery.set((e.target as HTMLInputElement).value);
  }
</script>

<aside class="monster-sidebar">
  <input
    bind:this={searchInput}
    type="text"
    class="monster-search"
    placeholder="Search monsters..."
    value={$monsterSearchQuery}
    on:input={handleSearch}
  />

  <div class="monster-list">
    {#if $isLoading}
      <div class="loading">Loading monsters...</div>
    {:else if !$monstersRootPath}
       <div class="empty">Please select a monster directory</div>
    {:else if $monsterList.length === 0}
       <div class="empty">No monsters found</div>
    {:else}
       <MonsterCategoryList />
    {/if}
  </div>
</aside>
