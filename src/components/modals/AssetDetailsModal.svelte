<script lang="ts">
  import { selectedAsset, isDetailsModalOpen, activeTab, closeAssetDetails, openAssetDetails } from '../../stores/selectionStore';
  import { currentCategory, assets } from '../../stores/assetsStore';
  import { translate } from '../../i18n';
  import { loadDetailSprites } from '../../utils/spriteLoading';
  import { invoke } from '../../utils/invoke';
  import type { CompleteAppearanceItem } from '../../types';
  
  // Components
  import AssetBasicInfo from '../asset-details/AssetBasicInfo.svelte';
  import AssetFlags from '../asset-details/AssetFlags.svelte';
  import AssetFrameGroups from '../asset-details/AssetFrameGroups.svelte';
  import AssetSpritePreview from '../asset-details/AssetSpritePreview.svelte';
  import AssetEditForm from '../asset-details/AssetEditForm.svelte';
  import TextureEditor from '../asset-details/texture/TextureEditor.svelte';
  import SoundDetails from '../asset-details/SoundDetails.svelte';
  import SoundEditForm from '../asset-details/SoundEditForm.svelte';

  // Import styles
  import '../../styles/modals.css';

  function handleClose() {
    closeAssetDetails();
  }

  function handlePrev() {
    if (!$selectedAsset) return;
    const currentId = $selectedAsset.id;
    const currentIndex = $assets.findIndex(a => a.id === currentId);
    if (currentIndex > 0) {
      const prev = $assets[currentIndex - 1];
      openAssetDetails(prev, false);
    }
  }

  function handleNext() {
    if (!$selectedAsset) return;
    const currentId = $selectedAsset.id;
    const currentIndex = $assets.findIndex(a => a.id === currentId);
    if (currentIndex !== -1 && currentIndex < $assets.length - 1) {
      const next = $assets[currentIndex + 1];
      openAssetDetails(next, false);
    }
  }

  function setTab(tab: 'details' | 'edit' | 'texture') {
    activeTab.set(tab);
    // Reload sprites if returning to details tab, as they might be cleared from DOM
    if (tab === 'details' && $selectedAsset) {
      const assetId = $selectedAsset.id;
      const cat = $currentCategory;
      const currentAsset = $selectedAsset;
      requestAnimationFrame(() => {
        if ($isDetailsModalOpen && $selectedAsset && $selectedAsset.id === assetId) {
          loadDetailSprites(cat, assetId, undefined, currentAsset);
        }
      });
    }
  }

  // Load sprites when asset changes or modal opens
  let lastFetchedId = -1;
  
  // Reset fetched ID when modal closes to ensure we refetch if needed
  $: if (!$isDetailsModalOpen || !$selectedAsset) {
      lastFetchedId = -1;
  }

  async function ensureCompleteDetails(assetId: number, category: string) {
      try {
          const fullDetails = await invoke('get_complete_appearance', { 
              category: category, 
              id: assetId 
          });
          
          if (fullDetails) {
              // Check if we are still viewing the same asset
              if ($selectedAsset && $selectedAsset.id === assetId) {
                  // Merge or replace? Replace is safer to ensure we have everything.
                  // However, preserve client-side flags if any? 
                  // Usually modal edits are committed to backend or local state.
                  // Since we just opened/navigated, replacing is fine.
                  selectedAsset.set(fullDetails as CompleteAppearanceItem);
              }
          }
      } catch (err) {
          console.error("Failed to fetch complete details", err);
      }
  }

  $: if ($isDetailsModalOpen && $selectedAsset) {
    const assetId = $selectedAsset.id;
    const cat = $currentCategory;
    const currentAsset = $selectedAsset;

    // Check if we need to fetch full details (if sprite_info is missing)
    // We do this only once per asset ID to avoid loops
    if (assetId !== lastFetchedId) {
        lastFetchedId = assetId;
        // Only fetch if it looks incomplete (optimization) or always fetch to be safe?
        // Let's check for frame_groups presence/completeness
        const isIncomplete = !currentAsset.frame_groups || 
                             (currentAsset.frame_groups.length > 0 && !currentAsset.frame_groups[0].sprite_info);
        
        if (isIncomplete) {
            ensureCompleteDetails(assetId, cat);
        }
    }
    
    // Schedule sprite loading after DOM update
    // Using requestAnimationFrame to ensure we don't block the UI rendering
    // and wait for the new elements to be mounted
    
    // Clear previous pending operations if any (though loadDetailSprites handles queues internally)
    requestAnimationFrame(() => {
      // Double check if we are still looking at the same asset
      if ($isDetailsModalOpen && $selectedAsset && $selectedAsset.id === assetId) {
        loadDetailSprites(cat, assetId, undefined, currentAsset);
      }
    });
  }

  async function handleSave(updated: CompleteAppearanceItem) {
    if (!$selectedAsset) return;
    const original = $selectedAsset;
    const category = $currentCategory;
    const id = original.id;

    try {
      // 1. Basic Info
      if (updated.name !== original.name) {
        await invoke('update_appearance_name', { category, id, newName: updated.name });
      }
      if (updated.description !== original.description) {
        await invoke('update_appearance_description', { category, id, newDescription: updated.description });
      }

      // 2. Boolean Flags
      const originalFlags = original.flags || {};
      const updatedFlags = updated.flags || {};
      
      const getBool = (obj: any, key: string) => !!obj[key];
      const boolFlags = [
        'clip', 'bottom', 'top', 'container', 'cumulative', 'usable', 'forceuse', 'multiuse',
        'liquidpool', 'liquidcontainer', 'unpass', 'unmove', 'unsight', 'avoid', 'no_movement_animation',
        'take', 'hang', 'rotate', 'dont_hide', 'translucent', 'lying_object', 'animate_always',
        'fullbank', 'ignore_look', 'wrap', 'unwrap', 'topeffect', 'corpse', 'player_corpse',
        'ammo', 'show_off_socket', 'reportable', 'reverse_addons_east', 'reverse_addons_west',
        'reverse_addons_south', 'reverse_addons_north', 'wearout', 'clockexpire', 'expire',
        'expirestop', 'deco_item_kit', 'dual_wielding', 'hook_south', 'hook_east'
      ];

      for (const key of boolFlags) {
        const oldVal = getBool(originalFlags, key);
        const newVal = getBool(updatedFlags, key);
        if (oldVal !== newVal) {
          await invoke('update_appearance_flag_bool', { category, id, flag: key, value: newVal });
        }
      }

      // 3. Complex Flags
      // Light
      if (updatedFlags.light) {
         await invoke('update_appearance_light', { 
           category, id, 
           brightness: updatedFlags.light.brightness, 
           color: updatedFlags.light.color 
         });
      }
      
      // Shift
      if (updatedFlags.shift) {
         await invoke('update_appearance_shift', { category, id, x: updatedFlags.shift.x, y: updatedFlags.shift.y });
      }

      // Height
      if (updatedFlags.height) {
         await invoke('update_appearance_height', { category, id, elevation: updatedFlags.height.elevation });
      }

      // Write
      if (updatedFlags.write) {
         await invoke('update_appearance_write', { category, id, maxTextLength: updatedFlags.write.max_text_length });
      }

      // Write Once
      if (updatedFlags.write_once) {
         await invoke('update_appearance_write_once', { category, id, maxTextLengthOnce: updatedFlags.write_once.max_text_length_once });
      }

      // Automap
      if (updatedFlags.automap) {
         await invoke('update_appearance_automap', { category, id, color: updatedFlags.automap.color });
      }

      // Hook (Direction)
      if (updatedFlags.hook) {
         await invoke('update_appearance_hook', { category, id, direction: updatedFlags.hook.direction });
      }

      // Lenshelp
      if (updatedFlags.lenshelp) {
         await invoke('update_appearance_lenshelp', { category, id, lenshelpId: updatedFlags.lenshelp.id });
      }

      // Clothes
      if (updatedFlags.clothes) {
         await invoke('update_appearance_clothes', { category, id, slot: updatedFlags.clothes.slot });
      }

      // Default Action
      if (updatedFlags.default_action) {
         await invoke('update_appearance_default_action', { category, id, action: updatedFlags.default_action.action });
      }

      // Weapon Type
      if (updatedFlags.weapon_type !== undefined) {
         await invoke('update_appearance_weapon_type', { category, id, weaponType: updatedFlags.weapon_type });
      }

      // Transparency Level
      if (updatedFlags.transparency_level !== undefined) {
         await invoke('update_appearance_transparency_level', { category, id, transparencyLevel: updatedFlags.transparency_level });
      }

      // Market
      if (updatedFlags.market) {
         const m = updatedFlags.market;
         await invoke('update_appearance_market', {
           category, id,
           categoryValue: m.category,
           tradeAsObjectId: m.trade_as_object_id,
           showAsObjectId: m.show_as_object_id,
           restrictToVocation: m.restrict_to_vocation || [],
           minimumLevel: m.minimum_level,
           name: m.name,
           vocation: m.vocation
         });
      }

      // 4. Save File
      await invoke('save_appearances_file');
      
      // Refresh
      const newDetails = await invoke('get_complete_appearance', { category, id });
      selectedAsset.set(newDetails as CompleteAppearanceItem);
      
      alert('Salvo com sucesso!');

    } catch (err) {
      console.error('Failed to save asset:', err);
      alert('Erro ao salvar: ' + err);
    }
  }
</script>

{#if $isDetailsModalOpen && $selectedAsset}
  <div id="asset-details" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" on:click={handleClose}></div>
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-tabs">
          <button 
            class="tab-btn" 
            class:active={$activeTab === 'details'} 
            on:click={() => setTab('details')}
          >
            {translate('modal.detailsTab')}
          </button>
          <button 
            class="tab-btn" 
            class:active={$activeTab === 'edit'} 
            on:click={() => setTab('edit')}
          >
            {translate('modal.editTab')}
          </button>
          <button 
            class="tab-btn" 
            class:active={$activeTab === 'texture'} 
            on:click={() => setTab('texture')}
          >
            {translate('modal.textureTab')}
          </button>
        </div>
        <div class="modal-actions">
          <div class="modal-nav-controls" role="group">
            <button class="detail-nav-btn" type="button" aria-label="Previous asset" on:click={handlePrev}>◀</button>
            <button class="detail-nav-btn" type="button" aria-label="Next asset" on:click={handleNext}>▶</button>
          </div>
          <button class="close-btn" type="button" on:click={handleClose}>✕</button>
        </div>
      </div>
      <div class="modal-body" id="details-content">
        {#if $currentCategory === 'Sounds'}
          {#if $activeTab === 'details'}
            <div class="tab-content">
              <SoundDetails id={$selectedAsset.id} />
            </div>
          {:else if $activeTab === 'edit'}
             <div class="tab-content" id="edit-content">
               <SoundEditForm id={$selectedAsset.id} onSave={() => { /* maybe refresh list? */ }} />
             </div>
          {:else if $activeTab === 'texture'}
            <div class="tab-content">
               <p style="color: #888; text-align: center;">Not applicable for sounds.</p>
            </div>
          {/if}
        {:else}
          {#if $activeTab === 'details'}
            <div class="tab-content">
              <AssetBasicInfo details={$selectedAsset} category={$currentCategory} />
              <AssetSpritePreview details={$selectedAsset} />
              <AssetFrameGroups details={$selectedAsset} />
              <AssetFlags flags={$selectedAsset.flags} />
            </div>
          {:else if $activeTab === 'edit'}
            <div class="tab-content" id="edit-content">
              <AssetEditForm 
                details={$selectedAsset} 
                category={$currentCategory} 
                onSave={handleSave} 
              />
            </div>
          {:else if $activeTab === 'texture'}
            <div class="tab-content">
              <TextureEditor details={$selectedAsset} />
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
