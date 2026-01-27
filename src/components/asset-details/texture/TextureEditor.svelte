<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import { currentCategory } from '../../../stores/assetsStore';
  import { getAppearanceSprites } from '../../../spriteCache';
  import TexturePreview from './TexturePreview.svelte';
  import TextureControls from './TextureControls.svelte';
  import TextureSpriteList from './TextureSpriteList.svelte';
  import TextureSettings from './TextureSettings.svelte';
  import { invoke } from '../../../utils/invoke';
  import '../../../styles/texture.css';

  export let details: CompleteAppearanceItem;

  // State
  let sprites: Uint8Array[] = [];
  let isLoading = false;
  
  // Preview State
  let state = {
    frameGroupIndex: 0,
    direction: 0,
    addon: 0,
    mount: 0,
    frame: 0,
    // Colors
    headColor: '#ffc107',
    bodyColor: '#ff5722',
    legsColor: '#4caf50',
    feetColor: '#2196f3',
    backgroundColor: '#262626', // Default dark gray
    // Toggles
    blendLayers: true,
    showFullAddons: true,
    showBoundingBoxes: true,
    autoAnimate: false,
    // Objects
    patternX: 0,
    patternY: 0,
    patternZ: 0,
    layer: 0
  };

  // Computed
  $: currentFrameGroup = details && details.frame_groups ? details.frame_groups[state.frameGroupIndex] : undefined;
  $: spriteInfo = currentFrameGroup?.sprite_info;
  $: isOutfit = details && (details.appearance_type === 2 || $currentCategory === 'Outfits');
  $: isObject = details && (details.appearance_type === 1 || $currentCategory === 'Objects');

  // Load sprites when details change
  $: if (details) {
    loadSprites();
  }

  async function loadSprites() {
    if (!details) return;
    isLoading = true;
    try {
      // Invalidate cache if needed, but for now just fetch
      sprites = await getAppearanceSprites($currentCategory, details.id);
    } catch (err) {
      console.error('Failed to load sprites for texture editor:', err);
    } finally {
      isLoading = false;
    }
  }

  function handleStateChange(newState: Partial<typeof state>) {
    state = { ...state, ...newState };
  }

  // Handle reorder from SpriteList
  async function handleReorder(event: CustomEvent<{ from: number, to: number }>) {
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { from, to } = event.detail;
    
    // Move element
    const ids = [...spriteInfo.sprite_ids];
    const [removed] = ids.splice(from, 1);
    ids.splice(to, 0, removed);
    
    // Update local state immediately
    spriteInfo.sprite_ids = ids;
    details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
    
    // Trigger save/update to persist reorder if needed, or just update sprites view
    // Ideally we should call a backend command to apply this reorder
    try {
      await invoke('update_appearance_sprite_ids', { 
        category: $currentCategory, 
        id: details.id, 
        frameGroupIndex: state.frameGroupIndex,
        spriteIds: ids
      });
      loadSprites(); // Refresh sprites to ensure consistency
    } catch (err) {
      console.error('Failed to reorder sprites:', err);
    }
  }

  // Handle remove from SpriteList
  async function handleRemove(event: CustomEvent<{ index: number }>) {
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { index } = event.detail;
    
    const ids = [...spriteInfo.sprite_ids];
    ids.splice(index, 1);
    
    // Optimistic update
    spriteInfo.sprite_ids = ids;
    if (details.frame_groups[state.frameGroupIndex]) {
        details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
    }
    
    try {
      // Use specific remove command if available for efficiency/legacy parity
      // Legacy: remove_appearance_sprites(category, id, update: { frame_group_index, indices: [index] })
      await invoke('remove_appearance_sprites', { 
        category: $currentCategory, 
        id: details.id, 
        update: {
            frame_group_index: state.frameGroupIndex,
            indices: [index]
        }
      });
      loadSprites();
    } catch (err) {
      console.error('Failed to remove sprite:', err);
      // Revert or reload?
      loadSprites();
    }
  }

  async function handleReplace(event: CustomEvent<{ index: number, spriteIds: number[] }>) {
      const { index, spriteIds } = event.detail;
      if (!spriteIds || spriteIds.length === 0) return;

      try {
          // Legacy: replace_appearance_sprites
          const updates = spriteIds.map((id, i) => ({
              index: index + i,
              sprite_id: id
          }));

          await invoke('replace_appearance_sprites', {
              category: $currentCategory,
              id: details.id,
              update: {
                  frame_group_index: state.frameGroupIndex,
                  updates: updates
              }
          });
          
          await invoke('save_appearances_file');
          loadSprites();
      } catch (err) {
          console.error('Failed to replace sprites:', err);
      }
  }

  async function handleAdd() {
      // Append a default sprite (e.g. 0)
      try {
          await invoke('append_appearance_sprites', {
              category: $currentCategory,
              id: details.id,
              update: {
                  frame_group_index: state.frameGroupIndex,
                  sprite_ids: [0]
              }
          });
          await invoke('save_appearances_file');
          loadSprites();
      } catch (err) {
          console.error('Failed to add sprite:', err);
      }
  }

  function handleSave(updatedDetails: CompleteAppearanceItem) {
      // Logic to save updated details (e.g. changed sprite info)
      // This might bubble up or call invoke directly
      // For now we assume TextureSettings might handle some of this or emit an event
  }
</script>

<div class="texture-layout">
  {#if isLoading}
    <div class="loading-overlay">Loading sprites...</div>
  {/if}

  <div class="texture-preview-column">
    <TexturePreview 
      {details} 
      {sprites} 
      {state} 
      {spriteInfo}
      {isOutfit}
    />
    
    <TextureControls 
      {state} 
      {spriteInfo} 
      {isOutfit}
      on:change={(e) => handleStateChange(e.detail)}
    />
  </div>

  <div class="texture-settings-column">
    <TextureSpriteList 
      {sprites} 
      {details}
      {state}
      frameGroupIndex={state.frameGroupIndex}
      on:reorder={handleReorder}
      on:remove={handleRemove}
      on:replace={handleReplace}
      on:add={handleAdd}
      on:refresh={loadSprites}
    />
    
    <TextureSettings 
      {details} 
      {state}
      on:change={(e) => handleStateChange(e.detail)}
      on:refresh={loadSprites}
    />
  </div>
</div>

<style>
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    color: white;
  }
</style>