<script lang="ts">
  import { npcState } from "../../../../stores/npcState.svelte";
  import { translate } from "../../../../i18n";

  let npc = $derived(npcState.currentNpc);

  function handleInput() {
    if (npc) {
      if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
      if (!npc.meta.touchedFields.includes("shop")) {
        npc.meta.touchedFields.push("shop");
      }
      npc.meta.missingFields = npc.meta.missingFields.filter(
        (f) => f !== "shop",
      );

      if (!npc.shop) npc.shop = [];
    }
  }

  function addItem() {
    if (npc) {
      handleInput();
      npc.shop = [
        ...(npc.shop || []),
        { itemName: "", clientId: 0, buy: 0, sell: 0 },
      ];
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
    <div class="monster-card-header">{translate("npc.card.shop.title")}</div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if !npc.shop || npc.shop.length === 0}
          <div class="form-group" style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);"
              >{translate("npc.card.shop.empty")}</span
            >
          </div>
          <button class="btn-primary" onclick={addItem}
            >{translate("npc.card.shop.addFirst")}</button
          >
        {:else}
          <div
            style="display:flex; justify-content:flex-end; margin-bottom:10px;"
          >
            <button class="btn-primary" onclick={addItem}
              >{translate("npc.card.shop.addItem")}</button
            >
          </div>

          <div class="spells-list" style="max-height: 250px; overflow-y: auto;">
            {#each npc.shop as item, i}
              <div
                class="spell-item"
                style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr; gap: 8px; align-items: end; margin-bottom: 8px;"
              >
                <div class="form-group">
                  <label for="shop-item-{i}"
                    >{translate("npc.card.shop.itemName")}</label
                  >
                  <input
                    id="shop-item-{i}"
                    type="text"
                    placeholder="sword"
                    bind:value={item.itemName}
                    onchange={handleInput}
                  />
                </div>
                <div class="form-group">
                  <label for="shop-client-{i}"
                    >{translate("npc.card.shop.clientId")}</label
                  >
                  <input
                    id="shop-client-{i}"
                    type="number"
                    min="0"
                    bind:value={item.clientId}
                    onchange={handleInput}
                  />
                </div>
                <div class="form-group">
                  <label for="shop-buy-{i}"
                    >{translate("npc.card.shop.buyPrice")}</label
                  >
                  <input
                    id="shop-buy-{i}"
                    type="number"
                    min="0"
                    bind:value={item.buy}
                    onchange={handleInput}
                  />
                </div>
                <div class="form-group">
                  <label for="shop-sell-{i}"
                    >{translate("npc.card.shop.sellPrice")}</label
                  >
                  <input
                    id="shop-sell-{i}"
                    type="number"
                    min="0"
                    bind:value={item.sell}
                    onchange={handleInput}
                  />
                </div>
                <div class="form-group" style="text-align: right;">
                  <button
                    class="btn-icon"
                    style="color:var(--danger-color); padding: 8px;"
                    onclick={() => removeItem(i)}
                    title={translate("modal.btn.remove")}>✕</button
                  >
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
