<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import SummonsModal from '../modals/SummonsModal.svelte';
  
  let showModal = false;
  
  function enableSummons() {
      if ($currentMonster) {
          $currentMonster.summon = { maxSummons: 0, summons: [] };
          showModal = true; 
      }
  }
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     ?? Summons
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if !$currentMonster.summon}
            <div class="empty-state">Summons desativados.</div>
            <button class="btn-secondary" on:click={enableSummons}>Ativar Summons</button>
        {:else}
             <div class="form-group">
                <label>Max Summons</label>
                <input type="number" bind:value={$currentMonster.summon.maxSummons} />
             </div>
             <div class="summons-list">
                 {#if $currentMonster.summon.summons.length === 0}
                     <div class="empty-state">Nenhum summon configurado.</div>
                 {:else}
                     {#each $currentMonster.summon.summons as summon}
                         <div class="summon-item">
                            <strong>{summon.name}</strong> - 
                            Count: {summon.count}, 
                            Chance: {summon.chance}%, 
                            Interval: {summon.interval}ms
                         </div>
                     {/each}
                 {/if}
             </div>
        {/if}
     </div>
  </div>
</div>

<SummonsModal bind:isOpen={showModal} />
{/if}
