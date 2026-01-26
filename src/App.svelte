<script lang="ts">
  import { currentView } from './stores/appState';
  import Launcher from './components/Launcher.svelte';
  import AssetEditorLayout from './components/AssetEditorLayout.svelte';
  
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
  <div style="color: white; padding: 2rem; text-align: center;">
    <h2>Monster Editor</h2>
    <p>Coming Soon</p>
    <button on:click={() => currentView.set('launcher')} class="btn-primary">Back to Home</button>
  </div>
{:else if $currentView === 'npc-editor'}
  <div style="color: white; padding: 2rem; text-align: center;">
    <h2>NPC Editor</h2>
    <p>Coming Soon</p>
    <button on:click={() => currentView.set('launcher')} class="btn-primary">Back to Home</button>
  </div>
{/if}
