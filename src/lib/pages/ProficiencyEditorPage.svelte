<script lang="ts">
  import { onMount, tick } from "svelte";
  import { open, save } from "@tauri-apps/plugin-dialog";
  import { appState } from "../../stores/appState.svelte";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { invoke } from "../../utils/invoke";
  import { COMMANDS } from "../../commands";
  import { showStatus } from "../../utils";
  import { loadSpritesForAssets } from "../../utils/spriteLoading";
  import { loadAssetsData } from "../../services/assetService";
  import { areAppearancesLoaded } from "../../appearanceLoader";
  import type {
    ProficiencyEntry,
    ProficiencyPerk,
    CompleteAppearanceItem,
  } from "../../types";

  // Import styles
  import "../../styles/proficiency.css";

  // ── Asset helpers ──────────────────────────────────────────────────────────
  const ICON_BASE = "../../assets/proficiency/";

  function asset(name: string) {
    return new URL(`${ICON_BASE}${name}`, import.meta.url).href;
  }

  const PERK_TYPE_LABELS: Record<number, string> = {
    0: "Attack Damage",
    1: "Defence",
    2: "Weapon Shield Mod",
    3: "Skill Bonus",
    4: "Special Magic Boost",
    5: "Spell Augment",
    6: "Bestiary Damage",
    7: "Powerful Foe Bonus",
    8: "Critical Hit Chance",
    9: "Element Critical Hit Chance",
    10: "Rune Critical Hit Chance",
    11: "Auto-Attack Critical Hit Chance",
    12: "Critical Extra Damage",
    13: "Element Critical Extra Damage",
    14: "Rune Critical Extra Damage",
    15: "Auto-Attack Critical Extra Damage",
    16: "Life Leech",
    17: "Mana Leech",
    18: "Life Gain on Hit",
    19: "Mana Gain on Hit",
    20: "Life Gain on Kill",
    21: "Mana Gain on Kill",
    22: "Perfect Shot Damage",
    23: "Ranged Hit Chance",
    24: "Attack Range",
    25: "Skill Pct Auto-Attack Damage",
    26: "Skill Pct Spell Damage",
    27: "Skill Pct Healing",
  };

  const PERK_VISUAL_DATA: Record<number, { source: string; offset: string }> = {
    0: { source: "icons-0.png", offset: "0 0" },
    1: { source: "icons-0.png", offset: "-64px 0" },
    2: { source: "icons-0.png", offset: "-128px 0" },
    3: { source: "icons-7.png", offset: "0 0" },
    4: { source: "icons-8.png", offset: "0 0" },
    5: { source: "icons-9.png", offset: "0 0" },
    6: { source: "icons-3.png", offset: "0 0" },
    7: { source: "icons-0.png", offset: "-192px 0" },
    8: { source: "icons-0.png", offset: "-256px 0" },
    9: { source: "icons-2.png", offset: "0 0" },
    10: { source: "icons-0.png", offset: "-320px 0" },
    11: { source: "icons-0.png", offset: "-384px 0" },
    12: { source: "icons-0.png", offset: "-448px 0" },
    13: { source: "icons-1.png", offset: "0 0" },
    14: { source: "icons-0.png", offset: "-512px 0" },
    15: { source: "icons-0.png", offset: "-576px 0" },
    16: { source: "icons-0.png", offset: "-640px 0" },
    17: { source: "icons-0.png", offset: "-704px 0" },
    18: { source: "icons-0.png", offset: "-768px 0" },
    19: { source: "icons-0.png", offset: "-832px 0" },
    20: { source: "icons-0.png", offset: "-896px 0" },
    21: { source: "icons-0.png", offset: "-960px 0" },
    22: { source: "icons-0.png", offset: "-1024px 0" },
    23: { source: "icons-0.png", offset: "-1088px 0" },
    24: { source: "icons-0.png", offset: "-1152px 0" },
    25: { source: "icons-4.png", offset: "0 0" },
    26: { source: "icons-5.png", offset: "0 0" },
    27: { source: "icons-6.png", offset: "0 0" },
  };

  function getPerkLabel(type: number) {
    return PERK_TYPE_LABELS[type] ?? `Type ${type}`;
  }

  function getPerkIconStyle(type: number) {
    const data = PERK_VISUAL_DATA[type] || {
      source: "icons-0.png",
      offset: "0 0",
    };
    const url = asset(data.source);
    return `background-image: url(${url}); background-position: ${data.offset}; width: 64px; height: 64px; display: inline-block; image-rendering: pixelated;`;
  }

  const STAR_GOLD = asset("icon-star-tiny-gold.png");
  const STAR_SILVER = asset("icon-star-tiny-silver.png");
  const BORDER_ACTIVE = asset("border-weaponmasterytreeicons-active.png");
  const BORDER_INACTIVE = asset("border-weaponmasterytreeicons-inactive.png");
  const LOCK_ICON = asset("icon-lock-grey.png");
  const AUGMENT_ICONS = asset("augment-icons.png");

  // Backgrounds OTUI
  const BG_STARS = asset("star-progress-bg.png");
  const BG_PROGRESS = asset("progress-bg.png");
  const BG_PROGRESS_FILL = asset("proficiency-progress.png");
  const MASTER_LEVEL_BG_BASE = "icon-masterylevel-";

  function getMasteryLevelBase(levelCount: number): string {
    const clamped = Math.min(Math.max(0, levelCount), 7);
    return asset(`${MASTER_LEVEL_BG_BASE}${clamped}.png`);
  }

  function getMasteryLevelOverlay(levelCount: number): string | null {
    if (levelCount <= 0) return null;
    const clamped = Math.min(levelCount, 7);
    return asset(`${MASTER_LEVEL_BG_BASE}${clamped}-silver.png`);
  }
  const HIGHLIGHT_BG = asset("backdrop_weaponmastery_highlight.png");
  const STAR_PROGRESS = asset("star-progress.png");
  const BONUS_COL_BG = asset("bonus-select-bg.png");
  const BONUS_COL_PROGRESS = asset("bonus-select-bg-progress.png");

  function getAugmentIconStyle(augmentType: number, active = true): string {
    const col = augmentType % 13;
    const row = active ? 0 : 1;
    const x = -(col * 32);
    const y = -(row * 32);
    return `background-image:url(${AUGMENT_ICONS});background-position:${x}px ${y}px;background-size:416px 64px;background-repeat:no-repeat;width:32px;height:32px;display:inline-block;image-rendering:pixelated`;
  }

  // ── State (restore from global cache to avoid flicker on re-mount) ────────
  let entries = $state<ProficiencyEntry[]>(assetsState.proficiencyEntries);
  let filePath = $state(appState.proficiencyFilePath || "");
  let selectedId = $state<number | null>(assetsState.proficiencySelectedId);
  let isDirty = $state(false);
  let searchTerm = $state("");

  // Edit popover states
  let selLvl = $state<number | null>(null);
  let selRow = $state<number | null>(null);
  let isHoveringAdd = $state<{ lvl: number } | null>(null);

  // Filter toggles
  let toggles = $state({ level: false, h1: false, h2: false });
  let vocFilter = $state<number | null>(null);
  let weaponTypeFilter = $state<number | null>(null);

  const VOC_LABELS: Record<number, string> = {
    [-1]: "Any",
    0: "None",
    1: "Knight",
    2: "Paladin",
    3: "Sorcerer",
    4: "Druid",
    5: "Monk",
    10: "Promoted",
  };

  const WEAPON_TYPE_LABELS: Record<number, string> = {
    1: "Sword",
    2: "Axe",
    3: "Club",
    4: "Fist",
    5: "Bow",
    6: "Crossbow",
    7: "Wand/Rod",
    8: "Throw",
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  let filtered = $derived(
    entries.filter((e) => {
      // Text search
      const term = searchTerm.toLowerCase();
      if (
        term &&
        !e.Name.toLowerCase().includes(term) &&
        !String(e.ProficiencyId).includes(searchTerm)
      )
        return false;

      const nameLower = e.Name.toLowerCase();

      // 1H / 2H name filters
      if (toggles.h1 && !nameLower.includes("1h")) return false;
      if (toggles.h2 && !nameLower.includes("2h")) return false;

      // Level / Vocation / Weapon type filters (require matching asset with flags)
      const asset = getAssetForProficiency(e.ProficiencyId);
      if (toggles.level && !asset?.flags?.minimum_level) return false;
      if (
        vocFilter !== null &&
        !asset?.flags?.restrict_to_vocation?.includes(vocFilter)
      )
        return false;
      if (
        weaponTypeFilter !== null &&
        asset?.flags?.weapon_type !== weaponTypeFilter
      )
        return false;

      return true;
    }),
  );

  let selectedEntry = $derived(
    entries.find((e) => e.ProficiencyId === selectedId) ?? null,
  );
  let selectedIndex = $derived(
    entries.findIndex((e) => e.ProficiencyId === selectedId),
  );

  let selectedPerk = $derived(
    selLvl !== null && selRow !== null && selectedEntry !== null
      ? (selectedEntry.Levels[selLvl]?.Perks[selRow] ?? null)
      : null,
  ) as ProficiencyPerk | null;

  let masteryLevel = $derived(selectedEntry ? selectedEntry.Levels.length : 0);
  let masteryBase = $derived(getMasteryLevelBase(masteryLevel));
  let masteryOverlay = $derived(getMasteryLevelOverlay(masteryLevel));

  let displayLevels = $derived(
    selectedEntry ? selectedEntry.Levels.slice(0, 7) : [],
  );
  let paddedLevels = $derived(
    Array.from({ length: 7 }).map((_, i) => displayLevels[i]),
  );

  // Find corresponding sprites from local map first, then assetsState fallback
  function getAssetForProficiency(
    profId: number,
  ): CompleteAppearanceItem | null {
    if (assetsState.proficiencyAssets[profId]) {
      return assetsState.proficiencyAssets[profId];
    }
    if (!assetsState.assets) return null;
    return (
      assetsState.assets.find(
        (a) => a.flags?.proficiency?.proficiency_id === profId,
      ) ?? null
    );
  }

  async function loadProficiencyAssets(profEntries: ProficiencyEntry[]) {
    // Pular download se o cache global já tem as armas guardadas
    if (Object.keys(assetsState.proficiencyAssets).length >= profEntries.length)
      return;

    try {
      // 1) Buscar TODOS os items com proficiency em uma única chamada
      const resp = await invoke<{
        total: number;
        items: { id: number }[];
      }>(COMMANDS.LIST_APPEARANCES_BY_CATEGORY, {
        category: "Objects",
        page: 0,
        pageSize: 5000,
        search: "proficiency-",
        subcategory: null,
      });

      if (!resp.items || resp.items.length === 0) return;

      const ids = resp.items.map((item) => item.id);

      // 2) Buscar dados completos de todos em uma única chamada batch
      const completeItems = await invoke<CompleteAppearanceItem[]>(
        COMMANDS.GET_COMPLETE_APPEARANCES_BATCH,
        { category: "Objects", ids },
      );

      // 3) Montar mapa proficiency_id → CompleteAppearanceItem
      const newAssets: Record<number, CompleteAppearanceItem> = {};
      for (const item of completeItems) {
        const profId = item.flags?.proficiency?.proficiency_id;
        if (profId != null) {
          newAssets[profId] = item;
        }
      }

      assetsState.proficiencyAssets = newAssets;
    } catch (e) {
      console.error("Falha ao buscar assets de proficiency em batch", e);
    }
  }

  onMount(() => {
    if (assetsState.assets.length === 0 && areAppearancesLoaded()) {
      loadAssetsData();
    }
  });

  // Effect to load sprites for items rendered
  $effect(() => {
    const profAssets = assetsState.proficiencyAssets;
    if (filtered.length > 0 && Object.keys(profAssets).length > 0) {
      const itemsToLoad = filtered
        .map((e) => profAssets[e.ProficiencyId])
        .filter(Boolean) as CompleteAppearanceItem[];
      if (itemsToLoad.length > 0) {
        tick().then(() =>
          loadSpritesForAssets(itemsToLoad, "Objects", "sprite-", true),
        );
      }
    }
  });

  $effect(() => {
    // Only depend on proficiencyAssets (not assetsState.assets) to avoid
    // loadId invalidation when loadAssetsData() completes concurrently
    const profAssets = assetsState.proficiencyAssets;
    if (selectedId && Object.keys(profAssets).length > 0) {
      const mainAsset = profAssets[selectedId];
      if (mainAsset) {
        tick().then(() =>
          loadSpritesForAssets([mainAsset], "Objects", "main-sprite-", true),
        );
      }
    }
  });

  // ── Load / Save ────────────────────────────────────────────────────────────
  async function loadFile(path?: string) {
    const target = path ?? filePath;
    if (!target) return;
    try {
      const loaded = await invoke<ProficiencyEntry[]>(
        COMMANDS.LOAD_PROFICIENCY_FILE,
        { filePath: target },
      );
      entries = loaded;
      filePath = target;
      appState.proficiencyFilePath = target;
      selectedId = loaded[0]?.ProficiencyId ?? null;
      isDirty = false;
      selLvl = null;
      selRow = null;

      // Buscar assests individualmente pós-carregamento.
      await loadProficiencyAssets(loaded);
    } catch (e) {
      showStatus("Erro ao carregar formato", "error");
    }
  }

  async function openFilePicker() {
    const sel = await open({
      directory: false,
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (typeof sel === "string" && sel) await loadFile(sel);
  }

  async function saveFile() {
    if (!filePath) {
      await saveAs();
      return;
    }
    try {
      await invoke(COMMANDS.SAVE_PROFICIENCY_FILE, { filePath, data: entries });
      isDirty = false;
      showStatus("Salvo com sucesso!", "success");
    } catch (e) {
      showStatus(`Erro: ${e}`, "error");
    }
  }

  async function saveAs() {
    const target = await save({
      defaultPath: "proficiency.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (typeof target === "string" && target) {
      filePath = target;
      appState.proficiencyFilePath = target;
      await saveFile();
    }
  }

  function markDirty() {
    isDirty = true;
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  function addPerkToLevel(lvlIdx: number) {
    if (selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== lvlIdx) return lv;
        if (lv.Perks.length >= 3) return lv; // Max 3 perks visual distribution
        return { ...lv, Perks: [...lv.Perks, { Type: 15, Value: 0.05 }] };
      });
      return { ...e, Levels };
    });
    selLvl = lvlIdx;
    selRow = entries[selectedIndex].Levels[lvlIdx].Perks.length - 1;
    markDirty();
  }

  function updateSelPerk(field: keyof ProficiencyPerk, value: any) {
    if (selLvl === null || selRow === null || selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== selLvl) return lv;
        const Perks = lv.Perks.map((p, pi) =>
          pi === selRow ? { ...p, [field]: value } : p,
        );
        return { ...lv, Perks };
      });
      return { ...e, Levels };
    });
    markDirty();
  }

  function updateSelPerkOptional(field: keyof ProficiencyPerk, raw: string) {
    updateSelPerk(field, raw === "" ? undefined : Number(raw));
  }

  function removeSelPerk() {
    if (selLvl === null || selRow === null || selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const Levels = e.Levels.map((lv, li) => {
        if (li !== selLvl) return lv;
        return { ...lv, Perks: lv.Perks.filter((_, pi) => pi !== selRow) };
      });
      return { ...e, Levels };
    });
    selLvl = null;
    selRow = null;
    markDirty();
  }

  function toggleUnlock(lvlIdx: number) {
    if (selectedIndex < 0) return;
    entries = entries.map((e, i) => {
      if (i !== selectedIndex) return e;
      const current = e.Levels;
      if (!current[lvlIdx]) {
        const newLevels = [...current];
        for (let idx = current.length; idx <= lvlIdx; idx++)
          newLevels.push({ Perks: [], XpRequired: 1000 });
        return { ...e, Levels: newLevels };
      } else {
        return { ...e, Levels: current.slice(0, lvlIdx) };
      }
    });
    markDirty();
  }

  // Sync local state → global cache so re-mount is instant
  $effect(() => {
    assetsState.proficiencyEntries = entries;
  });
  $effect(() => {
    assetsState.proficiencySelectedId = selectedId;
  });

  // Only load from backend if cache is empty
  $effect(() => {
    if (filePath && entries.length === 0) loadFile(filePath);
  });
</script>

<div class="tibia-bg">
  <div class="pe-layout">
  <div class="pe-window window-tibia">
    <div class="window-header">Weapon Proficiency</div>
    <div class="window-content">
      <!-- LEFT SIDEBAR -->
      <div class="sidebar">
        <!-- Weapon Info Box -->
        <div class="weapon-info-box t2-panel">
          <div
            class="weapon-name"
            title={selectedEntry
              ? (getAssetForProficiency(selectedEntry.ProficiencyId)?.name ??
                selectedEntry.Name)
              : "None"}
          >
            {selectedEntry
              ? (getAssetForProficiency(
                  selectedEntry.ProficiencyId,
                )?.name?.toLowerCase() ?? selectedEntry.Name.toLowerCase())
              : "Unknown Item"}
          </div>
          <div
            class="weapon-icon-wrapper"
            style="background-image: url({masteryBase});"
          >
            {#if masteryOverlay}
              <div
                class="mastery-overlay"
                style="background-image: url({masteryOverlay});"
              ></div>
            {/if}
            {#if selectedEntry && getAssetForProficiency(selectedEntry.ProficiencyId)}
              {@const asset = getAssetForProficiency(
                selectedEntry.ProficiencyId,
              )}
              <div
                class="main-sprite-container"
                id="main-sprite-{asset?.id}"
              ></div>
            {/if}
            <div class="info-circle" title="Item info">i</div>
          </div>
          <div class="weapon-xp">
            <!-- XP é gerenciado pelo servidor no cliente -->
          </div>
        </div>

        <!-- Filter Toggles -->
        <div class="filter-toggles">
          <button
            class="tibia-btn-toggle"
            class:active={toggles.level}
            onclick={() => (toggles.level = !toggles.level)}>Level</button
          >
          <select
            class="tibia-select filter-voc-select"
            value={vocFilter !== null ? String(vocFilter) : ""}
            onchange={(e) => {
              const v = e.currentTarget.value;
              vocFilter = v === "" ? null : Number(v);
            }}
          >
            <option value="">Voc.</option>
            {#each Object.entries(VOC_LABELS) as [id, label]}
              <option value={id}>{label}</option>
            {/each}
          </select>
          <button
            class="tibia-btn-toggle"
            class:active={toggles.h1}
            onclick={() => {
              toggles.h1 = !toggles.h1;
              if (toggles.h1) toggles.h2 = false;
            }}>1H</button
          >
          <button
            class="tibia-btn-toggle"
            class:active={toggles.h2}
            onclick={() => {
              toggles.h2 = !toggles.h2;
              if (toggles.h2) toggles.h1 = false;
            }}>2H</button
          >
        </div>

        <!-- Weapon Type Filter -->
        <select
          class="tibia-select filter-weapon-select"
          value={weaponTypeFilter !== null ? String(weaponTypeFilter) : ""}
          onchange={(e) => {
            const v = e.currentTarget.value;
            weaponTypeFilter = v === "" ? null : Number(v);
          }}
        >
          <option value="">Weapons: All</option>
          {#each Object.entries(WEAPON_TYPE_LABELS) as [id, label]}
            <option value={id}>{label}</option>
          {/each}
        </select>

        <!-- Search Box -->
        <div class="search-box textedit-panel">
          <input
            type="text"
            placeholder="Type to search"
            bind:value={searchTerm}
          />
          {#if searchTerm}
            <button
              class="clear-search"
              onclick={() => (searchTerm = "")}
              title="Clear Search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 1 L9 9 M9 1 L1 9" stroke="#888" stroke-width="2" />
              </svg>
            </button>
          {/if}
        </div>

        <!-- Grid (Pixel perfect styling like Tibia Item list) -->
        <div class="items-grid textedit-panel">
          {#each filtered as entry}
            <div
              class="item-slot"
              class:selected={selectedId === entry.ProficiencyId}
              onclick={() => {
                selectedId = entry.ProficiencyId;
                selLvl = null;
                selRow = null;
              }}
            >
              {#if getAssetForProficiency(entry.ProficiencyId)}
                <div
                  class="list-sprite-container"
                  id="sprite-{getAssetForProficiency(entry.ProficiencyId)?.id}"
                ></div>
              {/if}
              {#if selectedId === entry.ProficiencyId}
                <div class="slot-highlight"></div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- RIGHT MAIN AREA -->
      <div class="main-area">
        {#if selectedEntry}
          <!-- Stars Header (7 columns with progress) -->
          <div class="stars-header" style="background-image: url({BG_STARS});">
            {#each paddedLevels as lvl}
              <div class="star-col">
                <div
                  class="star-progress-fill"
                  style="background-image: url({STAR_PROGRESS}); width: {lvl
                    ? '100%'
                    : '0%'};"
                ></div>
                <div class="star-cell">
                  {#if lvl}
                    <img src={STAR_GOLD} class="star-icon" alt="*" />
                  {:else}
                    <img src={STAR_SILVER} class="star-icon disabled" alt="*" />
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          <!-- XP Progress row -->
          <div
            class="progress-bar-container"
            style="background-image: url({BG_PROGRESS});"
          >
            <div
              class="progress-bar-fill"
              style="background-image: url({BG_PROGRESS_FILL}); width: 99.9%;"
            ></div>
          </div>

          <!-- Tree Grid (7 columns) -->
          <div class="tree-grid">
            <div class="tree-columns">
              {#each paddedLevels as lvl, cIdx}
                <div
                  class="tree-col"
                  style="background-image: url({BONUS_COL_BG});"
                  onmouseenter={() => (isHoveringAdd = { lvl: cIdx })}
                  onmouseleave={() => (isHoveringAdd = null)}
                >
                  <!-- Column progress overlay -->
                  {#if lvl}
                    <div
                      class="col-progress-fill"
                      style="background-image: url({BONUS_COL_PROGRESS});"
                    ></div>
                  {/if}

                  {#if lvl}
                    <div class="perks-container perks-count-{lvl.Perks.length}">
                      {#each lvl.Perks as perk, rIdx}
                        <div
                          class="perk-node"
                          class:selected={selLvl === cIdx && selRow === rIdx}
                          onclick={() => {
                            selLvl = cIdx;
                            selRow = rIdx;
                          }}
                        >
                          <!-- Highlight overlay (visible on hover) -->
                          <div
                            class="node-highlight"
                            style="background-image: url({HIGHLIGHT_BG});"
                          ></div>
                          <!-- Icon -->
                          <div class="node-icon-wrapper">
                            <div
                              class="node-icon-bg"
                              style={getPerkIconStyle(perk.Type)}
                            ></div>
                          </div>
                          <!-- Border frame -->
                          <img
                            src={selLvl === cIdx && selRow === rIdx
                              ? BORDER_ACTIVE
                              : BORDER_INACTIVE}
                            class="node-border"
                            alt=""
                          />
                          <!-- Augment icon -->
                          {#if perk.AugmentType}
                            <span
                              class="augment-overlay"
                              style={getAugmentIconStyle(perk.AugmentType)}
                            ></span>
                          {/if}
                          <!-- Lock on perk (for empty/locked perk slots) -->
                        </div>
                      {/each}
                      {#if isHoveringAdd?.lvl === cIdx && lvl.Perks.length < 3}
                        <div
                          class="add-perk-node"
                          onclick={() => addPerkToLevel(cIdx)}
                        >
                          +
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Bonus Detail + Config wrapper -->
          <div class="bonus-detail-wrapper">
            <div class="bonus-detail-row textedit-panel">
              {#each paddedLevels as lvl, idx}
                <div class="detail-panel" onclick={() => toggleUnlock(idx)}>
                  {#if !lvl}
                    <img src={LOCK_ICON} alt="locked" class="lock-icon" />
                  {:else if selLvl === idx && selRow !== null && lvl.Perks[selRow]}
                    <div class="detail-text">
                      <span class="detail-name"
                        >{getPerkLabel(lvl.Perks[selRow].Type)}</span
                      >
                      <span class="detail-value-proficiency"
                        >+{lvl.Perks[selRow].Value}</span
                      >
                    </div>
                  {:else}
                    <div class="detail-text">
                      <span class="detail-placeholder"
                        >{lvl.Perks.length} perk{lvl.Perks.length !== 1
                          ? "s"
                          : ""}</span
                      >
                    </div>
                  {/if}
                </div>
              {/each}
            </div>

          </div>
        {:else}
          <div class="no-selection panel-sunken">
            <span class="no-sel-msg">Selecione uma arma à esquerda.</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- HORIZONTAL SEPARATOR -->
    <div class="bottom-sep"></div>

    <!-- FOOTER BOTÕES -->
    <div class="window-footer">
      <div class="footer-left">
        <button class="tibia-btn" onclick={openFilePicker}>Load Data</button>
        <button class="tibia-btn" onclick={saveAs}>Save As</button>
      </div>
      <div class="footer-right">
        <button
          class="tibia-btn"
          onclick={() => {
            appState.currentView = "launcher";
            saveFile();
          }}>Ok</button
        >
        <button class="tibia-btn" onclick={saveFile} disabled={!isDirty}
          >Apply</button
        >
        <button class="tibia-btn" onclick={() => loadFile()}>Reset</button>
        <button
          class="tibia-btn"
          onclick={() => (appState.currentView = "launcher")}>Close</button
        >
      </div>
    </div>
  </div>

  <!-- Side Panel: Perk Config -->
  {#if selLvl !== null && selRow !== null && selectedPerk}
    <div class="side-panel window-tibia">
      <div class="window-header">Perk Config</div>
      <div class="side-panel-content">
        <div class="config-field">
          <label>Type</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.Type}
            oninput={(e) => updateSelPerk("Type", Number(e.currentTarget.value))}
          />
        </div>
        <span class="type-name-label">{getPerkLabel(selectedPerk.Type)}</span>
        <div class="config-field">
          <label>Value</label>
          <input
            type="number"
            class="tibia-input"
            step="0.01"
            value={selectedPerk.Value}
            oninput={(e) => updateSelPerk("Value", Number(e.currentTarget.value))}
          />
        </div>
        <div class="config-field">
          <label>Augment</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.AugmentType ?? ""}
            oninput={(e) => updateSelPerkOptional("AugmentType", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>SkillId</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.SkillId ?? ""}
            oninput={(e) => updateSelPerkOptional("SkillId", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>SpellId</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.SpellId ?? ""}
            oninput={(e) => updateSelPerkOptional("SpellId", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>ElementId</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.ElementId ?? ""}
            oninput={(e) => updateSelPerkOptional("ElementId", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>DmgType</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.DamageType ?? ""}
            oninput={(e) => updateSelPerkOptional("DamageType", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>Range</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.Range ?? ""}
            oninput={(e) => updateSelPerkOptional("Range", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>BestId</label>
          <input
            type="number"
            class="tibia-input"
            value={selectedPerk.BestiaryId ?? ""}
            oninput={(e) => updateSelPerkOptional("BestiaryId", e.currentTarget.value)}
          />
        </div>
        <div class="config-field">
          <label>BestName</label>
          <input
            type="text"
            class="tibia-input"
            value={selectedPerk.BestiaryName ?? ""}
            oninput={(e) => {
              const val = e.currentTarget.value;
              updateSelPerk("BestiaryName", val === "" ? undefined : val);
            }}
          />
        </div>
        <div class="side-panel-footer">
          <button class="tibia-btn tibia-btn-danger" onclick={removeSelPerk}>Remover</button>
        </div>
      </div>
    </div>
  {/if}

  </div><!-- /pe-layout -->
</div>
