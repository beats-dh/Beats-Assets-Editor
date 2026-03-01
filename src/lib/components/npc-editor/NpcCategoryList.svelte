<script lang="ts">
  import { npcState } from "../../../stores/npcState.svelte";
  import {
    buildNpcTree,
    sortCategoryNodes,
    type NpcCategoryNode,
  } from "./utils";
  import NpcCategoryNodeComponent from "./NpcCategoryNode.svelte";
  import NpcListItem from "./NpcListItem.svelte";

  let normalizedFilter = $derived(npcState.npcSearchQuery.trim().toLowerCase());

  let filteredEntries = $derived.by(() => {
    if (normalizedFilter.length === 0) return npcState.npcList;
    return npcState.npcList.filter((entry) => {
      const nameMatch = entry.name.toLowerCase().includes(normalizedFilter);
      const relativePath = entry.relativePath ?? entry.filePath;
      const pathMatch = relativePath.toLowerCase().includes(normalizedFilter);
      const categoryMatch = (entry.categories ?? []).some((cat) =>
        cat.toLowerCase().includes(normalizedFilter),
      );
      return nameMatch || pathMatch || categoryMatch;
    });
  });

  let tree = $derived.by(() => {
    return buildNpcTree(filteredEntries);
  });

  let sortedRootChildren = $derived(
    sortCategoryNodes(Array.from(tree.children.values())),
  );
  let sortedRootNpcs = $derived(
    [...tree.npcs].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );
  let forceExpanded = $derived(normalizedFilter.length > 0);
</script>

<div>
  {#each sortedRootChildren as child (child.path)}
    <NpcCategoryNodeComponent node={child} depth={0} {forceExpanded} />
  {/each}
  {#each sortedRootNpcs as npc (npc.filePath)}
    <NpcListItem entry={npc} depth={0} />
  {/each}
</div>
