<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import LootModal from "../modals/LootModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
  let sortedLoot = $derived(
    m ? [...m.loot].sort((a, b) => b.chance - a.chance) : [],
  );
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.loot.title")} ({m.loot.length})
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.loot.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if sortedLoot.length === 0}
          <div class="empty-state">
            <div class="empty-state-icon">🤷</div>
            <div>{translate("monster.card.loot.empty")}</div>
          </div>
        {:else}
          <div class="loot-list">
            {#each sortedLoot as item}
              <div class="loot-item">
                <div
                  style="display: flex; justify-content: space-between; align-items: center;"
                >
                  <div>
                    <strong
                      >{item.name ||
                        (item.id
                          ? `Item ID: ${item.id}`
                          : translate("monster.card.loot.unknown"))}</strong
                    >
                    {#if item.minCount || item.maxCount}
                      <span style="color: var(--text-secondary)"
                        >x{item.minCount || 1}{item.maxCount &&
                        item.maxCount !== item.minCount
                          ? `-${item.maxCount}`
                          : ""}</span
                      >
                    {/if}
                  </div>
                  <span class="loot-chance"
                    >{(item.chance / 1000).toFixed(2)}%</span
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

<LootModal bind:isOpen={showModal} />
