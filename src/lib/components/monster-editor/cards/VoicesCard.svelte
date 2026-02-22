<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);

  function enableVoices() {
    if (m) { m.voices = { interval: 5000, chance: 10, entries: [] }; showModal = true; }
  }
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">
    🗣️ Voices
    <button class="card-edit-button" onclick={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if !m.voices}
        <div class="empty-state">Falas desativadas.</div>
        <button class="btn-secondary" onclick={enableVoices}>Ativar Falas</button>
      {:else}
        <div class="form-row">
          <div class="form-group"><label>Interval</label><input type="number" bind:value={m.voices.interval} /></div>
          <div class="form-group"><label>Chance</label><input type="number" bind:value={m.voices.chance} /></div>
        </div>
        <div class="voices-list">
          {#if m.voices.entries.length === 0}
            <div class="empty-state">Nenhuma fala configurada.</div>
          {:else}
            {#each m.voices.entries as voice}
              <div class="voice-item">"{voice.text}" {voice.yell ? '(yell)' : '(say)'}</div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
