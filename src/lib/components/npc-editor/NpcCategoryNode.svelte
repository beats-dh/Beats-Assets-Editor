<script lang="ts">
  import {
    getCategoryIcon,
    countNpcsInNode,
    sortCategoryNodes,
    type NpcCategoryNode,
  } from "./utils";
  import NpcListItem from "./NpcListItem.svelte";
  import NpcCategoryNodeComponent from "./NpcCategoryNode.svelte";
  import { npcState } from "../../../stores/npcState.svelte";

  interface Props {
    node: NpcCategoryNode;
    depth?: number;
    forceExpanded?: boolean;
  }
  let { node, depth = 0, forceExpanded = false }: Props = $props();

  let isOpen = $derived(
    forceExpanded || npcState.expandedCategories.has(node.path),
  );

  function toggleOpen(e: Event) {
    e.preventDefault();
    if (forceExpanded) {
      return;
    }

    if (isOpen) {
      npcState.expandedCategories.delete(node.path);
    } else {
      npcState.expandedCategories.add(node.path);
    }
  }

  let sortedChildren = $derived(
    sortCategoryNodes(Array.from(node.children.values())),
  );
  let sortedNpcs = $derived(
    [...node.npcs].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );
</script>

<details class="monster-category" open={isOpen}>
  <summary
    class="monster-category-header"
    style="padding-left: {depth * 12 + 8}px"
    onclick={toggleOpen}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleOpen(e as any);
      }
    }}
  >
    <span class="category-icon">{getCategoryIcon(node.name)}</span>
    <span class="category-name">{node.name}</span>
    <span class="category-count">{countNpcsInNode(node)}</span>
  </summary>

  <div class="monster-category-children">
    {#each sortedChildren as child (child.path)}
      <NpcCategoryNodeComponent
        node={child}
        depth={depth + 1}
        {forceExpanded}
      />
    {/each}
    {#each sortedNpcs as npc (npc.filePath)}
      <NpcListItem entry={npc} depth={depth + 1} />
    {/each}
  </div>
</details>
