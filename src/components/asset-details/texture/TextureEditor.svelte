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
  import { showStatus } from '../../../utils';
  import { spriteLibraryStore } from '../../../stores/spriteLibraryStore';

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

  // Open Sprite Library when mounted
  onMount(() => {
    // We can open the library in browse mode (no callback) so user can drag from it
    // Or we can just let user open it manually? 
    // Legacy behavior: it was always there on the right.
    // Since SpriteLibraryDrawer is global, we can trigger it to open.
    // However, it overlays the whole screen by default.
    // We need a way to open it "side-by-side" or just ensure it's available.
    // For now, let's open it in a mode that allows dragging.
    // But wait, SpriteLibraryDrawer has `position: fixed; width: 100vw; height: 100vh`. 
    // It's a modal overlay. It's not a side panel.
    // We need to modify SpriteLibraryDrawer or create a new "SpriteLibraryPanel" 
    // to mimic the legacy side-panel behavior.
    // OR we just use the existing one but maybe change its style when called from here?
    // Let's first make sure we can at least invoke it.
    
    // Actually, user said "Sprite Library Drawer não foi portada???? vc tem certeza? pq da pra acessar ele pela a lupa na aba edit??"
    // This implies they see it as a popup/modal.
    // But in legacy it was a side panel.
    // If the user wants the side panel back, we need to implement it as a component inside TextureEditor.
    // But if they just want access to it, we can add a button to open it.
  });

  function openSpriteLibrary() {
      spriteLibraryStore.openSelect((id) => {
          // If selected (clicked), what do we do? 
          // Maybe append it? Or replace selected?
          // Legacy didn't have "click to select" for the main list, it was drag and drop.
          // But here, if they click, maybe we append it?
          handleAppend(new CustomEvent('append', { detail: { spriteIds: [id] } }));
      });
  }


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
          showStatus('Sprite added successfully', 'success');
      } catch (err) {
          console.error('Failed to add sprite:', err);
          showStatus('Failed to add sprite: ' + err, 'error');
      }
  }

  async function handleDropSprites(event: CustomEvent<{ spriteIds: number[] }>) {
      const { spriteIds } = event.detail;
      if (!spriteIds || spriteIds.length === 0) return;

      try {
           const updates = spriteIds.map((id, i) => ({
              index: i,
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
          console.error('Failed to drop sprites:', err);
      }
  }

  async function handleAppend(event: CustomEvent<{ spriteIds: number[] }>) {
      const { spriteIds } = event.detail;
      if (!spriteIds || spriteIds.length === 0) return;

      try {
          await invoke('append_appearance_sprites', {
              category: $currentCategory,
              id: details.id,
              update: {
                  frame_group_index: state.frameGroupIndex,
                  sprite_ids: spriteIds
              }
          });
          await invoke('save_appearances_file');
          loadSprites();
          showStatus('Sprites appended successfully', 'success');
      } catch (err) {
          console.error('Failed to append sprites:', err);
          showStatus('Failed to append sprites: ' + err, 'error');
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
      on:dropSprites={handleDropSprites}
    />
    
    <TextureControls 
      {state} 
      {spriteInfo} 
      {isOutfit}
      {details}
      on:change={(e) => handleStateChange(e.detail)}
    />
  </div>

  <div class="texture-settings-column">
    <div class="texture-list-header">
       <h3>Sprites</h3>
       <button class="btn-secondary btn-sm" on:click={openSpriteLibrary} title="Open Sprite Library">
         🔍 Library
       </button>
    </div>
    <TextureSpriteList 
      {sprites} 
      {details}
      {state}
      frameGroupIndex={state.frameGroupIndex}
      on:reorder={handleReorder}
      on:remove={handleRemove}
      on:replace={handleReplace}
      on:add={handleAdd}
      on:append={handleAppend}
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
  .texture-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .texture-list-header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .btn-sm {
    padding: 0.1rem 0.5rem;
    font-size: 0.8rem;
  }

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