<script lang="ts">
  import { onMount } from 'svelte';
  import { currentView } from '../../stores/appState';
  import { 
    monsterList, 
    currentMonster, 
    currentFilePath, 
    monstersRootPath 
  } from '../../stores/monsterStore';
  import { invoke } from '../../utils/invoke';
  import { COMMANDS } from '../../commands';
  import MonsterSidebar from './MonsterSidebar.svelte';
  import MonsterForm from './MonsterForm.svelte';
  import { open } from '@tauri-apps/plugin-dialog';

  function goBack() {
    currentView.set('launcher');
  }

  async function handleReload() {
     // Trigger reload in sidebar via store or event if needed, 
     // but mainly we just need to re-fetch the list if the path is set.
     if ($monstersRootPath) {
        // We'll let the sidebar handle the actual fetching based on the store change
        // or we can force a re-fetch here.
        // For now, let's just re-set the path to trigger reactivity if we implement it that way,
        // or dispatch an event.
        window.dispatchEvent(new CustomEvent('reload-monster-list'));
     }
  }

  async function handleChangeDirectory() {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === "string" && selection) {
        await invoke(COMMANDS.SET_MONSTER_BASE_PATH, { monsterPath: selection });
        monstersRootPath.set(selection);
        currentMonster.set(null);
        currentFilePath.set(null);
      }
    } catch (error) {
      console.error("Failed to select monster directory:", error);
      alert("Não foi possível selecionar a nova pasta de monstros.");
    }
  }

  onMount(async () => {
      // Try to get the current monster path if already set in backend
      // or rely on what's passed.
      // If we need to load the initial path:
      // const path = await invoke('get_monster_base_path'); // if this command existed
      // For now we assume the user has to select it or it's stored in settings.
      // But the legacy code passes `monstersPath` to `createMonsterEditorView`.
      // We might need a store for "settings" that persists this.
      // For now, let's just wait for user interaction or check if we have a default.
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
