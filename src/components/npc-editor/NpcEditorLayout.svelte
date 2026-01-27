<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { currentView } from '../../stores/appState';
  import { translate } from '../../i18n';
  import Header from '../Header.svelte';

  let folderPath = '';
  let isLoading = false;
  let status = '';
  let showResults = false;
  
  const STORAGE_KEY = 'npc-editor-scripts-path';

  onMount(() => {
    folderPath = localStorage.getItem(STORAGE_KEY) || '';
  });

  function goBack() {
    currentView.set('launcher');
  }

  async function browseFolder() {
    try {
      const selection = await open({
        directory: true,
        multiple: false,
      });
      if (typeof selection === 'string' && selection) {
        folderPath = selection;
        localStorage.setItem(STORAGE_KEY, selection);
        status = '';
        showResults = false;
      }
    } catch (error) {
      console.error('Failed to open directory chooser:', error);
    }
  }

  function handleInput() {
    if (folderPath.trim()) {
      localStorage.setItem(STORAGE_KEY, folderPath.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function loadScripts() {
    if (!folderPath.trim()) {
      status = 'Please select a valid folder.';
      showResults = false;
      return;
    }

    isLoading = true;
    status = 'Scanning directory for scripts...';
    showResults = false;

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));

    isLoading = false;
    status = `Loaded scripts from ${folderPath}`;
    showResults = true;
  }
</script>

<div class="editor-view npc-editor-view">
  <!-- Reusing standard header structure if possible, or custom header -->
  <div class="editor-header">
    <div>
      <h2>NPC Editor</h2>
      <p class="editor-description">Manage and edit NPC scripts and dialogues.</p>
    </div>
    <button class="editor-back-button" on:click={goBack}>
      <span class="btn-icon">🏠</span><span>Back to Home</span>
    </button>
  </div>

  <div class="setup-card">
    <p class="launcher-secondary-text">
      Select the folder containing your NPC script files (.lua, .json) to begin editing.
    </p>

    <div class="launcher-folder-card">
      <h3 class="launcher-folder-title">Select a scripts directory</h3>

      <div class="input-group">
        <label>
          Scripts folder
          <div class="input-row">
            <input 
              type="text" 
              class="modern-input" 
              placeholder="C:\Path\To\scripts" 
              bind:value={folderPath} 
              on:input={handleInput}
            />
            <button class="btn-secondary" on:click={browseFolder}>
              Selecionar diretório
            </button>
          </div>
        </label>
      </div>

      <button 
        class="btn-primary launcher-folder-load" 
        disabled={!folderPath.trim() || isLoading}
        on:click={loadScripts}
        data-loading={isLoading ? "true" : undefined}
      >
        <span class="btn-icon">📁</span>
        <span>{isLoading ? 'Loading...' : 'Load scripts'}</span>
      </button>

      {#if status}
        <p class="launcher-secondary-text" style="display: block;">{status}</p>
      {/if}

      {#if showResults}
        <div class="launcher-folder-results" style="display: block;">
          <h4>Scripts Found</h4>
          <p class="launcher-secondary-text">
            Scripts are ready to be processed. Integration with the editor will arrive soon.
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Reuse styles from app.css or add specific ones */
  .npc-editor-view {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .editor-description {
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }

  .setup-card {
    background: var(--surface-card);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-md);
  }

  .launcher-folder-card {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-row {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .modern-input {
    flex: 1;
    background: var(--surface-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.75rem 1rem;
    border-radius: 6px;
  }

  .btn-primary, .btn-secondary, .editor-back-button {
    cursor: pointer;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--surface-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .editor-back-button {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .launcher-folder-results {
    background: var(--surface-hover);
    padding: 1rem;
    border-radius: 8px;
    border-left: 3px solid var(--success-color);
  }
</style>