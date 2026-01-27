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
        // External drop of IDs
        dispatch('dropExternal', { 
            index: targetIndex, 
            spriteIds: data.spriteIds, 
            replace: !e.ctrlKey // Default to replace, Ctrl to insert/append? Legacy logic was complex.
            // Legacy: 
            // If targetLocalIndex is number -> replace starting at that index
            // If Ctrl key -> complex mapping logic
            // Let's simplified: just emit the raw drop info and let parent decide
        });
        
        // Actually, let's keep it simple and consistent with legacy behavior intent:
        // If dropping on a slot, replace it and subsequent slots.
        dispatch('replace', { index: targetIndex, spriteIds: data.spriteIds });
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
        <div class="texture-sprite-preview">
          <img src={bufferToObjectUrl(sprite)} alt="Sprite {i}" />
        </div>
        <div class="texture-sprite-info">
          <span class="sprite-index">#{i}</span>
          <span class="sprite-id">ID: {spriteIds[i]}</span>
        </div>
        <button class="remove-btn" on:click|stopPropagation={() => handleRemove(i)} title="Remove">×</button>
      </div>
    {/each}
    
    <!-- Add Button -->
    <button class="texture-sprite-chip add-btn" on:click={() => dispatch('add')}>
      <span class="plus-icon">+</span>
    </button>
  </div>
</div>

<style>
  .texture-sprite-chip {
    position: relative;
    cursor: grab;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .texture-sprite-chip:active {
    cursor: grabbing;
  }
  
  .texture-sprite-chip.dragging {
    opacity: 0.5;
    border-style: dashed;
  }

  .texture-sprite-preview img {
    max-width: 32px;
    max-height: 32px;
    image-rendering: pixelated;
  }
  
  .texture-sprite-info {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
  }
  
  .sprite-id {
    color: var(--text-secondary);
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