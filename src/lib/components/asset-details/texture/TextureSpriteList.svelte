<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import type { DndEvent } from "svelte-dnd-action";
  import type { CompleteAppearanceItem } from "../../../../types";
  import { computeGroupOffsetsFromDetails } from "../../../../animation";
  import { pixelSprite } from "../../../../spriteCache";
  import { getSpriteUrl } from "../../../../utils/spriteUrlCache";
  import { translate } from "../../../../i18n";
  interface Props {
    sprites: Uint8Array[];
    details: CompleteAppearanceItem;
    frameGroupIndex: number;
    onReorder?: (detail: { newOrder: number[] }) => void;
    onRemove?: (detail: { indices: number[] }) => void;
    onReplace?: (detail: { index: number; spriteIds: number[] }) => void;
    onAppend?: (detail: { spriteIds: number[] }) => void;
    onAdd?: () => void;
    onExport?: (detail: { spriteIds: number[] }) => void;
    onImportImage?: () => void;
  }
  let {
    sprites,
    details,
    frameGroupIndex,
    onReorder,
    onRemove,
    onReplace,
    onAppend,
    onAdd,
    onExport,
    onImportImage,
  }: Props = $props();

  type SpriteListItem = {
    id: string;
    spriteData?: Uint8Array;
    spriteId: number;
    localIndex: number;
  };

  let selectedIndices = $state<Set<number>>(new Set());
  let lastFrameGroupIndex = $state<number | null>(null);

  let groupOffsets = $derived(computeGroupOffsetsFromDetails(details));
  let offset = $derived(groupOffsets[frameGroupIndex] ?? 0);
  let spriteInfo = $derived(
    details?.frame_groups
      ? details.frame_groups[frameGroupIndex]?.sprite_info
      : undefined,
  );
  let count = $derived(spriteInfo?.sprite_ids?.length ?? 0);
  let groupSprites = $derived(sprites.slice(offset, offset + count));
  let spriteIds = $derived(spriteInfo?.sprite_ids ?? []);
  let spriteItems = $state<SpriteListItem[]>([]);
  let isDragging = $state(false);

  $effect(() => {
    if (isDragging) return;
    spriteItems = spriteIds.map((spriteId: number, i: number) => ({
      id: `spr-${frameGroupIndex}-${i}`,
      spriteData: groupSprites[i],
      spriteId: spriteId ?? 0,
      localIndex: i,
    }));
  });

  $effect(() => {
    if (frameGroupIndex !== lastFrameGroupIndex) {
      selectedIndices = new Set();
      lastFrameGroupIndex = frameGroupIndex;
    }
  });

  $effect(() => {
    if (!spriteInfo || count === 0) selectedIndices = new Set();
  });

  function handleDndConsider(e: CustomEvent<DndEvent<SpriteListItem>>) {
    isDragging = true;
    spriteItems = e.detail.items;
  }
  function handleDndFinalize(e: CustomEvent<DndEvent<SpriteListItem>>) {
    isDragging = false;
    const items = e.detail.items;
    spriteItems = items;
    const currentSet = new Set(spriteIds);
    const newLibraryIds: number[] = [];
    for (const item of items) {
      const match = item.id.match(/^sprite-(\d+)$/);
      if (match) {
        const libraryId = parseInt(match[1], 10);
        if (!currentSet.has(libraryId)) newLibraryIds.push(libraryId);
      }
    }
    if (newLibraryIds.length > 0) {
      const targetIndex = items.findIndex((item) => {
        const match = item.id.match(/^sprite-(\d+)$/);
        return match && newLibraryIds.includes(parseInt(match[1], 10));
      });
      if (targetIndex !== -1 && targetIndex < count)
        onReplace?.({ index: targetIndex, spriteIds: newLibraryIds });
      else onAppend?.({ spriteIds: newLibraryIds });
      return;
    }
    onReorder?.({ newOrder: items.map((item) => item.localIndex) });
  }
  function handleRemoveClick(index: number) {
    const indices =
      selectedIndices.size > 0 && selectedIndices.has(index)
        ? Array.from(selectedIndices)
        : [index];
    selectedIndices = new Set();
    onRemove?.({ indices });
  }
  function handleExportClick() {
    const indices =
      selectedIndices.size > 0
        ? Array.from(selectedIndices)
        : spriteIds.map((_: number, i: number) => i);
    const ids = indices
      .map((i: number) => spriteIds[i])
      .filter((id: number) => typeof id === "number" && id > 0);
    if (ids.length > 0) onExport?.({ spriteIds: ids });
  }
  function handleSelection(event: MouseEvent | KeyboardEvent, index: number) {
    const isMulti = event.ctrlKey || event.metaKey;
    const wasSelected = selectedIndices.has(index);
    if (!isMulti) {
      selectedIndices = wasSelected ? new Set() : new Set([index]);
      return;
    }
    const next = new Set(selectedIndices);
    if (wasSelected) next.delete(index);
    else next.add(index);
    selectedIndices = next;
  }
</script>

<div class="texture-sprite-card">
  <div class="texture-sprite-card-header">
    <div>
      <h4>{translate("texture.spriteList.title")}</h4>
      <p class="texture-sprite-card-subtitle">
        {translate("texture.spriteList.subtitle")}
      </p>
    </div>
    <div class="texture-sprite-card-actions">
      {#if onImportImage}
        <button
          type="button"
          class="texture-sprite-add"
          title={translate("texture.spriteList.importTooltip")}
          onclick={() => onImportImage?.()}
          ><span aria-hidden="true">🖼</span></button
        >
      {/if}
      <button
        type="button"
        class="texture-sprite-add"
        title={translate("texture.spriteList.exportTooltip")}
        onclick={handleExportClick}><span aria-hidden="true">⬇</span></button
      >
      <button
        type="button"
        class="texture-sprite-add"
        title={translate("texture.spriteList.addTooltip")}
        onclick={() => onAdd?.()}><span aria-hidden="true">+</span></button
      >
    </div>
  </div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="texture-sprite-grid"
    id="texture-sprite-list"
    use:dndzone={{
      items: spriteItems,
      flipDurationMs: 200,
      dropTargetStyle: {},
      type: "sprite",
      dropFromOthersDisabled: false,
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#if !spriteInfo || count === 0}
      <div class="texture-sprite-empty">
        {translate("texture.spriteList.empty")}
      </div>
    {:else}
      {#each spriteItems as item (item.id)}
        <div
          class="texture-sprite-chip"
          class:is-selected={selectedIndices.has(item.localIndex)}
          data-id={item.id}
          role="button"
          tabindex="0"
          onclick={(e) => handleSelection(e, item.localIndex)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelection(e, item.localIndex);
            }
          }}
        >
          <div class="texture-sprite-thumb">
            {#if item.spriteData && item.spriteData.byteLength > 0}<canvas
                use:pixelSprite={getSpriteUrl(item.spriteData)}
                style="width:32px;height:32px;"
              ></canvas>
            {:else}<div class="texture-sprite-placeholder">?</div>{/if}
          </div>
          <div class="texture-sprite-meta">
            <span class="texture-sprite-id">#{item.spriteId}</span><span
              class="texture-sprite-slot"
              >{translate("texture.spriteList.slotLabel", {
                value: item.localIndex + 1,
              })}</span
            >
          </div>
          <button
            type="button"
            class="texture-sprite-remove"
            title={translate("texture.spriteList.removeTooltip")}
            onclick={(e) => {
              e.stopPropagation();
              handleRemoveClick(item.localIndex);
            }}><span aria-hidden="true">&times;</span></button
          >
        </div>
      {/each}
    {/if}
  </div>
</div>
