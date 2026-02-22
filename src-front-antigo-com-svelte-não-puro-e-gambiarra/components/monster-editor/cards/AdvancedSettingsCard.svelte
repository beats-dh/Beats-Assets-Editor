<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     🔧 Advanced Settings
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        
        <!-- Light -->
        <h4 class="section-title">Light</h4>
        <div class="form-row">
            <div class="form-group">
               <label>Level</label>
               <input type="number" bind:value={$currentMonster.light.level} />
            </div>
            <div class="form-group">
               <label>Color</label>
               <input type="number" bind:value={$currentMonster.light.color} />
            </div>
        </div>

        <!-- Change Target -->
        <h4 class="section-title">Change Target</h4>
        <div class="form-row">
            <div class="form-group">
               <label>Interval</label>
               <input type="number" bind:value={$currentMonster.changeTarget.interval} />
            </div>
            <div class="form-group">
               <label>Chance</label>
               <input type="number" bind:value={$currentMonster.changeTarget.chance} />
            </div>
        </div>

        <!-- Strategies -->
        <h4 class="section-title">Target Strategies</h4>
        <div class="form-row">
            <div class="form-group">
               <label>Nearest</label>
               <input type="number" bind:value={$currentMonster.strategiesTarget.nearest} />
            </div>
            <div class="form-group">
               <label>Health</label>
               <input type="number" bind:value={$currentMonster.strategiesTarget.health} />
            </div>
            <div class="form-group">
               <label>Damage</label>
               <input type="number" bind:value={$currentMonster.strategiesTarget.damage} />
            </div>
            <div class="form-group">
               <label>Random</label>
               <input type="number" bind:value={$currentMonster.strategiesTarget.random} />
            </div>
        </div>

     </div>
  </div>
</div>
{/if}

<style>
  .section-title {
    margin: 1rem 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .section-title:first-child {
    margin-top: 0;
  }
</style>
