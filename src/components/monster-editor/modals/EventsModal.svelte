<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  
  export let isOpen = false;
  
  let events: string[] = [];
  
  $: if (isOpen && $currentMonster) {
      events = [...($currentMonster.events || [])];
  }
  
  function save() {
      if ($currentMonster) {
          $currentMonster.events = events.filter(e => e.trim().length > 0);
          // Mark touched logic if needed
      }
      isOpen = false;
  }
  
  function addEvent() {
      events = [...events, ""];
  }
  
  function removeEvent(index: number) {
      events = events.filter((_, i) => i !== index);
  }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal">
        <div class="monster-modal-header">
            <h3>Editar Eventos</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Eventos Registrados</h4>
                <div class="modal-list">
                    {#if events.length === 0}
                        <div class="empty-state">Nenhum evento vinculado.</div>
                    {:else}
                        {#each events as event, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Evento {i + 1}
                                    <button class="btn-icon" on:click={() => removeEvent(i)}>&times;</button>
                                </div>
                                <div class="monster-modal-field">
                                    <label>Nome do Evento</label>
                                    <input type="text" bind:value={events[i]} placeholder="Ex.: RottenBloodBakragoreDeath" />
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addEvent} style="margin-top: 1rem;">Adicionar Evento</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
