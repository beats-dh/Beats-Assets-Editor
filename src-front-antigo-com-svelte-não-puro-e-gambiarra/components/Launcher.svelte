<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { currentView, tibiaPath, monsterPath, npcPath } from '../stores/appState';
  import { theme, language } from '../stores/settingsStore';
  import { invoke } from '../utils/invoke';
  import { COMMANDS } from '../commands';
  import { loadAppearancesForAssetsEditor } from '../appearanceLoader';
  import { loadSpecialMeaningIds } from '../specialMeaning';
  import { loadAssetsData } from '../services/assetService';
  import { showStatus } from '../utils';
  import { currentStats } from '../stores/assetsStore';
  import { join } from "@tauri-apps/api/path";
  import { 
    SUPPORTED_LANGUAGES, 
    LANGUAGE_LOCALES, 
    getLanguageOptionLabel,
    translate,
    applyDocumentTranslations 
  } from '../i18n';

  // Import styles
  import '../mainMenu.css';

  const SUPPORTED_THEMES = ['default', 'ocean', 'aurora', 'ember', 'forest', 'dusk'];
  const THEME_LABELS: Record<string, string> = {
    default: 'Royal (default)',
    ocean: 'Oceanic',
    aurora: 'Aurora',
    ember: 'Ember',
    forest: 'Forest',
    dusk: 'Dusk'
  };

  let isLaunching = false;
  let isLoadingMonster = false;
  let isLoadingNpc = false;

  // Browse for Tibia path
  async function browsePath() {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === 'string' && selection) {
        tibiaPath.set(selection);
      }
    } catch (error) {
      console.error('Failed to open directory chooser:', error);
    }
  }

  // Launch Assets Editor
  async function selectAssetsEditor() {
    if (!$tibiaPath) return;
    
    isLaunching = true;
    try {
      await invoke(COMMANDS.SET_TIBIA_BASE_PATH, { tibiaPath: $tibiaPath });
      
      const result = await loadAppearancesForAssetsEditor($tibiaPath);
      await loadSpecialMeaningIds();
      
      currentStats.set(result);
      currentView.set('assets-editor');
      
    } catch (error) {
      console.error('Error loading appearances:', error);
      const message = error instanceof Error ? error.message : String(error);
      showStatus(translate('status.loadError', { message }), "error");
    } finally {
      isLaunching = false;
    }
  }

  // Launch Monster Editor
  async function selectMonsterEditor(forceSelect = false) {
    isLoadingMonster = true;
    
    try {
      let path: string | null = null;
      
      // Try to use cached path if not forcing selection
      if (!forceSelect) {
        path = $monsterPath;
        
        // Try to get from backend if not in store
        if (!path) {
          try {
            path = await invoke<string | null>(COMMANDS.GET_MONSTER_BASE_PATH);
            if (path) {
              monsterPath.set(path);
            }
          } catch (error) {
            console.warn('Failed to read saved monster path:', error);
          }
        }
      }
      
      // Prompt for folder selection if no path
      if (!path) {
        const selection = await open({ directory: true, multiple: false });
        if (typeof selection !== 'string' || !selection) {
          return; // User cancelled
        }
        path = selection;
        
        // Persist the path
        try {
          await invoke(COMMANDS.SET_MONSTER_BASE_PATH, { monsterPath: path });
          monsterPath.set(path);
        } catch (error) {
          console.warn('Failed to persist monster path:', error);
        }
      }
      
      if (!path) return;
      
      currentView.set('monster-editor');
      
    } catch (error) {
      console.error('Failed to open monster editor:', error);
      
      // Retry with force select if initial attempt failed
      if (!forceSelect) {
        try {
          await selectMonsterEditor(true);
          return;
        } catch (innerError) {
          console.error('Failed to select monster folder after retry:', innerError);
        }
      }
      
      showStatus('Failed to select monster scripts folder', 'error');
    } finally {
      isLoadingMonster = false;
    }
  }

  // Launch NPC Editor
  async function selectNpcEditor(forceSelect = false) {
    isLoadingNpc = true;
    
    try {
      let path: string | null = null;
      
      // Try to use cached path if not forcing selection
      if (!forceSelect) {
        path = $npcPath;
      }
      
      // Prompt for folder selection if no path
      if (!path) {
        const selection = await open({ directory: true, multiple: false });
        if (typeof selection !== 'string' || !selection) {
          return; // User cancelled
        }
        path = selection;
        npcPath.set(path);
      }
      
      if (!path) return;
      
      currentView.set('npc-editor');
      
    } catch (error) {
      console.error('Failed to open NPC editor:', error);
      showStatus('Failed to select NPC scripts folder', 'error');
    } finally {
      isLoadingNpc = false;
    }
  }

  // Handle click with modifier keys for force selection
  function handleMonsterClick(e: MouseEvent) {
    const forceSelect = e.shiftKey || e.altKey;
    selectMonsterEditor(forceSelect);
  }

  function handleNpcClick(e: MouseEvent) {
    const forceSelect = e.shiftKey || e.altKey;
    selectNpcEditor(forceSelect);
  }

  function reloadApp() {
    window.location.reload();
  }
</script>

<div id="app-launcher" class="app-launcher-overlay" role="dialog" aria-modal="true">
  <div class="app-launcher-card">
    <div class="launcher-view">
      
      <!-- Hero -->
      <section class="launcher-hero">
        <h1 class="launcher-title">Tibia creation suite</h1>
        <p class="launcher-subtitle">Choose an editor to get started or adjust your preferences before diving in.</p>
      </section>

      <!-- Tibia Path -->
      <section class="launcher-tibia-path-section">
        <h3 class="launcher-section-title">Tibia Client Configuration</h3>
        <p class="launcher-secondary-text">Select your Tibia client directory to enable the editors below.</p>
        <div class="launcher-path-input-group">
          <label class="launcher-path-label" for="tibia-path-input">Client Path</label>
          <div class="launcher-path-input-row">
            <input 
              id="tibia-path-input"
              type="text" 
              class="launcher-path-input" 
              placeholder="C:\Path\To\Tibia" 
              autocomplete="off"
              bind:value={$tibiaPath}
            />
            <button type="button" class="btn-secondary" on:click={browsePath}>
              <span class="btn-icon">📁</span><span>Browse</span>
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
          class:disabled={!$tibiaPath || isLaunching} 
          disabled={!$tibiaPath || isLaunching}
          on:click={selectAssetsEditor}
          title={!$tibiaPath ? 'Please select a Tibia client path first' : ''}
        >
          <div class="launcher-option-icon">🗂️</div>
          <h3>Assets editor</h3>
          <p>Browse, edit and export appearance assets with the modern workflow.</p>
          <span class="launcher-option-badge">
            {isLaunching ? 'Loading...' : 'Current'}
          </span>
        </button>

        <!-- Monster Editor -->
        <button 
          type="button" 
          class="launcher-option"
          class:disabled={isLoadingMonster}
          disabled={isLoadingMonster}
          on:click={handleMonsterClick}
          title="Hold Shift or Alt to select a new folder"
        >
          <div class="launcher-option-icon">👾</div>
          <h3>Monster editor</h3>
          <p>Select a monster scripts folder to load encounter data just like assets.</p>
          {#if $monsterPath}
            <span class="launcher-option-badge active">Ready</span>
          {:else if isLoadingMonster}
            <span class="launcher-option-badge">Loading...</span>
          {/if}
        </button>

        <!-- NPC Editor -->
        <button 
          type="button" 
          class="launcher-option"
          class:disabled={isLoadingNpc}
          disabled={isLoadingNpc}
          on:click={handleNpcClick}
          title="Hold Shift or Alt to select a new folder"
        >
          <div class="launcher-option-icon">🧙</div>
          <h3>NPC editor</h3>
          <p>Choose an NPC scripts directory and prepare dialogue for editing.</p>
          {#if $npcPath}
            <span class="launcher-option-badge active">Ready</span>
          {:else if isLoadingNpc}
            <span class="launcher-option-badge">Loading...</span>
          {/if}
        </button>

        <!-- Map Editor -->
        <button type="button" class="launcher-option disabled" disabled>
          <div class="launcher-option-icon">🗺️</div>
          <h3>Map editor</h3>
          <p>Plan zones and biomes with procedural tools (coming soon).</p>
          <span class="launcher-option-badge upcoming">Coming up</span>
        </button>
      </div>

      <!-- Configurations -->
      <section class="launcher-configurations">
        
        <!-- Theme -->
        <div class="config-group">
          <label for="theme-select">Interface colour</label>
          <select id="theme-select" class="config-select" bind:value={$theme}>
            {#each SUPPORTED_THEMES as t}
              <option value={t}>{THEME_LABELS[t]}</option>
            {/each}
          </select>
        </div>

        <!-- Language -->
        <div class="config-group">
          <label for="lang-select">Language</label>
          <select id="lang-select" class="config-select" bind:value={$language}>
            {#each SUPPORTED_LANGUAGES as l}
              <option value={l}>{l === 'default' ? 'Auto (multilingual)' : l}</option>
            {/each}
          </select>
        </div>

        <!-- Refresh -->
        <div class="config-group">
          <label for="refresh-btn">Maintenance</label>
          <button id="refresh-btn" type="button" class="refresh-button" on:click={reloadApp}>
            <span aria-hidden="true">🔄</span> Refresh application
          </button>
        </div>

      </section>

    </div>
  </div>
</div>

<style>
  /* Badge active state */
  :global(.launcher-option-badge.active) {
    background: var(--success-color, #10b981);
  }
</style>