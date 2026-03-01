<script lang="ts">
  import { monsterState } from "../../../stores/monsterState.svelte";
  import {
    buildMonsterTree,
    getBestiaryClassLabel,
    sortCategoryNodes,
    UNKNOWN_CLASS_NAME,
    type MonsterCategoryNode,
  } from "./utils";
  import MonsterCategoryNodeComponent from "./MonsterCategoryNode.svelte";
  import MonsterListItem from "./MonsterListItem.svelte";

  let normalizedFilter = $derived(
    monsterState.monsterSearchQuery.trim().toLowerCase(),
  );

  let filteredEntries = $derived.by(() => {
    if (normalizedFilter.length === 0) return monsterState.monsterList;
    return monsterState.monsterList.filter((entry) => {
      const nameMatch = entry.name.toLowerCase().includes(normalizedFilter);
      const relativePath = entry.relativePath ?? entry.filePath;
      const pathMatch = relativePath.toLowerCase().includes(normalizedFilter);
      const categoryMatch = (entry.categories ?? []).some((cat) =>
        cat.toLowerCase().includes(normalizedFilter),
      );
      const classMatch = getBestiaryClassLabel(entry)
        .toLowerCase()
        .includes(normalizedFilter);
      return nameMatch || pathMatch || categoryMatch || classMatch;
    });
  });

  let tree = $derived.by(() => {
    const nonBossEntries = filteredEntries
      .filter((e) => !e.isBoss)
      .map((e) => ({
        ...e,
        categories: [getBestiaryClassLabel(e)],
      }));
    const t = buildMonsterTree(nonBossEntries);

    const bossEntries = filteredEntries.filter((e) => e.isBoss);
    if (bossEntries.length > 0) {
      const bossTreeEntries = bossEntries.map((e) => {
        const label = getBestiaryClassLabel(e);
        const categories =
          label === UNKNOWN_CLASS_NAME ? ["Bosses"] : ["Bosses", label];
        return { ...e, categories };
      });
      const bossTree = buildMonsterTree(bossTreeEntries);
      const bossNode = bossTree.children.get("Bosses");
      if (bossNode) t.children.set("Bosses", bossNode);
    }
    return t;
  });

  let sortedRootChildren = $derived(
    sortCategoryNodes(
      Array.from(tree.children.values()),
      monsterState.bestiaryClassOrder,
    ),
  );
  let sortedRootMonsters = $derived(
    [...tree.monsters].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );
  let forceExpanded = $derived(normalizedFilter.length > 0);
</script>

<div>
  {#each sortedRootChildren as child (child.path)}
    <MonsterCategoryNodeComponent node={child} depth={0} {forceExpanded} />
  {/each}
  {#each sortedRootMonsters as monster (monster.filePath)}
    <MonsterListItem entry={monster} depth={0} />
  {/each}
</div>
