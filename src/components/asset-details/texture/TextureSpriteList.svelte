<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompleteAppearanceItem } from '../../../types';
  import { computeGroupOffsetsFromDetails } from '../../../animation';
  import { bufferToObjectUrl } from '../../../spriteCache';
  import { translate } from '../../../i18n';

  export let sprites: Uint8Array[];
  export let details: CompleteAppearanceItem;
  export let state: any;
  export let frameGroupIndex: number;

  const dispatch = createEventDispatcher();

  $: groupOffsets = computeGroupOffsetsFromDetails(details);
  $: offset = groupOffsets[frameGroupIndex] ?? 0;
  $: spriteInfo = details && details.frame_groups ? details.frame_groups[frameGroupIndex]?.sprite_info : undefined;
  $: count = spriteInfo?.sprite_ids?.length ?? 0;
  
  // Slice of sprites for current group
  $: groupSprites = sprites.slice(offset, offset + count);
  $: spriteIds = spriteInfo?.sprite_ids ?? [];

  // Drag and Drop State
  let draggingIndex: number | null = null;

  function handleDragStart(e: DragEvent, index: number) {
    if (!e.dataTransfer) return;
    draggingIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'sprite-reorder',
      index: index,
      frameGroupIndex: frameGroupIndex
    }));
    // Legacy payload format compatibility if needed
    e.dataTransfer.setData('application/json', JSON.stringify({
      spriteIds: [spriteIds[index]],
      localIndices: [index],
      frameGroupIndex: frameGroupIndex
    }));
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    
    try {
      const textData = e.dataTransfer.getData('text/plain');
      let data: any = {};
      try {
          data = JSON.parse(textData);
      } catch (e) {
          // Not JSON, treat as comma-separated IDs if simple text
          if (textData && /^[0-9, ]+$/.test(textData)) {
              const ids = textData.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
              if (ids.length > 0) {
                  data = { spriteIds: ids };
              }
          }
      }

      if (data.type === 'sprite-reorder' && data.frameGroupIndex === frameGroupIndex) {
        dispatch('reorder', { from: data.index, to: targetIndex });
      } else if (data.spriteIds && Array.isArray(data.spriteIds)) {
        // Handle external drops (from Sprite Library or desktop)
        // If dropped on an existing item (targetIndex < count), we replace
        // If dropped on the add button (targetIndex >= count), we append
        if (targetIndex < count) {
             dispatch('replace', { index: targetIndex, spriteIds: data.spriteIds });
        } else {
             // For appending, we might need a specific 'append' event or just reuse replace logic if backend supports it
             // But the current 'replace' handler in TextureEditor expects replacing existing slots.
             // We need an 'append' handler in TextureEditor that takes a list of IDs.
             // Let's emit a new event 'append' with sprites
             dispatch('append', { spriteIds: data.spriteIds });
        }
      }
    } catch (err) {
      console.warn('Invalid drop data', err);
    }
    draggingIndex = null;
  }

  function handleRemove(index: number) {
    if (confirm(translate('modal.confirmDelete'))) {
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
  
  <div class="texture-sprite-grid">
    {#each groupSprites as sprite, i}
      <div 
        class="texture-sprite-chip"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, i)}
        on:dragover={(e) => handleDragOver(e, i)}
        on:drop={(e) => handleDrop(e, i)}
        class:dragging={draggingIndex === i}
      >
        <div class="texture-sprite-thumb">
          <img src={bufferToObjectUrl(sprite)} alt="Sprite {i}" />
        </div>
        <div class="texture-sprite-meta">
          <span class="texture-sprite-id">#{i}</span>
          <span class="texture-sprite-slot">ID: {spriteIds[i]}</span>
        </div>
        <button class="texture-remove-box remove-btn" on:click|stopPropagation={() => handleRemove(i)} title="Remove">×</button>
      </div>
    {/each}
    
    <!-- Add Button -->
    <button 
      class="texture-sprite-chip add-btn" 
      on:click={() => dispatch('add')}
      on:dragover={(e) => handleDragOver(e, count)}
      on:drop={(e) => handleDrop(e, count)}
    >
      <span class="plus-icon">+</span>
    </button>
  </div>
</div>

<style>
  /* Only minimal overrides not in global texture.css */
  .texture-sprite-chip.dragging {
    opacity: 0.5;
    border-style: dashed;
  }

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