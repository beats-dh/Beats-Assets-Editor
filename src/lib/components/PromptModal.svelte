<script lang="ts">
  import { translate } from "../../i18n";
  import { promptState, closePrompt } from "../../stores/promptState.svelte";

  let value = $state("");
  let inputEl = $state<HTMLInputElement | undefined>();

  // Reset the field and focus it whenever a new prompt opens.
  $effect(() => {
    if (promptState.options) {
      value = promptState.options.defaultValue ?? "";
      requestAnimationFrame(() => inputEl?.focus());
    }
  });

  function submit() {
    closePrompt(value);
  }
  function cancel() {
    closePrompt(null);
  }
</script>

{#if promptState.options}
  <div class="prompt-overlay" role="dialog" aria-modal="true">
    <div
      class="prompt-backdrop"
      role="button"
      tabindex="0"
      onclick={cancel}
      onkeydown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      aria-label={promptState.options.cancelLabel ?? translate("modal.btn.cancel")}
    ></div>
    <div class="prompt-dialog" role="document">
      <div class="prompt-header">
        <h2>{promptState.options.title}</h2>
        <button
          class="prompt-close"
          onclick={cancel}
          aria-label={translate("modal.aria.close")}>✕</button
        >
      </div>
      <div class="prompt-body">
        {#if promptState.options.message}
          <p class="prompt-message">{promptState.options.message}</p>
        {/if}
        <input
          bind:this={inputEl}
          class="prompt-input"
          type="text"
          bind:value
          placeholder={promptState.options.placeholder ?? ""}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      </div>
      <div class="prompt-actions">
        <button class="prompt-btn primary" onclick={submit}>
          {promptState.options.confirmLabel ?? translate("modal.btn.confirm")}
        </button>
        <button class="prompt-btn secondary" onclick={cancel}>
          {promptState.options.cancelLabel ?? translate("modal.btn.cancel")}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .prompt-overlay {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .prompt-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
  .prompt-dialog {
    position: relative;
    z-index: 2201;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 360px;
    max-width: 460px;
    box-shadow: var(--shadow-xl);
  }
  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .prompt-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .prompt-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
  }
  .prompt-close:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }
  .prompt-body {
    padding: var(--space-lg);
  }
  .prompt-message {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .prompt-input {
    width: 100%;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: var(--primary-bg);
    color: var(--text-primary);
    font-size: 14px;
  }
  .prompt-input:focus {
    outline: none;
    border-color: var(--primary-accent);
  }
  .prompt-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg) var(--space-md);
  }
  .prompt-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .prompt-btn.primary {
    background: var(--primary-accent);
    border: 1px solid var(--primary-accent);
    color: #fff;
  }
  .prompt-btn.primary:hover {
    filter: brightness(1.1);
  }
  .prompt-btn.secondary {
    background: var(--surface-bg);
    border: 1px solid var(--border-hover);
    color: var(--text-primary);
  }
  .prompt-btn.secondary:hover {
    background: var(--elevated-bg);
    border-color: var(--text-muted);
  }
</style>
