<script lang="ts">
  import {
    getCategoryIcon,
    countNpcsInNode,
    sortCategoryNodes,
    type NpcCategoryNode,
  } from "./utils";
  import NpcListItem from "./NpcListItem.svelte";
  import NpcCategoryNodeComponent from "./NpcCategoryNode.svelte";

  interface Props {
    node: NpcCategoryNode;
    depth?: number;
    forceExpanded?: boolean;
  }
  let { node, depth = 0, forceExpanded = false }: Props = $props();

  // Handle open state inline since we don't have expandedCategories in npcState yet or don't need persistent exp
  let isOpen = $state(false);

  $effect(() => {
    isOpen = forceExpanded;
  });

  function toggleOpen(e: Event) {
    if (forceExpanded) {
      e.preventDefault();
      return;
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

<details class="monster-category" bind:open={isOpen}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <summary
    class="monster-category-header"
    style="padding-left: {depth * 12 + 8}px"
    onclick={toggleOpen}
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
