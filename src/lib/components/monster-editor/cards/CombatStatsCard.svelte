<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">🛡️ Combat Stats</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="form-row">
        <div class="form-group"><label>Defense</label><input type="number" bind:value={m.defenses.defense} /></div>
        <div class="form-group"><label>Armor</label><input type="number" bind:value={m.defenses.armor} /></div>
        <div class="form-group"><label>Mitigation</label><input type="number" step="0.01" bind:value={m.defenses.mitigation} /></div>
      </div>
    </div>
  </div>
</div>
{/if}
