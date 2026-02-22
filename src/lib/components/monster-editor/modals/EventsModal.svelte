<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  interface Props { isOpen: boolean; }
  let { isOpen = $bindable(false) }: Props = $props();
  let events = $state<string[]>([]);

  $effect(() => { if (isOpen && monsterState.currentMonster) events = [...(monsterState.currentMonster.events || [])]; });

  function save() {
    if (monsterState.currentMonster) monsterState.currentMonster.events = events.filter(e => e.trim().length > 0);
    isOpen = false;
  }
  function addEvent() { events = [...events, '']; }
  function removeEvent(i: number) { events = events.filter((_, idx) => idx !== i); }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="monster-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) isOpen = false; }}>
  <div class="monster-modal">
    <div class="monster-modal-header"><h3>Editar Eventos</h3><button class="modal-close-button" onclick={() => isOpen = false}>&times;</button></div>
    <div class="monster-modal-body">
      <div class="monster-modal-section">
        <h4>Eventos Registrados</h4>
        <div class="modal-list">
          {#if events.length === 0}<div class="empty-state">Nenhum evento vinculado.</div>
          {:else}{#each events as event, i}
            <div class="modal-list-item">
              <div class="modal-list-item-header">Evento {i + 1}<button class="btn-icon" onclick={() => removeEvent(i)}>&times;</button></div>
              <div class="monster-modal-field"><label for="event-name-{i}">Nome do Evento</label><input id="event-name-{i}" type="text" bind:value={events[i]} placeholder="Ex.: RottenBloodBakragoreDeath" /></div>
            </div>
          {/each}{/if}
        </div>
        <button class="btn-secondary" onclick={addEvent} style="margin-top: 1rem;">Adicionar Evento</button>
      </div>
    </div>
    <div class="monster-modal-footer">
      <button class="btn-secondary" onclick={() => isOpen = false}>Cancelar</button>
      <button class="btn-primary" onclick={save}>Salvar</button>
    </div>
  </div>
</div>
{/if}
