<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import type { DndEvent } from 'svelte-dnd-action';
  import type { CompleteAppearanceItem } from '../../../types';
  import { computeGroupOffsetsFromDetails } from '../../../animation';
  import { bufferToObjectUrl } from '../../../spriteCache';
  import { translate } from '../../../i18n';

  export let sprites: Uint8Array[];
  export let details: CompleteAppearanceItem;
  export let frameGroupIndex: number;

  const dispatch = createEventDispatcher();

  type SpriteListItem = {
    id: string;
    spriteData: Uint8Array;
    spriteId: number;
    localIndex: number;
  };

  let spriteItems: SpriteListItem[] = [];
  let selectedIndices: Set<number> = new Set();
  let lastFrameGroupIndex: number | null = null;

  $: groupOffsets = computeGroupOffsetsFromDetails(details);
  $: offset = groupOffsets[frameGroupIndex] ?? 0;
  $: spriteInfo = details && details.frame_groups ? details.frame_groups[frameGroupIndex]?.sprite_info : undefined;
  $: count = spriteInfo?.sprite_ids?.length ?? 0;
  $: groupSprites = sprites.slice(offset, offset + count);
  $: spriteIds = spriteInfo?.sprite_ids ?? [];

  $: spriteItems = groupSprites.map((spriteData, i) => ({
    id: `sprite-${frameGroupIndex}-${i}`,
    spriteData,
    spriteId: spriteIds[i] ?? 0,
    localIndex: i
  }));

  $: if (frameGroupIndex !== lastFrameGroupIndex) {
    selectedIndices = new Set();
    lastFrameGroupIndex = frameGroupIndex;
  }

  $: if (!spriteInfo || count === 0) {
    selectedIndices = new Set();
  }

  function handleDndConsider(e: CustomEvent<DndEvent<SpriteListItem>>) {
    spriteItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<SpriteListItem>>) {
    const items = e.detail.items;
    spriteItems = items;

    const currentSet = new Set(spriteIds);
    const newLibraryIds: number[] = [];

    for (const item of items) {
      const match = item.id.match(/^sprite-(\d+)$/);
      if (match) {
        const libraryId = parseInt(match[1], 10);
        if (!currentSet.has(libraryId)) {
          newLibraryIds.push(libraryId);
        }
      }
    }

    if (newLibraryIds.length > 0) {
      const targetIndex = items.findIndex(item => {
        const match = item.id.match(/^sprite-(\d+)$/);
        return match && newLibraryIds.includes(parseInt(match[1], 10));
      });

      if (targetIndex !== -1 && targetIndex < count) {
        dispatch('replace', { index: targetIndex, spriteIds: newLibraryIds });
      } else {
        dispatch('append', { spriteIds: newLibraryIds });
      }
      return;
    }

    const newOrder = items.map(item => item.localIndex);
    dispatch('reorder', { newOrder });
  }

  function handleRemoveClick(index: number) {
    const indices = (selectedIndices.size > 0 && selectedIndices.has(index))
      ? Array.from(selectedIndices)
      : [index];
    selectedIndices = new Set();
    dispatch('remove', { indices });
  }

  function handleSelection(event: MouseEvent, index: number) {
    const isMulti = event.ctrlKey || event.metaKey;
    const wasSelected = selectedIndices.has(index);

    if (!isMulti) {
      selectedIndices = wasSelected ? new Set() : new Set([index]);
      return;
    }

    const next = new Set(selectedIndices);
    if (wasSelected) {
      next.delete(index);
    } else {
      next.add(index);
    }
    selectedIndices = next;
  }
</script>

<div class="texture-sprite-card">
  <div class="texture-sprite-card-header">
    <div>
      <h4>{translate('texture.spriteList.title')}</h4>
      <p class="texture-sprite-card-subtitle">{translate('texture.spriteList.subtitle')}</p>
    </div>
    <button type="button" class="texture-sprite-add" on:click={() => dispatch('add')}>
      <span aria-hidden="true">+</span>
    </button>
  </div>

  <div
    class="texture-sprite-grid"
    id="texture-sprite-list"
    use:dndzone={{
      items: spriteItems,
      flipDurationMs: 200,
      dropTargetStyle: {},
      type: 'sprite',
      dropFromOthersDisabled: false
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#if !spriteInfo || count === 0}
      <div class="texture-sprite-empty">{translate('texture.spriteList.empty')}</div>
    {:else}
      {#each spriteItems as item (item.id)}
        <div
          class="texture-sprite-chip"
          class:is-selected={selectedIndices.has(item.localIndex)}
          data-id={item.id}
          data-local-index={item.localIndex}
          data-sprite-id={item.spriteId}
          role="button"
          tabindex="0"
          on:click={(e) => handleSelection(e, item.localIndex)}
        >
          <div class="texture-sprite-thumb">
            {#if item.spriteData && item.spriteData.byteLength > 0}
              <img src={bufferToObjectUrl(item.spriteData)} alt="Sprite {item.spriteId}" draggable="false" />
            {:else}
              <div class="texture-sprite-placeholder">?</div>
            {/if}
          </div>
          <div class="texture-sprite-meta">
            <span class="texture-sprite-id">#{item.spriteId}</span>
            <span class="texture-sprite-slot">{translate('texture.spriteList.slotLabel', { value: item.localIndex + 1 })}</span>
          </div>
          <button
            type="button"
            class="texture-sprite-remove"
            title={translate('texture.spriteList.removeTooltip')}
            data-local-index={item.localIndex}
            on:click|stopPropagation={() => handleRemoveClick(item.localIndex)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>
