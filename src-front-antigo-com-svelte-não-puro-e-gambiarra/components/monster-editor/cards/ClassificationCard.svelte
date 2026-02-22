<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  
  function createDefaultBestiary() {
    return {
      class: "",
      race: "",
      toKill: 0,
      firstUnlock: 0,
      secondUnlock: 0,
      charmsPoints: 0,
      stars: 0,
      occurrence: 0,
      locations: "",
    };
  }

  function createDefaultBosstiary() {
    return {
      bossRaceId: 0,
      bossRace: "",
    };
  }
  
  function toggleBestiary() {
      if (!$currentMonster) return;
      if ($currentMonster.bestiary) {
          // Can't really disable bestiary in the types? 
          // The type says bestiary?: MonsterBestiary
          // But usually it's always there or we toggle it.
          // The legacy code doesn't have a toggle for Bestiary, it just says "Enabled" always (true passed to buildSection).
          // Wait, legacy: buildSection("Bestiary", true, ...)
          // So it's always enabled.
      }
  }

  function toggleBosstiary() {
      if (!$currentMonster) return;
      if ($currentMonster.bosstiary) {
          $currentMonster.bosstiary = undefined;
      } else {
          $currentMonster.bosstiary = createDefaultBosstiary();
      }
  }
</script>

{#if $currentMonster}
<div class="monster-card classification-card">
  <div class="monster-card-header">
     ?? Lore & Classification
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        <div class="form-row">
            <div class="form-group">
               <label>Race ID</label>
               <input type="number" bind:value={$currentMonster.raceId} />
            </div>
        </div>

        <!-- Bestiary (Always Enabled) -->
        <div class="classification-section">
            <div class="classification-section-header">
                <div class="classification-section-title">Bestiary</div>
                <button class="classification-toggle is-active" disabled>Enabled</button>
            </div>
            <p class="classification-section-description">Controls monster.Bestiary table: lore, stars, unlock thresholds and locations.</p>
            
            {#if !$currentMonster.bestiary}
                <!-- Should ensure bestiary exists -->
                <button class="btn-secondary" on:click={() => { if ($currentMonster) $currentMonster.bestiary = createDefaultBestiary(); }}>Initialize Bestiary</button>
            {:else}
                <div class="classification-section-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Class</label>
                            <input type="text" bind:value={$currentMonster.bestiary.class} />
                        </div>
                        <div class="form-group">
                            <label>Race</label>
                            <input type="text" bind:value={$currentMonster.bestiary.race} />
                        </div>
                        <div class="form-group">
                            <label>Stars</label>
                            <input type="number" bind:value={$currentMonster.bestiary.stars} />
                        </div>
                        <div class="form-group">
                            <label>Occurrence</label>
                            <input type="number" bind:value={$currentMonster.bestiary.occurrence} />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>To Kill</label>
                            <input type="number" bind:value={$currentMonster.bestiary.toKill} />
                        </div>
                        <div class="form-group">
                            <label>First Unlock</label>
                            <input type="number" bind:value={$currentMonster.bestiary.firstUnlock} />
                        </div>
                        <div class="form-group">
                            <label>Second Unlock</label>
                            <input type="number" bind:value={$currentMonster.bestiary.secondUnlock} />
                        </div>
                        <div class="form-group">
                            <label>Charms Points</label>
                            <input type="number" bind:value={$currentMonster.bestiary.charmsPoints} />
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Locations</label>
                        <textarea bind:value={$currentMonster.bestiary.locations}></textarea>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Bosstiary -->
        <div class="classification-section">
            <div class="classification-section-header">
                <div class="classification-section-title">Bosstiary</div>
                <button 
                  class="classification-toggle" 
                  class:is-active={!!$currentMonster.bosstiary}
                  on:click={toggleBosstiary}
                >
                  {$currentMonster.bosstiary ? "Enabled" : "Disabled"}
                </button>
            </div>
            <p class="classification-section-description">Boss rarity information exported in monster.bosstiary.</p>
            
            <div class="classification-section-body">
                {#if $currentMonster.bosstiary}
                    <div class="form-row">
                        <div class="form-group">
                            <label>Boss Race ID</label>
                            <input type="number" bind:value={$currentMonster.bosstiary.bossRaceId} />
                        </div>
                        <div class="form-group">
                            <label>Boss Race Constant</label>
                            <input type="text" bind:value={$currentMonster.bosstiary.bossRace} />
                        </div>
                    </div>
                {:else}
                    <p class="classification-placeholder">Disabled for this monster.</p>
                {/if}
            </div>
        </div>

     </div>
  </div>
</div>
{/if}
