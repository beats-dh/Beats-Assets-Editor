<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import type { LootEntry } from '../../../monsterTypes';
  
  export let isOpen = false;
  
  let lootEntries: LootEntry[] = [];

  $: if (isOpen && $currentMonster) {
      lootEntries = JSON.parse(JSON.stringify($currentMonster.loot));
  }

  function save() {
      if ($currentMonster) {
          $currentMonster.loot = lootEntries
             .map(entry => ({
                 id: entry.id,
                 name: entry.name?.trim() || undefined,
                 chance: entry.chance || 0,
                 minCount: entry.minCount,
                 maxCount: entry.maxCount
             }))
             .filter(entry => (entry.id !== undefined || entry.name) && entry.chance >= 0);
      }
      isOpen = false;
  }

  function addItem() {
      lootEntries = [...lootEntries, { name: "", chance: 0 }];
  }

  function removeItem(index: number) {
      lootEntries = lootEntries.filter((_, i) => i !== index);
  }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal">
        <div class="monster-modal-header">
            <h3>Editar Loot</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Itens de Loot</h4>
                <div class="modal-list">
                    {#if lootEntries.length === 0}
                        <div class="empty-state">Nenhum item configurado.</div>
                    {:else}
                        {#each lootEntries as entry, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Item {i + 1}
                                    <button class="btn-icon" on:click={() => removeItem(i)}>&times;</button>
                                </div>
                                <div class="modal-grid">
                                    <div class="monster-modal-field">
                                        <label>Nome</label>
                                        <input type="text" bind:value={entry.name} placeholder="Nome do item" />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>ID</label>
                                        <input type="number" bind:value={entry.id} placeholder="ID (opcional)" />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Chance (0-100000)</label>
                                        <input type="number" bind:value={entry.chance} min="0" />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Qtd. Minima</label>
                                        <input type="number" bind:value={entry.minCount} min="0" />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Qtd. Maxima</label>
                                        <input type="number" bind:value={entry.maxCount} min="0" />
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addItem} style="margin-top: 1rem;">Adicionar Item</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
