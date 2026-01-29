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
  export let state: any;
  export let frameGroupIndex: number;

  const dispatch = createEventDispatcher();

  // Type for dndzone items
  type SpriteListItem = {
    id: string;
    spriteData: Uint8Array;
    spriteId: number;
    localIndex: number;
  };

  $: groupOffsets = computeGroupOffsetsFromDetails(details);
  $: offset = groupOffsets[frameGroupIndex] ?? 0;
  $: spriteInfo = details && details.frame_groups ? details.frame_groups[frameGroupIndex]?.sprite_info : undefined;
  $: count = spriteInfo?.sprite_ids?.length ?? 0;
  
  // Slice of sprites for current group
  $: groupSprites = sprites.slice(offset, offset + count);
  $: spriteIds = spriteInfo?.sprite_ids ?? [];

  // Convert to dndzone items
  let spriteItems: SpriteListItem[] = [];
  $: spriteItems = groupSprites.map((spriteData, i) => ({
    id: `sprite-${frameGroupIndex}-${i}`,
    spriteData,
    spriteId: spriteIds[i] ?? 0,
    localIndex: i
  }));

  function handleDndConsider(e: CustomEvent<DndEvent<SpriteListItem>>) {
    spriteItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<SpriteListItem>>) {
    const items = e.detail.items;
    spriteItems = items;

    // Check if there are new IDs (coming from library)
    const currentSet = new Set(spriteIds);
    const newLibraryIds: number[] = [];
    
    for (const item of items) {
      // Check if this is a library item by parsing the ID (format: sprite-<spriteId>)
      const match = item.id.match(/^sprite-(\d+)$/);
      
      if (match) {
        const libraryId = parseInt(match[1], 10);
        
        if (!currentSet.has(libraryId)) {
          newLibraryIds.push(libraryId);
        }
      }
    }

    if (newLibraryIds.length > 0) {
      // External drop from library
      // Find where the new item was dropped
      const targetIndex = items.findIndex(item => {
        const match = item.id.match(/^sprite-(\d+)$/);
        return match && newLibraryIds.includes(parseInt(match[1], 10));
      });
      
      if (targetIndex !== -1 && targetIndex < count) {
        // Replace existing sprite
        dispatch('replace', { index: targetIndex, spriteId: newLibraryIds[0] });
      } else {
        // Append new sprites
        dispatch('append', { spriteIds: newLibraryIds });
      }
    } else {
      // Internal reorder
      const newOrder = items.map(item => item.localIndex);
      dispatch('reorder', { newOrder });
    }
  }

  function handleRemove(index: number) {
    if (confirm(translate('modal.confirmDelete') || 'Are you sure you want to delete this sprite?')) {
      dispatch('remove', { index });
    }
  }
</script>

<div class="texture-sprite-card">
  <div class="texture-sprite-card-header">
    <div>
      <h4>{translate('texture.spriteList.title')}</h4>
      <p class="texture-sprite-card-subtitle">{translate('texture.spriteList.subtitle')}</p>
    </div>
  </div>
  
  <div 
    class="texture-sprite-grid"
    use:dndzone={{
      items: spriteItems,
      flipDurationMs: 200,
      dropTargetStyle: {},
      type: 'sprite',
      dropFromOthersDisabled: false
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    role="list"
  >
    {#each spriteItems as item (item.id)}
      <div class="texture-sprite-chip">
        <div class="texture-sprite-thumb">
          {#if item.spriteData && item.spriteData.byteLength > 0}
            <img src={bufferToObjectUrl(item.spriteData)} alt="Sprite {item.spriteId}" draggable="false" />
          {:else}
            <div class="texture-sprite-placeholder">…</div>
          {/if}
        </div>
        <div class="texture-sprite-meta">
          <span class="texture-sprite-id">#{item.localIndex}</span>
          <span class="texture-sprite-slot">ID: {item.spriteId}</span>
        </div>
        <button class="texture-remove-box remove-btn" on:click|stopPropagation={() => handleRemove(item.localIndex)} title="Remove">×</button>
      </div>
    {/each}
    
    <!-- Add Button -->
    <button 
      class="texture-sprite-chip add-btn" 
      on:click={() => dispatch('add')}
    >
      <span class="plus-icon">+</span>
    </button>
  </div>
</div>

<style>
  /* Only minimal overrides not in global texture.css */
  .remove-btn {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--error-color, #ef4444);
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    line-height: 1;
    cursor: pointer;
    display: none;
    font-size: 12px;
    align-items: center;
    justify-content: center;
  }

  .texture-sprite-chip:hover .remove-btn {
    display: flex;
  }

  .add-btn {
    justify-content: center;
    cursor: pointer;
    background: var(--surface-hover);
    border-style: dashed;
  }

  .plus-icon {
    font-size: 1.5rem;
    color: var(--text-secondary);
  }
</style>