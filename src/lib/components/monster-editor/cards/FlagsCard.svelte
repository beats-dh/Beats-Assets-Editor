<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">⚙️ Flags</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="form-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-sm);">
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.summonable} /> Summonable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.attackable} /> Attackable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.hostile} /> Hostile</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.convinceable} /> Convinceable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.pushable} /> Pushable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.rewardBoss} /> Reward Boss</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.illusionable} /> Illusionable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.canPushItems} /> Can Push Items</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.canPushCreatures} /> Can Push Creatures</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.healthHidden} /> Health Hidden</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.isBlockable} /> Is Blockable</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.canWalkOnEnergy} /> Walk on Energy</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.canWalkOnFire} /> Walk on Fire</label>
        <label class="checkbox-group"><input type="checkbox" bind:checked={m.flags.canWalkOnPoison} /> Walk on Poison</label>
      </div>
      <div class="form-row" style="margin-top: var(--space-md);">
        <div class="form-group"><label>Static Attack Chance</label><input type="number" bind:value={m.flags.staticAttackChance} /></div>
        <div class="form-group"><label>Target Distance</label><input type="number" bind:value={m.flags.targetDistance} /></div>
        <div class="form-group"><label>Run Health</label><input type="number" bind:value={m.flags.runHealth} /></div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .checkbox-group { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: rgba(15, 23, 42, 0.3); border-radius: 4px; cursor: pointer; }
  .checkbox-group input { width: 16px; height: 16px; accent-color: #8b5cf6; }
</style>
