<script lang="ts">
  import { theme, language } from '../stores/settingsStore';
  import { debugCache } from '../spriteCache';
  import { showStatus } from '../utils';
  import { translate, getThemeLabel, getLanguageOptionLabel, SUPPORTED_LANGUAGES } from '../i18n';
  import { clearPreviewSpriteCaches, clearAssetsQueryCaches, loadAssets } from '../assetUI'; // Refactor pending

  const SUPPORTED_THEMES = ['default', 'ocean', 'aurora', 'ember', 'forest', 'dusk'];

  export let show = false;
  export let closeMenu: () => void;

  function setTheme(newTheme: string) {
    theme.set(newTheme);
    showStatus(translate('status.themeApplied', { theme: getThemeLabel(newTheme) }), 'success');
  }

  function setLanguage(newLang: string) {
    language.set(newLang);
    showStatus(translate('status.languageUpdated', { language: getLanguageOptionLabel(newLang) }), 'success');
  }

  async function clearCache() {
    await debugCache.clearAllCaches();
    clearPreviewSpriteCaches();
    clearAssetsQueryCaches();
    showStatus(translate('status.cacheCleared'), 'success');
    closeMenu();
  }

  // Auto animate toggle logic
  let autoAnimate = localStorage.getItem('autoAnimateGridEnabled') === 'true';
  function toggleAutoAnimate() {
    autoAnimate = !autoAnimate;
    localStorage.setItem('autoAnimateGridEnabled', String(autoAnimate));
    window.location.reload(); // Reload to apply
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
  class="settings-menu" 
  class:show={show}
  on:click={stopPropagation}
>
  <div class="settings-section">
    <div class="settings-section-header">
      <h4 class="settings-title">{translate('settings.language.title')}</h4>
      <p class="settings-description">{translate('settings.language.description')}</p>
    </div>
    <select class="settings-select" value={$language} on:change={(e) => setLanguage(e.currentTarget.value)}>
      {#each SUPPORTED_LANGUAGES as lang}
        <option value={lang}>{lang === 'default' ? translate('language.option.default') : getLanguageOptionLabel(lang)}</option>
      {/each}
    </select>
  </div>

  <div class="menu-divider"></div>

  <div class="settings-section">
    <div class="settings-section-header">
      <h4 class="settings-title">{translate('settings.theme.title')}</h4>
      <p class="settings-description">{translate('settings.theme.description')}</p>
    </div>
    <div class="theme-grid" role="list">
      {#each SUPPORTED_THEMES as t}
        <button 
          class="theme-option" 
          type="button" 
          class:active={$theme === t}
          data-theme={t} 
          role="listitem"
          on:click={() => setTheme(t)}
        >
          <span class="theme-name">{translate(`theme.${t}`)}</span>
          <span class="theme-preview">
            <!-- Colors are handled by CSS based on theme, but here we might need inline styles if they are dynamic -->
            <!-- The original code had hardcoded styles in HTML, let's copy them if possible or rely on CSS -->
            {#if t === 'default'}
              <span class="color-swatch" style="background: #4f46e5;"></span>
              <span class="color-swatch" style="background: #7c3aed;"></span>
              <span class="color-swatch" style="background: #10b981;"></span>
            {:else if t === 'ocean'}
              <span class="color-swatch" style="background: #0ea5e9;"></span>
              <span class="color-swatch" style="background: #22d3ee;"></span>
              <span class="color-swatch" style="background: #1abc9c;"></span>
            {:else if t === 'aurora'}
              <span class="color-swatch" style="background: #8b5cf6;"></span>
              <span class="color-swatch" style="background: #ec4899;"></span>
              <span class="color-swatch" style="background: #2c2555;"></span>
            {:else if t === 'ember'}
              <span class="color-swatch" style="background: #f97316;"></span>
              <span class="color-swatch" style="background: #f43f5e;"></span>
              <span class="color-swatch" style="background: #3a2218;"></span>
            {:else if t === 'forest'}
              <span class="color-swatch" style="background: #22c55e;"></span>
              <span class="color-swatch" style="background: #14b8a6;"></span>
              <span class="color-swatch" style="background: #1d3f27;"></span>
            {:else if t === 'dusk'}
              <span class="color-swatch" style="background: #f59e0b;"></span>
              <span class="color-swatch" style="background: #38bdf8;"></span>
              <span class="color-swatch" style="background: #2b3045;"></span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <div class="menu-divider"></div>

  <div class="settings-section">
    <h4 class="settings-title">{translate('settings.preferences.title')}</h4>
    <div class="settings-item">
      <label>
        <input type="checkbox" checked={autoAnimate} on:change={toggleAutoAnimate} />
        <span>{translate('settings.preferences.autoAnimate')}</span>
      </label>
    </div>
    <button class="menu-btn" on:click={clearCache}>{translate('settings.preferences.clearCache')}</button>
  </div>
</div>
