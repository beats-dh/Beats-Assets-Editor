<script lang="ts">
  import { currentView } from './stores/appState';
  import Launcher from './components/Launcher.svelte';
  import AssetEditorLayout from './components/AssetEditorLayout.svelte';
  import MonsterEditorLayout from './components/monster-editor/MonsterEditorLayout.svelte';
  import NpcEditorLayout from './components/npc-editor/NpcEditorLayout.svelte';
  import ImportStartIdModal from './components/modals/ImportStartIdModal.svelte';
  
  // Global Styles
  import './styles/main.css';
  import './features/layout/headerSpacing.css';
  import './features/assetGrid/assetSelectionLayout.css';
  import './monsterEditor.css';
</script>

{#if $currentView === 'launcher'}
  <Launcher />
{:else if $currentView === 'assets-editor'}
  <AssetEditorLayout />
{:else if $currentView === 'monster-editor'}
  <MonsterEditorLayout />
{:else if $currentView === 'npc-editor'}
  <NpcEditorLayout />
{/if}

<ImportStartIdModal />
