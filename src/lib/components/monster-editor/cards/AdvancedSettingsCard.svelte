<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">🔧 Advanced Settings</div>
  <div class="monster-card-body">
    <div class="card-content">
      <h4 class="section-title">Light</h4>
      <div class="form-row">
        <div class="form-group"><label>Level</label><input type="number" bind:value={m.light.level} /></div>
        <div class="form-group"><label>Color</label><input type="number" bind:value={m.light.color} /></div>
      </div>

      <h4 class="section-title">Change Target</h4>
      <div class="form-row">
        <div class="form-group"><label>Interval</label><input type="number" bind:value={m.changeTarget.interval} /></div>
        <div class="form-group"><label>Chance</label><input type="number" bind:value={m.changeTarget.chance} /></div>
      </div>

      <h4 class="section-title">Target Strategies</h4>
      <div class="form-row">
        <div class="form-group"><label>Nearest</label><input type="number" bind:value={m.strategiesTarget.nearest} /></div>
        <div class="form-group"><label>Health</label><input type="number" bind:value={m.strategiesTarget.health} /></div>
        <div class="form-group"><label>Damage</label><input type="number" bind:value={m.strategiesTarget.damage} /></div>
        <div class="form-group"><label>Random</label><input type="number" bind:value={m.strategiesTarget.random} /></div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .section-title { margin: 1rem 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  .section-title:first-child { margin-top: 0; }
</style>
