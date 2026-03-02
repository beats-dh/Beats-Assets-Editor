<script lang="ts">
  import { onMount, tick } from "svelte";
  import { assetsState } from "../../stores/assetsState.svelte";
  import {
    isAssetSelected,
    toggleAssetSelection,
    setAssetSelection,
    getCurrentSelection,
    openAssetDetails,
    selectionState,
  } from "../../stores/selectionState.svelte";
  import {
    loadSpritesForAssets,
    clearAssetsQueryCachesForSprites,
  } from "../../utils/spriteLoading";
  import { stopAllAnimationPlayers } from "../../animation";
  import { COMMANDS } from "../../commands";
  import { invoke } from "../../utils/invoke";
  import { translate } from "../../i18n";
  import { loadAssetsData } from "../../services/assetService";
  import {
    handleImport as serviceImport,
    handleExport as serviceExport,
    handleCopyFlags as serviceCopyFlags,
    handlePasteFlagsBatch as servicePasteFlags,
    handleDeleteAppearances as serviceDelete,
    handleDuplicate as serviceDuplicate,
    handleCreateNew as serviceCreateNew,
  } from "../../services/importExportService";
  import AddSoundModal from "./AddSoundModal.svelte";

  // Back button
  function goBack() {
    stopAllAnimationPlayers();
    clearAssetsQueryCachesForSprites();
    assetsState.viewMode = "categories";
  }

  // Selection tracking
  let hasClipboard = $state(false);
  let selectedCount = $derived(selectionState.selected.length);

  onMount(() => {
    loadAssetsData();
  });

  // React to category changes
  let lastCategory = $state("");
  let showNames = $state(true);
  let subcategories = $state<{ value: string; label: string }[]>([]);

  $effect(() => {
    if (assetsState.currentCategory !== lastCategory) {
      lastCategory = assetsState.currentCategory;
      showNames = !["Effects", "Missiles", "Outfits"].includes(
        assetsState.currentCategory,
      );
      loadSubcategories();
    }
  });

  // Load sprites when assets change
  $effect(() => {
    const assets = assetsState.assets;
    const category = assetsState.currentCategory;
    if (assets && assets.length > 0) {
      (async () => {
        await tick();
        requestAnimationFrame(() => {
          loadSpritesForAssets(assets, category);
        });
      })();
    }
  });

  // --- Actions ---

  async function handleImport() {
    await serviceImport();
  }

  async function handleExport() {
    const sel = getCurrentSelection();
    if (sel.length === 0) {
      const idInput = prompt(translate("prompt.enterExportId"), "");
      if (!idInput) return;
      const id = parseInt(idInput);
      if (isNaN(id)) return;
      await serviceExport(assetsState.currentCategory, id);
      return;
    }
    const target = sel[sel.length - 1];
    await serviceExport(target.category, target.id);
  }

  async function handleDuplicate() {
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    const target = sel[sel.length - 1];
    const duplicatedId = await serviceDuplicate(target.category, target.id);
    if (duplicatedId) {
      loadAssetsData();
    }
  }

  async function handleCopyFlags() {
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    const target = sel[sel.length - 1];
    await serviceCopyFlags(target.category, target.id);
    hasClipboard = true;
  }

  async function handlePasteFlags() {
    if (!hasClipboard) return;
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    await servicePasteFlags(sel);
  }

  async function handleCreate() {
    const createdId = await serviceCreateNew(assetsState.currentCategory);
    if (createdId) {
      openAssetDetails({ id: createdId } as any);
    }
  }

  async function handleDelete() {
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    await serviceDelete(sel);
  }

  function handleAssetClick(e: MouseEvent | KeyboardEvent, asset: any) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        const lastSel = getCurrentSelection().pop();
        if (lastSel && lastSel.category === assetsState.currentCategory) {
          const assetsList = assetsState.assets;
          const lastIdx = assetsList.findIndex((a) => a.id === lastSel.id);
          const currIdx = assetsList.findIndex((a) => a.id === asset.id);
          if (lastIdx !== -1 && currIdx !== -1) {
            const start = Math.min(lastIdx, currIdx);
            const end = Math.max(lastIdx, currIdx);
            for (let i = start; i <= end; i++) {
              setAssetSelection(
                assetsState.currentCategory,
                assetsList[i].id,
                true,
                false,
              );
            }
            return;
          }
        }
      }
      toggleAssetSelection(assetsState.currentCategory, asset.id);
      return;
    }
    openAssetDetails(asset);
  }

  function handleCheckboxClick(e: Event, asset: any) {
    e.stopPropagation();
    toggleAssetSelection(assetsState.currentCategory, asset.id);
  }

  let timer: number;
  function handleSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    assetsState.searchQuery = val;
    clearTimeout(timer);
    timer = setTimeout(() => {
      assetsState.currentPage = 0;
      loadAssetsData();
    }, 300) as unknown as number;
  }

  function clearSearch() {
    assetsState.searchQuery = "";
    assetsState.currentPage = 0;
    loadAssetsData();
  }

  // Pagination
  function prevPage() {
    if (assetsState.currentPage > 0) {
      stopAllAnimationPlayers();
      clearAssetsQueryCachesForSprites();
      assetsState.currentPage--;
      loadAssetsData();
    }
  }

  function nextPage() {
    const maxPage = Math.max(
      1,
      Math.ceil(assetsState.totalItems / assetsState.pageSize),
    );
    if (assetsState.currentPage < maxPage - 1) {
      stopAllAnimationPlayers();
      clearAssetsQueryCachesForSprites();
      assetsState.currentPage++;
      loadAssetsData();
    }
  }

  function handlePageSizeChange(e: Event) {
    stopAllAnimationPlayers();
    clearAssetsQueryCachesForSprites();
    assetsState.pageSize = parseInt((e.target as HTMLSelectElement).value);
    assetsState.currentPage = 0;
    loadAssetsData();
  }

  function getPaginationInfo(current: number, size: number, total: number) {
    const totalPages = Math.max(1, Math.ceil(total / size));
    const pageNum = Math.min(current, totalPages - 1);
    return `${pageNum + 1} ${translate("categoryView.pagination.of")} ${totalPages}`;
  }

  function getResultsText(current: number, size: number, total: number) {
    if (total === 0)
      return "0 " + translate("category.itemsCount", { count: "" }).trim();
    const start = current * size + 1;
    const end = Math.min(total, (current + 1) * size);
    return `${start}-${end} ${translate("categoryView.of")} ${total}`;
  }

  // Dynamic Subcategories
  async function loadSubcategories() {
    subcategories = [];
    if (assetsState.currentCategory === "Objects") {
      try {
        const subs = await invoke<[string, string][]>(
          COMMANDS.GET_ITEM_SUBCATEGORIES,
        );
        subcategories = subs.map(([value, label]) => ({ value, label }));
      } catch (err) {
        console.error("Error loading object subcategories", err);
        subcategories = [
          { value: "All", label: translate("subcategory.option.allObjects") },
        ];
      }
    } else if (assetsState.currentCategory === "Sounds") {
      try {
        const types = await invoke<string[]>(COMMANDS.LIST_SOUND_TYPES);
        const raw = [
          { value: "All", label: translate("subcategory.option.allSounds") },
          ...types.map((t) => {
            const key: Record<string, string> = {
              "Ambience Streams": "subcategory.ambienceStreams",
              "Ambience Object Streams": "subcategory.ambienceObjectStreams",
              "Music Templates": "subcategory.musicTemplates",
            };
            return { value: t, label: key[t] ? translate(key[t] as any) : t };
          }),
          {
            value: "Ambience Streams",
            label: translate("subcategory.ambienceStreams"),
          },
          {
            value: "Ambience Object Streams",
            label: translate("subcategory.ambienceObjectStreams"),
          },
          {
            value: "Music Templates",
            label: translate("subcategory.musicTemplates"),
          },
        ];
        const seen = new Set<string>();
        subcategories = raw.filter((s) => {
          if (seen.has(s.value)) return false;
          seen.add(s.value);
          return true;
        });
      } catch (err) {
        console.error("Error loading sound types", err);
        subcategories = [
          { value: "All", label: translate("subcategory.option.allSounds") },
        ];
      }
    }
  }

  function handleSubcategoryChange(e: Event) {
    stopAllAnimationPlayers();
    clearAssetsQueryCachesForSprites();
    assetsState.currentSubcategory = (e.target as HTMLSelectElement).value;
    assetsState.currentPage = 0;
    loadAssetsData();
  }

  let showAddSoundModal = $state(false);

  function handleAddSound() {
    showAddSoundModal = true;
  }

  function handleCloseAddSound() {
    showAddSoundModal = false;
  }

  function handleSoundCreated(_id: number) {
    loadAssetsData();
  }
</script>

<AddSoundModal
  isOpen={showAddSoundModal}
  onClose={handleCloseAddSound}
  onSoundCreated={handleSoundCreated}
/>

<main id="category-view" class="category-view" style="display: block;">
  <!-- Modern Unified Header -->
  <header class="modern-header">
    <div class="header-left">
      <button id="back-btn" class="modern-back-btn" onclick={goBack}>
        <svg
          class="back-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>{translate("categoryView.back")}</span>
      </button>
      <div class="header-divider"></div>
    </div>

    <div
      id="appearance-action-bar"
      class="appearance-action-bar"
      aria-label="Appearance actions"
    >
      <div class="appearance-action-group">
        {#if assetsState.currentCategory !== "Sounds"}
          <button class="appearance-action-button" onclick={handleImport}>
            {translate("action.button.import")}
          </button>
          <button
            class="appearance-action-button"
            onclick={handleExport}
            disabled={selectedCount === 0}
          >
            {translate("action.button.export")}
          </button>
          <button
            class="appearance-action-button"
            onclick={handleDuplicate}
            disabled={selectedCount !== 1}
          >
            {translate("action.button.duplicate")}
          </button>
          <button
            class="appearance-action-button"
            onclick={handleCopyFlags}
            disabled={selectedCount !== 1}
          >
            {translate("action.button.copyFlags")}
          </button>
          <button
            class="appearance-action-button"
            onclick={handlePasteFlags}
            disabled={selectedCount === 0 || !hasClipboard}
          >
            {translate("action.button.pasteFlags")}
          </button>
          <button
            class="appearance-action-button destructive"
            onclick={handleDelete}
            disabled={selectedCount === 0}
          >
            {translate("button.delete")}
          </button>
          <button
            class="appearance-action-button primary"
            onclick={handleCreate}
          >
            {translate("button.create")}
          </button>
        {:else}
          <button
            class="appearance-action-button primary"
            onclick={handleAddSound}
          >
            {translate("modal.sound.add")}
          </button>
        {/if}
      </div>
    </div>

    <div class="header-center">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            id="asset-search"
            placeholder={translate("search.placeholder")}
            class="search-input"
            value={assetsState.searchQuery}
            oninput={handleSearch}
          />
          {#if assetsState.searchQuery}
            <button
              id="clear-search"
              class="clear-search-btn"
              onclick={clearSearch}
              style="display: flex;"
              aria-label={translate("search.clear")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="results-info">
        <span id="results-count" class="results-text">
          {getResultsText(
            assetsState.currentPage,
            assetsState.pageSize,
            assetsState.totalItems,
          )}
        </span>
      </div>

      <div class="pagination-nav" role="group">
        <button
          id="prev-page"
          class="pagination-btn"
          type="button"
          disabled={assetsState.currentPage <= 0}
          onclick={prevPage}
        >
          <span>◀</span>
        </button>
        <div class="pagination-info">
          <span id="page-info" class="results-text">
            {getPaginationInfo(
              assetsState.currentPage,
              assetsState.pageSize,
              assetsState.totalItems,
            )}
          </span>
        </div>
        <button
          id="next-page"
          class="pagination-btn"
          type="button"
          disabled={assetsState.currentPage >=
            Math.ceil(assetsState.totalItems / assetsState.pageSize) - 1}
          onclick={nextPage}
        >
          <span>▶</span>
        </button>
      </div>

      <div class="page-size-container">
        <select
          id="page-size"
          class="page-size-select"
          bind:value={assetsState.pageSize}
          onchange={handlePageSizeChange}
        >
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={10000}>10000</option>
          <option value={50000}>50000</option>
        </select>
      </div>

      {#if subcategories.length > 0}
        <div class="filter-container">
          <select
            id="subcategory-select"
            class="filter-select"
            onchange={handleSubcategoryChange}
            value={assetsState.currentSubcategory}
          >
            {#each subcategories as sub}
              <option value={sub.value}>{sub.label}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  </header>

  <div class="view-content">
    <div id="assets-grid" class="modern-assets-grid">
      {#if assetsState.isLoading}
        <div class="loading-spinner">
          <div>🔄 {translate("categoryView.loading")}</div>
        </div>
      {:else if assetsState.assets.length === 0}
        <div class="empty-state">
          <h3>📭 {translate("categoryView.noAssets")}</h3>
          <p>{translate("categoryView.noAssetsCriteria")}</p>
        </div>
      {:else}
        {#each assetsState.assets as asset (asset.id)}
          <div
            class="asset-item"
            class:is-selected={isAssetSelected(
              assetsState.currentCategory,
              asset.id,
            )}
            class:sound-item={assetsState.currentCategory === "Sounds"}
            data-asset-id={asset.id}
            data-category={assetsState.currentCategory}
            onclick={(e) => {
              if ((e.target as HTMLElement).closest(".asset-select-control"))
                return;
              handleAssetClick(e, asset);
            }}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if ((e.target as HTMLElement).closest(".asset-select-control"))
                  return;
                e.preventDefault();
                handleAssetClick(e, asset);
              }
            }}
            role="button"
            tabindex="0"
          >
            <label
              class="asset-select-control"
              aria-label={translate("categoryView.aria.selectAsset", {
                id: asset.id,
              })}
            >
              <input
                type="checkbox"
                class="asset-select-checkbox"
                data-asset-id={asset.id}
                data-category={assetsState.currentCategory}
                checked={isAssetSelected(assetsState.currentCategory, asset.id)}
                onchange={(e) => handleCheckboxClick(e, asset)}
              />
              <span class="asset-select-indicator" aria-hidden="true"></span>
            </label>

            {#if assetsState.currentCategory === "Sounds"}
              <div class="sound-icon-large">🔊</div>
              <div class="asset-details">
                <span class="asset-id">#{asset.id}</span>
                <span class="asset-name"
                  >{asset.name || translate("browser.static.unnamed")}</span
                >
              </div>
            {:else}
              <div class="asset-id">#{asset.id}</div>
              <div class="asset-visual-row">
                <div class="asset-image-container" id="sprite-{asset.id}">
                  <div class="asset-image-overlay">
                    <div class="asset-flags">
                      {#if asset.flags}
                        <div
                          class="flag-indicator"
                          title={translate("categoryView.flag.title")}
                        ></div>
                      {/if}
                    </div>
                  </div>
                  <div class="sprite-loading">🔄</div>
                </div>
              </div>
              {#if showNames}
                <div class="asset-name">
                  {asset.name || translate("browser.static.unnamed")}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</main>
