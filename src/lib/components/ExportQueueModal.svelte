<script lang="ts">
  import { translate } from "../../i18n";
  import {
    exportQueueState,
    closeExportQueue,
    removeFromExportQueue,
    clearExportQueue,
  } from "../../stores/exportQueueState.svelte";
  import { exportQueueToFolder } from "../../services/importExportService";
  import ModalShell from "./ModalShell.svelte";

  let format = $state<"aec" | "json">("aec");
  let isExporting = $state(false);

  async function exportAll() {
    if (exportQueueState.items.length === 0 || isExporting) return;
    isExporting = true;
    try {
      const allOk = await exportQueueToFolder(
        exportQueueState.items.map((i) => ({ ...i })),
        format,
      );
      if (allOk) {
        clearExportQueue();
        closeExportQueue();
      }
    } finally {
      isExporting = false;
    }
  }
</script>

<ModalShell
  show={exportQueueState.isOpen}
  title={translate("export.queue.title", {
    count: String(exportQueueState.items.length),
  })}
  onClose={closeExportQueue}
  maxWidth="520px"
>
  {#if exportQueueState.items.length === 0}
    <p class="eq-empty">{translate("export.queue.empty")}</p>
  {:else}
    <ul class="eq-list">
      {#each exportQueueState.items as item (item.category + ":" + item.id)}
        <li class="eq-item">
          <span class="eq-item-label">{item.category} #{item.id}</span>
          <button
            type="button"
            class="eq-item-remove"
            title={translate("export.queue.remove")}
            onclick={() => removeFromExportQueue(item.category, item.id)}
            >✕</button
          >
        </li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <div class="eq-footer-row">
      <div class="eq-format">
        <label
          ><input type="radio" bind:group={format} value="aec" /> AEC</label
        >
        <label
          ><input type="radio" bind:group={format} value="json" /> JSON</label
        >
      </div>
      <div class="eq-actions">
        <button
          class="btn-secondary"
          onclick={clearExportQueue}
          disabled={exportQueueState.items.length === 0 || isExporting}
          >{translate("export.queue.clear")}</button
        >
        <button
          class="btn-primary"
          onclick={exportAll}
          disabled={exportQueueState.items.length === 0 || isExporting}
          >{translate("export.queue.exportAll")}</button
        >
      </div>
    </div>
  {/snippet}
</ModalShell>

<style>
  .eq-empty {
    color: var(--text-muted);
    font-size: 13px;
  }
  .eq-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .eq-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: var(--primary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--text-secondary);
  }
  .eq-item-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .eq-item-remove:hover {
    color: var(--error-color);
  }
  .eq-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
  }
  .eq-format {
    display: flex;
    gap: 12px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .eq-actions {
    display: flex;
    gap: var(--space-sm);
  }
</style>
