<script lang="ts">
  import { translate } from "../../i18n";
  import {
    exportQueueState,
    closeExportQueue,
    removeFromExportQueue,
    clearExportQueue,
  } from "../../stores/exportQueueState.svelte";
  import { exportQueueToFolder } from "../../services/importExportService";

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

{#if exportQueueState.isOpen}
  <div class="eq-overlay" role="dialog" aria-modal="true">
    <div
      class="eq-backdrop"
      role="button"
      tabindex="0"
      onclick={closeExportQueue}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          closeExportQueue();
        }
      }}
      aria-label={translate("export.queue.close")}
    ></div>
    <div class="eq-dialog" role="document">
      <div class="eq-header">
        <h2>
          {translate("export.queue.title", {
            count: String(exportQueueState.items.length),
          })}
        </h2>
        <button
          class="eq-close"
          onclick={closeExportQueue}
          aria-label={translate("export.queue.close")}>✕</button
        >
      </div>

      <div class="eq-body">
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
      </div>

      <div class="eq-footer">
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
            class="eq-btn"
            onclick={clearExportQueue}
            disabled={exportQueueState.items.length === 0 || isExporting}
            >{translate("export.queue.clear")}</button
          >
          <button
            class="eq-btn primary"
            onclick={exportAll}
            disabled={exportQueueState.items.length === 0 || isExporting}
            >{translate("export.queue.exportAll")}</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .eq-overlay {
    position: fixed;
    inset: 0;
    z-index: 2100;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .eq-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
  .eq-dialog {
    position: relative;
    z-index: 2101;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 380px;
    max-width: 520px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
  }
  .eq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .eq-header h2 {
    margin: 0;
    font-size: 15px;
    color: var(--text-primary);
  }
  .eq-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 16px;
    cursor: pointer;
  }
  .eq-close:hover {
    color: var(--text-primary);
  }
  .eq-body {
    padding: var(--space-md) var(--space-lg);
    overflow-y: auto;
  }
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
  .eq-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-sm) var(--space-lg) var(--space-md);
    border-top: 1px solid var(--border-color);
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
  .eq-btn {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    cursor: pointer;
    background: var(--surface-bg);
    border: 1px solid var(--border-hover);
    color: var(--text-primary);
  }
  .eq-btn:hover:not(:disabled) {
    background: var(--elevated-bg);
  }
  .eq-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .eq-btn.primary {
    background: var(--accent-color, #4f46e5);
    border-color: var(--accent-color, #4f46e5);
    color: #fff;
  }
</style>
