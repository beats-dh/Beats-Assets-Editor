<script lang="ts">
  import type { Snippet } from "svelte";
  import { translate } from "../../i18n";

  interface Props {
    show: boolean;
    title: string;
    onClose: () => void;
    maxWidth?: string;
    children: Snippet;
    footer?: Snippet;
  }
  let {
    show,
    title,
    onClose,
    maxWidth = "460px",
    children,
    footer,
  }: Props = $props();
</script>

{#if show}
  <div class="ms-overlay" role="dialog" aria-modal="true">
    <div
      class="ms-backdrop"
      role="button"
      tabindex="0"
      onclick={onClose}
      onkeydown={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      }}
      aria-label={translate("modal.aria.close")}
    ></div>
    <div class="ms-dialog" role="document" style="max-width: {maxWidth};">
      <div class="ms-header">
        <h2>{title}</h2>
        <button
          class="ms-close"
          onclick={onClose}
          aria-label={translate("modal.aria.close")}>✕</button
        >
      </div>
      <div class="ms-body">{@render children()}</div>
      {#if footer}<div class="ms-footer">{@render footer()}</div>{/if}
    </div>
  </div>
{/if}

<style>
  .ms-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ms-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    animation: msFade var(--transition-fast);
  }
  .ms-dialog {
    position: relative;
    z-index: 2001;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 360px;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    animation: msSlide var(--transition-fast);
  }
  .ms-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .ms-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .ms-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .ms-close:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }
  .ms-body {
    padding: var(--space-lg);
    overflow-y: auto;
  }
  .ms-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg) var(--space-md);
    border-top: 1px solid var(--border-color);
  }
  @keyframes msFade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes msSlide {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
