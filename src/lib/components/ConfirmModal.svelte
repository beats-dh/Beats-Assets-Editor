<script lang="ts">
  import { translate } from "../../i18n";
  import { confirmState, closeConfirm } from "../../stores/confirmState.svelte";

  function handleConfirm() {
    closeConfirm(true);
  }

  function handleCancel() {
    closeConfirm(false);
  }
</script>

{#if confirmState.options}
  <div
    id="confirm-modal"
    class="confirm-overlay"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="confirm-backdrop"
      role="button"
      tabindex="0"
      onclick={handleCancel}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCancel();
        }
      }}
      aria-label="Close confirm"
    ></div>
    <div class="confirm-dialog" role="document">
      <div class="confirm-header">
        <h2>{confirmState.options.title}</h2>
        <button
          class="confirm-close"
          onclick={handleCancel}
          aria-label={translate("modal.aria.close")}>✕</button
        >
      </div>
      <div class="confirm-body">
        {@html confirmState.options.message}
      </div>
      <div class="confirm-actions">
        <button class="confirm-btn danger" onclick={handleConfirm}>
          {confirmState.options.confirmLabel || translate("modal.btn.confirm")}
        </button>
        <button class="confirm-btn secondary" onclick={handleCancel}>
          {confirmState.options.cancelLabel || translate("modal.btn.cancel")}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .confirm-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
  }

  .confirm-dialog {
    position: relative;
    z-index: 2001;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 400px;
    max-width: 500px;
    box-shadow:
      var(--shadow-xl),
      0 0 0 1px rgba(79, 70, 229, 0.1);
    animation: confirmSlideIn var(--transition-fast);
  }

  @keyframes confirmSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .confirm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .confirm-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .confirm-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .confirm-close:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }

  .confirm-body {
    padding: var(--space-lg);
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* Styles for HTML content inside the body */
  .confirm-body :global(p) {
    margin: 0 0 12px 0;
  }
  .confirm-body :global(p:last-child) {
    margin-bottom: 0;
  }
  .confirm-body :global(.confirm-filename) {
    display: inline;
    color: var(--text-primary);
    font-weight: 600;
  }
  .confirm-body :global(.confirm-detail) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin: 12px 0;
    background: var(--primary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    word-break: break-all;
  }
  .confirm-body :global(.confirm-detail .detail-label) {
    color: var(--text-disabled);
    font-family: var(--font-family);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }
  .confirm-body :global(.confirm-detail .detail-value) {
    color: var(--text-secondary);
  }
  .confirm-body :global(.confirm-warning) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-top: 12px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    color: var(--error-color);
    font-size: 12px;
    font-weight: 500;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg) var(--space-md);
  }

  .confirm-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .confirm-btn.danger {
    background: var(--error-color);
    border: 1px solid var(--error-color);
    color: white;
  }
  .confirm-btn.danger:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
  }

  .confirm-btn.secondary {
    background: var(--surface-bg);
    border: 1px solid var(--border-hover);
    color: var(--text-primary);
  }
  .confirm-btn.secondary:hover {
    background: var(--elevated-bg);
    border-color: var(--text-muted);
  }
</style>
