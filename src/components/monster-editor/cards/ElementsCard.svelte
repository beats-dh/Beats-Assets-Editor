<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import ElementsModal from '../modals/ElementsModal.svelte';
  
  let showModal = false;
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     🧪 Elements & Immunities
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if $currentMonster.elements.length > 0}
            <h4 class="section-title">Elements</h4>
            <div class="elements-list">
                {#each $currentMonster.elements as el}
                    <div class="element-item"><strong>{el.elementType}</strong>: {el.percent}%</div>
                {/each}
            </div>
        {/if}
        
        {#if $currentMonster.immunities.length > 0}
             <h4 class="section-title" style="margin-top: 1rem;">Immunities</h4>
             <div class="immunities-list">
                {#each $currentMonster.immunities as imm}
                    <div class="immunity-item"><strong>{imm.immunityType}</strong>: {imm.condition ? "Yes" : "No"}</div>
                {/each}
             </div>
        {/if}

        {#if $currentMonster.elements.length === 0 && $currentMonster.immunities.length === 0}
            <div class="empty-state">No elements or immunities configured</div>
        {/if}
     </div>
  </div>
</div>

<ElementsModal bind:isOpen={showModal} />
{/if}

<style>
  .section-title {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
