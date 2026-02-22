<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);

  function enableSummons() {
    if (m) { m.summon = { maxSummons: 0, summons: [] }; showModal = true; }
  }
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">
    📣 Summons
    <button class="card-edit-button" onclick={() => showModal = true}>Editar</button>
  </div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if !m.summon}
        <div class="empty-state">Summons desativados.</div>
        <button class="btn-secondary" onclick={enableSummons}>Ativar Summons</button>
      {:else}
        <div class="form-group"><label>Max Summons</label><input type="number" bind:value={m.summon.maxSummons} /></div>
        <div class="summons-list">
          {#if m.summon.summons.length === 0}
            <div class="empty-state">Nenhum summon configurado.</div>
          {:else}
            {#each m.summon.summons as summon}
              <div class="summon-item"><strong>{summon.name}</strong> - Count: {summon.count}, Chance: {summon.chance}%, Interval: {summon.interval}ms</div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
