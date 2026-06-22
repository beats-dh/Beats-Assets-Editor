<script lang="ts">
  import { onMount } from "svelte";
  import { translate } from "../../i18n";
  import { getName, getVersion } from "@tauri-apps/api/app";

  interface Props {
    show: boolean;
    closeDialog: () => void;
  }
  let { show, closeDialog }: Props = $props();

  let appName = $state("Canary Studio");
  let appVersion = $state("");

  onMount(async () => {
    try {
      appName = await getName();
      appVersion = await getVersion();
    } catch (_) {
      // Running outside the Tauri runtime (e.g. plain `vite dev`).
    }
  });
</script>

{#if show}
  <div class="about-overlay" role="dialog" aria-modal="true">
    <div
      class="about-backdrop"
      role="button"
      tabindex="0"
      onclick={closeDialog}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          closeDialog();
        }
      }}
      aria-label={translate("about.close")}
    ></div>
    <div class="about-dialog" role="document">
      <div class="about-header">
        <h2>{translate("about.title")}</h2>
        <button
          class="about-close"
          onclick={closeDialog}
          aria-label={translate("modal.aria.close")}>✕</button
        >
      </div>
      <div class="about-body">
        <div class="about-logo">⚔️</div>
        <h3 class="about-name">{appName}</h3>
        <p class="about-version">{translate("about.version")} {appVersion}</p>
        <p class="about-description">{translate("about.description")}</p>
      </div>
      <div class="about-actions">
        <button class="about-btn" onclick={closeDialog}
          >{translate("about.close")}</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .about-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .about-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
  .about-dialog {
    position: relative;
    z-index: 2001;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 360px;
    max-width: 460px;
    box-shadow: var(--shadow-xl);
  }
  .about-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    background: var(--tertiary-bg);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .about-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .about-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-sm);
  }
  .about-close:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }
  .about-body {
    padding: var(--space-lg);
    text-align: center;
    color: var(--text-secondary);
  }
  .about-logo {
    font-size: 48px;
    line-height: 1;
    margin-bottom: var(--space-sm);
  }
  .about-name {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .about-version {
    margin: 4px 0 12px;
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .about-description {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .about-actions {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-sm) var(--space-lg) var(--space-md);
  }
  .about-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    background: var(--surface-bg);
    border: 1px solid var(--border-hover);
    color: var(--text-primary);
  }
  .about-btn:hover {
    background: var(--elevated-bg);
    border-color: var(--text-muted);
  }
</style>
