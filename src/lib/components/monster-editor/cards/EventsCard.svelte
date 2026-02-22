<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">
    📅 Monster Events
    <button class="card-edit-button" onclick={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if !m.events || m.events.length === 0}
        <div class="empty-state">No Lua events linked to this monster.</div>
        <button class="btn-secondary" onclick={() => showModal = true}>Adicionar Evento</button>
      {:else}
        <div class="events-list">
          {#each m.events as event}
            <span class="event-pill">{event}</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
