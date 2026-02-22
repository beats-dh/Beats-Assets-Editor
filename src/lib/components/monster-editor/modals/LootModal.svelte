<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  import type { LootEntry } from '../../../../monsterTypes';
  interface Props { isOpen: boolean; }
  let { isOpen = $bindable(false) }: Props = $props();
  let lootEntries = $state<LootEntry[]>([]);

  $effect(() => { if (isOpen && monsterState.currentMonster) lootEntries = JSON.parse(JSON.stringify(monsterState.currentMonster.loot)); });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.loot = lootEntries
        .map(e => ({ id: e.id, name: e.name?.trim() || undefined, chance: e.chance || 0, minCount: e.minCount, maxCount: e.maxCount }))
        .filter(e => (e.id !== undefined || e.name) && e.chance >= 0);
    }
    isOpen = false;
  }
  function addItem() { lootEntries = [...lootEntries, { name: '', chance: 0 }]; }
  function removeItem(i: number) { lootEntries = lootEntries.filter((_, idx) => idx !== i); }
</script>

{#if isOpen}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="monster-modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) isOpen = false; }}>
  <div class="monster-modal">
    <div class="monster-modal-header"><h3>Editar Loot</h3><button class="modal-close-button" onclick={() => isOpen = false}>&times;</button></div>
    <div class="monster-modal-body">
      <div class="monster-modal-section">
        <h4>Itens de Loot</h4>
        <div class="modal-list">
          {#if lootEntries.length === 0}
            <div class="empty-state">Nenhum item configurado.</div>
          {:else}
            {#each lootEntries as entry, i}
              <div class="modal-list-item">
                <div class="modal-list-item-header">Item {i + 1}<button class="btn-icon" onclick={() => removeItem(i)}>&times;</button></div>
                <div class="modal-grid">
                  <div class="monster-modal-field"><label>Nome</label><input type="text" bind:value={entry.name} placeholder="Nome do item" /></div>
                  <div class="monster-modal-field"><label>ID</label><input type="number" bind:value={entry.id} placeholder="ID (opcional)" /></div>
                  <div class="monster-modal-field"><label>Chance (0-100000)</label><input type="number" bind:value={entry.chance} min="0" /></div>
                  <div class="monster-modal-field"><label>Qtd. Minima</label><input type="number" bind:value={entry.minCount} min="0" /></div>
                  <div class="monster-modal-field"><label>Qtd. Maxima</label><input type="number" bind:value={entry.maxCount} min="0" /></div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
        <button class="btn-secondary" onclick={addItem} style="margin-top: 1rem;">Adicionar Item</button>
      </div>
    </div>
    <div class="monster-modal-footer">
      <button class="btn-secondary" onclick={() => isOpen = false}>Cancelar</button>
      <button class="btn-primary" onclick={save}>Salvar</button>
    </div>
  </div>
</div>
{/if}
