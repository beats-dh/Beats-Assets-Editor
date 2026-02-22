<script lang="ts">
  import { currentView } from '../stores/appState';
  import { currentStats } from '../stores/assetsStore';
  import { translate } from '../i18n';
  import { loadAssetsData as loadAssets } from '../services/assetService';
  import { clearPreviewSpriteCaches } from '../utils/spriteLoading';
  import { showStatus } from '../utils';
  import SettingsMenu from './SettingsMenu.svelte';
  
  // Import styles
  import '../styles/header.css';

  let isSettingsOpen = false;

  function toggleSettings(e: Event) {
    e.stopPropagation();
    isSettingsOpen = !isSettingsOpen;
  }

  function closeSettings() {
    isSettingsOpen = false;
  }

  function goHome() {
    // If we are in asset editor, go back to launcher?
    // Or does "Home" mean "Category Nav" (Objects, Outfits...)?
    // main.ts says: "Home button is handled in mainMenu.ts. It will open the launcher overlay"
    currentView.set('launcher');
  }

  async function refresh() {
    clearPreviewSpriteCaches();
    await loadAssets();
    showStatus(translate('status.assetsRefreshed'), 'success');
  }

  // Handle click outside to close settings
  function onWindowClick() {
    if (isSettingsOpen) closeSettings();
  }
</script>

<svelte:window on:click={onWindowClick} />

<header class="app-header">
  <div class="header-content">
    <div class="logo-section">
      <div class="app-logo">⚔️</div>
      <div class="app-title">
        <h1>{translate('app.title')}</h1>
        <p class="app-subtitle">{translate('app.subtitle')}</p>
      </div>
    </div>
    
    <div class="header-stats" id="header-stats">
      <!-- Original logic populated this via JS, we can implement it properly if needed, but CSS says display: none !important -->
    </div>

    <div class="header-actions">
      <button 
        class="icon-btn" 
        title={translate('header.settings.tooltip')} 
        on:click={toggleSettings}
      >⚙️</button>
      
      <SettingsMenu show={isSettingsOpen} closeMenu={closeSettings} />

      <button 
        class="icon-btn" 
        title={translate('header.home.tooltip')}
        on:click={goHome}
      >🏠</button>
      
      <button 
        class="icon-btn" 
        title={translate('header.refresh.tooltip')}
        on:click={refresh}
      >🔄</button>
    </div>
  </div>
</header>
