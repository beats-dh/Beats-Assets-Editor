<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentView } from '../../stores/appState';
  import { 
    currentMonster, 
    currentFilePath, 
    monstersRootPath,
    cachedMonstersPath
  } from '../../stores/monsterStore';
  import { invoke } from '../../utils/invoke';
  import { COMMANDS } from '../../commands';
  import { ensureAppearancesLoaded } from '../../appearanceLoader';
  import MonsterSidebar from './MonsterSidebar.svelte';
  import MonsterForm from './MonsterForm.svelte';
  import { open } from '@tauri-apps/plugin-dialog';

  let isInitializing = true;
  let initError = '';

  function goBack() {
    currentView.set('launcher');
  }

  async function handleReload() {
     if ($monstersRootPath) {
        window.dispatchEvent(new CustomEvent('reload-monster-list'));
     }
  }

  async function handleChangeDirectory() {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === "string" && selection) {
        await invoke(COMMANDS.SET_MONSTER_BASE_PATH, { monsterPath: selection });
        monstersRootPath.set(selection);
        cachedMonstersPath.set(null); // Clear cache to force reload
        currentMonster.set(null);
        currentFilePath.set(null);
      }
    } catch (error) {
      console.error("Failed to select monster directory:", error);
      alert("Não foi possível selecionar a nova pasta de monstros.");
    }
  }

  onMount(async () => {
    try {
      // 1. Ensure appearances are loaded (required for sprites)
      await ensureAppearancesLoaded();
      
      // 2. Load saved monster path from backend if not already set
      if (!get(monstersRootPath)) {
        try {
          const savedPath = await invoke<string | null>(COMMANDS.GET_MONSTER_BASE_PATH);
          if (savedPath) {
            monstersRootPath.set(savedPath);
          }
        } catch (e) {
          console.log('No saved monster path found');
        }
      }
    } catch (error) {
      console.error('Failed to initialize Monster Editor:', error);
      initError = error instanceof Error ? error.message : String(error);
    } finally {
      isInitializing = false;
    }
  });
</script>


<div class="monster-editor-container">
  <header class="monster-editor-header">
    <button class="editor-back-button" on:click={goBack}>
      <span class="btn-icon">🏠</span>
      <span>Back to Home</span>
    </button>
    
    <h1>Monster Editor</h1>

    <div class="monster-header-actions">
      <button type="button" class="editor-icon-button" on:click={handleReload} title="Recarregar diretório atual">
        <span class="btn-icon">🔄</span>
        <span>Reload</span>
      </button>
      
      <button type="button" class="editor-icon-button" on:click={handleChangeDirectory} title="Escolher um novo diretório de monstros">
        <span class="btn-icon">📁</span>
        <span>Mudar pasta</span>
      </button>
    </div>
  </header>

  <div class="monster-editor-main">
    <MonsterSidebar />
    <MonsterForm />
  </div>
</div>

<style>
  /* We are using global styles from monsterEditor.css for now */
</style>
