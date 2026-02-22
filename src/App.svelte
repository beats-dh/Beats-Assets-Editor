<script lang="ts">
  import { appState } from './stores/appState.svelte';
  import Launcher from './lib/pages/Launcher.svelte';
  import AssetEditorLayout from './lib/pages/AssetEditorLayout.svelte';
  import MonsterEditorPage from './lib/pages/MonsterEditorPage.svelte';
  import NpcEditorPage from './lib/pages/NpcEditorPage.svelte';

  // Global Styles
  import './styles/main.css';
  import './features/layout/headerSpacing.css';
  import './features/assetGrid/assetSelectionLayout.css';
  import './monsterEditor.css';
</script>

{#if appState.currentView === 'launcher'}
  <Launcher />
{:else if appState.currentView === 'assets-editor'}
  <AssetEditorLayout />
{:else if appState.currentView === 'monster-editor'}
  <MonsterEditorPage />
{:else if appState.currentView === 'npc-editor'}
  <NpcEditorPage />
{/if}

