<script lang="ts">
  import { appState, THEMES, type Theme, type Language } from "../stores/app.svelte";

  // Props
  interface Props {
    onclose?: () => void;
  }

  let { onclose }: Props = $props();

  // Derived state
  let currentTheme = $derived(appState.theme);
  let currentLanguage = $derived(appState.language);

  // Theme colors for preview
  const THEME_COLORS: Record<Theme, string[]> = {
    default: ["#4f46e5", "#7c3aed", "#10b981"],
    ocean: ["#0ea5e9", "#22d3ee", "#1abc9c"],
    aurora: ["#8b5cf6", "#ec4899", "#2c2555"],
    ember: ["#f97316", "#f43f5e", "#3a2218"],
    forest: ["#22c55e", "#14b8a6", "#1d3f27"],
    dusk: ["#6366f1", "#8b5cf6", "#1e1b4b"],
  };

  // Theme labels
  const THEME_LABELS: Record<Theme, string> = {
    default: "Padrão",
    ocean: "Oceanic",
    aurora: "Aurora",
    ember: "Ember",
    forest: "Floresta",
    dusk: "Dusk",
  };

  function selectTheme(theme: Theme) {
    appState.setTheme(theme);
  }

  function handleLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    appState.setLanguage(select.value as Language);
  }

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
  }
</script>

<!-- Settings Menu - Using original CSS classes -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="settings-menu show" onclick={handleClick}>
  <!-- Language Section -->
  <div class="settings-section">
    <div class="settings-section-header">
      <h4 class="settings-title">Linguagem</h4>
      <p class="settings-description">Selecione o idioma da interface.</p>
    </div>
    <select
      id="language-select"
      class="settings-select"
      value={currentLanguage}
      onchange={handleLanguageChange}
    >
      <option value="default">Default (multilíngue)</option>
      <option value="pt-BR">Português</option>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="ru">Русский</option>
    </select>
  </div>

  <div class="menu-divider"></div>

  <!-- Theme Section -->
  <div class="settings-section">
    <div class="settings-section-header">
      <h4 class="settings-title">Cores</h4>
      <p class="settings-description">Escolha um tema que combine com você.</p>
    </div>
    <div class="theme-grid" role="list">
      {#each THEMES as theme}
        <button
          class="theme-option"
          class:active={currentTheme === theme}
          type="button"
          data-theme={theme}
          onclick={() => selectTheme(theme)}
        >
          <span class="theme-name">{THEME_LABELS[theme]}</span>
          <span class="theme-preview">
            {#each THEME_COLORS[theme] as color}
              <span class="color-swatch" style="background: {color};"></span>
            {/each}
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>
