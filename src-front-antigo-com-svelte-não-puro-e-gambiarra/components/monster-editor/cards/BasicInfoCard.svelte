<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  
  function markTouched(field: string) {
     if (!$currentMonster) return;
     if (!$currentMonster.meta) $currentMonster.meta = { missingFields: [], touchedFields: [] };
     if (!$currentMonster.meta.touchedFields.includes(field)) {
         $currentMonster.meta.touchedFields.push(field);
     }
  }
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     📋 Basic Information
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        <div class="form-group">
           <label for="m-name">Name</label>
           <input id="m-name" type="text" bind:value={$currentMonster.name} />
        </div>
        <div class="form-group">
           <label for="m-desc">Description</label>
           <textarea id="m-desc" bind:value={$currentMonster.description} on:input={() => markTouched('description')}></textarea>
        </div>
        
        <div class="form-row">
            <div class="form-group">
               <label for="m-exp">Experience</label>
               <input id="m-exp" type="number" bind:value={$currentMonster.experience} on:input={() => markTouched('experience')} />
            </div>
            <div class="form-group">
               <label for="m-hp">Health</label>
               <input id="m-hp" type="number" bind:value={$currentMonster.health} on:input={() => markTouched('health')} />
            </div>
            <div class="form-group">
               <label for="m-maxhp">Max Health</label>
               <input id="m-maxhp" type="number" bind:value={$currentMonster.maxHealth} on:input={() => markTouched('maxHealth')} />
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
               <label for="m-speed">Speed</label>
               <input id="m-speed" type="number" bind:value={$currentMonster.speed} on:input={() => markTouched('speed')} />
            </div>
            <div class="form-group">
               <label for="m-mana">Mana Cost</label>
               <input id="m-mana" type="number" bind:value={$currentMonster.manaCost} on:input={() => markTouched('manaCost')} />
            </div>
            <div class="form-group">
               <label for="m-race">Race</label>
               <input id="m-race" type="text" bind:value={$currentMonster.race} on:input={() => markTouched('race')} />
            </div>
        </div>

        <div class="form-row">
             <div class="form-group">
               <label for="m-corpse">Corpse ID</label>
               <input id="m-corpse" type="number" bind:value={$currentMonster.corpse} on:input={() => markTouched('corpse')} />
            </div>
        </div>
     </div>
  </div>
</div>
{/if}
