<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { appState, THEMES, LANGUAGES, type Theme, type Language } from "../stores/app.svelte";
  import { loadAppearancesForAssetsEditor } from "../api/appearanceLoader";

  // Theme labels
  const THEME_LABELS: Record<Theme, string> = {
    default: "Royal (default)",
    ocean: "Oceanic",
    aurora: "Aurora",
    ember: "Ember",
    forest: "Forest",
    dusk: "Dusk",
  };

  // Language labels
  const LANGUAGE_LABELS: Record<Language, string> = {
    default: "Auto (multilingual)",
    "pt-BR": "Português",
    en: "English",
    es: "Español",
    ru: "Русский",
  };

  // Local state
  let tibiaPath = $state(appState.tibiaPath);
  let isHidden = $state(false);

  // Derived state
  let hasValidPath = $derived(tibiaPath.trim().length > 0);
  let currentTheme = $derived(appState.theme);
  let currentLanguage = $derived(appState.language);

  // Browse for directory
  async function browseDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Tibia Client Directory",
      });
      if (selected && typeof selected === "string") {
        tibiaPath = selected;
        appState.setTibiaPath(selected);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  }

  // Handle path input
  function handlePathInput(event: Event) {
    const input = event.target as HTMLInputElement;
    tibiaPath = input.value;
    if (tibiaPath.trim()) {
      appState.setTibiaPath(tibiaPath);
    }
  }

  // Select theme
  function handleThemeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    appState.setTheme(select.value as Theme);
  }

  // Select language
  function handleLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    appState.setLanguage(select.value as Language);
  }

  // Refresh application
  function refreshApp() {
    window.location.reload();
  }

  // Launch Assets Editor
  async function launchAssetsEditor() {
    if (!hasValidPath) return;

    isHidden = true;
    appState.setLoading(true);
    appState.setLoadingProgress(10, "Loading appearances...");

    try {
      const stats = await loadAppearancesForAssetsEditor(tibiaPath);
      appState.setStats(stats);
      appState.setLoadingProgress(100, "Done!");
      appState.setLoaded(true);
      appState.setLoading(false);
    } catch (error) {
      console.error("Error loading assets:", error);
      isHidden = false;
      appState.setLoading(false);
    }
  }

  // Launch Monster Editor
  async function launchMonsterEditor() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Monster Scripts Folder",
      });
      if (selected && typeof selected === "string") {
        console.log("Monster path:", selected);
        alert("Monster Editor - Em desenvolvimento");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Launch NPC Editor
  function launchNpcEditor() {
    alert("NPC Editor - Em desenvolvimento");
  }

  // Launch Map Editor (disabled)
  function launchMapEditor() {
    alert("The Map editor is under construction and will be available soon.");
  }
</script>

<!-- App Launcher Overlay - Using original CSS classes -->
<div
  class="app-launcher-overlay"
  class:hidden={isHidden}
  role="dialog"
  aria-modal="true"
  aria-hidden={isHidden ? "true" : "false"}
>
  <div class="app-launcher-card">
    <div class="launcher-view">
      <!-- Hero Section -->
      <section class="launcher-hero">
        <h1 class="launcher-title">Tibia creation suite</h1>
        <p class="launcher-subtitle">
          Choose an editor to get started or adjust your preferences before diving in.
        </p>
      </section>

      <!-- Tibia Path Section -->
      <section class="launcher-tibia-path-section">
        <h3 class="launcher-section-title">Tibia Client Configuration</h3>
        <p class="launcher-secondary-text">
          Select your Tibia client directory to enable the editors below.
        </p>
        <div class="launcher-path-input-group">
          <div class="launcher-path-input-row">
            <input
              type="text"
              class="launcher-path-input"
              placeholder="C:\Path\To\Tibia"
              autocomplete="off"
              value={tibiaPath}
              oninput={handlePathInput}
            />
            <button type="button" class="btn-secondary" onclick={browseDirectory}>
              <span class="btn-icon">📁</span>
              <span>Browse</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Options Grid -->
      <div class="launcher-options-grid">
        <!-- Assets Editor -->
        <button
          type="button"
          class="launcher-option"
          class:disabled={!hasValidPath}
          disabled={!hasValidPath}
          title={!hasValidPath ? "Please select a Tibia client path first" : ""}
          onclick={launchAssetsEditor}
        >
          <div class="launcher-option-icon">🗂️</div>
          <h3>Assets editor</h3>
          <p>Browse, edit and export appearance assets with the modern workflow.</p>
          <span class="launcher-option-badge">Current</span>
        </button>

        <!-- Monster Editor -->
        <button type="button" class="launcher-option" onclick={launchMonsterEditor}>
          <div class="launcher-option-icon">👾</div>
          <h3>Monster editor</h3>
          <p>Select a monster scripts folder to load encounter data just like assets.</p>
        </button>

        <!-- NPC Editor -->
        <button type="button" class="launcher-option" onclick={launchNpcEditor}>
          <div class="launcher-option-icon">🧙</div>
          <h3>NPC editor</h3>
          <p>Choose an NPC scripts directory and prepare dialogue for editing.</p>
        </button>

        <!-- Map Editor (disabled) -->
        <button
          type="button"
          class="launcher-option disabled"
          disabled
          onclick={launchMapEditor}
        >
          <div class="launcher-option-icon">🗺️</div>
          <h3>Map editor</h3>
          <p>Plan zones and biomes with procedural tools (coming soon).</p>
          <span class="launcher-option-badge upcoming">Coming up</span>
        </button>
      </div>

      <!-- Configurations Section -->
      <section class="launcher-configurations">
        <!-- Theme -->
        <div class="config-group">
          <label>Interface colour</label>
          <select class="config-select" value={currentTheme} onchange={handleThemeChange}>
            {#each THEMES as theme}
              <option value={theme}>{THEME_LABELS[theme]}</option>
            {/each}
          </select>
        </div>

        <!-- Language -->
        <div class="config-group">
          <label>Language</label>
          <select class="config-select" value={currentLanguage} onchange={handleLanguageChange}>
            {#each LANGUAGES as lang}
              <option value={lang}>{LANGUAGE_LABELS[lang]}</option>
            {/each}
          </select>
        </div>

        <!-- Maintenance -->
        <div class="config-group">
          <label>Maintenance</label>
          <button type="button" class="refresh-button" onclick={refreshApp}>
            <span aria-hidden="true">🔄</span> Refresh application
          </button>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  .hidden {
    display: none !important;
  }
</style>
