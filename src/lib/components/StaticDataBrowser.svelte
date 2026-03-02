<script lang="ts">
  import { translate } from "../../i18n";
  import { invoke } from "@tauri-apps/api/core";
  import { join } from "@tauri-apps/api/path";
  import {
    assetsState,
    updateStaticDataState,
  } from "../../stores/assetsState.svelte";
  import { COMMANDS } from "../../commands";
  import type {
    StaticCreature,
    StaticTitle,
    StaticHouse,
    StaticBoss,
    StaticQuest,
  } from "../../types";
  import {
    getAppearancePreviewSpritesBatch,
    loadSprites,
    pixelSprite,
  } from "../../spriteCache";
  import { getSpriteUrl } from "../../utils/spriteUrlCache";
  import StaticDataModal from "./StaticDataModal.svelte";
  import StaticDataFormModal from "./StaticDataFormModal.svelte";

  let dataReady = $state(false);
  let isCreateModalOpen = $state(false);

  // Search
  let searchQuery = $state("");

  // Derived state to know what we are rendering
  let currentDataType = $derived(assetsState.currentStaticDataType);

  // Derived arrays do Store persistente
  let creatures = $derived(assetsState.creatures);
  let titles = $derived(assetsState.titles);
  let houses = $derived(assetsState.houses);
  let bosses = $derived(assetsState.bosses);
  let quests = $derived(assetsState.quests);
  let mapHouses = $derived(assetsState.mapHouses);
  let outfitSprites = $derived(assetsState.outfitSprites);

  // Trigger loads from backend RAM when component mounts or datatype changes
  $effect(() => {
    if (currentDataType) {
      loadData(currentDataType);
    }
  });

  async function loadData(type: string) {
    dataReady = false;
    try {
      if (type === "creatures" && assetsState.creatures.length === 0) {
        assetsState.creatures = await invoke<StaticCreature[]>(
          COMMANDS.GET_STATICDATA_CREATURES,
        );
        await preloadOutfits(
          assetsState.creatures
            .map((c) => c.outfit?.looktype)
            .filter((id) => id != null) as number[],
        );
      } else if (type === "titles" && assetsState.titles.length === 0) {
        assetsState.titles = await invoke<StaticTitle[]>(
          COMMANDS.GET_STATICDATA_TITLES,
        );
      } else if (type === "houses" && assetsState.houses.length === 0) {
        assetsState.houses = await invoke<StaticHouse[]>(
          COMMANDS.GET_STATICDATA_HOUSES,
        );
      } else if (type === "bosses" && assetsState.bosses.length === 0) {
        assetsState.bosses = await invoke<StaticBoss[]>(
          COMMANDS.GET_STATICDATA_BOSSES,
        );
        await preloadOutfits(
          assetsState.bosses
            .map((b) => b.outfit?.looktype)
            .filter((id) => id != null) as number[],
        );
      } else if (type === "quests" && assetsState.quests.length === 0) {
        assetsState.quests = await invoke<StaticQuest[]>(
          COMMANDS.GET_STATICDATA_QUESTS,
        );
      } else if (type === "map_houses" && assetsState.mapHouses.length === 0) {
        assetsState.mapHouses = await invoke<any[]>(
          COMMANDS.GET_STATICMAPDATA_HOUSES,
        );
      }
    } catch (e) {
      console.error(`Failed to load static list for ${type}`, e);
    } finally {
      dataReady = true;
    }
  }

  async function preloadOutfits(lookTypes: number[]) {
    if (lookTypes.length === 0) return;

    const uniqueTypes = [...new Set(lookTypes)].filter(
      (id) => !assetsState.outfitSprites.has(id),
    );
    if (uniqueTypes.length === 0) return;

    try {
      await loadSprites();

      // Progressive rendering via onProgress callback (chunking is internal)
      const updateSprites = (batchResult: Map<number, Uint8Array>) => {
        for (const [id, buffer] of batchResult.entries()) {
          if (!assetsState.outfitSprites.has(id)) {
            try {
              assetsState.outfitSprites.set(id, getSpriteUrl(buffer));
            } catch (e) {
              console.warn(`Failed to buffer URL for LookType ${id}`);
            }
          }
        }
      };

      const batchResult = await getAppearancePreviewSpritesBatch(
        "Outfits",
        uniqueTypes,
        updateSprites,
      );
      updateSprites(batchResult); // Final pass
    } catch (e) {
      console.error("Failed to preload outfits batch", e);
    }
  }

  // Filtered lists based on search
  let filteredCreatures = $derived(
    creatures.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
  let filteredTitles = $derived(
    titles.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
  let filteredHouses = $derived(
    houses.filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
  let filteredBosses = $derived(
    bosses.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
  let filteredQuests = $derived(
    quests.filter((q) =>
      q.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );
  let filteredMapHouses = $derived(
    mapHouses.filter((m) =>
      (m.house_id?.toString() || "").includes(searchQuery),
    ),
  );

  let filteredList = $derived(
    currentDataType === "creatures"
      ? filteredCreatures
      : currentDataType === "bosses"
        ? filteredBosses
        : currentDataType === "titles"
          ? filteredTitles
          : currentDataType === "quests"
            ? filteredQuests
            : currentDataType === "houses"
              ? filteredHouses
              : currentDataType === "map_houses"
                ? filteredMapHouses
                : [],
  );

  let selectedItem = $state<any>(null);
  let isModalOpen = $state(false);

  function openModal(item: any) {
    selectedItem = item;
    isModalOpen = true;
  }

  function getIconForItem(type: string): string {
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

  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      const tibiaPath = await invoke<string>(COMMANDS.GET_TIBIA_BASE_PATH);
      const files = await invoke<string[]>(COMMANDS.LIST_STATICDATA_FILES, {
        tibiaPath,
      });
      if (files && files.length > 0) {
        const sdPath = await join(tibiaPath, "assets", files[0]);
        await invoke(COMMANDS.SAVE_STATICDATA_FILE, { path: sdPath });
        console.log("StaticData saved to", sdPath);
      }
    } catch (e) {
      console.error("Failed to save static data", e);
    } finally {
      isSaving = false;
    }
  }

  function handleCreateNew() {
    isCreateModalOpen = true;
  }

  async function handleFormSubmit(newItem: any) {
    let currentArr = [];
    switch (currentDataType) {
      case "creatures":
        currentArr = creatures;
        break;
      case "bosses":
        currentArr = bosses;
        break;
      case "quests":
        currentArr = quests;
        break;
      case "titles":
        currentArr = titles;
        break;
    }

    if (currentArr.some((i: any) => i.id === newItem.id)) {
      alert(`Já existe um item com o ID ${newItem.id} em ${currentDataType}!`);
      return;
    }

    let command = "";
    switch (currentDataType) {
      case "creatures":
        command = COMMANDS.UPDATE_STATICDATA_CREATURE;
        break;
      case "bosses":
        command = COMMANDS.UPDATE_STATICDATA_BOSS;
        break;
      case "quests":
        command = COMMANDS.UPDATE_STATICDATA_QUEST;
        break;
      case "titles":
        command = COMMANDS.UPDATE_STATICDATA_TITLE;
        break;
    }

    if (!command) return;

    try {
      await invoke(command, { item: newItem });

      let newList: any[] = [...currentArr, newItem];
      // Forçar ordenação por ID
      newList.sort((a, b) => (a.id || 0) - (b.id || 0));

      updateStaticDataState(currentDataType, newList);
      isCreateModalOpen = false;
    } catch (e) {
      console.error("Failed to create item", e);
      alert("Erro ao criar: " + e);
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke(COMMANDS.REMOVE_STATICDATA_ITEM, {
        category: currentDataType,
        id,
      });

      let newList: any[] = [];
      switch (currentDataType) {
        case "creatures":
          newList = creatures.filter((i) => i.id !== id);
          break;
        case "bosses":
          newList = bosses.filter((i) => i.id !== id);
          break;
        case "quests":
          newList = quests.filter((i) => i.id !== id);
          break;
        case "titles":
          newList = titles.filter((i) => i.id !== id);
          break;
      }

      updateStaticDataState(currentDataType, newList);
      isModalOpen = false;
    } catch (e) {
      console.error("Failed to delete item", e);
      alert("Failed to delete item: " + e);
    }
  }

  function goBack() {
    assetsState.viewMode = "categories";
  }
</script>

<div class="static-data-container">
  <header class="modern-header">
    <div class="header-left">
      <button class="modern-back-btn" onclick={goBack}>
        <svg
          class="back-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>{translate("browser.static.back")}</span>
      </button>
      <div class="header-divider"></div>
    </div>

    <div
      class="appearance-action-bar"
      style="justify-content: flex-start; gap: 0.75rem;"
    >
      <span
        class="category-icon"
        style="font-size: 1.5rem; display: flex; align-items: center;"
      >
        {#if currentDataType === "creatures"}🐉{/if}
        {#if currentDataType === "bosses"}👑{/if}
        {#if currentDataType === "quests"}📜{/if}
        {#if currentDataType === "titles"}🏅{/if}
        {#if currentDataType === "houses"}🏘️{/if}
        {#if currentDataType === "map_houses"}🗺️{/if}
      </span>
      <h2
        style="margin: 0; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; color: var(--text-primary);"
      >
        {#if currentDataType === "creatures"}Creatures{/if}
        {#if currentDataType === "bosses"}Bosses{/if}
        {#if currentDataType === "quests"}Quests{/if}
        {#if currentDataType === "titles"}Titles{/if}
        {#if currentDataType === "houses"}Houses{/if}
        {#if currentDataType === "map_houses"}Map Houses{/if}
      </h2>
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
            bind:value={searchQuery}
            placeholder={translate("browser.static.search")}
            class="search-input"
          />
          {#if searchQuery}
            <button
              class="clear-search-btn"
              onclick={() => (searchQuery = "")}
              style="display: flex;"
              aria-label="Limpar pesquisa"
              title="Limpar pesquisa"
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

    <div
      class="header-right"
      style="display: flex; gap: 1rem; align-items: center;"
    >
      {#if currentDataType !== "houses" && currentDataType !== "map_houses"}
        <button
          class="modern-back-btn"
          onclick={handleCreateNew}
          disabled={isSaving}
        >
          <span>{translate("browser.static.new")}</span>
        </button>
        <button
          class="modern-back-btn"
          onclick={handleSave}
          disabled={isSaving}
          style="background: var(--gradient-primary); color: white; border: none;"
        >
          <span
            >{isSaving
              ? translate("browser.static.saving")
              : translate("browser.static.save")}</span
          >
        </button>
      {/if}
      <div class="results-info">
        <span class="results-text">
          {filteredList.length}
          {translate("browser.static.local")}
        </span>
      </div>
    </div>
  </header>

  <div class="content-area">
    {#if !dataReady}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{translate("browser.static.loading")}</p>
      </div>
    {:else}
      <div class="modern-assets-grid">
        {#each filteredList as item}
          <div
            class="static-data-card"
            onclick={() => openModal(item)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openModal(item);
              }
            }}
            role="button"
            tabindex="0"
          >
            <div class="static-data-id">
              #{item.id !== undefined ? item.id : item.house_id}
            </div>
            <div class="static-data-visual">
              {#if (currentDataType === "creatures" || currentDataType === "bosses") && item.outfit?.looktype && outfitSprites.has(item.outfit.looktype)}
                <canvas
                  use:pixelSprite={outfitSprites.get(item.outfit.looktype) ??
                    null}
                  class="static-data-img"
                  style="width:64px;height:64px;"
                ></canvas>
              {:else}
                <div class="static-data-icon">
                  {getIconForItem(currentDataType)}
                </div>
              {/if}
            </div>
            <div class="static-data-name">
              {#if currentDataType === "map_houses"}
                {translate("browser.static.mapLayout")} #{item.house_id}
              {:else}
                {item.name || translate("browser.static.unnamed")}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <StaticDataModal
    isOpen={isModalOpen}
    itemDetails={selectedItem}
    dataType={currentDataType}
    onClose={() => (isModalOpen = false)}
    onDelete={handleDelete}
  />

  <StaticDataFormModal
    isOpen={isCreateModalOpen}
    dataType={currentDataType}
    onClose={() => (isCreateModalOpen = false)}
    onSubmit={handleFormSubmit}
  />
</div>

<style>
  .static-data-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .content-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .content-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Custom Styles for Static Data Grid override */
  .static-data-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 220px; /* guarantees the background encloses everything */
    padding: 0.75rem;
    box-sizing: border-box;
    position: relative;
    background: var(--gradient-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .static-data-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-accent);
  }

  .static-data-id {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: auto; /* Pushes the visual down */
    text-align: center;
    width: 100%;
  }

  .static-data-visual {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 120px;
    margin: 0.5rem 0;
  }

  .static-data-img {
    max-width: 64px;
    max-height: 64px;
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }

  .static-data-icon {
    font-size: 3rem;
  }

  .static-data-name {
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
    margin-top: auto; /* Pushes to the bottom */
    width: 100%;
    word-break: break-word;
    color: var(--text-secondary);
  }
</style>
