<script lang="ts">
  import { open, save } from "@tauri-apps/plugin-dialog";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { invoke } from "../../utils/invoke";
  import { COMMANDS } from "../../commands";
  import { showStatus } from "../../utils";

  // ── Types ──────────────────────────────────────────────────────────────────

  interface CategoryStats { objects: number; outfits: number; effects: number; missiles: number; }

  interface MergeFolderStats {
    appearances: CategoryStats;
    appearancesFile: string;
    catalog: { totalEntries: number; maxSpriteId: number } | null;
    staticdataFile: string | null;
    staticmapdataFile: string | null;
  }

  interface MergePreview {
    toAdd: CategoryStats;
    conflicts: CategoryStats;
    officialKept: CategoryStats;
  }

  interface ConflictEntry { file: string; firstSpriteId: number; lastSpriteId: number; }

  interface SpriteMergePreview {
    customSpriteCount: number;
    lzmaFilesToCopy: number;
    conflictEntries: ConflictEntry[];
    remapStartsAt: number;
  }

  interface SpriteMergeResult {
    filesCopied: number;
    catalogEntriesAdded: number;
    spritesRemapped: number;
    newFirstSpriteId: number;
    newLastSpriteId: number;
  }

  interface StaticDataMergePreview {
    creaturesToAdd: number; bossesToAdd: number; housesToAdd: number;
    questsToAdd: number; titlesToAdd: number; mapHousesToAdd: number;
    staticdataFile: string; staticmapdataFile: string | null;
  }

  interface StaticDataMergeResult {
    creaturesAdded: number; bossesAdded: number; housesAdded: number;
    questsAdded: number; titlesAdded: number; mapHousesAdded: number;
  }

  // ── State ──────────────────────────────────────────────────────────────────

  let folderPath    = $state("");
  let folderLoaded  = $state(false);
  let loadingFolder = $state(false);
  let folderStats   = $state<MergeFolderStats | null>(null);

  let thresholds   = $state({ objects: 60000, outfits: 5000, effects: 1000, missiles: 1000 });
  let sdThresholds = $state({ creatures: 1000, bosses: 6000, houses: 1000, quests: 1000, titles: 1000, mapHouses: 1000 });

  let preview        = $state<MergePreview | null>(null);
  let mergeResult    = $state<CategoryStats | null>(null);
  let loadingPreview = $state(false);
  let merging        = $state(false);
  let merged         = $state(false);

  let spriteMergePreview   = $state<SpriteMergePreview | null>(null);
  let spriteMergeResult    = $state<SpriteMergeResult | null>(null);
  let loadingSpritePreview = $state(false);
  let mergingSprites       = $state(false);
  let spritesMerged        = $state(false);
  let conflictsExpanded    = $state(false);

  let sdPreview        = $state<StaticDataMergePreview | null>(null);
  let sdResult         = $state<StaticDataMergeResult | null>(null);
  let loadingSdPreview = $state(false);
  let mergingSd        = $state(false);
  let sdMerged         = $state(false);

  let activeTab = $state<"appearances" | "sprites" | "staticdata">("appearances");

  // ── Derived ────────────────────────────────────────────────────────────────

  let completedSteps = $derived(
    (merged ? 1 : 0) + (spritesMerged ? 1 : 0) + (sdMerged ? 1 : 0)
  );
  let totalSteps = $derived(
    1 + (folderStats?.catalog ? 1 : 0) + (folderStats?.staticdataFile ? 1 : 0)
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function pickFolder() {
    const path = await open({ directory: true });
    if (!path || typeof path !== "string") return;
    folderPath = path;
    loadingFolder = true;
    folderStats = null; folderLoaded = false;
    preview = null; mergeResult = null; merged = false;
    spriteMergePreview = null; spriteMergeResult = null; spritesMerged = false;
    sdPreview = null; sdResult = null; sdMerged = false;
    try {
      folderStats = await invoke<MergeFolderStats>(COMMANDS.LOAD_MERGE_FOLDER, { assetsPath: path });
      folderLoaded = true;
      showStatus("Pasta assets carregada", "success");
    } catch (e) {
      showStatus(`Erro: ${e}`, "error");
    } finally {
      loadingFolder = false;
    }
  }

  async function computePreview() {
    loadingPreview = true;
    try { preview = await invoke<MergePreview>(COMMANDS.GET_MERGE_PREVIEW, { thresholds }); }
    catch (e) { showStatus(`Erro preview: ${e}`, "error"); }
    finally { loadingPreview = false; }
  }

  async function executeMerge() {
    if (!preview) return;
    if (!confirm("Executar merge de appearances? O .dat em memoria sera substituido.")) return;
    merging = true;
    try {
      mergeResult = await invoke<CategoryStats>(COMMANDS.EXECUTE_DAT_MERGE, { thresholds });
      merged = true; preview = null; assetsState.currentStats = null;
      showStatus(`${total(mergeResult)} itens mergeados`, "success");
    } catch (e) { showStatus(`Erro: ${e}`, "error"); }
    finally { merging = false; }
  }

  async function saveResult() {
    const path = await save({ filters: [{ name: "DAT", extensions: ["dat"] }] });
    if (!path) return;
    try { await invoke(COMMANDS.SAVE_MERGED_DAT, { path }); showStatus("DAT salvo", "success"); }
    catch (e) { showStatus(`Erro ao salvar: ${e}`, "error"); }
  }

  async function computeSpritePreview() {
    loadingSpritePreview = true;
    try { spriteMergePreview = await invoke<SpriteMergePreview>(COMMANDS.GET_SPRITE_MERGE_PREVIEW, { thresholds }); }
    catch (e) { showStatus(`Erro preview sprites: ${e}`, "error"); }
    finally { loadingSpritePreview = false; }
  }

  async function executeSpritesMerge() {
    if (!spriteMergePreview) return;
    const n = spriteMergePreview.conflictEntries.length;
    const msg = n > 0
      ? `Copiar arquivos LZMA e atualizar catalogo?\n${n} arquivo(s) com IDs sobrepostos serao remapeados a partir de ${spriteMergePreview.remapStartsAt.toLocaleString()}.`
      : `Copiar ${spriteMergePreview.lzmaFilesToCopy} arquivo(s) LZMA e atualizar catalogo?`;
    if (!confirm(msg)) return;
    mergingSprites = true;
    try {
      spriteMergeResult = await invoke<SpriteMergeResult>(COMMANDS.EXECUTE_SPRITE_MERGE, { thresholds });
      spritesMerged = true;
      showStatus(`${spriteMergeResult.filesCopied} arquivo(s) copiado(s)`, "success");
    } catch (e) { showStatus(`Erro: ${e}`, "error"); }
    finally { mergingSprites = false; }
  }

  async function computeSdPreview() {
    loadingSdPreview = true;
    try {
      sdPreview = await invoke<StaticDataMergePreview>(COMMANDS.GET_STATICDATA_MERGE_PREVIEW, {
        thresholds: { creatures: sdThresholds.creatures, bosses: sdThresholds.bosses,
          houses: sdThresholds.houses, quests: sdThresholds.quests,
          titles: sdThresholds.titles, mapHouses: sdThresholds.mapHouses },
      });
    } catch (e) { showStatus(`Erro preview staticdata: ${e}`, "error"); }
    finally { loadingSdPreview = false; }
  }

  async function executeSdMerge() {
    if (!sdPreview) return;
    if (!confirm(`Fazer merge nos arquivos:\n- ${sdPreview.staticdataFile}${sdPreview.staticmapdataFile ? "\n- " + sdPreview.staticmapdataFile : ""}\n\nOs arquivos na pasta oficial serao modificados.`)) return;
    mergingSd = true;
    try {
      sdResult = await invoke<StaticDataMergeResult>(COMMANDS.EXECUTE_STATICDATA_MERGE, {
        thresholds: { creatures: sdThresholds.creatures, bosses: sdThresholds.bosses,
          houses: sdThresholds.houses, quests: sdThresholds.quests,
          titles: sdThresholds.titles, mapHouses: sdThresholds.mapHouses },
      });
      sdMerged = true;
      showStatus("Static data mergeado", "success");
    } catch (e) { showStatus(`Erro: ${e}`, "error"); }
    finally { mergingSd = false; }
  }

  function total(s: CategoryStats) { return s.objects + s.outfits + s.effects + s.missiles; }
  function sdTotal(p: StaticDataMergePreview) {
    return p.creaturesToAdd + p.bossesToAdd + p.housesToAdd + p.questsToAdd + p.titlesToAdd + p.mapHousesToAdd;
  }
</script>

<div class="dat-merge">

  <!-- ── Header ── -->
  <header class="page-header">
    <div class="header-left">
      <button class="btn-back" onclick={() => (assetsState.viewMode = "categories")}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Voltar
      </button>
      <div class="header-title-group">
        <h1 class="page-title">DAT Merge</h1>
        <span class="page-subtitle">Mesclar assets custom com versao oficial</span>
      </div>
    </div>
    <div class="header-right">
      {#if folderLoaded}
        <div class="progress-indicator">
          <span class="progress-label">{completedSteps}/{totalSteps} etapas</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%"></div>
          </div>
        </div>
      {/if}
      {#if merged && mergeResult}
        <button class="btn-action success" onclick={saveResult}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13 11v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2M8 2v9M5 8l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Salvar .dat
        </button>
      {/if}
      <button class="btn-action primary" onclick={pickFolder} disabled={loadingFolder}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 4.5A1.5 1.5 0 013.5 3h3.379a1.5 1.5 0 011.06.44l.622.62a1.5 1.5 0 001.06.44H12.5A1.5 1.5 0 0114 6v5.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {loadingFolder ? "Carregando..." : "Selecionar pasta"}
      </button>
    </div>
  </header>

  <!-- ── Body ── -->
  <div class="page-body">

    {#if !folderLoaded}
      <!-- ── Empty State ── -->
      <div class="empty-state">
        <div class="empty-visual">
          <div class="empty-icon-ring">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M6 14a4 4 0 014-4h10.34a4 4 0 012.83 1.17l1.66 1.66A4 4 0 0027.66 14H38a4 4 0 014 4v16a4 4 0 01-4 4H10a4 4 0 01-4-4V14z" stroke="var(--primary-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 28l4 4 4-4M24 22v10" stroke="var(--secondary-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="empty-title">Selecione a pasta de assets</h2>
          <p class="empty-desc">
            Aponte para a pasta <code>assets/</code> do cliente oficial para iniciar o merge.
          </p>
        </div>
        <button class="btn-action primary lg" onclick={pickFolder} disabled={loadingFolder}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4.5A1.5 1.5 0 013.5 3h3.379a1.5 1.5 0 011.06.44l.622.62a1.5 1.5 0 001.06.44H12.5A1.5 1.5 0 0114 6v5.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {loadingFolder ? "Carregando..." : "Selecionar pasta assets/"}
        </button>
      </div>

    {:else}
      <!-- ── Two-column: sidebar + main ── -->
      <div class="content-layout">

        <!-- ── Sidebar ── -->
        <aside class="sidebar">

          <!-- Folder info -->
          <div class="sidebar-section">
            <div class="sidebar-section-header">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4.5A1.5 1.5 0 013.5 3h3.379a1.5 1.5 0 011.06.44l.622.62a1.5 1.5 0 001.06.44H12.5A1.5 1.5 0 0114 6v5.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span>Pasta oficial</span>
            </div>
            <div class="folder-path">{folderPath}</div>
          </div>

          <!-- Detected files -->
          {#if folderStats}
            <div class="sidebar-section">
              <div class="sidebar-section-header">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M9 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V5L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 2v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Arquivos detectados</span>
              </div>

              <div class="file-list">
                <!-- appearances -->
                <div class="file-item">
                  <span class="file-dot ok"></span>
                  <div class="file-info">
                    <span class="file-name">{folderStats.appearancesFile}</span>
                    <span class="file-meta">
                      {folderStats.appearances.objects.toLocaleString()} obj
                      · {folderStats.appearances.outfits.toLocaleString()} out
                      · {folderStats.appearances.effects.toLocaleString()} eff
                      · {folderStats.appearances.missiles.toLocaleString()} mis
                    </span>
                  </div>
                </div>

                <!-- catalog -->
                <div class="file-item">
                  <span class="file-dot {folderStats.catalog ? 'ok' : 'warn'}"></span>
                  <div class="file-info">
                    <span class="file-name">catalog-content.json</span>
                    {#if folderStats.catalog}
                      <span class="file-meta">
                        {folderStats.catalog.totalEntries.toLocaleString()} entradas
                        · max ID {folderStats.catalog.maxSpriteId.toLocaleString()}
                      </span>
                    {:else}
                      <span class="file-meta warn">nao encontrado</span>
                    {/if}
                  </div>
                </div>

                <!-- staticdata -->
                <div class="file-item">
                  <span class="file-dot {folderStats.staticdataFile ? 'ok' : 'warn'}"></span>
                  <div class="file-info">
                    {#if folderStats.staticdataFile}
                      <span class="file-name">{folderStats.staticdataFile}</span>
                      {#if folderStats.staticmapdataFile}
                        <span class="file-meta">+ {folderStats.staticmapdataFile}</span>
                      {/if}
                    {:else}
                      <span class="file-name muted">staticdata-*.dat</span>
                      <span class="file-meta warn">nao encontrado</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- Thresholds: Appearances -->
          <div class="sidebar-section">
            <div class="sidebar-section-header">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8l2-2 2 2M10 6l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>IDs custom (Appearances)</span>
            </div>
            <div class="threshold-grid">
              {#each [["Objects", "objects"], ["Outfits", "outfits"], ["Effects", "effects"], ["Missiles", "missiles"]] as [label, key]}
                <label class="threshold-row">
                  <span class="threshold-label">{label}</span>
                  <input type="number" bind:value={(thresholds as any)[key]} min="1" class="threshold-input" />
                </label>
              {/each}
            </div>
          </div>

          <!-- Thresholds: Static Data -->
          {#if folderStats?.staticdataFile}
            <div class="sidebar-section">
              <div class="sidebar-section-header">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8l2-2 2 2M10 6l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>IDs custom (Static Data)</span>
              </div>
              <div class="threshold-grid">
                {#each [["Creatures", "creatures"], ["Bosses", "bosses"], ["Houses", "houses"], ["Quests", "quests"], ["Titles", "titles"], ["Map Houses", "mapHouses"]] as [label, key]}
                  <label class="threshold-row">
                    <span class="threshold-label">{label}</span>
                    <input type="number" bind:value={(sdThresholds as any)[key]} min="1" class="threshold-input" />
                  </label>
                {/each}
              </div>
            </div>
          {/if}
        </aside>

        <!-- ── Main content ── -->
        <main class="main-panel">

          <!-- Tab bar -->
          <div class="tab-bar">
            <button class="tab" class:active={activeTab === "appearances"} onclick={() => (activeTab = "appearances")}>
              <span class="tab-text">Appearances</span>
              {#if merged}<span class="tab-badge done">OK</span>{/if}
            </button>
            {#if folderStats?.catalog}
              <button class="tab" class:active={activeTab === "sprites"} onclick={() => (activeTab = "sprites")}>
                <span class="tab-text">Sprites</span>
                {#if spritesMerged}<span class="tab-badge done">OK</span>{/if}
              </button>
            {/if}
            {#if folderStats?.staticdataFile}
              <button class="tab" class:active={activeTab === "staticdata"} onclick={() => (activeTab = "staticdata")}>
                <span class="tab-text">Static Data</span>
                {#if sdMerged}<span class="tab-badge done">OK</span>{/if}
              </button>
            {/if}
          </div>

          <!-- Tab content -->
          <div class="tab-content">

            <!-- ── Tab: Appearances ── -->
            {#if activeTab === "appearances"}
              <div class="tab-panel">

                {#if !preview && !merged}
                  <div class="action-card">
                    <div class="action-card-text">
                      <h3>Calcular preview do merge</h3>
                      <p>Analisa quais appearances custom serao adicionadas ao arquivo oficial.</p>
                    </div>
                    <button class="btn-action primary" onclick={computePreview} disabled={loadingPreview}>
                      {loadingPreview ? "Calculando..." : "Calcular Preview"}
                    </button>
                  </div>
                {/if}

                {#if preview}
                  <div class="data-card">
                    <div class="data-card-header">
                      <h3>Preview do Merge</h3>
                      <span class="data-card-badge">{total(preview.toAdd).toLocaleString()} a adicionar</span>
                    </div>
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th class="col-r">A adicionar</th>
                          <th class="col-r">Conflitos</th>
                          <th class="col-r">Oficial mantido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each [["Objects","objects"],["Outfits","outfits"],["Effects","effects"],["Missiles","missiles"]] as [label, key]}
                          <tr>
                            <td>{label}</td>
                            <td class="col-r col-green">{(preview.toAdd as any)[key].toLocaleString()}</td>
                            <td class="col-r col-warn">{(preview.conflicts as any)[key] > 0 ? (preview.conflicts as any)[key] : "—"}</td>
                            <td class="col-r col-muted">{(preview.officialKept as any)[key].toLocaleString()}</td>
                          </tr>
                        {/each}
                        <tr class="row-total">
                          <td>Total</td>
                          <td class="col-r col-green">{total(preview.toAdd).toLocaleString()}</td>
                          <td class="col-r col-warn">{total(preview.conflicts) > 0 ? total(preview.conflicts) : "—"}</td>
                          <td class="col-r col-muted">{total(preview.officialKept).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="data-card-footer">
                      <button class="btn-action" onclick={computePreview} disabled={loadingPreview}>
                        Recalcular
                      </button>
                      <button class="btn-action primary" onclick={executeMerge} disabled={merging}>
                        {merging ? "Mesclando..." : "Executar Merge"}
                      </button>
                    </div>
                  </div>
                {/if}

                {#if merged && mergeResult}
                  <div class="result-banner success">
                    <div class="result-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="var(--success-color)" stroke-width="1.5"/>
                        <path d="M6 10l3 3 5-5" stroke="var(--success-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="result-text">
                      <strong>{total(mergeResult).toLocaleString()} itens custom adicionados em memoria</strong>
                      <span>Use "Salvar .dat" no topo para persistir as alteracoes.</span>
                    </div>
                  </div>
                  {#if (spriteMergeResult?.spritesRemapped ?? 0) > 0}
                    <div class="result-banner warning">
                      <div class="result-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2L1 18h18L10 2z" stroke="var(--warning-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M10 8v4M10 14h.01" stroke="var(--warning-color)" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div class="result-text">
                        <strong>Sprites foram remapeadas</strong>
                        <span>Salve o .dat para persistir as novas referencias.</span>
                      </div>
                    </div>
                  {/if}
                {/if}
              </div>

            <!-- ── Tab: Sprites ── -->
            {:else if activeTab === "sprites"}
              <div class="tab-panel">

                {#if !spriteMergePreview && !spritesMerged}
                  <div class="action-card">
                    <div class="action-card-text">
                      <h3>Calcular preview de sprites</h3>
                      <p>Verifica quais arquivos LZMA serao copiados e se ha conflitos de IDs.</p>
                    </div>
                    <button class="btn-action primary" onclick={computeSpritePreview} disabled={loadingSpritePreview}>
                      {loadingSpritePreview ? "Calculando..." : "Calcular Preview"}
                    </button>
                  </div>
                {/if}

                {#if spriteMergePreview}
                  <div class="data-card">
                    <div class="data-card-header">
                      <h3>Preview de Sprites</h3>
                      <span class="data-card-badge">{spriteMergePreview.lzmaFilesToCopy.toLocaleString()} arquivos</span>
                    </div>

                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-value green">{spriteMergePreview.customSpriteCount.toLocaleString()}</span>
                        <span class="stat-label">Referencias custom</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value green">{spriteMergePreview.lzmaFilesToCopy.toLocaleString()}</span>
                        <span class="stat-label">Arquivos LZMA</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-value {spriteMergePreview.conflictEntries.length > 0 ? 'accent' : ''}">
                          {spriteMergePreview.conflictEntries.length > 0 ? spriteMergePreview.conflictEntries.length : "—"}
                        </span>
                        <span class="stat-label">IDs sobrepostos</span>
                      </div>
                    </div>

                    {#if spriteMergePreview.conflictEntries.length > 0}
                      <div class="conflicts-section">
                        <button class="conflicts-toggle" onclick={() => (conflictsExpanded = !conflictsExpanded)}>
                          <svg width="12" height="12" viewBox="0 0 12 12" class="toggle-chevron" class:expanded={conflictsExpanded}>
                            <path d="M4 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          {spriteMergePreview.conflictEntries.length} arquivo(s) com IDs sobrepostos — serao remapeados
                        </button>

                        {#if conflictsExpanded}
                          <div class="conflict-list">
                            {#each spriteMergePreview.conflictEntries as c}
                              <div class="conflict-row">
                                <span class="conflict-file">{c.file}</span>
                                <span class="conflict-range">ID {c.firstSpriteId.toLocaleString()} – {c.lastSpriteId.toLocaleString()}</span>
                              </div>
                            {/each}
                            <div class="remap-note">
                              Remapeados a partir do ID <strong>{spriteMergePreview.remapStartsAt.toLocaleString()}</strong> — conteudo LZMA inalterado
                            </div>
                          </div>
                        {/if}
                      </div>
                    {/if}

                    <div class="data-card-footer">
                      <button class="btn-action" onclick={computeSpritePreview} disabled={loadingSpritePreview}>
                        Recalcular
                      </button>
                      <button class="btn-action primary" onclick={executeSpritesMerge} disabled={mergingSprites}>
                        {mergingSprites ? "Copiando..." : "Executar Merge de Sprites"}
                      </button>
                    </div>
                  </div>
                {/if}

                {#if spritesMerged && spriteMergeResult}
                  <div class="result-banner success">
                    <div class="result-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="var(--success-color)" stroke-width="1.5"/>
                        <path d="M6 10l3 3 5-5" stroke="var(--success-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="result-text">
                      <strong>{spriteMergeResult.filesCopied} arquivo(s) copiado(s)</strong>
                      {#if spriteMergeResult.spritesRemapped > 0}
                        <span>{spriteMergeResult.spritesRemapped} IDs remapeados ({spriteMergeResult.newFirstSpriteId.toLocaleString()}–{spriteMergeResult.newLastSpriteId.toLocaleString()})</span>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>

            <!-- ── Tab: Static Data ── -->
            {:else if activeTab === "staticdata"}
              <div class="tab-panel">

                {#if !sdPreview && !sdMerged}
                  <div class="action-card">
                    <div class="action-card-text">
                      <h3>Calcular preview de static data</h3>
                      <p>Verifica quais entradas de creatures, bosses, houses, etc. serao mescladas.</p>
                    </div>
                    <button class="btn-action primary" onclick={computeSdPreview} disabled={loadingSdPreview}>
                      {loadingSdPreview ? "Calculando..." : "Calcular Preview"}
                    </button>
                  </div>
                {/if}

                {#if sdPreview}
                  <div class="data-card">
                    <div class="data-card-header">
                      <h3>Preview de Static Data</h3>
                      <span class="data-card-badge">{sdTotal(sdPreview).toLocaleString()} a adicionar</span>
                    </div>

                    <div class="target-files">
                      <span class="target-label">Alvos:</span>
                      <code>{sdPreview.staticdataFile}</code>
                      {#if sdPreview.staticmapdataFile}<code>{sdPreview.staticmapdataFile}</code>{/if}
                    </div>

                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th class="col-r">A adicionar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each [
                          ["Creatures", sdPreview.creaturesToAdd],
                          ["Bosses", sdPreview.bossesToAdd],
                          ["Houses", sdPreview.housesToAdd],
                          ["Quests", sdPreview.questsToAdd],
                          ["Titles", sdPreview.titlesToAdd],
                          ...(sdPreview.staticmapdataFile ? [["Map Houses", sdPreview.mapHousesToAdd]] : [])
                        ] as [label, count]}
                          <tr>
                            <td>{label}</td>
                            <td class="col-r col-green">{(count as number).toLocaleString()}</td>
                          </tr>
                        {/each}
                        <tr class="row-total">
                          <td>Total</td>
                          <td class="col-r col-green">{sdTotal(sdPreview).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="data-card-footer">
                      <button class="btn-action" onclick={computeSdPreview} disabled={loadingSdPreview}>
                        Recalcular
                      </button>
                      <button class="btn-action primary" onclick={executeSdMerge} disabled={mergingSd}>
                        {mergingSd ? "Mesclando..." : "Executar Merge"}
                      </button>
                    </div>
                  </div>
                {/if}

                {#if sdMerged && sdResult}
                  <div class="result-banner success">
                    <div class="result-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="var(--success-color)" stroke-width="1.5"/>
                        <path d="M6 10l3 3 5-5" stroke="var(--success-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <div class="result-text">
                      <strong>{sdResult.creaturesAdded + sdResult.bossesAdded + sdResult.housesAdded
                        + sdResult.questsAdded + sdResult.titlesAdded + sdResult.mapHousesAdded} itens adicionados e salvos</strong>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

          </div>
        </main>

      </div>
    {/if}
  </div>
</div>

<style>
  /* ── Root ── */
  .dat-merge {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--primary-bg);
    color: var(--text-primary);
    font-family: var(--font-family);
    font-size: 13px;
  }

  /* ── Header ── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    background: var(--secondary-bg);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    min-height: 52px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--tertiary-bg);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }
  .btn-back:hover {
    border-color: var(--primary-accent);
    color: var(--text-primary);
    background: var(--surface-bg);
  }

  .header-title-group {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.2;
  }

  /* Progress */
  .progress-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 var(--space-sm);
  }

  .progress-label {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .progress-bar {
    width: 60px;
    height: 4px;
    background: var(--tertiary-bg);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--gradient-primary);
    border-radius: 2px;
    transition: width var(--transition-normal);
  }

  /* ── Buttons ── */
  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--tertiary-bg);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }
  .btn-action:hover:not(:disabled) {
    background: var(--surface-bg);
    border-color: var(--border-hover);
  }
  .btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-action.primary {
    background: var(--gradient-primary);
    border-color: rgba(99, 102, 241, 0.4);
    color: #fff;
    font-weight: 600;
  }
  .btn-action.primary:hover:not(:disabled) {
    filter: brightness(1.12);
    box-shadow: 0 2px 12px rgba(79, 70, 229, 0.3);
    transform: translateY(-1px);
  }
  .btn-action.success {
    background: linear-gradient(135deg, #059669, var(--success-color));
    border-color: rgba(16, 185, 129, 0.4);
    color: #fff;
    font-weight: 600;
  }
  .btn-action.success:hover:not(:disabled) {
    filter: brightness(1.12);
    box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
    transform: translateY(-1px);
  }
  .btn-action.lg {
    padding: 10px 20px;
    font-size: 13px;
  }

  /* ── Body ── */
  .page-body {
    flex: 1;
    overflow: hidden;
    display: flex;
  }

  /* ── Empty state ── */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
    padding: var(--space-2xl);
    text-align: center;
  }

  .empty-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }

  .empty-icon-ring {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
    max-width: 340px;
    line-height: 1.5;
  }

  .empty-desc code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 6px;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }

  /* ── Content layout ── */
  .content-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-width: 0;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid var(--border-color);
    background: var(--secondary-bg);
    scrollbar-width: thin;
  }

  .sidebar-section {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sidebar-section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .sidebar-section-header svg {
    opacity: 0.6;
    flex-shrink: 0;
  }

  .folder-path {
    font-size: 11px;
    color: var(--text-secondary);
    word-break: break-all;
    font-family: var(--font-mono);
    line-height: 1.5;
    padding: 8px 10px;
    background: var(--tertiary-bg);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-soft-20);
  }

  /* ── File list ── */
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .file-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    background: var(--tertiary-bg);
    border: 1px solid var(--border-soft-20);
    transition: border-color var(--transition-fast);
  }
  .file-item:hover {
    border-color: var(--border-soft-30);
  }

  .file-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
  }
  .file-dot.ok { background: var(--success-color); box-shadow: 0 0 6px rgba(16, 185, 129, 0.4); }
  .file-dot.warn { background: var(--warning-color); box-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .file-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-primary);
    font-family: var(--font-mono);
    word-break: break-all;
    overflow-wrap: anywhere;
  }
  .file-name.muted { color: var(--text-muted); }

  .file-meta {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.4;
  }
  .file-meta.warn { color: var(--warning-color); }

  /* ── Thresholds ── */
  .threshold-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .threshold-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .threshold-label {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .threshold-input {
    width: 72px;
    min-width: 0;
    padding: 5px 8px;
    background: var(--control-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 12px;
    font-family: var(--font-mono);
    text-align: right;
    transition: all var(--transition-fast);
  }
  .threshold-input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  /* ── Main panel ── */
  .main-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* ── Tabs ── */
  .tab-bar {
    display: flex;
    align-items: stretch;
    padding: 0 var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--secondary-bg);
    flex-shrink: 0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    margin-bottom: -1px;
  }
  .tab:hover { color: var(--text-secondary); }
  .tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--primary-accent);
  }

  .tab-text { line-height: 1; }

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .tab-badge.done {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success-color);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  /* ── Tab content ── */
  .tab-content {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .tab-panel {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-width: 720px;
  }

  /* ── Action card (initial CTA) ── */
  .action-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    padding: var(--space-lg);
    background: var(--gradient-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
  }

  .action-card-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .action-card-text h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .action-card-text p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* ── Data card ── */
  .data-card {
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .data-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-color);
  }

  .data-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .data-card-badge {
    font-size: 11px;
    font-weight: 600;
    color: var(--success-color);
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 2px 10px;
    border-radius: 10px;
  }

  .data-card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 18px;
    border-top: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.1);
  }

  /* ── Data table ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .data-table th,
  .data-table td {
    padding: 10px 18px;
    text-align: left;
    border-bottom: 1px solid var(--border-soft-20);
  }

  .data-table th {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: rgba(0, 0, 0, 0.15);
  }

  .data-table tbody tr { transition: background var(--transition-fast); }
  .data-table tbody tr:hover { background: rgba(79, 70, 229, 0.04); }
  .data-table tbody tr:last-child td { border-bottom: none; }

  .row-total td {
    border-top: 1px solid var(--border-color) !important;
    font-weight: 600;
    color: var(--text-primary);
    background: rgba(0, 0, 0, 0.08);
  }

  .col-r    { text-align: right; }
  .col-green { color: var(--success-color); }
  .col-warn  { color: var(--warning-color); }
  .col-muted { color: var(--text-muted); }

  /* ── Stats grid (sprites) ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--border-soft-20);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px;
    background: var(--secondary-bg);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    font-family: var(--font-mono);
    line-height: 1;
  }
  .stat-value.green { color: var(--success-color); }
  .stat-value.accent { color: var(--primary-accent); }

  .stat-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Conflicts ── */
  .conflicts-section {
    padding: 0 18px 12px;
  }

  .conflicts-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--primary-accent);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    padding: 8px 0;
    transition: color var(--transition-fast);
  }
  .conflicts-toggle:hover { color: var(--text-primary); }

  .toggle-chevron {
    transition: transform var(--transition-fast);
  }
  .toggle-chevron.expanded {
    transform: rotate(90deg);
  }

  .conflict-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--tertiary-bg);
    scrollbar-width: thin;
    margin-top: 4px;
  }

  .conflict-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    gap: 12px;
    border-bottom: 1px solid var(--border-soft-20);
    font-size: 11px;
  }
  .conflict-row:last-of-type { border-bottom: none; }

  .conflict-file {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    word-break: break-all;
    font-size: 10px;
  }

  .conflict-range {
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    font-size: 10px;
    font-family: var(--font-mono);
  }

  .remap-note {
    padding: 8px 12px;
    font-size: 11px;
    color: var(--primary-accent);
    border-top: 1px solid var(--border-color);
    background: rgba(79, 70, 229, 0.05);
  }
  .remap-note strong { color: var(--text-primary); }

  /* ── Target files (static data) ── */
  .target-files {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 18px;
    border-bottom: 1px solid var(--border-soft-20);
    font-size: 11px;
  }

  .target-label {
    color: var(--text-muted);
    font-weight: 500;
  }

  .target-files code {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 8px;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }

  /* ── Result banners ── */
  .result-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--radius-lg);
    font-size: 12px;
  }
  .result-banner.success {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }
  .result-banner.warning {
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .result-icon { flex-shrink: 0; margin-top: 1px; }

  .result-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .result-text strong {
    color: var(--text-primary);
    font-weight: 600;
  }
  .result-text span {
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.4;
  }
</style>
