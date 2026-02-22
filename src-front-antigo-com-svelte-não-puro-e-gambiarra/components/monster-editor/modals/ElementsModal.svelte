<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import type { ElementEntry, ImmunityEntry } from '../../../monsterTypes';
  
  export let isOpen = false;
  
  let elements: ElementEntry[] = [];
  let immunities: ImmunityEntry[] = [];

  $: if (isOpen && $currentMonster) {
      elements = JSON.parse(JSON.stringify($currentMonster.elements));
      immunities = JSON.parse(JSON.stringify($currentMonster.immunities));
  }

  function save() {
      if ($currentMonster) {
          $currentMonster.elements = elements.filter(e => e.elementType.trim().length > 0);
          $currentMonster.immunities = immunities.filter(e => e.immunityType.trim().length > 0);
      }
      isOpen = false;
  }

  function addElement() {
      elements = [...elements, { elementType: "", percent: 0 }];
  }

  function addImmunity() {
      immunities = [...immunities, { immunityType: "", condition: false }];
  }

  function removeElement(index: number) {
      elements = elements.filter((_, i) => i !== index);
  }
  
  function removeImmunity(index: number) {
      immunities = immunities.filter((_, i) => i !== index);
  }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal">
        <div class="monster-modal-header">
            <h3>Editar Elementos & Imunidades</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Elementos</h4>
                <div class="modal-list">
                    {#if elements.length === 0}
                        <div class="empty-state">Nenhum registro.</div>
                    {:else}
                        {#each elements as el, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Elemento {i + 1}
                                    <button class="btn-icon" on:click={() => removeElement(i)}>&times;</button>
                                </div>
                                <div class="modal-grid">
                                    <div class="monster-modal-field">
                                        <label>Tipo</label>
                                        <input type="text" bind:value={el.elementType} />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>%</label>
                                        <input type="number" bind:value={el.percent} />
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addElement} style="margin-top: 1rem;">Adicionar Elemento</button>
             </div>

             <div class="monster-modal-section">
                <h4>Imunidades</h4>
                <div class="modal-list">
                    {#if immunities.length === 0}
                        <div class="empty-state">Nenhum registro.</div>
                    {:else}
                        {#each immunities as imm, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Imunidade {i + 1}
                                    <button class="btn-icon" on:click={() => removeImmunity(i)}>&times;</button>
                                </div>
                                <div class="modal-grid">
                                    <div class="monster-modal-field">
                                        <label>Tipo</label>
                                        <input type="text" bind:value={imm.immunityType} />
                                    </div>
                                    <div class="monster-modal-field checkbox">
                                        <input type="checkbox" bind:checked={imm.condition} />
                                        <span>Immune</span>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addImmunity} style="margin-top: 1rem;">Adicionar Imunidade</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
