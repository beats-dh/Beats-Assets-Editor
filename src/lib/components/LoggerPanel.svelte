<script lang="ts">
  import { translate } from "../../i18n";
  import {
    loggerState,
    clearLogs,
    closeLogger,
    type LogLevel,
  } from "../../stores/loggerState.svelte";

  let filter = $state<LogLevel | "all">("all");

  let shown = $derived(
    filter === "all"
      ? loggerState.entries
      : loggerState.entries.filter((e) => e.level === filter),
  );

  const levelIcon: Record<LogLevel, string> = {
    info: "ℹ️",
    success: "✅",
    warn: "⚠️",
    error: "⛔",
  };
</script>

{#if loggerState.isOpen}
  <aside class="logger-panel" aria-label={translate("logger.title")}>
    <div class="logger-header">
      <h3>{translate("logger.title")}</h3>
      <div class="logger-header-actions">
        <select bind:value={filter} class="logger-filter">
          <option value="all">{translate("logger.filter.all")}</option>
          <option value="info">{translate("logger.filter.info")}</option>
          <option value="success">{translate("logger.filter.success")}</option>
          <option value="warn">{translate("logger.filter.warn")}</option>
          <option value="error">{translate("logger.filter.error")}</option>
        </select>
        <button
          class="logger-btn"
          onclick={clearLogs}
          title={translate("logger.clear")}>🗑️</button
        >
        <button
          class="logger-btn"
          onclick={closeLogger}
          aria-label={translate("logger.close")}>✕</button
        >
      </div>
    </div>
    <div class="logger-body">
      {#if shown.length === 0}
        <p class="logger-empty">{translate("logger.empty")}</p>
      {:else}
        {#each shown as entry (entry.id)}
          <div class="logger-entry logger-{entry.level}">
            <span class="logger-time">{entry.time}</span>
            <span class="logger-level">{levelIcon[entry.level]}</span>
            <span class="logger-message">{entry.message}</span>
          </div>
        {/each}
      {/if}
    </div>
    <div class="logger-footer">
      {translate("logger.count", { count: String(loggerState.entries.length) })}
    </div>
  </aside>
{/if}

<style>
  .logger-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 420px;
    max-width: 90vw;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    background: var(--secondary-bg);
    border-left: 1px solid var(--border-color);
    box-shadow: var(--shadow-xl);
  }
  .logger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
  }
  .logger-header h3 {
    margin: 0;
    font-size: 14px;
    color: var(--text-primary);
  }
  .logger-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .logger-filter {
    font-size: 12px;
    background: var(--primary-bg);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 2px 4px;
  }
  .logger-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-muted);
    padding: 2px 4px;
  }
  .logger-btn:hover {
    color: var(--text-primary);
  }
  .logger-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .logger-empty {
    color: var(--text-muted);
  }
  .logger-entry {
    display: flex;
    gap: 8px;
    padding: 3px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    align-items: baseline;
  }
  .logger-time {
    color: var(--text-disabled);
    flex-shrink: 0;
  }
  .logger-level {
    flex-shrink: 0;
  }
  .logger-message {
    color: var(--text-secondary);
    word-break: break-word;
  }
  .logger-error .logger-message {
    color: var(--error-color);
  }
  .logger-footer {
    padding: 6px 14px;
    border-top: 1px solid var(--border-color);
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
