<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../../stores/appState.svelte';
  import { monsterState } from '../../../stores/monsterState.svelte';
  import { invoke } from '../../../utils/invoke';
  import { COMMANDS } from '../../../commands';
  import { ensureAppearancesLoaded } from '../../../appearanceLoader';
  import { open } from '@tauri-apps/plugin-dialog';
  import MonsterSidebar from './MonsterSidebar.svelte';
  import MonsterForm from './MonsterForm.svelte';

  let isInitializing = $state(true);
  let initError = $state('');

  function goBack() {
    appState.currentView = 'launcher';
  }

  async function handleReload() {
    if (monsterState.monstersRootPath) {
      window.dispatchEvent(new CustomEvent('reload-monster-list'));
    }
  }

  async function handleChangeDirectory() {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === 'string' && selection) {
        await invoke(COMMANDS.SET_MONSTER_BASE_PATH, { monsterPath: selection });
        monsterState.monstersRootPath = selection;
        monsterState.cachedMonstersPath = null;
        monsterState.currentMonster = null;
        monsterState.currentFilePath = null;
      }
    } catch (error) {
      console.error('Failed to select monster directory:', error);
      alert('Não foi possível selecionar a nova pasta de monstros.');
    }
  }

  onMount(async () => {
    try {
      await ensureAppearancesLoaded();
      if (!monsterState.monstersRootPath) {
        try {
          const savedPath = await invoke<string | null>(COMMANDS.GET_MONSTER_BASE_PATH);
          if (savedPath) monsterState.monstersRootPath = savedPath;
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
    <button class="editor-back-button" onclick={goBack}>
      <span class="btn-icon">🏠</span>
      <span>Back to Home</span>
    </button>

    <h1>Monster Editor</h1>

    <div class="monster-header-actions">
      <button type="button" class="editor-icon-button" onclick={handleReload} title="Recarregar diretório atual">
        <span class="btn-icon">🔄</span>
        <span>Reload</span>
      </button>
      <button type="button" class="editor-icon-button" onclick={handleChangeDirectory} title="Escolher um novo diretório de monstros">
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
