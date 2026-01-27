<script lang="ts">
  import { monsterList, monsterSearchQuery, bestiaryClassOrder } from '../../stores/monsterStore';
  import { buildMonsterTree, getBestiaryClassLabel, sortCategoryNodes, UNKNOWN_CLASS_NAME, type MonsterCategoryNode } from './utils';
  import MonsterCategoryNodeComponent from './MonsterCategoryNode.svelte';
  import MonsterListItem from './MonsterListItem.svelte';

  $: normalizedFilter = $monsterSearchQuery.trim().toLowerCase();
  
  $: filteredEntries = normalizedFilter.length === 0 
     ? $monsterList 
     : $monsterList.filter(entry => {
         const nameMatch = entry.name.toLowerCase().includes(normalizedFilter);
         const relativePath = entry.relativePath ?? entry.filePath;
         const pathMatch = relativePath.toLowerCase().includes(normalizedFilter);
         const categoryMatch = (entry.categories ?? []).some(cat => cat.toLowerCase().includes(normalizedFilter));
         const classMatch = getBestiaryClassLabel(entry).toLowerCase().includes(normalizedFilter);
         return nameMatch || pathMatch || categoryMatch || classMatch;
     });

  $: tree = (() => {
      const nonBossEntries = filteredEntries.filter(e => !e.isBoss).map(e => ({
          ...e,
          categories: [getBestiaryClassLabel(e)]
      }));
      
      const t = buildMonsterTree(nonBossEntries);
      
      // Handle bosses
      const bossEntries = filteredEntries.filter(e => e.isBoss);
      if (bossEntries.length > 0) {
         const bossTreeEntries = bossEntries.map(e => {
             const label = getBestiaryClassLabel(e);
             const categories = label === UNKNOWN_CLASS_NAME ? ["Bosses"] : ["Bosses", label];
             return { ...e, categories };
         });
         const bossTree = buildMonsterTree(bossTreeEntries);
         const bossNode = bossTree.children.get("Bosses");
         if (bossNode) {
             t.children.set("Bosses", bossNode);
         }
      }
      return t;
  })();

  $: sortedRootChildren = sortCategoryNodes(Array.from(tree.children.values()), $bestiaryClassOrder);
  $: sortedRootMonsters = [...tree.monsters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  
  $: forceExpanded = normalizedFilter.length > 0;
</script>

<div>
  {#each sortedRootChildren as child (child.path)}
    <MonsterCategoryNodeComponent node={child} depth={0} {forceExpanded} />
  {/each}
  {#each sortedRootMonsters as monster (monster.filePath)}
    <MonsterListItem entry={monster} depth={0} />
  {/each}
</div>
