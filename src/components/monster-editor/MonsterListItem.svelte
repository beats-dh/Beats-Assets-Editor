<script lang="ts">
  import { currentFilePath, currentMonster, isLoading } from '../../stores/monsterStore';
  import { invoke } from '../../utils/invoke';
  import type { MonsterListEntry, Monster } from '../../monsterTypes';

  export let entry: MonsterListEntry;
  export let depth: number = 0;

  $: isActive = $currentFilePath === entry.filePath;

  async function loadMonster() {
    if ($isLoading) return;
    // Don't reload if already loaded? Maybe we want to reload.
    // if ($currentFilePath === entry.filePath) return; 
    
    // Set loading state for the form area mainly, but sidebar can reflect it too
    // Note: We might want a separate 'isMonsterLoading' vs 'isListLoading'
    // For now we use global isLoading or maybe we shouldn't block list interaction?
    // Let's just set a local loading or use the store but be careful.
    // The monsterStore 'isLoading' is generally for the list. 
    // Let's just fire the invoke and let the store update.
    
    try {
      // currentMonster.set(null); // Optional: clear before load
      const monster = await invoke<Monster>("load_monster_file", { filePath: entry.filePath });
      
      // Ensure meta
      if (monster) {
        if (!monster.meta) monster.meta = { missingFields: [], touchedFields: [] };
        if (!monster.events) monster.events = [];
      }
      
      currentMonster.set(monster);
      currentFilePath.set(entry.filePath);
    } catch (err) {
      console.error(err);
      alert(`Failed to load monster: ${err}`);
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
  class="monster-list-item" 
  class:active={isActive}
  style="padding-left: {depth * 12 + 24}px"
  on:click={loadMonster}
  role="button"
  tabindex="0"
>
  {entry.name}
</div>
