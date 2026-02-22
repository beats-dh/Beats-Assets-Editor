<script lang="ts">
  import type { CompleteAppearanceItem } from '../../../types';
  import { currentCategory } from '../../../stores/assetsStore';
  import { computeGroupOffsetsFromDetails } from '../../../animation';
  import { getAppearanceSprites, getSpriteById } from '../../../spriteCache';
  import TexturePreview from './TexturePreview.svelte';
  import TextureControls from './TextureControls.svelte';
  import TextureSpriteList from './TextureSpriteList.svelte';
  import TextureSettings from './TextureSettings.svelte';
  import TextureBoundingBox from './TextureBoundingBox.svelte';
  import { invoke } from '../../../utils/invoke';
  import { invalidateDetailSpriteCache, loadDetailSprites, refreshAssetPreview } from '../../../utils/spriteLoading';
  import { showStatus } from '../../../utils';
  import { spriteLibraryStore } from '../../../stores/spriteLibraryStore';
  import { translate } from '../../../i18n';
  import '../../../styles/texture.css';

  export let details: CompleteAppearanceItem;

  // State
  let sprites: Uint8Array[] = [];
  
  const defaultState = {
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

  // Preview State (Initialize with defaults matching backup)
  let state = { ...defaultState };
  let lastDetailsId: number | null = null;

  $: textureCategory =
    details?.appearance_type === 2
      ? 'Outfits'
      : details?.appearance_type === 1
        ? 'Objects'
        : ($currentCategory === 'Outfits' || $currentCategory === 'Objects')
          ? $currentCategory
          : 'Other';

  $: isOutfit = textureCategory === 'Outfits';
  $: isUnsupported = textureCategory === 'Other';
  $: activeTextureCategory = isOutfit
    ? 'Outfits'
    : textureCategory === 'Objects'
      ? 'Objects'
      : null;
  
  // Computed helpers
  $: currentFrameGroup = details && details.frame_groups ? details.frame_groups[state.frameGroupIndex] : undefined;
  $: spriteInfo = currentFrameGroup?.sprite_info;

  // Reset state and load sprites when details change
  $: if (details && details.id !== lastDetailsId) {
    lastDetailsId = details.id;
    state = { ...defaultState };
    loadSprites();
  }

  async function loadSprites() {
    if (!details || !activeTextureCategory) return;
    try {
      sprites = await getAppearanceSprites(activeTextureCategory, details.id);
    } catch (err) {
      console.error('Failed to load sprites for texture editor:', err);
    }
  }

  function getGroupOffset(): number {
    if (!details) return 0;
    const offsets = computeGroupOffsetsFromDetails(details);
    return offsets[state.frameGroupIndex] ?? 0;
  }

  async function fetchSpriteBuffers(spriteIds: number[]): Promise<Uint8Array[]> {
    const buffers = await Promise.all(
      spriteIds.map(async (spriteId) => {
        const sprite = await getSpriteById(spriteId);
        return sprite ?? new Uint8Array();
      })
    );
    return buffers;
  }

  function refreshDetailPreviews(): void {
    if (!details || !activeTextureCategory) return;
    const category = activeTextureCategory;
    const id = details.id;
    invalidateDetailSpriteCache(category, id);
    void refreshAssetPreview(category, id);
    requestAnimationFrame(() => {
      loadDetailSprites(category, id, undefined, details);
    });
  }

  function handleStateChange(newState: any) {
    if (newState.frameGroupIndex !== undefined && newState.frameGroupIndex !== state.frameGroupIndex) {
      state = {
        ...state,
        frameGroupIndex: newState.frameGroupIndex,
        direction: 0,
        addon: 0,
        mount: 0,
        frame: 0,
        patternX: 0,
        patternY: 0,
        patternZ: 0,
        layer: 0
      };
      return;
    }
    state = { ...state, ...newState };
  }

  function openSpriteLibrary() {
    spriteLibraryStore.openBrowse();
  }

  // --- Sprite Operations ---

  async function handleReorder(event: CustomEvent<{ newOrder: number[] }>) {
    const category = activeTextureCategory;
    if (!category) return;
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { newOrder } = event.detail;
    if (!Array.isArray(newOrder) || newOrder.length === 0) return;

    const ids = spriteInfo.sprite_ids.slice();
    const reordered = newOrder.map(index => ids[index]).filter(id => typeof id === 'number') as number[];
    if (reordered.length !== ids.length) return;

    const updates = reordered.map((spriteId, index) => ({
      index,
      sprite_id: spriteId
    }));

    try {
      await invoke('replace_appearance_sprites', {
        category,
        id: details.id,
        update: {
          frame_group_index: state.frameGroupIndex,
          updates
        }
      });
      await invoke('save_appearances_file');
      spriteInfo.sprite_ids = reordered;
      if (details.frame_groups[state.frameGroupIndex]) {
        details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
      }
      const offset = getGroupOffset();
      const count = spriteInfo.sprite_ids.length;
      const current = sprites.slice();
      const groupSprites = current.slice(offset, offset + count);
      const reorderedSprites = newOrder.map(index => groupSprites[index] ?? new Uint8Array());
      current.splice(offset, count, ...reorderedSprites);
      sprites = current;
      refreshDetailPreviews();
      void loadSprites();
      showStatus(translate('status.spriteReplaced'), 'success');
    } catch (err) {
      console.error('Failed to reorder sprites:', err);
      showStatus(translate('status.spriteReplaceFailed'), 'error');
    }
  }

  async function handleRemove(event: CustomEvent<{ indices: number[] }>) {
    const category = activeTextureCategory;
    if (!category) return;
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const indices = Array.from(new Set(event.detail.indices || []))
      .filter(index => Number.isInteger(index))
      .sort((a, b) => a - b);
    if (indices.length === 0) return;

    try {
      await invoke('remove_appearance_sprites', {
        category,
        id: details.id,
        update: {
          frame_group_index: state.frameGroupIndex,
          indices
        }
      });
      await invoke('save_appearances_file');

      indices.slice().sort((a, b) => b - a).forEach((index) => {
        spriteInfo.sprite_ids?.splice(index, 1);
      });
      if (details.frame_groups[state.frameGroupIndex]) {
        details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
      }

      const offset = getGroupOffset();
      const current = sprites.slice();
      indices.slice().sort((a, b) => b - a).forEach((index) => {
        const target = offset + index;
        if (target >= 0 && target < current.length) {
          current.splice(target, 1);
        }
      });
      sprites = current;
      refreshDetailPreviews();
      void loadSprites();
      showStatus(translate('status.spriteRemoved'), 'success');
    } catch (err) {
      console.error('Failed to remove sprite:', err);
      showStatus(translate('status.spriteRemoveFailed'), 'error');
    }
  }

  async function handleReplace(event: CustomEvent<{ index: number, spriteIds: number[] }>) {
    const category = activeTextureCategory;
    if (!category) return;
    if (!spriteInfo || !spriteInfo.sprite_ids) return;
    const { index, spriteIds } = event.detail;
    if (!spriteIds || spriteIds.length === 0) return;

    const offset = getGroupOffset();
    const previousCount = spriteInfo.sprite_ids.length;
    const updates: Array<{ index: number; sprite_id: number }> = [];
    const appendIds: number[] = [];

    spriteIds.forEach((spriteId, offset) => {
      const targetIndex = index + offset;
      if (targetIndex < spriteInfo.sprite_ids.length) {
        updates.push({ index: targetIndex, sprite_id: spriteId });
      } else {
        appendIds.push(spriteId);
      }
    });

    try {
      if (updates.length > 0) {
        await invoke('replace_appearance_sprites', {
          category,
          id: details.id,
          update: {
            frame_group_index: state.frameGroupIndex,
            updates
          }
        });
        updates.forEach((update) => {
          if (spriteInfo.sprite_ids && update.index < spriteInfo.sprite_ids.length) {
            spriteInfo.sprite_ids[update.index] = update.sprite_id;
          }
        });
      }

      if (appendIds.length > 0) {
        await invoke('append_appearance_sprites', {
          category,
          id: details.id,
          update: {
            frame_group_index: state.frameGroupIndex,
            sprite_ids: appendIds
          }
        });
        spriteInfo.sprite_ids.push(...appendIds);
      }

      if (updates.length > 0 || appendIds.length > 0) {
        await invoke('save_appearances_file');
        
        // Force reactivity by updating the reference
        if (details.frame_groups[state.frameGroupIndex]) {
          details.frame_groups[state.frameGroupIndex].sprite_info = { ...spriteInfo };
        }

        const current = sprites.slice();
        if (updates.length > 0) {
          const buffers = await fetchSpriteBuffers(updates.map(update => update.sprite_id));
          updates.forEach((update, updateIndex) => {
            const target = offset + update.index;
            if (target >= 0 && target < current.length) {
              current[target] = buffers[updateIndex] ?? new Uint8Array();
            }
          });
        }

        if (appendIds.length > 0) {
          const buffers = await fetchSpriteBuffers(appendIds);
          const insertAt = offset + previousCount;
          current.splice(insertAt, 0, ...buffers);
        }

        sprites = current;
        refreshDetailPreviews();
        void loadSprites();
        showStatus(translate('status.spriteReplaced'), 'success');
      }
    } catch (err) {
      console.error('Failed to replace sprites:', err);
      showStatus(translate('status.spriteReplaceFailed'), 'error');
    }
  }

  async function handleAppend(event: CustomEvent<{ spriteIds: number[] }>) {
    const category = activeTextureCategory;
    if (!category) return;
    const { spriteIds } = event.detail;
    if (!spriteIds || spriteIds.length === 0) return;
    if (!spriteInfo || !spriteInfo.sprite_ids) return;

    const offset = getGroupOffset();
    const previousCount = spriteInfo.sprite_ids.length;
    try {
      await invoke('append_appearance_sprites', {
        category,
        id: details.id,
        update: {
          frame_group_index: state.frameGroupIndex,
          sprite_ids: spriteIds
        }
      });
      await invoke('save_appearances_file');

      // Update sprite_ids and force reactivity
      spriteInfo.sprite_ids.push(...spriteIds);
      if (details.frame_groups[state.frameGroupIndex]) {
        details.frame_groups[state.frameGroupIndex].sprite_info = { ...spriteInfo };
      }

      const current = sprites.slice();
      const buffers = await fetchSpriteBuffers(spriteIds);
      current.splice(offset + previousCount, 0, ...buffers);
      sprites = current;
      refreshDetailPreviews();
      void loadSprites();
      showStatus(translate('status.spriteReplaced'), 'success');
    } catch (err) {
      console.error('Failed to append sprites:', err);
      showStatus(translate('status.spriteReplaceFailed'), 'error');
    }
  }

  // Handle updates from Settings Form (bounding boxes, animation, properties)
  async function handleSettingsChange(event: CustomEvent<any>) {
      // Just update reference, actual save is explicit via Save button
      // But since we bind objects, svelte updates them.
      // If event.detail contains specific updates, merge them?
      // Actually TextureSettings directly mutates spriteInfo via bindings mostly.
      // But if we need to react:
      if (event.detail?.animation) {
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
      const category = activeTextureCategory;
      if (!category) return;

      try {
          await invoke('update_appearance_texture_settings', {
              category,
              id: details.id,
              update: update
          });
          
          await invoke('save_appearances_file');
          showStatus(translate('status.textureSaved'), 'success');
          document.dispatchEvent(new CustomEvent('texture-settings-saved', {
            detail: { category, id: details.id }
          }));
          loadSprites(); 
      } catch (err) {
          console.error('Failed to save texture settings:', err);
          showStatus(translate('status.textureSaveFailed'), 'error');
      }
  }

</script>

{#if isUnsupported}
  <div class="texture-empty-state">
    <p>{translate('texture.emptyState.unsupported')}</p>
  </div>
{:else}
  <div class="texture-layout">
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

      <TextureSpriteList 
        {sprites} 
        {details}
        frameGroupIndex={state.frameGroupIndex}
        on:reorder={handleReorder}
        on:remove={handleRemove}
        on:replace={handleReplace}
        on:append={handleAppend}
        on:add={openSpriteLibrary}
      />

      <TextureBoundingBox 
        {spriteInfo}
        on:change={handleSettingsChange}
      />
    </div>

    <div class="texture-settings-column">
      <TextureSettings 
        {spriteInfo}
        on:change={handleSettingsChange}
        on:save={handleSaveSettings}
      />
    </div>
  </div>
{/if}
