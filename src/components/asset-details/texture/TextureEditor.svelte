<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import { currentCategory } from '../../../stores/assetsStore';
  import { getAppearanceSprites } from '../../../spriteCache';
  import TexturePreview from './TexturePreview.svelte';
  import TextureControls from './TextureControls.svelte';
  import TextureSpriteList from './TextureSpriteList.svelte';
  import TextureSettings from './TextureSettings.svelte';
  import TextureBoundingBox from './TextureBoundingBox.svelte';
  import SpriteLibraryDrawer from '../../drawers/SpriteLibraryDrawer.svelte';
  import { invoke } from '../../../utils/invoke';
  import { showStatus } from '../../../utils';
  import { spriteLibraryStore } from '../../../stores/spriteLibraryStore';
  import { translate } from '../../../i18n';
  import '../../../styles/texture.css';

  export let details: CompleteAppearanceItem;

  // State
  let sprites: Uint8Array[] = [];
  let isLoading = false;
  
  // Preview State (Initialize with defaults matching backup)
  let state = {
    frameGroupIndex: 0,
    direction: 2, // South
    addon: 0,
    mount: 0,
    frame: 0,
    // Colors
    headColor: '#ffc107',
    bodyColor: '#ff5722',
    legsColor: '#4caf50',
    feetColor: '#2196f3',
    backgroundColor: '#262626',
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

  $: isOutfit = details && (details.appearance_type === 2 || $currentCategory === 'Outfits');
  $: isObject = details && (details.appearance_type === 1 || $currentCategory === 'Objects');
  
  // Computed helpers
  $: currentFrameGroup = details && details.frame_groups ? details.frame_groups[state.frameGroupIndex] : undefined;
  $: spriteInfo = currentFrameGroup?.sprite_info;

  // Load sprites when details change
  $: if (details) {
    loadSprites();
  }

  async function loadSprites() {
    if (!details) return;
    isLoading = true;
    try {
      sprites = await getAppearanceSprites($currentCategory, details.id);
    } catch (err) {
      console.error('Failed to load sprites for texture editor:', err);
    } finally {
      isLoading = false;
    }
  }

  function handleStateChange(newState: any) {
    state = { ...state, ...newState };
  }

  function openSpriteLibrary() {
    spriteLibraryStore.openBrowse();
  }

  // --- Sprite Operations ---

  async function handleReorder(event: CustomEvent<{ from: number, to: number }>) {
    // Reusing logic similar to backup's reorderSpriteIds
    // Backup logic: Remove from old index, Insert at new index, call replace_appearance_sprites with new mapping
    // But backend might support 'update_appearance_sprite_ids' directly?
    // The previously viewed TextureEditor used 'update_appearance_sprite_ids'.
    // Let's try that first as it is cleaner.
    
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { from, to } = event.detail;
    
    const ids = [...spriteInfo.sprite_ids];
    const [removed] = ids.splice(from, 1);
    ids.splice(to, 0, removed);
    
    // Optimistic update
    spriteInfo.sprite_ids = ids;
    if (details.frame_groups[state.frameGroupIndex]) {
        details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
    }
    
    try {
      await invoke('update_appearance_sprite_ids', { 
        category: $currentCategory, 
        id: details.id, 
        frameGroupIndex: state.frameGroupIndex,
        spriteIds: ids
      });
      document.dispatchEvent(new CustomEvent('texture-settings-saved', { detail: { category: $currentCategory, id: details.id } }));
      loadSprites(); 
    } catch (err) {
      console.error('Failed to reorder sprites:', err);
      showStatus('Failed to reorder', 'error');
      loadSprites(); // Revert
    }
  }

  async function handleRemove(event: CustomEvent<{ index: number }>) {
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { index } = event.detail;

    try {
      await invoke('remove_appearance_sprites', { 
        category: $currentCategory, 
        id: details.id, 
        update: {
            frame_group_index: state.frameGroupIndex,
            indices: [index]
        }
      });
      await invoke('save_appearances_file');
      
      // Update local state
      spriteInfo.sprite_ids.splice(index, 1);
      if (details.frame_groups[state.frameGroupIndex]) {
         details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
      }
      
      loadSprites();
      showStatus(translate('status.spriteRemoved'), 'success');
    } catch (err) {
      console.error('Failed to remove sprite:', err);
      showStatus('Failed to remove sprite', 'error');
    }
  }

  async function handleReplace(event: CustomEvent<{ index: number, spriteIds: number[] }>) {
      const { index, spriteIds } = event.detail;
      if (!spriteIds || spriteIds.length === 0) return;

      try {
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
          showStatus(translate('status.spriteReplaced'), 'success');
      } catch (err) {
          console.error('Failed to replace sprites:', err);
          showStatus('Failed to replace sprites', 'error');
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
          
          // Update local
          if (spriteInfo && spriteInfo.sprite_ids) {
             spriteInfo.sprite_ids.push(...spriteIds);
          }
          
          loadSprites();
          showStatus(translate('status.spriteReplaced'), 'success');
      } catch (err) {
          console.error('Failed to append sprites:', err);
          showStatus('Failed to append sprites', 'error');
      }
  }

  // Handle updates from Settings Form (bounding boxes, animation, properties)
  async function handleSettingsChange(event: CustomEvent<any>) {
      // Just update reference, actual save is explicit via Save button
      // But since we bind objects, svelte updates them.
      // If event.detail contains specific updates, merge them?
      // Actually TextureSettings directly mutates spriteInfo via bindings mostly.
      // But if we need to react:
      if (event.detail.animation) {
         // handle animation update if special logic needed
      }
  }

   // Helper to collect payload similar to backup
  function collectTextureUpdatePayload() {
      if (!spriteInfo) return null;
      
      const payload: any = {
          frame_group_index: state.frameGroupIndex,
          pattern_width: Number(spriteInfo.pattern_width || 0),
          pattern_height: Number(spriteInfo.pattern_height || 0),
          pattern_depth: Number(spriteInfo.pattern_depth || 0),
          layers: Number(spriteInfo.layers || 1),
          pattern_frames: Number(spriteInfo.pattern_frames || 1),
          bounding_square: Number(spriteInfo.bounding_square || 0),
          is_opaque: !!spriteInfo.is_opaque,
          is_animation: !!spriteInfo.is_animation,
          bounding_boxes: spriteInfo.bounding_boxes || []
      };

      if (spriteInfo.animation) {
          // Sanitizing animation data
          const anim = spriteInfo.animation;
          payload.animation = {
              default_start_phase: Number(anim.default_start_phase || 0),
              loop_type: Number(anim.loop_type || 0),
              loop_count: Number(anim.loop_count || 0),
              synchronized: !!anim.synchronized,
              random_start_phase: !!anim.random_start_phase,
              phases: anim.phases?.map(p => ({
                  duration_min: Number(p.duration_min || 100),
                  duration_max: Number(p.duration_max || 100)
              })) || []
          };
      } else {
          payload.animation = null;
      }
      
      return payload;
  }

  async function handleSaveSettings() {
      const update = collectTextureUpdatePayload();
      if (!update) return;

      try {
          await invoke('update_appearance_texture_settings', {
              category: $currentCategory,
              id: details.id,
              update: update
          });
          
          await invoke('save_appearances_file');
          showStatus(translate('status.textureSaved'), 'success');
          document.dispatchEvent(new CustomEvent('texture-settings-saved', {
            detail: { category: $currentCategory, id: details.id }
          }));
          loadSprites(); 
      } catch (err) {
          console.error('Failed to save texture settings:', err);
          showStatus(translate('status.textureSaveFailed'), 'error');
      }
  }

</script>

<div class="texture-layout">
  {#if isLoading}
    <div class="loading-overlay">Loading...</div>
  {/if}

  <div class="texture-preview-column">
    <TexturePreview 
      {details} 
      {sprites} 
      {state} 
      {spriteInfo}
      {isOutfit}
      on:dropSprites={handleAppend}
      on:stateChange={(e) => handleStateChange(e.detail)}
    />
    
    <TextureControls 
      {state} 
      {spriteInfo} 
      {isOutfit}
      {details}
      on:change={(e) => handleStateChange(e.detail)}
    />


    <!-- Sprite List (Moved to Left Column to match backup) -->
     <div class="texture-sprite-settings-wrapper">
        <div class="texture-library-trigger-row" style="margin-bottom: 8px;">
            <button class="sprite-library-trigger" on:click={openSpriteLibrary} style="width: 100%; justify-content: center;">
                <span>🔍</span> {translate('texture.library.title')}
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
          on:append={handleAppend}
          on:add={() => openSpriteLibrary()} 
        />
    </div>

    <!-- Bounding Boxes (Moved to Left Column to match backup) -->
    <TextureBoundingBox 
      {spriteInfo}
      on:change={handleSettingsChange}
    />
  </div>

  <div class="texture-settings-column">
    <TextureSettings 
      {details} 
      {state}
      {spriteInfo}
      on:change={handleSettingsChange}
      on:save={handleSaveSettings}
    />
  </div>
</div>

<SpriteLibraryDrawer />

<style>
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.7);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    border-radius: 12px;
  }
  
  .texture-library-trigger-row {
      margin-bottom: 12px;
  }
  
  /* Ensure layout doesn't break */
  .texture-layout {
      position: relative;
  }
</style>
