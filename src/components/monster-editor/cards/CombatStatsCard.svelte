<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     🛡️ Combat Stats
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        <div class="form-row">
            <div class="form-group">
               <label>Defense</label>
               <input type="number" bind:value={$currentMonster.defenses.defense} />
            </div>
            <div class="form-group">
               <label>Armor</label>
               <input type="number" bind:value={$currentMonster.defenses.armor} />
            </div>
            <div class="form-group">
               <label>Mitigation</label>
               <input type="number" step="0.01" bind:value={$currentMonster.defenses.mitigation} />
            </div>
        </div>
     </div>
  </div>
</div>
{/if}
