<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import VoicesModal from '../modals/VoicesModal.svelte';
  
  let showModal = false;
  
  function enableVoices() {
      if ($currentMonster) {
          $currentMonster.voices = { interval: 5000, chance: 10, entries: [] };
          showModal = true; 
      }
  }
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     ?? Voices
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if !$currentMonster.voices}
            <div class="empty-state">Falas desativadas.</div>
            <button class="btn-secondary" on:click={enableVoices}>Ativar Falas</button>
        {:else}
             <div class="form-row">
                 <div class="form-group">
                    <label>Interval</label>
                    <input type="number" bind:value={$currentMonster.voices.interval} />
                 </div>
                 <div class="form-group">
                    <label>Chance</label>
                    <input type="number" bind:value={$currentMonster.voices.chance} />
                 </div>
             </div>
             
             <div class="voices-list">
                 {#if $currentMonster.voices.entries.length === 0}
                     <div class="empty-state">Nenhuma fala configurada.</div>
                 {:else}
                     {#each $currentMonster.voices.entries as voice}
                         <div class="voice-item">
                            "{voice.text}" {voice.yell ? "(yell)" : "(say)"}
                         </div>
                     {/each}
                 {/if}
             </div>
        {/if}
     </div>
  </div>
</div>

<VoicesModal bind:isOpen={showModal} />
{/if}
