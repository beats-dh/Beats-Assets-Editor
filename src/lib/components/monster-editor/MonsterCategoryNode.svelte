<script lang="ts">
  import { monsterState } from "../../../stores/monsterState.svelte";
  import {
    getCategoryIcon,
    countMonstersInNode,
    sortCategoryNodes,
    type MonsterCategoryNode,
  } from "./utils";
  import MonsterListItem from "./MonsterListItem.svelte";
  import MonsterCategoryNodeComponent from "./MonsterCategoryNode.svelte";

  interface Props {
    node: MonsterCategoryNode;
    depth?: number;
    forceExpanded?: boolean;
  }
  let { node, depth = 0, forceExpanded = false }: Props = $props();

  let isOpen = $derived(
    forceExpanded || monsterState.expandedCategories.has(node.path),
  );

  function toggleOpen(e: Event) {
    e.preventDefault();
    if (forceExpanded) return;

    if (isOpen) {
      monsterState.expandedCategories.delete(node.path);
      monsterState.expandedCategories = new Set(
        monsterState.expandedCategories,
      );
    } else {
      monsterState.expandedCategories.add(node.path);
      monsterState.expandedCategories = new Set(
        monsterState.expandedCategories,
      );
    }
  }

  let sortedChildren = $derived(
    sortCategoryNodes(
      Array.from(node.children.values()),
      monsterState.bestiaryClassOrder,
    ),
  );
  let sortedMonsters = $derived(
    [...node.monsters].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
  );
</script>

<details class="monster-category" open={isOpen}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <summary
    class="monster-category-header"
    style="padding-left: {depth * 12 + 8}px"
    onclick={toggleOpen}
  >
    <span class="category-icon">{getCategoryIcon(node.name)}</span>
    <span class="category-name">{node.name}</span>
    <span class="category-count">{countMonstersInNode(node)}</span>
  </summary>

  <div class="monster-category-children">
    {#each sortedChildren as child (child.path)}
      <MonsterCategoryNodeComponent
        node={child}
        depth={depth + 1}
        {forceExpanded}
      />
    {/each}
    {#each sortedMonsters as monster (monster.filePath)}
      <MonsterListItem entry={monster} depth={depth + 1} />
    {/each}
  </div>
</details>
