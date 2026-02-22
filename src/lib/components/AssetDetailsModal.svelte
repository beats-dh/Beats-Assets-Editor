<script lang="ts">
  import { detailsModal, closeAssetDetails, openAssetDetails } from '../../stores/selectionState.svelte';
  import { closeSpriteLibrary } from '../../stores/spriteLibraryState.svelte';
  import { assetsState } from '../../stores/assetsState.svelte';
  import { translate } from '../../i18n';
  import { loadDetailSprites } from '../../utils/spriteLoading';
  import { invoke } from '../../utils/invoke';
  import type { CompleteAppearanceItem } from '../../types';

  // Sub-components
  import AssetBasicInfo from './asset-details/AssetBasicInfo.svelte';
  import AssetFlags from './asset-details/AssetFlags.svelte';
  import AssetFrameGroups from './asset-details/AssetFrameGroups.svelte';
  import AssetSpritePreview from './asset-details/AssetSpritePreview.svelte';
  import AssetEditForm from './asset-details/AssetEditForm.svelte';
  import TextureEditor from './asset-details/texture/TextureEditor.svelte';
  import SoundDetails from './asset-details/SoundDetails.svelte';
  import SoundEditForm from './asset-details/SoundEditForm.svelte';

  // Import styles
  import '../../styles/modals.css';

  function handleClose() {
    closeAssetDetails();
    closeSpriteLibrary();
  }

  function handlePrev() {
    if (!detailsModal.selectedAsset) return;
    const currentId = detailsModal.selectedAsset.id;
    const currentIndex = assetsState.assets.findIndex(a => a.id === currentId);
    if (currentIndex > 0) {
      openAssetDetails(assetsState.assets[currentIndex - 1], false);
    }
  }

  function handleNext() {
    if (!detailsModal.selectedAsset) return;
    const currentId = detailsModal.selectedAsset.id;
    const currentIndex = assetsState.assets.findIndex(a => a.id === currentId);
    if (currentIndex !== -1 && currentIndex < assetsState.assets.length - 1) {
      openAssetDetails(assetsState.assets[currentIndex + 1], false);
    }
  }

  function setTab(tab: 'details' | 'edit' | 'texture') {
    detailsModal.activeTab = tab;
    if (tab === 'details' && detailsModal.selectedAsset) {
      const assetId = detailsModal.selectedAsset.id;
      const cat = assetsState.currentCategory;
      const currentAsset = detailsModal.selectedAsset;
      requestAnimationFrame(() => {
        if (detailsModal.isOpen && detailsModal.selectedAsset?.id === assetId) {
          loadDetailSprites(cat, assetId, undefined, currentAsset);
        }
      });
    }
  }

  // Load sprites when asset changes
  let lastFetchedId = $state(-1);

  $effect(() => {
    if (!detailsModal.isOpen || !detailsModal.selectedAsset) {
      lastFetchedId = -1;
      return;
    }
  });

  $effect(() => {
    if (detailsModal.isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      closeSpriteLibrary();
    }
  });

  $effect(() => {
    if (detailsModal.isOpen && detailsModal.selectedAsset) {
      const assetId = detailsModal.selectedAsset.id;
      const cat = assetsState.currentCategory;
      const currentAsset = detailsModal.selectedAsset;

      if (assetId !== lastFetchedId) {
        lastFetchedId = assetId;
        const isIncomplete = !currentAsset.frame_groups ||
          (currentAsset.frame_groups.length > 0 && !currentAsset.frame_groups[0].sprite_info);
        if (isIncomplete) {
          ensureCompleteDetails(assetId, cat);
        }
      }

      requestAnimationFrame(() => {
        if (detailsModal.isOpen && detailsModal.selectedAsset?.id === assetId) {
          loadDetailSprites(cat, assetId, undefined, currentAsset);
        }
      });
    }
  });

  async function ensureCompleteDetails(assetId: number, category: string) {
    try {
      const fullDetails = await invoke('get_complete_appearance', { category, id: assetId });
      if (fullDetails && detailsModal.selectedAsset?.id === assetId) {
        detailsModal.selectedAsset = fullDetails as CompleteAppearanceItem;
      }
    } catch (err) {
      console.error('Failed to fetch complete details', err);
    }
  }

  async function handleSave(updated: CompleteAppearanceItem) {
    if (!detailsModal.selectedAsset) return;
    const original = detailsModal.selectedAsset;
    const category = assetsState.currentCategory;
    const id = original.id;

    try {
      if (updated.name !== original.name) {
        await invoke('update_appearance_name', { category, id, newName: updated.name });
      }
      if (updated.description !== original.description) {
        await invoke('update_appearance_description', { category, id, newDescription: updated.description });
      }

      // Boolean flags
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
        'expirestop', 'deco_item_kit', 'dual_wielding', 'hook_south', 'hook_east',
      ];
      for (const key of boolFlags) {
        const oldVal = getBool(originalFlags, key);
        const newVal = getBool(updatedFlags, key);
        if (oldVal !== newVal) {
          await invoke('update_appearance_flag_bool', { category, id, flag: key, value: newVal });
        }
      }

      // Complex flags
      if (updatedFlags.light) await invoke('update_appearance_light', { category, id, brightness: updatedFlags.light.brightness, color: updatedFlags.light.color });
      if (updatedFlags.shift) await invoke('update_appearance_shift', { category, id, x: updatedFlags.shift.x, y: updatedFlags.shift.y });
      if (updatedFlags.height) await invoke('update_appearance_height', { category, id, elevation: updatedFlags.height.elevation });
      if (updatedFlags.write) await invoke('update_appearance_write', { category, id, maxTextLength: updatedFlags.write.max_text_length });
      if (updatedFlags.write_once) await invoke('update_appearance_write_once', { category, id, maxTextLengthOnce: updatedFlags.write_once.max_text_length_once });
      if (updatedFlags.automap) await invoke('update_appearance_automap', { category, id, color: updatedFlags.automap.color });
      if (updatedFlags.hook) await invoke('update_appearance_hook', { category, id, direction: updatedFlags.hook.direction });
      if (updatedFlags.lenshelp) await invoke('update_appearance_lenshelp', { category, id, lenshelpId: updatedFlags.lenshelp.id });
      if (updatedFlags.clothes) await invoke('update_appearance_clothes', { category, id, slot: updatedFlags.clothes.slot });
      if (updatedFlags.default_action) await invoke('update_appearance_default_action', { category, id, action: updatedFlags.default_action.action });
      if (updatedFlags.weapon_type !== undefined) await invoke('update_appearance_weapon_type', { category, id, weaponType: updatedFlags.weapon_type });
      if (updatedFlags.transparency_level !== undefined) await invoke('update_appearance_transparency_level', { category, id, transparencyLevel: updatedFlags.transparency_level });
      if (updatedFlags.market) {
        const m = updatedFlags.market;
        await invoke('update_appearance_market', {
          category, id, categoryValue: m.category, tradeAsObjectId: m.trade_as_object_id,
          showAsObjectId: m.show_as_object_id, restrictToVocation: m.restrict_to_vocation || [],
          minimumLevel: m.minimum_level, name: m.name, vocation: m.vocation,
        });
      }

      await invoke('save_appearances_file');
      const newDetails = await invoke('get_complete_appearance', { category, id });
      detailsModal.selectedAsset = newDetails as CompleteAppearanceItem;
      alert('Salvo com sucesso!');
    } catch (err) {
      console.error('Failed to save asset:', err);
      alert('Erro ao salvar: ' + err);
    }
  }
</script>

{#if detailsModal.isOpen && detailsModal.selectedAsset}
  <div id="asset-details" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-tabs">
          <button class="tab-btn" class:active={detailsModal.activeTab === 'details'} onclick={() => setTab('details')}>{translate('modal.detailsTab')}</button>
          <button class="tab-btn" class:active={detailsModal.activeTab === 'edit'} onclick={() => setTab('edit')}>{translate('modal.editTab')}</button>
          <button class="tab-btn" class:active={detailsModal.activeTab === 'texture'} onclick={() => setTab('texture')}>{translate('modal.textureTab')}</button>
        </div>
        <div class="modal-actions">
          <div class="modal-nav-controls" role="group">
            <button class="detail-nav-btn" type="button" aria-label="Previous asset" onclick={handlePrev}>◀</button>
            <button class="detail-nav-btn" type="button" aria-label="Next asset" onclick={handleNext}>▶</button>
          </div>
          <button class="close-btn" type="button" onclick={handleClose}>✕</button>
        </div>
      </div>
      <div class="modal-body" id="details-content">
        {#if assetsState.currentCategory === 'Sounds'}
          {#if detailsModal.activeTab === 'details'}
            <div class="tab-content"><SoundDetails id={detailsModal.selectedAsset.id} /></div>
          {:else if detailsModal.activeTab === 'edit'}
            <div class="tab-content" id="edit-content"><SoundEditForm id={detailsModal.selectedAsset.id} onSave={() => {}} /></div>
          {:else if detailsModal.activeTab === 'texture'}
            <div class="tab-content"><p style="color: #888; text-align: center;">Not applicable for sounds.</p></div>
          {/if}
        {:else}
          {#if detailsModal.activeTab === 'details'}
            <div class="tab-content">
              <AssetBasicInfo details={detailsModal.selectedAsset} category={assetsState.currentCategory} />
              <AssetSpritePreview details={detailsModal.selectedAsset} />
              <AssetFrameGroups details={detailsModal.selectedAsset} />
              <AssetFlags flags={detailsModal.selectedAsset.flags} />
            </div>
          {:else if detailsModal.activeTab === 'edit'}
            <div class="tab-content" id="edit-content">
              <AssetEditForm details={detailsModal.selectedAsset} category={assetsState.currentCategory} onSave={handleSave} />
            </div>
          {:else if detailsModal.activeTab === 'texture'}
            <div class="tab-content"><TextureEditor details={detailsModal.selectedAsset} /></div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
