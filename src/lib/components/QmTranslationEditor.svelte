<script lang="ts">
  import { onMount } from "svelte";
  import { open, save } from "@tauri-apps/plugin-dialog";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { invoke } from "../../utils/invoke";
  import { showStatus } from "../../utils";
  import { COMMANDS } from "../../commands";
  import { translate } from "../../i18n";
  import { SvelteMap } from "svelte/reactivity";

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------
  interface QmEntry {
    index: number;
    hash: number;
    offset: number;
    context: string;
    source_text: string;
    comment: string;
    translation: string | null;
    numerus_forms: string[];
  }

  interface QmLoadResult {
    entries: QmEntry[];
    total: number;
    has_source_text: boolean;
    path: string;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let entries = $state<QmEntry[]>([]);
  let filteredEntries = $state<QmEntry[]>([]);
  let searchQuery = $state("");
  let loadedPath = $state("");
  let totalEntries = $state(0);
  let hasSourceText = $state(false);
  let isLoading = $state(false);
  let isSaving = $state(false);
  let statusMessage = $state("");
  let statusType = $state<"info" | "success" | "error">("info");

  // Pending edits: index → new translation string (or null to clear)
  let pendingEdits = $state(new SvelteMap<number, string | null>());
  // Which row is being edited inline
  let editingIndex = $state<number | null>(null);
  let editingValue = $state("");

  // Pagination
  let currentPage = $state(0);
  const PAGE_SIZE = 100;
  let totalPages = $derived(
    Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE)),
  );
  let pageEntries = $derived(
    filteredEntries.slice(
      currentPage * PAGE_SIZE,
      (currentPage + 1) * PAGE_SIZE,
    ),
  );

  const STORAGE_KEY = "lastQmPath";

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  onMount(async () => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      await loadFile(cached);
      return;
    }
    // Try to find QM files near the Tibia client path
    const tibia = localStorage.getItem("lastTibiaPath");
    if (tibia) {
      try {
        const found = await invoke<string[]>(COMMANDS.QM_FIND_FILES, {
          basePath: tibia,
        });
        if (found.length > 0) {
          await loadFile(found[0]);
        }
      } catch {
        // silent
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Filter / search
  // ---------------------------------------------------------------------------
  $effect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      filteredEntries = entries;
    } else {
      filteredEntries = entries.filter(
        (e) =>
          e.source_text.toLowerCase().includes(q) ||
          e.context.toLowerCase().includes(q) ||
          e.comment.toLowerCase().includes(q) ||
          (e.translation ?? "").toLowerCase().includes(q),
      );
    }
    currentPage = 0;
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function setStatus(msg: string, type: "info" | "success" | "error" = "info") {
    statusMessage = msg;
    statusType = type;
  }

  function getTranslation(entry: QmEntry): string {
    if (pendingEdits.has(entry.index)) {
      return pendingEdits.get(entry.index) ?? "";
    }
    return entry.translation ?? "";
  }

  function hasPendingEdit(index: number): boolean {
    return pendingEdits.has(index);
  }

  // ---------------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------------
  async function loadFile(path: string) {
    isLoading = true;
    setStatus(translate("qm.status.loading"));
    try {
      const result = await invoke<QmLoadResult>(COMMANDS.QM_LOAD, { path });
      entries = result.entries;
      filteredEntries = result.entries;
      totalEntries = result.total;
      hasSourceText = result.has_source_text;
      loadedPath = result.path;
      pendingEdits.clear();
      editingIndex = null;
      localStorage.setItem(STORAGE_KEY, path);
      setStatus(
        translate("qm.status.loaded", { count: String(result.total) }),
        "success",
      );
    } catch (e) {
      setStatus(translate("qm.status.error", { err: String(e) }), "error");
    } finally {
      isLoading = false;
    }
  }

  async function openFile() {
    try {
      const selected = await open({
        title: translate("qm.dialog.openTitle"),
        filters: [{ name: "Qt Translation", extensions: ["qm"] }],
      });
      if (typeof selected === "string" && selected) {
        await loadFile(selected);
      }
    } catch (e) {
      setStatus(translate("qm.status.error", { err: String(e) }), "error");
    }
  }

  async function saveFile(saveAs = false) {
    if (!loadedPath && !saveAs) {
      setStatus(translate("qm.status.noFile"), "error");
      return;
    }

    // Flush all pending edits to backend first
    if (pendingEdits.size > 0) {
      await flushPendingEdits();
    }

    isSaving = true;
    setStatus(translate("qm.status.saving"));
    try {
      let outPath: string | undefined;
      if (saveAs) {
        const dest = await save({
          title: translate("qm.dialog.saveTitle"),
          defaultPath: loadedPath || "translations.qm",
          filters: [{ name: "Qt Translation", extensions: ["qm"] }],
        });
        if (!dest) {
          isSaving = false;
          return;
        }
        outPath = dest;
      }

      const savedPath = await invoke<string>(COMMANDS.QM_SAVE, {
        outputPath: outPath ?? null,
      });
      loadedPath = savedPath;
      localStorage.setItem(STORAGE_KEY, savedPath);
      setStatus(translate("qm.status.saved", { path: savedPath }), "success");
    } catch (e) {
      setStatus(translate("qm.status.error", { err: String(e) }), "error");
    } finally {
      isSaving = false;
    }
  }

  async function exportCsv() {
    try {
      const dest = await save({
        title: translate("qm.dialog.exportTitle"),
        defaultPath: "translations.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!dest) return;

      // Flush pending first
      if (pendingEdits.size > 0) await flushPendingEdits();

      const count = await invoke<number>(COMMANDS.QM_EXPORT_CSV, {
        outputPath: dest,
      });
      setStatus(
        translate("qm.status.exported", { count: String(count) }),
        "success",
      );
    } catch (e) {
      setStatus(translate("qm.status.error", { err: String(e) }), "error");
    }
  }

  async function importCsv() {
    try {
      const selected = await open({
        title: translate("qm.dialog.importTitle"),
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (typeof selected !== "string" || !selected) return;

      const count = await invoke<number>(COMMANDS.QM_IMPORT_CSV, {
        filePath: selected,
      });

      // Reload entries from backend to reflect imported translations
      const updated = await invoke<QmEntry[]>(COMMANDS.QM_GET_ENTRIES);
      entries = updated;
      filteredEntries = entries; // trigger re-filter
      pendingEdits.clear();

      setStatus(
        translate("qm.status.imported", { count: String(count) }),
        "success",
      );
    } catch (e) {
      setStatus(translate("qm.status.error", { err: String(e) }), "error");
    }
  }

  // ---------------------------------------------------------------------------
  // Inline editing
  // ---------------------------------------------------------------------------
  function startEdit(entry: QmEntry) {
    editingIndex = entry.index;
    editingValue = getTranslation(entry);
  }

  function commitEdit(index: number) {
    pendingEdits.set(index, editingValue || null);
    editingIndex = null;
    editingValue = "";
  }

  function cancelEdit() {
    editingIndex = null;
    editingValue = "";
  }

  function handleEditKeydown(e: KeyboardEvent, index: number) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEdit(index);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  async function debugRaw() {
    try {
      const result = await invoke<string>(COMMANDS.QM_DEBUG_RAW);
      showStatus(result, "success");
    } catch (e) {
      showStatus(String(e), "error");
    }
  }

  async function flushPendingEdits() {
    if (pendingEdits.size === 0) return;
    const updates: [number, string | null][] = Array.from(
      pendingEdits.entries(),
    );
    await invoke(COMMANDS.QM_UPDATE_TRANSLATIONS, { updates });
    // Merge into entries
    entries = entries.map((e) => {
      if (pendingEdits.has(e.index)) {
        return { ...e, translation: pendingEdits.get(e.index) ?? null };
      }
      return e;
    });
    pendingEdits.clear();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function goBack() {
    assetsState.viewMode = "categories";
  }

  function clearSearch() {
    searchQuery = "";
  }

  function focusAction(node: HTMLElement) {
    // Svelte action to safely focus the element without triggering a11y warnings
    node.focus();
  }
</script>

<!-- =========================================================================
  Layout
========================================================================= -->
<div class="qm-editor">
  <!-- Toolbar -->
  <div class="qm-toolbar">
    <button class="btn-back" onclick={goBack} title={translate("qm.btn.back")}>
      ← {translate("qm.btn.back")}
    </button>

    <span class="qm-title">🌐 {translate("qm.title")}</span>

    <div class="toolbar-actions">
      <button class="btn-tool" onclick={openFile} disabled={isLoading}>
        📂 {translate("qm.btn.open")}
      </button>
      {#if loadedPath}
        <button
          class="btn-tool"
          onclick={() => saveFile(false)}
          disabled={isSaving || isLoading}
        >
          💾 {translate("qm.btn.save")}
        </button>
        <button
          class="btn-tool"
          onclick={() => saveFile(true)}
          disabled={isSaving || isLoading}
        >
          💾 {translate("qm.btn.saveAs")}
        </button>
        <button class="btn-tool" onclick={exportCsv} disabled={isLoading}>
          📤 {translate("qm.btn.exportCsv")}
        </button>
        <button class="btn-tool" onclick={importCsv} disabled={isLoading}>
          📥 {translate("qm.btn.importCsv")}
        </button>
        <button
          class="btn-tool btn-debug"
          onclick={debugRaw}
          title="Debug: dump raw bytes from QM file"
        >
          🔬 Debug
        </button>
      {/if}
    </div>
  </div>

  <!-- Status bar -->
  {#if statusMessage}
    <div class="qm-status qm-status--{statusType}">
      {statusMessage}
    </div>
  {/if}

  {#if !loadedPath && !isLoading}
    <!-- Empty state -->
    <div class="qm-empty">
      <div class="qm-empty-icon">🌐</div>
      <h2>{translate("qm.empty.title")}</h2>
      <p>{translate("qm.empty.desc")}</p>
      <button class="btn-primary" onclick={openFile}>
        {translate("qm.btn.open")}
      </button>
    </div>
  {:else if isLoading}
    <div class="qm-loading">
      <div class="spinner"></div>
      <p>{translate("qm.status.loading")}</p>
    </div>
  {:else}
    <!-- Info bar -->
    <div class="qm-info-bar">
      <span class="qm-path" title={loadedPath}>📄 {loadedPath}</span>
      <span class="qm-count">
        {filteredEntries.length} / {totalEntries}
        {translate("qm.info.entries")}
        {#if pendingEdits.size > 0}
          <span class="badge-pending">
            {pendingEdits.size}
            {translate("qm.info.unsaved")}
          </span>
        {/if}
      </span>
    </div>

    <!-- Search -->
    <div class="qm-search-row">
      <input
        class="qm-search"
        type="text"
        placeholder={translate("qm.search.placeholder")}
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button
          class="btn-clear-search"
          onclick={clearSearch}
          aria-label={translate("search.clear")}
        >
          ✕
        </button>
      {/if}
      {#if !hasSourceText}
        <span class="badge-warn">⚠️ {translate("qm.warn.noSourceText")}</span>
      {/if}
    </div>

    <!-- Table -->
    <div class="qm-table-wrap">
      <table class="qm-table">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th class="col-context">{translate("qm.col.context")}</th>
            {#if hasSourceText}
              <th class="col-source">{translate("qm.col.source")}</th>
            {/if}
            <th class="col-translation">{translate("qm.col.translation")}</th>
            <th class="col-hash">{translate("qm.col.hash")}</th>
          </tr>
        </thead>
        <tbody>
          {#each pageEntries as entry (entry.index)}
            {@const isDirty = hasPendingEdit(entry.index)}
            {@const isEditing = editingIndex === entry.index}
            <tr class:dirty={isDirty} class:editing={isEditing}>
              <td class="col-idx">{entry.index}</td>

              <td class="col-context" title={entry.context}>
                {entry.context || entry.comment || "—"}
              </td>

              {#if hasSourceText}
                <td class="col-source" title={entry.source_text}>
                  {entry.source_text || "—"}
                </td>
              {/if}

              <td class="col-translation">
                {#if isEditing}
                  <textarea
                    class="edit-textarea"
                    bind:value={editingValue}
                    onkeydown={(e) => handleEditKeydown(e, entry.index)}
                    onblur={() => commitEdit(entry.index)}
                    rows={2}
                    use:focusAction
                  ></textarea>
                {:else}
                  <div
                    class="translation-cell"
                    role="button"
                    tabindex="0"
                    ondblclick={() => startEdit(entry)}
                    onkeydown={(e) => {
                      if (e.key === "Enter") startEdit(entry);
                    }}
                    title={translate("qm.hint.dblclick")}
                  >
                    {#if getTranslation(entry)}
                      {getTranslation(entry)}
                    {:else}
                      <em class="empty-translation"
                        >{translate("qm.empty.translation")}</em
                      >
                    {/if}
                  </div>
                {/if}
              </td>

              <td class="col-hash">
                <code
                  >{entry.hash
                    .toString(16)
                    .toUpperCase()
                    .padStart(8, "0")}</code
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="qm-pagination">
        <button
          class="btn-page"
          disabled={currentPage === 0}
          onclick={() => (currentPage = 0)}>«</button
        >
        <button
          class="btn-page"
          disabled={currentPage === 0}
          onclick={() => currentPage--}>‹</button
        >
        <span class="page-info">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          class="btn-page"
          disabled={currentPage >= totalPages - 1}
          onclick={() => currentPage++}>›</button
        >
        <button
          class="btn-page"
          disabled={currentPage >= totalPages - 1}
          onclick={() => (currentPage = totalPages - 1)}>»</button
        >
      </div>
    {/if}
  {/if}
</div>

<style>
  .qm-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-primary, #0f1117);
    color: var(--text-primary, #e2e8f0);
    font-family: var(--font-mono, monospace);
    overflow: hidden;
  }

  /* ---- Toolbar ---- */
  .qm-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    background: var(--bg-secondary, #1a1d27);
    border-bottom: 1px solid var(--border-color, #2d3148);
    flex-shrink: 0;
  }

  .btn-back {
    background: none;
    border: 1px solid var(--border-color, #2d3148);
    color: var(--text-secondary, #94a3b8);
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }
  .btn-back:hover {
    border-color: var(--accent, #6366f1);
    color: var(--accent, #6366f1);
  }

  .qm-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #e2e8f0);
    flex: 1;
  }

  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-tool {
    background: var(--bg-tertiary, #252836);
    border: 1px solid var(--border-color, #2d3148);
    color: var(--text-primary, #e2e8f0);
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.15s;
  }
  .btn-tool:hover:not(:disabled) {
    border-color: var(--accent, #6366f1);
    background: var(--accent-dim, rgba(99, 102, 241, 0.1));
  }
  .btn-tool:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-debug {
    border-color: rgba(99, 102, 241, 0.4);
    color: var(--text-secondary, #94a3b8);
    font-size: 0.75rem;
  }

  /* ---- Status ---- */
  .qm-status {
    padding: 0.4rem 1rem;
    font-size: 0.82rem;
    flex-shrink: 0;
  }
  .qm-status--info {
    background: rgba(99, 102, 241, 0.1);
    color: #a5b4fc;
  }
  .qm-status--success {
    background: rgba(34, 197, 94, 0.1);
    color: #86efac;
  }
  .qm-status--error {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
  }

  /* ---- Empty / Loading ---- */
  .qm-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary, #94a3b8);
  }
  .qm-empty-icon {
    font-size: 3rem;
  }
  .qm-empty h2 {
    font-size: 1.3rem;
    margin: 0;
    color: var(--text-primary, #e2e8f0);
  }
  .qm-empty p {
    margin: 0;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: var(--accent, #6366f1);
    border: none;
    color: #fff;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: opacity 0.15s;
  }
  .btn-primary:hover {
    opacity: 0.85;
  }

  .qm-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary, #94a3b8);
  }
  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-color, #2d3148);
    border-top-color: var(--accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ---- Info bar ---- */
  .qm-info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 1rem;
    background: var(--bg-secondary, #1a1d27);
    border-bottom: 1px solid var(--border-color, #2d3148);
    font-size: 0.78rem;
    color: var(--text-secondary, #94a3b8);
    flex-shrink: 0;
  }
  .qm-path {
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge-pending {
    display: inline-block;
    background: rgba(251, 191, 36, 0.15);
    color: #fcd34d;
    border-radius: 4px;
    padding: 0 0.4rem;
    margin-left: 0.5rem;
    font-size: 0.75rem;
  }

  /* ---- Search ---- */
  .qm-search-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary, #1a1d27);
    border-bottom: 1px solid var(--border-color, #2d3148);
    flex-shrink: 0;
  }
  .qm-search {
    flex: 1;
    background: var(--bg-tertiary, #252836);
    border: 1px solid var(--border-color, #2d3148);
    color: var(--text-primary, #e2e8f0);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;
  }
  .qm-search:focus {
    border-color: var(--accent, #6366f1);
  }

  .btn-clear-search {
    background: none;
    border: none;
    color: var(--text-secondary, #94a3b8);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }
  .btn-clear-search:hover {
    color: var(--text-primary, #e2e8f0);
  }

  .badge-warn {
    background: rgba(251, 191, 36, 0.12);
    color: #fcd34d;
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  /* ---- Table ---- */
  .qm-table-wrap {
    flex: 1;
    overflow: auto;
  }

  .qm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }

  .qm-table th {
    position: sticky;
    top: 0;
    background: var(--bg-secondary, #1a1d27);
    border-bottom: 2px solid var(--border-color, #2d3148);
    padding: 0.5rem 0.75rem;
    text-align: left;
    color: var(--text-secondary, #94a3b8);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    z-index: 1;
  }

  .qm-table td {
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid var(--border-color, #1e2235);
    vertical-align: top;
    max-width: 0;
  }

  .qm-table tr:hover td {
    background: var(--bg-hover, rgba(255, 255, 255, 0.02));
  }

  .qm-table tr.dirty td {
    background: rgba(251, 191, 36, 0.04);
  }

  /* Column widths */
  .col-idx {
    width: 60px;
    color: var(--text-muted, #4b5563);
    font-size: 0.75rem;
  }
  .col-context {
    width: 14%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-secondary, #94a3b8);
  }
  .col-source {
    width: 35%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .col-translation {
    width: auto;
  }
  .col-hash {
    width: 100px;
    color: var(--text-muted, #4b5563);
    font-size: 0.72rem;
  }

  /* Translation cell */
  .translation-cell {
    cursor: text;
    min-height: 1.4em;
    white-space: pre-wrap;
    word-break: break-word;
    border-radius: 3px;
    padding: 1px 2px;
    transition: background 0.1s;
  }
  .translation-cell:hover {
    background: rgba(99, 102, 241, 0.08);
    outline: 1px dashed var(--accent, #6366f1);
  }

  .empty-translation {
    color: var(--text-muted, #4b5563);
    font-style: italic;
    font-size: 0.78rem;
  }

  .edit-textarea {
    width: 100%;
    background: var(--bg-tertiary, #252836);
    border: 1px solid var(--accent, #6366f1);
    color: var(--text-primary, #e2e8f0);
    border-radius: 4px;
    padding: 0.25rem 0.4rem;
    font-size: 0.82rem;
    font-family: inherit;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
  }

  /* ---- Pagination ---- */
  .qm-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem;
    border-top: 1px solid var(--border-color, #2d3148);
    background: var(--bg-secondary, #1a1d27);
    flex-shrink: 0;
  }
  .btn-page {
    background: var(--bg-tertiary, #252836);
    border: 1px solid var(--border-color, #2d3148);
    color: var(--text-primary, #e2e8f0);
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.1s;
  }
  .btn-page:hover:not(:disabled) {
    border-color: var(--accent, #6366f1);
  }
  .btn-page:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .page-info {
    font-size: 0.82rem;
    color: var(--text-secondary, #94a3b8);
    min-width: 70px;
    text-align: center;
  }
</style>
