<script lang="ts">
  import { selectedAsset, isDetailsModalOpen, activeTab, closeAssetDetails } from '../../stores/selectionStore';
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
  import SoundDetails from '../asset-details/SoundDetails.svelte';
  import SoundEditForm from '../asset-details/SoundEditForm.svelte';

  // Import styles
  import '../../styles/modals.css';

  function handleClose() {
    closeAssetDetails();
  }

  function setTab(tab: 'details' | 'edit' | 'texture') {
    activeTab.set(tab);
  }

  // Load sprites when asset changes or modal opens
  $: if ($isDetailsModalOpen && $selectedAsset) {
    // Schedule sprite loading after DOM update
    setTimeout(() => {
      if ($selectedAsset) {
        loadDetailSprites($currentCategory, $selectedAsset.id);
      }
    }, 0);
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
             <div class="tab-content">
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
            <div class="tab-content">
              <AssetEditForm 
                details={$selectedAsset} 
                category={$currentCategory} 
                onSave={handleSave} 
              />
            </div>
          {:else if $activeTab === 'texture'}
            <div class="tab-content">
              <p style="color: #888; text-align: center;">Texture editor coming soon...</p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
