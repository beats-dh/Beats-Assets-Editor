<script lang="ts">
  import { translate } from "../../i18n";
  import "../../styles/modals.css";
  import {
    getAppearancePreviewSpritesBatch,
    loadSprites,
    pixelSprite,
  } from "../../spriteCache";
  import { getSpriteUrl } from "../../utils/spriteUrlCache";
  import { assetsState } from "../../stores/assetsState.svelte";

  let { isOpen, itemDetails, dataType, onClose, onDelete } = $props<{
    isOpen: boolean;
    itemDetails: any;
    dataType: string;
    onClose: () => void;
    onDelete?: (id: number) => void;
  }>();

  let previewSpriteUrl = $state<string | null>(null);

  $effect(() => {
    if (isOpen && itemDetails) {
      if (
        (dataType === "creatures" || dataType === "bosses") &&
        itemDetails.outfit?.looktype
      ) {
        // Usa do cache global se já existir antes de bater na API IPC
        const cachedUrl = assetsState.outfitSprites.get(
          itemDetails.outfit.looktype,
        );
        if (cachedUrl) {
          previewSpriteUrl = cachedUrl;
        } else {
          fetchPreviewSprite(itemDetails.outfit.looktype);
        }
      } else {
        previewSpriteUrl = null;
      }
    }
  });

  async function fetchPreviewSprite(looktype: number) {
    previewSpriteUrl = null;
    try {
      await loadSprites();
      const batchResult = await getAppearancePreviewSpritesBatch("Outfits", [
        looktype,
      ]);
      const buffer = batchResult.get(looktype);
      if (buffer) {
        const url = getSpriteUrl(buffer);
        previewSpriteUrl = url;

        // Alimentar o memory store retroativamente
        assetsState.outfitSprites.set(looktype, url);
      }
    } catch (e) {
      console.warn(
        "Failed to fetch preview sprite for Modal looktype",
        looktype,
        e,
      );
    }
  }

  // Função para fechar clicando no fundo ou botão
  function close() {
    onClose();
  }

  function getIcon(type: string): string {
    switch (type) {
      case "creatures":
        return "🐉";
      case "bosses":
        return "👑";
      case "quests":
        return "📜";
      case "titles":
        return "🏅";
      case "houses":
        return "🏘️";
      case "map_houses":
        return "🗺️";
      default:
        return "📄";
    }
  }

  function formatTitle(item: any, type: string) {
    if (type === "map_houses")
      return translate("static.fallback.mapLayout", { id: item.house_id });
    return item.name || translate("static.fallback.unnamed", { id: item.id });
  }
</script>

{#if isOpen && itemDetails}
  <div
    id="static-data-modal"
    class="asset-details-modal"
    role="dialog"
    aria-modal="true"
    style="display: flex;"
  >
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      onclick={onClose}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      }}
      aria-label="Close modal"
    ></div>
    <div class="modal-content" style="max-width: 500px; max-height: 80vh;">
      <div class="modal-header" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          {#if previewSpriteUrl}
            <canvas
              use:pixelSprite={previewSpriteUrl}
              style="width:48px;height:48px;margin-right:0.5rem;"
            ></canvas>
          {:else}
            <span style="font-size: 1.5rem;">{getIcon(dataType)}</span>
          {/if}
          <h2 style="margin: 0;">{formatTitle(itemDetails, dataType)}</h2>
        </div>
        <div class="modal-tabs">
          {#if onDelete && dataType !== "houses" && dataType !== "map_houses"}
            <button
              class="close-btn"
              style="background: var(--bg-error, #ef4444); width: auto; padding: 0 10px; font-size: 0.9rem; font-weight: bold;"
              onclick={() => {
                if (confirm(translate("modal.static.confirmDelete")))
                  onDelete(itemDetails.id ?? itemDetails.house_id);
              }}
              title={translate("modal.static.btn.delete")}
            >
              {translate("modal.static.btn.delete")}
            </button>
          {/if}
          <button
            class="close-btn"
            onclick={close}
            title={translate("modal.static.btn.close")}>&times;</button
          >
        </div>
      </div>

      <div class="modal-body" style="padding: 1.5rem; overflow-y: auto;">
        <!-- ======================= -->
        <!-- CREATURES / BOSSES      -->
        <!-- ======================= -->
        {#if dataType === "creatures" || dataType === "bosses"}
          <div class="detail-section">
            <h3 class="section-title">
              {translate("modal.static.info.general")}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.id")}</span
                >
                <span class="info-value">{itemDetails.id}</span>
              </div>
              {#if dataType === "creatures"}
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.difficulty")}</span
                  >
                  <span class="info-value">{itemDetails.difficulty || 0}</span>
                </div>
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.occurrence")}</span
                  >
                  <span class="info-value">{itemDetails.occurrence || 0}</span>
                </div>
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.type")}</span
                  >
                  <span class="info-value">
                    {#if itemDetails.is_npc}
                      {itemDetails.is_hostile
                        ? translate("modal.static.info.npcHostile")
                        : translate("modal.static.info.npcFriendly")}
                    {:else}
                      {itemDetails.is_hostile
                        ? translate("modal.static.info.monsterHostile")
                        : translate("modal.static.info.monsterPassive")}
                    {/if}
                  </span>
                </div>
              {/if}
              {#if dataType === "bosses"}
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.targetTier")}</span
                  >
                  <span class="info-value">
                    {#if itemDetails.is_archfoe}
                      {translate("modal.static.info.archfoe")}
                    {:else}
                      {translate("modal.static.info.standard")}
                    {/if}
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <div class="detail-section" style="margin-top: 1.5rem;">
            <h3 class="section-title">
              {translate("modal.static.info.outfitDetails")}
            </h3>
            <div class="info-grid box-panel">
              {#if itemDetails.outfit}
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.lookType")}</span
                  >
                  <span class="info-value"
                    >{itemDetails.outfit.looktype ??
                      translate("modal.static.info.missing")}</span
                  >
                </div>
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.addons")}</span
                  >
                  <span class="info-value"
                    >{itemDetails.outfit.addons ?? 0}</span
                  >
                </div>
                <div class="info-item">
                  <span class="info-label"
                    >{translate("modal.static.info.mountId")}</span
                  >
                  <span class="info-value">{itemDetails.outfit.mount ?? 0}</span
                  >
                </div>

                <div style="grid-column: 1 / -1; margin-top: 0.5rem;">
                  <span
                    class="info-label"
                    style="display:block; margin-bottom: 4px;"
                    >{translate("modal.static.info.colors")}</span
                  >
                  {#if itemDetails.outfit.colors}
                    <div style="display: flex; gap: 0.5rem;">
                      <span class="color-badge"
                        >{translate("modal.static.info.head")}: {itemDetails
                          .outfit.colors.head ?? 0}</span
                      >
                      <span class="color-badge"
                        >{translate("modal.static.info.body")}: {itemDetails
                          .outfit.colors.body ?? 0}</span
                      >
                      <span class="color-badge"
                        >{translate("modal.static.info.legs")}: {itemDetails
                          .outfit.colors.legs ?? 0}</span
                      >
                      <span class="color-badge"
                        >{translate("modal.static.info.feet")}: {itemDetails
                          .outfit.colors.feet ?? 0}</span
                      >
                    </div>
                  {:else}
                    <span class="info-value"
                      >{translate("modal.static.info.none")}</span
                    >
                  {/if}
                </div>
              {:else}
                <div class="info-item">
                  <span class="info-value" style="color:var(--text-muted)"
                    >{translate("modal.static.info.noOutfit")}</span
                  >
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- TITLES                  -->
        <!-- ======================= -->
        {#if dataType === "titles"}
          <div class="detail-section">
            <h3 class="section-title">
              {translate("modal.static.info.titleProfile")}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.id")}</span
                >
                <span class="info-value">{itemDetails.id}</span>
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.gradeRank")}</span
                >
                <span class="info-value">★ {itemDetails.grade || 0}</span>
              </div>
            </div>

            <div style="margin-top: 1rem;" class="box-panel">
              <span
                class="info-label"
                style="display:block; margin-bottom:0.5rem"
                >{translate("modal.static.info.unlockDesc")}</span
              >
              <span class="info-value" style="white-space: pre-wrap;"
                >{itemDetails.description ||
                  translate("modal.static.info.noDesc")}</span
              >
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- QUESTS                  -->
        <!-- ======================= -->
        {#if dataType === "quests"}
          <div class="detail-section">
            <h3 class="section-title">
              {translate("modal.static.info.questEntity")}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.questId")}</span
                >
                <span class="info-value">{itemDetails.id}</span>
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.systemName")}</span
                >
                <span class="info-value">{itemDetails.name}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- HOUSES                  -->
        <!-- ======================= -->
        {#if dataType === "houses"}
          <div class="detail-section">
            <h3 class="section-title">
              {translate("modal.static.info.localityInfo")}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.id")}</span
                ><span class="info-value">{itemDetails.id}</span>
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.town")}</span
                ><span class="info-value"
                  >{itemDetails.town ||
                    translate("modal.static.info.unknown")}</span
                >
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.building")}</span
                ><span class="info-value"
                  >{itemDetails.guildhall
                    ? translate("modal.static.info.guildhall")
                    : translate("modal.static.info.house")}</span
                >
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.premium")}</span
                ><span class="info-value"
                  >{itemDetails.is_premium
                    ? translate("modal.static.info.yes")
                    : translate("modal.static.info.no")}</span
                >
              </div>
            </div>

            <h3 class="section-title" style="margin-top: 1.5rem;">
              {translate("modal.static.info.estateSpecs")}
            </h3>
            <div class="info-grid box-panel">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.location")}</span
                >
                <span class="info-value">
                  {#if itemDetails.position}
                    {itemDetails.position.x ?? "-"}, {itemDetails.position.y ??
                      "-"}, {itemDetails.position.z ?? "-"}
                  {:else}
                    {translate("modal.static.info.unmapped")}
                  {/if}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.size")}</span
                ><span class="info-value"
                  >{itemDetails.size || 0}
                  {translate("modal.static.info.sqm")}</span
                >
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.rent")}</span
                ><span class="info-value"
                  >{itemDetails.rent || 0}
                  {translate("modal.static.info.goldMo")}</span
                >
              </div>
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.beds")}</span
                ><span class="info-value"
                  >{itemDetails.beds || 0}
                  {translate("modal.static.info.slots")}</span
                >
              </div>
            </div>

            <div style="margin-top: 1.5rem;" class="box-panel">
              <span
                class="info-label"
                style="display:block; margin-bottom:0.5rem"
                >{translate("modal.static.info.houseAdv")}</span
              >
              <span class="info-value" style="white-space: pre-wrap;"
                >{itemDetails.description ||
                  translate("modal.static.info.noDescFound")}</span
              >
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- MAP HOUSES              -->
        <!-- ======================= -->
        {#if dataType === "map_houses"}
          <div class="detail-section">
            <h3 class="section-title">
              {translate("modal.static.info.topologyArray")}
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label"
                  >{translate("modal.static.info.houseIdBound")}</span
                ><span class="info-value">#{itemDetails.house_id}</span>
              </div>
            </div>

            <div class="box-panel" style="margin-top: 1.5rem;">
              {#if itemDetails.layout}
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label"
                      >{translate("modal.static.info.startCoord")}</span
                    >
                    <span class="info-value">
                      {#if itemDetails.layout.position}
                        {itemDetails.layout.position.x ?? "-"}, {itemDetails
                          .layout.position.y ?? "-"}, {itemDetails.layout
                          .position.z ?? "-"}
                      {:else}
                        -
                      {/if}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label"
                      >{translate("modal.static.info.floorLevels")}</span
                    ><span class="info-value"
                      >{itemDetails.layout.size?.floors ?? 1}</span
                    >
                  </div>
                  <div class="info-item">
                    <span class="info-label"
                      >{translate("modal.static.info.dimensions")}</span
                    ><span class="info-value"
                      >{itemDetails.layout.size?.width ?? 0} x {itemDetails
                        .layout.size?.height ?? 0}
                      {translate("modal.static.info.tiles")}</span
                    >
                  </div>
                </div>

                <!-- Grid Layout Info -->
                {#if itemDetails.layout.tiles?.floor_data?.rows}
                  <div
                    style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);"
                  >
                    <span class="info-label"
                      >{translate("modal.static.info.floormapChunk")}</span
                    >
                    <ul
                      style="margin: 0.5rem 0 0 1rem; color: var(--text-secondary); font-size: 0.9em;"
                    >
                      <li>
                        {translate("modal.static.info.mapRowsExtracted")}: {itemDetails
                          .layout.tiles.floor_data.rows.length}
                      </li>
                      <li>
                        {translate("modal.static.info.tilesDeserialized")}
                      </li>
                    </ul>
                  </div>
                {/if}
              {:else}
                <div
                  class="info-value"
                  style="color:var(--text-muted); padding: 1rem; text-align: center;"
                >
                  {translate("modal.static.info.noLayoutStructure")}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .box-panel {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 6px;
  }

  .color-badge {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--text-primary);
  }
</style>
