<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  import type { ElementEntry, ImmunityEntry } from '../../../../monsterTypes';
  interface Props { isOpen: boolean; }
  let { isOpen = $bindable(false) }: Props = $props();
  let elements = $state<ElementEntry[]>([]);
  let immunities = $state<ImmunityEntry[]>([]);

  $effect(() => {
    if (isOpen && monsterState.currentMonster) {
      elements = JSON.parse(JSON.stringify(monsterState.currentMonster.elements));
      immunities = JSON.parse(JSON.stringify(monsterState.currentMonster.immunities));
    }
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.elements = elements.filter(e => e.elementType.trim().length > 0);
      monsterState.currentMonster.immunities = immunities.filter(e => e.immunityType.trim().length > 0);
    }
    isOpen = false;
  }
  function addElement() { elements = [...elements, { elementType: '', percent: 0 }]; }
  function addImmunity() { immunities = [...immunities, { immunityType: '', condition: false }]; }
  function removeElement(i: number) { elements = elements.filter((_, idx) => idx !== i); }
  function removeImmunity(i: number) { immunities = immunities.filter((_, idx) => idx !== i); }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="monster-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) isOpen = false; }}>
  <div class="monster-modal">
    <div class="monster-modal-header"><h3>Editar Elementos & Imunidades</h3><button class="modal-close-button" onclick={() => isOpen = false}>&times;</button></div>
    <div class="monster-modal-body">
      <div class="monster-modal-section">
        <h4>Elementos</h4>
        <div class="modal-list">
          {#if elements.length === 0}<div class="empty-state">Nenhum registro.</div>
          {:else}{#each elements as el, i}
            <div class="modal-list-item">
              <div class="modal-list-item-header">Elemento {i + 1}<button class="btn-icon" onclick={() => removeElement(i)}>&times;</button></div>
              <div class="modal-grid">
                <div class="monster-modal-field"><label>Tipo</label><input type="text" bind:value={el.elementType} /></div>
                <div class="monster-modal-field"><label>%</label><input type="number" bind:value={el.percent} /></div>
              </div>
            </div>
          {/each}{/if}
        </div>
        <button class="btn-secondary" onclick={addElement} style="margin-top: 1rem;">Adicionar Elemento</button>
      </div>
      <div class="monster-modal-section">
        <h4>Imunidades</h4>
        <div class="modal-list">
          {#if immunities.length === 0}<div class="empty-state">Nenhum registro.</div>
          {:else}{#each immunities as imm, i}
            <div class="modal-list-item">
              <div class="modal-list-item-header">Imunidade {i + 1}<button class="btn-icon" onclick={() => removeImmunity(i)}>&times;</button></div>
              <div class="modal-grid">
                <div class="monster-modal-field"><label>Tipo</label><input type="text" bind:value={imm.immunityType} /></div>
                <div class="monster-modal-field checkbox"><input type="checkbox" bind:checked={imm.condition} /><span>Immune</span></div>
              </div>
            </div>
          {/each}{/if}
        </div>
        <button class="btn-secondary" onclick={addImmunity} style="margin-top: 1rem;">Adicionar Imunidade</button>
      </div>
    </div>
    <div class="monster-modal-footer">
      <button class="btn-secondary" onclick={() => isOpen = false}>Cancelar</button>
      <button class="btn-primary" onclick={save}>Salvar</button>
    </div>
  </div>
</div>
{/if}
