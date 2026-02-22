<script lang="ts">
  import { expandedCategories, bestiaryClassOrder } from '../../stores/monsterStore';
  import { getCategoryIcon, countMonstersInNode, sortCategoryNodes, type MonsterCategoryNode } from './utils';
  import MonsterListItem from './MonsterListItem.svelte';

  export let node: MonsterCategoryNode;
  export let depth: number = 0;
  export let forceExpanded: boolean = false;

  $: isOpen = forceExpanded || $expandedCategories.has(node.path);
  
  function toggleOpen(e: Event) {
    e.preventDefault(); 
    if (forceExpanded) return; 

    if (isOpen) {
      expandedCategories.update(s => { s.delete(node.path); return s; });
    } else {
      expandedCategories.update(s => { s.add(node.path); return s; });
    }
  }
  
  $: sortedChildren = sortCategoryNodes(Array.from(node.children.values()), $bestiaryClassOrder);
  $: sortedMonsters = [...node.monsters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
</script>

<details class="monster-category" open={isOpen}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <summary class="monster-category-header" style="padding-left: {depth * 12 + 8}px" on:click={toggleOpen}>
    <span class="category-icon">{getCategoryIcon(node.name)}</span>
    <span class="category-name">{node.name}</span>
    <span class="category-count">{countMonstersInNode(node)}</span>
  </summary>
  
  <div class="monster-category-children">
    {#each sortedChildren as child (child.path)}
      <svelte:self node={child} depth={depth + 1} {forceExpanded} />
    {/each}
    {#each sortedMonsters as monster (monster.filePath)}
      <MonsterListItem entry={monster} depth={depth + 1} />
    {/each}
  </div>
</details>
