<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import SpellsModal from '../modals/SpellsModal.svelte';
  
  let showModal = false;
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     ⚔️ Attacks & Defenses
     <button class="card-edit-button" on:click={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        {#if $currentMonster.attacks.length === 0 && $currentMonster.defenses.entries.length === 0}
             <div class="empty-state">No attacks or defenses configured</div>
        {:else}
             {#if $currentMonster.attacks.length > 0}
                 <h4 class="section-title">Offensive Spells</h4>
                 <div class="attacks-list">
                     {#each $currentMonster.attacks as attack}
                         <div class="attack-item">
                             <div class="attack-item-header">
                                 <strong>{attack.name || "(Unnamed)"}</strong>
                                 <span class="attack-badge attack-badge-offense">Attack</span>
                             </div>
                             <div class="attack-meta-grid">
                                 {#if attack.interval > 0}<div class="attack-meta-entry"><span class="attack-meta-label">Interval</span><span class="attack-meta-value">{attack.interval} ms</span></div>{/if}
                                 <div class="attack-meta-entry"><span class="attack-meta-label">Chance</span><span class="attack-meta-value">{attack.chance}%</span></div>
                                 {#if attack.minDamage || attack.maxDamage}<div class="attack-meta-entry"><span class="attack-meta-label">Damage</span><span class="attack-meta-value">{attack.minDamage || 0} to {attack.maxDamage || 0}</span></div>{/if}
                             </div>
                         </div>
                     {/each}
                 </div>
             {/if}

             {#if $currentMonster.defenses.entries.length > 0}
                 <h4 class="section-title" style="margin-top: 1rem;">Defensive Spells</h4>
                 <div class="defenses-list">
                     {#each $currentMonster.defenses.entries as defense}
                         <div class="attack-item">
                             <div class="attack-item-header">
                                 <strong>{defense.name || "(Unnamed)"}</strong>
                                 <span class="attack-badge attack-badge-defense">Defense</span>
                             </div>
                              <div class="attack-meta-grid">
                                 {#if defense.interval > 0}<div class="attack-meta-entry"><span class="attack-meta-label">Interval</span><span class="attack-meta-value">{defense.interval} ms</span></div>{/if}
                                 <div class="attack-meta-entry"><span class="attack-meta-label">Chance</span><span class="attack-meta-value">{defense.chance}%</span></div>
                             </div>
                         </div>
                     {/each}
                 </div>
             {/if}
        {/if}
     </div>
  </div>
</div>

<SpellsModal bind:isOpen={showModal} />
{/if}

<style>
  .section-title {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
