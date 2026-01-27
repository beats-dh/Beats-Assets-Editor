<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import EventsModal from '../modals/EventsModal.svelte';
  
  let showModal = false;
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     ?? Monster Events
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if !$currentMonster.events || $currentMonster.events.length === 0}
            <div class="empty-state">
                No Lua events linked to this monster.
            </div>
            <button class="btn-secondary" on:click={() => showModal = true}>Adicionar Evento</button>
        {:else}
            <div class="events-list">
                {#each $currentMonster.events as event}
                    <span class="event-pill">{event}</span>
                {/each}
            </div>
        {/if}
     </div>
  </div>
</div>

<EventsModal bind:isOpen={showModal} />
{/if}
