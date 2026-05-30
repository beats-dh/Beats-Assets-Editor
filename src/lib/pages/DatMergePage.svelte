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
  let conflictsExpanded    = $state(true);

  let sdPreview        = $state<StaticDataMergePreview | null>(null);
  let sdResult         = $state<StaticDataMergeResult | null>(null);
  let loadingSdPreview = $state(false);
  let mergingSd        = $state(false);
  let sdMerged         = $state(false);

  let activeTab = $state<"appearances" | "sprites" | "staticdata" | "save">("appearances");

  interface SaveAllResult {
    datSaved: boolean; datBytes: number;
    spriteFilesCopied: number; catalogSaved: boolean;
    staticdataSaved: boolean; staticmapdataSaved: boolean;
  }

  let saving      = $state(false);
  let allSaved    = $state(false);
  let saveResult  = $state<SaveAllResult | null>(null);

  // ── Steps ─────────────────────────────────────────────────────────────────

  type StepId = "appearances" | "sprites" | "staticdata" | "save";
  interface Step { id: StepId; label: string; done: boolean; }

  // All previous merge steps must be done to unlock "save"
  let allMergesDone = $derived(
    merged
    && (!folderStats?.catalog || spritesMerged)
    && (!folderStats?.staticdataFile || sdMerged)
  );

  let steps = $derived<Step[]>([
    { id: "appearances" as const, label: "Appearances", done: merged },
    ...(folderStats?.catalog ? [{ id: "sprites" as const, label: "Sprites", done: spritesMerged }] : []),
    ...(folderStats?.staticdataFile ? [{ id: "staticdata" as const, label: "Static Data", done: sdMerged }] : []),
    { id: "save" as const, label: "Salvar", done: allSaved },
  ]);

  function canNavigateTo(index: number): boolean {
    if (index === 0) return true;
    // "Save" step requires all merges done
    if (steps[index]?.id === "save") return allMergesDone;
    // Other steps: previous step must be done
    return steps[index - 1]?.done ?? false;
  }

  function goToStep(index: number) {
    if (canNavigateTo(index)) activeTab = steps[index].id;
  }

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
    merging = true;
    try {
      mergeResult = await invoke<CategoryStats>(COMMANDS.EXECUTE_DAT_MERGE, { thresholds });
      merged = true; preview = null; assetsState.currentStats = null;
      showStatus(`${total(mergeResult)} itens mergeados`, "success");
      // Auto-advance to next step
      if (folderStats?.catalog) activeTab = "sprites";
      else if (folderStats?.staticdataFile) activeTab = "staticdata";
    } catch (e) { showStatus(`Erro: ${e}`, "error"); }
    finally { merging = false; }
  }

  async function saveAll() {
    const datPath = await save({ filters: [{ name: "DAT", extensions: ["dat"] }] });
    if (!datPath) return;
    saving = true;
    try {
      saveResult = await invoke<SaveAllResult>(COMMANDS.SAVE_ALL_MERGE, { datPath });
      allSaved = true;
      showStatus("Todos os arquivos salvos com sucesso", "success");
    } catch (e) { showStatus(`Erro ao salvar: ${e}`, "error"); }
    finally { saving = false; }
  }

  async function computeSpritePreview() {
    loadingSpritePreview = true;
    try { spriteMergePreview = await invoke<SpriteMergePreview>(COMMANDS.GET_SPRITE_MERGE_PREVIEW, { thresholds }); }
    catch (e) { showStatus(`Erro preview sprites: ${e}`, "error"); }
    finally { loadingSpritePreview = false; }
  }

  async function executeSpritesMerge() {
    if (!spriteMergePreview) return;
    mergingSprites = true;
    try {
      spriteMergeResult = await invoke<SpriteMergeResult>(COMMANDS.EXECUTE_SPRITE_MERGE, { thresholds });
      spritesMerged = true;
      showStatus(`${spriteMergeResult.filesCopied} arquivo(s) preparado(s)`, "success");
      // Auto-advance to next step
      if (folderStats?.staticdataFile) activeTab = "staticdata";
      else activeTab = "save";
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
    mergingSd = true;
    try {
      sdResult = await invoke<StaticDataMergeResult>(COMMANDS.EXECUTE_STATICDATA_MERGE, {
        thresholds: { creatures: sdThresholds.creatures, bosses: sdThresholds.bosses,
          houses: sdThresholds.houses, quests: sdThresholds.quests,
          titles: sdThresholds.titles, mapHouses: sdThresholds.mapHouses },
      });
      sdMerged = true;
      showStatus("Static data preparado", "success");
      // Auto-advance to save step
      activeTab = "save";
    } catch (e) { showStatus(`Erro: ${e}`, "error"); }
    finally { mergingSd = false; }
  }

  function total(s: CategoryStats) { return s.objects + s.outfits + s.effects + s.missiles; }
  function sdTotal(p: StaticDataMergePreview) {
    return p.creaturesToAdd + p.bossesToAdd + p.housesToAdd + p.questsToAdd + p.titlesToAdd + p.mapHousesToAdd;
  }
</script>

<main class="dat-merge">

  <!-- ── Header (same pattern as CategoryView) ── -->
  <header class="modern-header">
    <div class="header-left">
      <button class="modern-back-btn" onclick={() => (assetsState.viewMode = "categories")}>
        <svg class="back-icon" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Voltar</span>
      </button>
      <div class="header-divider"></div>
      <h1 class="header-title">DAT Merge</h1>
    </div>

    <div class="header-right">
      {#if folderLoaded}
        <span class="header-info">{folderPath}</span>
      {/if}
      <button class="action-button primary" onclick={pickFolder} disabled={loadingFolder}>
        {loadingFolder ? "Carregando..." : folderLoaded ? "Trocar pasta" : "Selecionar pasta"}
      </button>
    </div>
  </header>

  <!-- ── Content ── -->
  <div class="content-scroll">

    {#if !folderLoaded}
      <!-- ── Empty State ── -->
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <h2>Selecione a pasta de assets</h2>
        <p>Aponte para a pasta <code>assets/</code> do cliente oficial para iniciar o merge.</p>
        <button class="action-button primary" onclick={pickFolder} disabled={loadingFolder}>
          {loadingFolder ? "Carregando..." : "Selecionar pasta assets/"}
        </button>
      </div>

    {:else}
      <div class="merge-container">

        <!-- ── Source info + Detected files (horizontal cards, like CategoryNav) ── -->
        <div class="source-row">
          {#if folderStats}
            <div class="source-card">
              <div class="card-icon">📄</div>
              <div class="card-content">
                <h3>Appearances</h3>
                <p>{(folderStats.appearances.objects + folderStats.appearances.outfits + folderStats.appearances.effects + folderStats.appearances.missiles).toLocaleString()} items</p>
              </div>
            </div>

            <div class="source-card {folderStats.catalog ? '' : 'warn'}">
              <div class="card-icon">📦</div>
              <div class="card-content">
                <h3>Catalog</h3>
                {#if folderStats.catalog}
                  <p>{folderStats.catalog.totalEntries.toLocaleString()} entradas</p>
                {:else}
                  <p class="warn-text">Nao encontrado</p>
                {/if}
              </div>
            </div>

            <div class="source-card {folderStats.staticdataFile ? '' : 'warn'}">
              <div class="card-icon">🗄️</div>
              <div class="card-content">
                <h3>Static Data</h3>
                {#if folderStats.staticdataFile}
                  <p>{folderStats.staticmapdataFile ? "staticdata + mapdata" : "staticdata"}</p>
                {:else}
                  <p class="warn-text">Nao encontrado</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- ── Stepper ── -->
        <div class="stepper">
          {#each steps as step, i}
            {#if i > 0}
              <div class="step-line" class:done={steps[i - 1].done}></div>
            {/if}
            <button
              class="step-node"
              class:active={activeTab === step.id}
              class:done={step.done}
              class:locked={!canNavigateTo(i)}
              disabled={!canNavigateTo(i)}
              onclick={() => goToStep(i)}
            >
              <span class="step-circle">
                {#if step.done}✓{:else}{i + 1}{/if}
              </span>
              <span class="step-label">{step.label}</span>
            </button>
          {/each}
        </div>

        <!-- ── Tab: Appearances ── -->
        {#if activeTab === "appearances"}
          <div class="tab-panel">
            <!-- Thresholds inline -->
            <div class="config-section">
              <span class="config-label">IDs custom ≥</span>
              {#each [["Objects", "objects"], ["Outfits", "outfits"], ["Effects", "effects"], ["Missiles", "missiles"]] as [label, key]}
                <label class="config-field">
                  <span>{label}</span>
                  <input type="number" bind:value={(thresholds as any)[key]} min="1" />
                </label>
              {/each}
              <button class="action-button" onclick={computePreview} disabled={loadingPreview}>
                {loadingPreview ? "Calculando..." : "Calcular Preview"}
              </button>
            </div>

            {#if preview}
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
              <div class="actions-row">
                <button class="action-button primary" onclick={executeMerge} disabled={merging}>
                  {merging ? "Mesclando..." : "Executar Merge"}
                </button>
              </div>
            {/if}

            {#if merged && mergeResult}
              <div class="result-banner success">
                ✅ {total(mergeResult).toLocaleString()} itens custom preparados em memoria.
              </div>
              {#if (spriteMergeResult?.spritesRemapped ?? 0) > 0}
                <div class="result-banner warning">
                  ⚠ Sprites foram remapeadas — as referencias serao atualizadas no step Salvar.
                </div>
              {/if}
            {/if}
          </div>

        <!-- ── Tab: Sprites ── -->
        {:else if activeTab === "sprites"}
          <div class="tab-panel">
            <div class="config-section">
              <button class="action-button" onclick={computeSpritePreview} disabled={loadingSpritePreview}>
                {loadingSpritePreview ? "Calculando..." : "Calcular Preview"}
              </button>
            </div>

            {#if spriteMergePreview}
              <div class="stats-row">
                <div class="stat-card">
                  <span class="stat-val">{spriteMergePreview.customSpriteCount.toLocaleString()}</span>
                  <span class="stat-lbl">Referencias custom</span>
                </div>
                <div class="stat-card">
                  <span class="stat-val">{spriteMergePreview.lzmaFilesToCopy.toLocaleString()}</span>
                  <span class="stat-lbl">Arquivos LZMA</span>
                </div>
                <div class="stat-card">
                  <span class="stat-val {spriteMergePreview.conflictEntries.length > 0 ? 'accent' : ''}">{spriteMergePreview.conflictEntries.length > 0 ? spriteMergePreview.conflictEntries.length : "—"}</span>
                  <span class="stat-lbl">IDs sobrepostos</span>
                </div>
              </div>

              {#if spriteMergePreview.conflictEntries.length > 0}
                <button class="toggle-btn" onclick={() => (conflictsExpanded = !conflictsExpanded)}>
                  {conflictsExpanded ? "▼" : "▶"} {spriteMergePreview.conflictEntries.length} arquivo(s) com IDs sobrepostos — serao remapeados
                </button>
                {#if conflictsExpanded}
                  <div class="conflict-list">
                    {#each spriteMergePreview.conflictEntries as c}
                      <div class="conflict-row">
                        <span class="conflict-file">{c.file}</span>
                        <span class="conflict-range">ID {c.firstSpriteId.toLocaleString()} – {c.lastSpriteId.toLocaleString()}</span>
                      </div>
                    {/each}
                    <div class="remap-note">Remapeados a partir do ID <strong>{spriteMergePreview.remapStartsAt.toLocaleString()}</strong></div>
                  </div>
                {/if}
              {/if}

              <div class="actions-row">
                <button class="action-button primary" onclick={executeSpritesMerge} disabled={mergingSprites}>
                  {mergingSprites ? "Copiando..." : "Executar Merge de Sprites"}
                </button>
              </div>
            {/if}

            {#if spritesMerged && spriteMergeResult}
              <div class="result-banner success">
                ✅ {spriteMergeResult.filesCopied} arquivo(s) copiado(s)
                {#if spriteMergeResult.spritesRemapped > 0}
                  · {spriteMergeResult.spritesRemapped} IDs remapeados ({spriteMergeResult.newFirstSpriteId.toLocaleString()}–{spriteMergeResult.newLastSpriteId.toLocaleString()})
                {/if}
              </div>
            {/if}
          </div>

        <!-- ── Tab: Static Data ── -->
        {:else if activeTab === "staticdata"}
          <div class="tab-panel">
            <div class="config-section">
              <span class="config-label">IDs custom ≥</span>
              {#each [["Creatures", "creatures"], ["Bosses", "bosses"], ["Houses", "houses"], ["Quests", "quests"], ["Titles", "titles"], ["Map Houses", "mapHouses"]] as [label, key]}
                <label class="config-field">
                  <span>{label}</span>
                  <input type="number" bind:value={(sdThresholds as any)[key]} min="1" />
                </label>
              {/each}
              <button class="action-button" onclick={computeSdPreview} disabled={loadingSdPreview}>
                {loadingSdPreview ? "Calculando..." : "Calcular Preview"}
              </button>
            </div>

            {#if sdPreview}
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
              <div class="actions-row">
                <button class="action-button primary" onclick={executeSdMerge} disabled={mergingSd}>
                  {mergingSd ? "Mesclando..." : "Executar Merge"}
                </button>
              </div>
            {/if}

            {#if sdMerged && sdResult}
              <div class="result-banner success">
                ✅ {sdResult.creaturesAdded + sdResult.bossesAdded + sdResult.housesAdded
                  + sdResult.questsAdded + sdResult.titlesAdded + sdResult.mapHousesAdded} itens preparados em memoria
              </div>
            {/if}
          </div>

        <!-- ── Step: Salvar ── -->
        {:else if activeTab === "save"}
          <div class="tab-panel">
            <h2 class="save-title">Resumo do Merge</h2>
            <p class="save-desc">Tudo esta em memoria. Escolha onde salvar o .dat e todos os arquivos serao gravados de uma vez.</p>

            <div class="save-summary">
              <div class="summary-item">
                <span class="summary-label">Appearances</span>
                <span class="summary-value {merged ? 'ok' : ''}">{merged && mergeResult ? total(mergeResult).toLocaleString() + ' itens' : 'Nao executado'}</span>
              </div>
              {#if folderStats?.catalog}
                <div class="summary-item">
                  <span class="summary-label">Sprites</span>
                  <span class="summary-value {spritesMerged ? 'ok' : ''}">{spritesMerged && spriteMergeResult ? spriteMergeResult.filesCopied + ' arquivos' : 'Nao executado'}</span>
                </div>
              {/if}
              {#if folderStats?.staticdataFile}
                <div class="summary-item">
                  <span class="summary-label">Static Data</span>
                  <span class="summary-value {sdMerged ? 'ok' : ''}">{sdMerged && sdResult ? (sdResult.creaturesAdded + sdResult.bossesAdded + sdResult.housesAdded + sdResult.questsAdded + sdResult.titlesAdded + sdResult.mapHousesAdded) + ' itens' : 'Nao executado'}</span>
                </div>
              {/if}
            </div>

            <div class="actions-row">
              <button class="action-button primary" onclick={saveAll} disabled={saving || allSaved}>
                {saving ? "Salvando..." : allSaved ? "Salvo ✓" : "Escolher local e Salvar tudo"}
              </button>
            </div>

            {#if allSaved && saveResult}
              <div class="result-banner success">
                ✅ Tudo salvo com sucesso — .dat ({(saveResult.datBytes / 1024).toFixed(0)} KB){saveResult.spriteFilesCopied > 0 ? `, ${saveResult.spriteFilesCopied} sprites` : ''}{saveResult.staticdataSaved ? ', staticdata' : ''}{saveResult.staticmapdataSaved ? ', staticmapdata' : ''}
              </div>
            {/if}
          </div>
        {/if}

      </div>
    {/if}
  </div>
</main>

<style>
  .dat-merge {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--primary-bg);
    color: var(--text-primary);
    font-family: var(--font-family);
  }

  /* ── Header (matches CategoryView modern-header) ── */
  .modern-header {
    background: var(--gradient-surface);
    border-bottom: 1px solid var(--border-soft-20);
    padding: var(--space-sm) var(--space-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    min-height: 56px;
    backdrop-filter: blur(20px);
    flex-shrink: 0;
    z-index: 20;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    flex: 0 0 auto;
  }

  .modern-back-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: var(--surface-bg);
    border: 1px solid var(--border-soft);
    color: var(--text-primary);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .modern-back-btn:hover {
    background: var(--elevated-bg);
    border-color: var(--border-hover);
    transform: translateY(-1px);
  }

  .back-icon { width: 16px; height: 16px; stroke-width: 2; }

  .header-divider {
    width: 1px;
    height: var(--control-height);
    background: var(--border-color);
    opacity: 0.5;
  }

  .header-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .header-info {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Buttons (matches CategoryView action-button pattern) ── */
  .action-button {
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(15, 23, 42, 0.35);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: 0.45rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    white-space: nowrap;
    backdrop-filter: blur(12px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .action-button:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.22);
    border-color: rgba(59, 130, 246, 0.55);
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.18);
  }
  .action-button:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-button.primary {
    border-color: rgba(129, 140, 248, 0.55);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.42), rgba(129, 140, 248, 0.38));
    color: #ede9fe;
  }

  /* ── Content ── */
  .content-scroll {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  /* ── Empty state ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-2xl);
    text-align: center;
    min-height: 60vh;
  }
  .empty-icon { font-size: 3rem; }
  .empty-state h2 { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
  .empty-state p { margin: 0; font-size: 0.875rem; color: var(--text-muted); max-width: 340px; line-height: 1.5; }
  .empty-state code {
    font-family: var(--font-mono);
    padding: 1px 6px;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }

  /* ── Container (like CategoryNav nav-container) ── */
  .merge-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  /* ── Source cards row (like category-cards) ── */
  .source-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }

  .source-card {
    background: var(--gradient-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    transition: all var(--transition-normal);
  }
  .source-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-accent);
  }
  .source-card.warn { opacity: 0.6; }

  .card-icon { font-size: 2rem; flex-shrink: 0; }

  .card-content {
    flex: 1;
    min-width: 0;
  }
  .card-content h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 var(--space-xs);
    color: var(--text-primary);
  }
  .card-content p {
    margin: 0;
    display: inline-flex;
    width: fit-content;
    padding: 2px 10px;
    background: var(--control-bg);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-soft);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .warn-text {
    color: var(--warning-color) !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
  }

  /* ── Stepper ── */
  .stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .step-line {
    width: 48px;
    height: 2px;
    background: var(--border-color);
    transition: background var(--transition-normal);
  }
  .step-line.done { background: var(--success-color); }

  .step-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--transition-fast);
  }
  .step-node:hover:not(:disabled) { color: var(--text-primary); }
  .step-node.active { color: var(--text-primary); }
  .step-node.active .step-circle {
    background: var(--primary-accent);
    border-color: var(--primary-accent);
    color: #fff;
  }
  .step-node.done .step-circle {
    background: var(--success-color);
    border-color: var(--success-color);
    color: #fff;
  }
  .step-node.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .step-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    background: var(--tertiary-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }

  .step-label { white-space: nowrap; }

  /* ── Tab panel ── */
  .tab-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  /* ── Config section (thresholds + button inline) ── */
  .config-section {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-wrap: wrap;
    padding: var(--space-md);
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  .config-label {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .config-field {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .config-field span {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .config-field input {
    width: 110px;
    padding: 0.4rem 0.6rem;
    background: var(--control-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 0.85rem;
    font-family: var(--font-mono);
    text-align: center;
    transition: border-color var(--transition-fast);
  }
  .config-field input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  /* ── Actions row ── */
  .actions-row {
    display: flex;
    justify-content: center;
    gap: var(--space-sm);
  }

  /* ── Data table ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .data-table th, .data-table td {
    padding: 0.65rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-soft-20);
  }
  .data-table th {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: var(--secondary-bg);
  }
  .data-table tbody tr:hover { background: rgba(79, 70, 229, 0.04); }
  .data-table tbody tr:last-child td { border-bottom: none; }

  .row-total td {
    border-top: 1px solid var(--border-color) !important;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.08);
  }

  .col-r { text-align: right; font-family: var(--font-mono); }
  .col-green { color: var(--success-color); }
  .col-warn { color: var(--warning-color); }
  .col-muted { color: var(--text-muted); }

  /* ── Stats row (sprites) ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }

  .stat-card {
    text-align: center;
    padding: var(--space-md);
    background: var(--tertiary-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }
  .stat-val {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--success-color);
    font-family: var(--font-mono);
    line-height: 1.2;
  }
  .stat-val.accent { color: var(--primary-accent); }
  .stat-lbl {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: var(--space-xs);
  }

  /* ── Conflicts ── */
  .toggle-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0;
    text-align: left;
    transition: color var(--transition-fast);
  }
  .toggle-btn:hover { color: var(--text-primary); }

  .conflict-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--secondary-bg);
    scrollbar-width: thin;
  }
  .conflict-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.75rem;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border-soft-20);
    font-size: 0.75rem;
  }
  .conflict-row:last-of-type { border-bottom: none; }
  .conflict-file { font-family: var(--font-mono); color: var(--text-secondary); word-break: break-all; }
  .conflict-range { color: var(--text-muted); white-space: nowrap; flex-shrink: 0; font-family: var(--font-mono); }
  .remap-note {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--primary-accent);
    border-top: 1px solid var(--border-color);
  }
  .remap-note strong { color: var(--text-primary); }

  /* ── Result banners ── */
  .result-banner {
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.85rem;
  }
  .result-banner.success {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: var(--success-color);
  }
  .result-banner.warning {
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.2);
    color: var(--warning-color);
  }

  /* ── Save step ── */
  .save-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .save-desc {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .save-summary {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--tertiary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-soft-20);
  }
  .summary-item:last-child { border-bottom: none; }

  .summary-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .summary-value {
    font-size: 0.875rem;
    font-family: var(--font-mono);
    color: var(--text-muted);
  }
  .summary-value.ok { color: var(--success-color); }
</style>
