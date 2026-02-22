<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import LootModal from '../modals/LootModal.svelte';
  
  let showModal = false;
  
  $: sortedLoot = $currentMonster ? [...$currentMonster.loot].sort((a, b) => b.chance - a.chance) : [];
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     💰 Loot ({$currentMonster.loot.length})
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if sortedLoot.length === 0}
            <div class="empty-state">
               <div class="empty-state-icon">🤷</div>
               <div>No loot items found for this monster</div>
            </div>
        {:else}
            <div class="loot-list">
                {#each sortedLoot as item}
                    <div class="loot-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <strong>{item.name || (item.id ? `Item ID: ${item.id}` : "Unknown Item")}</strong> 
                            {#if item.minCount || item.maxCount}
                                <span style="color: var(--text-secondary)">x{item.minCount || 1}{item.maxCount && item.maxCount !== item.minCount ? `-${item.maxCount}` : ""}</span>
                            {/if}
                          </div>
                          <span class="loot-chance">{(item.chance / 1000).toFixed(2)}%</span>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
     </div>
  </div>
</div>

<LootModal bind:isOpen={showModal} />
{/if}
