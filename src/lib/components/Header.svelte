<script lang="ts">
  import { appState } from "../../stores/appState.svelte";
  import { assetsState } from "../../stores/assetsState.svelte";
  import { translate } from "../../i18n";
  import { loadAssetsData as loadAssets } from "../../services/assetService";
  import { clearPreviewSpriteCaches } from "../../utils/spriteLoading";
  import { showStatus } from "../../utils";
  import SettingsMenu from "./SettingsMenu.svelte";
  import AboutDialog from "./AboutDialog.svelte";
  import ExportQueueModal from "./ExportQueueModal.svelte";
  import {
    exportQueueState,
    openExportQueue,
  } from "../../stores/exportQueueState.svelte";
  import { toggleLogger } from "../../stores/loggerState.svelte";

  // Import styles
  import "../../styles/header.css";

  let isSettingsOpen = $state(false);
  let isAboutOpen = $state(false);

  function toggleSettings(e: Event) {
    e.stopPropagation();
    isSettingsOpen = !isSettingsOpen;
  }

  function closeSettings() {
    isSettingsOpen = false;
  }

  function toggleAbout(e: Event) {
    e.stopPropagation();
    isAboutOpen = !isAboutOpen;
  }

  function closeAbout() {
    isAboutOpen = false;
  }

  function goHome() {
    appState.currentView = "launcher";
  }

  async function refresh() {
    clearPreviewSpriteCaches();
    await loadAssets();
    showStatus(translate("status.assetsRefreshed"), "success");
  }

  function onWindowClick() {
    if (isSettingsOpen) closeSettings();
  }
</script>

<svelte:window onclick={onWindowClick} />

<header class="app-header">
  <div class="header-content">
    <div class="logo-section">
      <div class="app-logo">⚔️</div>
      <div class="app-title">
        <h1>{translate("app.title")}</h1>
        <p class="app-subtitle">{translate("app.subtitle")}</p>
      </div>
    </div>

    <div class="header-stats" id="header-stats">
      {#if assetsState.currentStats?.content_hash}
        <span
          class="catalog-version"
          title={translate("header.catalogVersion.tooltip")}
        >
          {translate("header.catalogVersion.label", {
            hash: assetsState.currentStats.content_hash.slice(0, 8),
          })}
        </span>
      {/if}
    </div>

    <div class="header-actions">
      <button
        class="icon-btn"
        title={translate("header.settings.tooltip")}
        onclick={toggleSettings}>⚙️</button
      >

      <SettingsMenu show={isSettingsOpen} closeMenu={closeSettings} />

      <button
        class="icon-btn"
        title={translate("header.home.tooltip")}
        onclick={goHome}>🏠</button
      >

      <button
        class="icon-btn"
        title={translate("header.refresh.tooltip")}
        onclick={refresh}>🔄</button
      >

      {#if exportQueueState.items.length > 0}
        <button
          class="icon-btn export-queue-btn"
          title={translate("export.queue.openTooltip")}
          onclick={openExportQueue}
        >
          📤<span class="export-queue-badge"
            >{exportQueueState.items.length}</span
          >
        </button>
      {/if}

      <button
        class="icon-btn"
        title={translate("header.logger.tooltip")}
        onclick={toggleLogger}>📜</button
      >

      <button
        class="icon-btn"
        title={translate("header.about.tooltip")}
        onclick={toggleAbout}>ℹ️</button
      >
    </div>
  </div>
</header>

<AboutDialog show={isAboutOpen} closeDialog={closeAbout} />
<ExportQueueModal />

<style>
  .export-queue-btn {
    position: relative;
  }
  .export-queue-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--primary-accent);
    color: #fff;
    font-size: 10px;
    line-height: 16px;
    text-align: center;
  }
  .catalog-version {
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    padding: 2px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }
</style>
