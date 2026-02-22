<script lang="ts">
  import { appState } from '../../stores/appState.svelte';

  function goBack() {
    appState.currentView = 'launcher';
  }
</script>

<div class="npc-editor-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:1rem;">
  <h1>NPC Editor</h1>
  <p style="color:var(--text-secondary)">NPC Editor — em construção (Fase 5)</p>
  <button class="btn-primary" onclick={goBack}>Voltar</button>
</div>
