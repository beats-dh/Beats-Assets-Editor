<script lang="ts">
  import { appState } from "../../stores/appState.svelte";
  import { translate } from "../../i18n";
  import { loadAssetsData as loadAssets } from "../../services/assetService";
  import { clearPreviewSpriteCaches } from "../../utils/spriteLoading";
  import { showStatus } from "../../utils";
  import SettingsMenu from "./SettingsMenu.svelte";

  // Import styles
  import "../../styles/header.css";

  let isSettingsOpen = $state(false);

  function toggleSettings(e: Event) {
    e.stopPropagation();
    isSettingsOpen = !isSettingsOpen;
  }

  function closeSettings() {
    isSettingsOpen = false;
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

    <div class="header-stats" id="header-stats"></div>

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
    </div>
  </div>
</header>
