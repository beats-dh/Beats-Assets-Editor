<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     ⚙️ Flags
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        <div class="form-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-sm);">
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.summonable} /> Summonable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.attackable} /> Attackable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.hostile} /> Hostile
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.convinceable} /> Convinceable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.pushable} /> Pushable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.rewardBoss} /> Reward Boss
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.illusionable} /> Illusionable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.canPushItems} /> Can Push Items
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.canPushCreatures} /> Can Push Creatures
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.healthHidden} /> Health Hidden
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.isBlockable} /> Is Blockable
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.canWalkOnEnergy} /> Walk on Energy
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.canWalkOnFire} /> Walk on Fire
             </label>
             <label class="checkbox-group">
                <input type="checkbox" bind:checked={$currentMonster.flags.canWalkOnPoison} /> Walk on Poison
             </label>
        </div>

        <div class="form-row" style="margin-top: var(--space-md);">
            <div class="form-group">
               <label>Static Attack Chance</label>
               <input type="number" bind:value={$currentMonster.flags.staticAttackChance} />
            </div>
            <div class="form-group">
               <label>Target Distance</label>
               <input type="number" bind:value={$currentMonster.flags.targetDistance} />
            </div>
            <div class="form-group">
               <label>Run Health</label>
               <input type="number" bind:value={$currentMonster.flags.runHealth} />
            </div>
        </div>
     </div>
  </div>
</div>
{/if}

<style>
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.3);
    border-radius: 4px;
    cursor: pointer;
  }
  .checkbox-group input {
    width: 16px;
    height: 16px;
    accent-color: #8b5cf6;
  }
</style>
