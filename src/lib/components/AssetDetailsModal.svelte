<script lang="ts">
  import {
    detailsModal,
    closeAssetDetails,
    openAssetDetails,
  } from "../../stores/selectionState.svelte";
  import { closeSpriteLibrary } from "../../stores/spriteLibraryState.svelte";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { translate } from "../../i18n";
  import { loadDetailSprites } from "../../utils/spriteLoading";
  import { addToExportQueue } from "../../stores/exportQueueState.svelte";
  import { invoke } from "../../utils/invoke";
  import { showStatus } from "../../utils";
  import type { CompleteAppearanceItem, CompleteFlags } from "../../types";

  // Sub-components
  import AssetBasicInfo from "./asset-details/AssetBasicInfo.svelte";
  import AssetFlags from "./asset-details/AssetFlags.svelte";
  import AssetFrameGroups from "./asset-details/AssetFrameGroups.svelte";
  import AssetSpritePreview from "./asset-details/AssetSpritePreview.svelte";
  import AssetEditForm from "./asset-details/AssetEditForm.svelte";
  import TextureEditor from "./asset-details/texture/TextureEditor.svelte";
  import OtherTabView from "./asset-details/OtherTabView.svelte";
  import SoundDetails from "./asset-details/SoundDetails.svelte";
  import SoundEditForm from "./asset-details/SoundEditForm.svelte";

  // Import styles
  import "../../styles/modals.css";

  // Callback referenciado pelo form filho (para pegar as alterações local do componente child Svelte).
  let getEditedDataFn: (() => CompleteAppearanceItem) | null = null;

  function handleClose() {
    closeAssetDetails();
    closeSpriteLibrary();
  }

  function handlePrev() {
    if (!detailsModal.selectedAsset) return;
    const currentId = detailsModal.selectedAsset.id;
    const currentIndex = assetsState.assets.findIndex(
      (a) => a.id === currentId,
    );
    if (currentIndex > 0) {
      openAssetDetails(assetsState.assets[currentIndex - 1], false);
    }
  }

  function handleNext() {
    if (!detailsModal.selectedAsset) return;
    const currentId = detailsModal.selectedAsset.id;
    const currentIndex = assetsState.assets.findIndex(
      (a) => a.id === currentId,
    );
    if (currentIndex !== -1 && currentIndex < assetsState.assets.length - 1) {
      openAssetDetails(assetsState.assets[currentIndex + 1], false);
    }
  }

  function setTab(tab: "details" | "edit" | "texture" | "other") {
    detailsModal.activeTab = tab;
    if (tab === "details" && detailsModal.selectedAsset) {
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
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
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
        const isIncomplete =
          !currentAsset.frame_groups ||
          (currentAsset.frame_groups.length > 0 &&
            !currentAsset.frame_groups[0].sprite_info);
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
      const fullDetails = await invoke("get_complete_appearance", {
        category,
        id: assetId,
      });
      if (fullDetails && detailsModal.selectedAsset?.id === assetId) {
        detailsModal.selectedAsset = fullDetails as CompleteAppearanceItem;
      }
    } catch (err) {
      console.error("Failed to fetch complete details", err);
    }
  }

  async function triggerSaveFromHeader() {
    if (!getEditedDataFn) return;
    const updatedData = getEditedDataFn();
    await handleSave(updatedData);
  }

  async function handleSave(updated: CompleteAppearanceItem) {
    if (!detailsModal.selectedAsset) return;
    const original = detailsModal.selectedAsset;
    const category = assetsState.currentCategory;
    const id = original.id;

    try {
      if (updated.name !== original.name) {
        await invoke("update_appearance_name", {
          category,
          id,
          newName: updated.name,
        });
      }
      if (updated.description !== original.description) {
        await invoke("update_appearance_description", {
          category,
          id,
          newDescription: updated.description,
        });
      }

      // Boolean flags
      const originalFlags: CompleteFlags =
        original.flags || ({} as CompleteFlags);
      const updatedFlags: CompleteFlags =
        updated.flags || ({} as CompleteFlags);
      const getBool = (obj: any, key: string) => !!obj[key];
      const boolFlags = [
        "clip",
        "bottom",
        "top",
        "container",
        "cumulative",
        "usable",
        "forceuse",
        "multiuse",
        "liquidpool",
        "liquidcontainer",
        "unpass",
        "unmove",
        "unsight",
        "avoid",
        "no_movement_animation",
        "take",
        "hang",
        "rotate",
        "dont_hide",
        "translucent",
        "lying_object",
        "animate_always",
        "fullbank",
        "ignore_look",
        "wrap",
        "unwrap",
        "topeffect",
        "corpse",
        "player_corpse",
        "ammo",
        "show_off_socket",
        "reportable",
        "reverse_addons_east",
        "reverse_addons_west",
        "reverse_addons_south",
        "reverse_addons_north",
        "wearout",
        "clockexpire",
        "expire",
        "expirestop",
        "deco_item_kit",
        "dual_wielding",
      ];
      for (const key of boolFlags) {
        const oldVal = getBool(originalFlags, key);
        const newVal = getBool(updatedFlags, key);
        if (oldVal !== newVal) {
          await invoke("update_appearance_flag_bool", {
            category,
            id,
            flag: key,
            value: newVal,
          });
        }
      }

      // Complex flags
      if (updatedFlags.light)
        await invoke("update_appearance_light", {
          category,
          id,
          brightness: updatedFlags.light.brightness,
          color: updatedFlags.light.color,
        });
      if (updatedFlags.shift)
        await invoke("update_appearance_shift", {
          category,
          id,
          x: updatedFlags.shift.x,
          y: updatedFlags.shift.y,
        });
      if (updatedFlags.height)
        await invoke("update_appearance_height", {
          category,
          id,
          elevation: updatedFlags.height.elevation,
        });
      if (updatedFlags.write)
        await invoke("update_appearance_write", {
          category,
          id,
          maxTextLength: updatedFlags.write.max_text_length,
        });
      if (updatedFlags.write_once)
        await invoke("update_appearance_write_once", {
          category,
          id,
          maxTextLengthOnce: updatedFlags.write_once.max_text_length_once,
        });
      if (updatedFlags.automap)
        await invoke("update_appearance_automap", {
          category,
          id,
          color: updatedFlags.automap.color,
        });
      if (updatedFlags.hook)
        await invoke("update_appearance_hook", {
          category,
          id,
          direction: updatedFlags.hook.direction,
        });
      if (updatedFlags.lenshelp)
        await invoke("update_appearance_lenshelp", {
          category,
          id,
          lenshelpId: updatedFlags.lenshelp.id,
        });
      if (updatedFlags.clothes)
        await invoke("update_appearance_clothes", {
          category,
          id,
          slot: updatedFlags.clothes.slot,
        });
      if (updatedFlags.default_action)
        await invoke("update_appearance_default_action", {
          category,
          id,
          action: updatedFlags.default_action.action,
        });
      if (updatedFlags.weapon_type !== undefined)
        await invoke("update_appearance_weapon_type", {
          category,
          id,
          weaponType: updatedFlags.weapon_type,
        });
      if (updatedFlags.market) {
        const m = updatedFlags.market;
        await invoke("update_appearance_market", {
          category,
          id,
          categoryValue: m.category,
          tradeAsObjectId: m.trade_as_object_id,
          showAsObjectId: m.show_as_object_id,
        });
      }
      if (updatedFlags.changed_to_expire?.former_object_typeid)
        await invoke("update_appearance_changed_to_expire", {
          category,
          id,
          formerObjectTypeid:
            updatedFlags.changed_to_expire.former_object_typeid,
        });
      if (updatedFlags.cyclopedia_item?.cyclopedia_type)
        await invoke("update_appearance_cyclopedia_item", {
          category,
          id,
          cyclopediaType: updatedFlags.cyclopedia_item.cyclopedia_type,
        });
      if (updatedFlags.upgrade_classification?.upgrade_classification)
        await invoke("update_appearance_upgrade_classification", {
          category,
          id,
          upgradeClassification:
            updatedFlags.upgrade_classification.upgrade_classification,
        });
      if (updatedFlags.skillwheel_gem)
        await invoke("update_appearance_skillwheel_gem", {
          category,
          id,
          gemQualityId: updatedFlags.skillwheel_gem.gem_quality_id,
          vocationId: updatedFlags.skillwheel_gem.vocation_id,
        });
      if (updatedFlags.imbueable?.slot_count)
        await invoke("update_appearance_imbueable", {
          category,
          id,
          slotCount: updatedFlags.imbueable.slot_count,
        });
      if (updatedFlags.proficiency?.proficiency_id)
        await invoke("update_appearance_proficiency", {
          category,
          id,
          proficiencyId: updatedFlags.proficiency.proficiency_id,
        });
      if (updatedFlags.minimum_level !== undefined)
        await invoke("update_appearance_minimum_level", {
          category,
          id,
          minimumLevel: updatedFlags.minimum_level,
        });
      if (updatedFlags.restrict_to_vocation)
        await invoke("update_appearance_restrict_to_vocation", {
          category,
          id,
          vocations: updatedFlags.restrict_to_vocation,
        });
      if (updatedFlags.npc_sale_data)
        await invoke("update_appearance_npc_sale_data", {
          category,
          id,
          npcSaleData: updatedFlags.npc_sale_data,
        });

      await invoke("save_appearances_file");
      const newDetails = await invoke("get_complete_appearance", {
        category,
        id,
      });
      detailsModal.selectedAsset = newDetails as CompleteAppearanceItem;
      showStatus(translate("status.saveSuccess"), "success");
    } catch (err) {
      console.error("Failed to save asset:", err);
      showStatus(translate("status.saveError", { err: String(err) }), "error");
    }
  }
</script>

{#if detailsModal.isOpen && detailsModal.selectedAsset}
  <div
    id="asset-details"
    class="asset-details-modal"
    role="dialog"
    aria-modal="true"
    style="display: flex;"
  >
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      onclick={handleClose}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClose();
        }
      }}
      aria-label={translate("modal.btn.cancel" as any)}
    ></div>
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-tabs">
          <button
            class="tab-btn"
            class:active={detailsModal.activeTab === "details"}
            onclick={() => setTab("details")}
            >{translate("modal.detailsTab")}</button
          >
          <button
            class="tab-btn"
            class:active={detailsModal.activeTab === "edit"}
            onclick={() => setTab("edit")}>{translate("modal.editTab")}</button
          >
          <button
            class="tab-btn"
            class:active={detailsModal.activeTab === "texture"}
            onclick={() => setTab("texture")}
            >{translate("modal.textureTab")}</button
          >
          {#if assetsState.currentCategory !== "Sounds"}
            <button
              class="tab-btn"
              class:active={detailsModal.activeTab === "other"}
              onclick={() => setTab("other")}
              >{translate("modal.otherTab")}</button
            >
          {/if}
        </div>
        <div class="modal-actions">
          {#if detailsModal.activeTab === "edit"}
            <button
              class="btn-primary"
              style="margin-right: 0.5rem;"
              onclick={triggerSaveFromHeader}
            >
              {translate("action.button.saveChanges")}
            </button>
          {/if}
          {#if assetsState.currentCategory !== "Sounds"}
            <button
              class="btn-secondary"
              style="margin-right: 0.5rem;"
              title={translate("export.queue.add")}
              onclick={() =>
                detailsModal.selectedAsset &&
                addToExportQueue(
                  assetsState.currentCategory,
                  detailsModal.selectedAsset.id,
                )}
            >
              {translate("export.queue.add")}
            </button>
          {/if}
          <div class="modal-nav-controls" role="group">
            <button
              class="detail-nav-btn"
              type="button"
              aria-label={translate("modal.nav.prev")}
              onclick={handlePrev}>◀</button
            >
            <button
              class="detail-nav-btn"
              type="button"
              aria-label={translate("modal.nav.next")}
              onclick={handleNext}>▶</button
            >
          </div>
          <button class="close-btn" type="button" onclick={handleClose}
            >✕</button
          >
        </div>
      </div>
      <div class="modal-body" id="details-content">
        {#if assetsState.currentCategory === "Sounds"}
          {#if detailsModal.activeTab === "details"}
            <div class="tab-content">
              <SoundDetails id={detailsModal.selectedAsset.id} />
            </div>
          {:else if detailsModal.activeTab === "edit"}
            <div class="tab-content" id="edit-content">
              <SoundEditForm
                id={detailsModal.selectedAsset.id}
                onSave={() => {}}
              />
            </div>
          {:else if detailsModal.activeTab === "texture"}
            <div class="tab-content">
              <p style="color: var(--text-muted); text-align: center;">
                {translate("asset.notApplicableSounds")}
              </p>
            </div>
          {/if}
        {:else if detailsModal.activeTab === "details"}
          <div class="tab-content">
            <AssetBasicInfo
              details={detailsModal.selectedAsset}
              category={assetsState.currentCategory}
            />
            <AssetSpritePreview details={detailsModal.selectedAsset} />
            <AssetFrameGroups details={detailsModal.selectedAsset} />
            <AssetFlags flags={detailsModal.selectedAsset.flags} />
          </div>
        {:else if detailsModal.activeTab === "edit"}
          <div class="tab-content" id="edit-content">
            <AssetEditForm
              details={detailsModal.selectedAsset}
              category={assetsState.currentCategory}
              bindDetails={(fn: any) => (getEditedDataFn = fn)}
            />
          </div>
        {:else if detailsModal.activeTab === "texture"}
          <div class="tab-content">
            <TextureEditor details={detailsModal.selectedAsset} />
          </div>
        {:else if detailsModal.activeTab === "other"}
          <div class="tab-content">
            <OtherTabView
              category={assetsState.currentCategory}
              id={detailsModal.selectedAsset.id}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
