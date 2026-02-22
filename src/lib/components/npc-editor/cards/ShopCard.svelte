<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';

  let npc = $derived(npcState.currentNpc);

  function handleInput() {
    if (npc) {
      if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
      if (!npc.meta.touchedFields.includes('shop')) {
        npc.meta.touchedFields.push('shop');
      }
      npc.meta.missingFields = npc.meta.missingFields.filter(f => f !== 'shop');
      
      if (!npc.shop) npc.shop = [];
    }
  }

  function addItem() {
    if (npc) {
      handleInput();
      npc.shop = [...(npc.shop || []), { itemName: '', clientId: 0, buy: 0, sell: 0 }];
    }
  }

  function removeItem(index: number) {
    if (npc && npc.shop) {
      handleInput();
      npc.shop.splice(index, 1);
      npc.shop = [...npc.shop];
    }
  }
</script>

{#if npc}
<div class="monster-card">
  <div class="monster-card-header">🛍️ Shop Inventory</div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if !npc.shop || npc.shop.length === 0}
        <div class="form-group" style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">No items sold. (Note: Shop arrays configured dynamically via `table.insert` loops in LUA cannot be extracted. Add static tables only.)</span>
        </div>
        <button class="btn-primary" onclick={addItem}>Add First Item</button>
      {:else}
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
           <button class="btn-primary" onclick={addItem}>+ Add Item</button>
        </div>
        
        <div class="spells-list" style="max-height: 250px; overflow-y: auto;">
            {#each npc.shop as item, i}
              <div class="spell-item" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr; gap: 8px; align-items: end; margin-bottom: 8px;">
                <div class="form-group">
                  <label>Item Name</label>
                  <input type="text" placeholder="sword" bind:value={item.itemName} onchange={handleInput} />
                </div>
                <div class="form-group">
                  <label>Client ID</label>
                  <input type="number" min="0" bind:value={item.clientId} onchange={handleInput} />
                </div>
                <div class="form-group">
                  <label>Buy Price</label>
                  <input type="number" min="0" bind:value={item.buy} onchange={handleInput} />
                </div>
                <div class="form-group">
                  <label>Sell Price</label>
                  <input type="number" min="0" bind:value={item.sell} onchange={handleInput} />
                </div>
                <div class="form-group" style="text-align: right;">
                  <button class="btn-icon" style="color:var(--danger-color); padding: 8px;" onclick={() => removeItem(i)} title="Remove">✕</button>
                </div>
              </div>
            {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
