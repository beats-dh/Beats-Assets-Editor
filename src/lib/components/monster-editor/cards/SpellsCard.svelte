<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">
    ⚔️ Attacks & Defenses
    <button class="card-edit-button" onclick={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if m.attacks.length === 0 && m.defenses.entries.length === 0}
        <div class="empty-state">No attacks or defenses configured</div>
      {:else}
        {#if m.attacks.length > 0}
          <h4 class="section-title">Offensive Spells</h4>
          <div class="attacks-list">
            {#each m.attacks as attack}
              <div class="attack-item">
                <div class="attack-item-header">
                  <strong>{attack.name || '(Unnamed)'}</strong>
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
        {#if m.defenses.entries.length > 0}
          <h4 class="section-title" style="margin-top: 1rem;">Defensive Spells</h4>
          <div class="defenses-list">
            {#each m.defenses.entries as defense}
              <div class="attack-item">
                <div class="attack-item-header">
                  <strong>{defense.name || '(Unnamed)'}</strong>
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
{/if}

<style>
  .section-title { margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
</style>
