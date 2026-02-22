<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  let m = $derived(monsterState.currentMonster);

  function createDefaultBestiary() {
    return { class: '', race: '', toKill: 0, firstUnlock: 0, secondUnlock: 0, charmsPoints: 0, stars: 0, occurrence: 0, locations: '' };
  }

  function createDefaultBosstiary() {
    return { bossRaceId: 0, bossRace: '' };
  }

  function toggleBosstiary() {
    if (!m) return;
    if (m.bosstiary) { m.bosstiary = undefined; }
    else { m.bosstiary = createDefaultBosstiary(); }
  }
</script>

{#if m}
<div class="monster-card classification-card">
  <div class="monster-card-header">📂 Lore & Classification</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="form-row">
        <div class="form-group"><label>Race ID</label><input type="number" bind:value={m.raceId} /></div>
      </div>

      <!-- Bestiary -->
      <div class="classification-section">
        <div class="classification-section-header">
          <div class="classification-section-title">Bestiary</div>
          <button class="classification-toggle is-active" disabled>Enabled</button>
        </div>
        <p class="classification-section-description">Controls monster.Bestiary table: lore, stars, unlock thresholds and locations.</p>
        {#if !m.bestiary}
          <button class="btn-secondary" onclick={() => { if (m) m.bestiary = createDefaultBestiary(); }}>Initialize Bestiary</button>
        {:else}
          <div class="classification-section-body">
            <div class="form-row">
              <div class="form-group"><label>Class</label><input type="text" bind:value={m.bestiary.class} /></div>
              <div class="form-group"><label>Race</label><input type="text" bind:value={m.bestiary.race} /></div>
              <div class="form-group"><label>Stars</label><input type="number" bind:value={m.bestiary.stars} /></div>
              <div class="form-group"><label>Occurrence</label><input type="number" bind:value={m.bestiary.occurrence} /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>To Kill</label><input type="number" bind:value={m.bestiary.toKill} /></div>
              <div class="form-group"><label>First Unlock</label><input type="number" bind:value={m.bestiary.firstUnlock} /></div>
              <div class="form-group"><label>Second Unlock</label><input type="number" bind:value={m.bestiary.secondUnlock} /></div>
              <div class="form-group"><label>Charms Points</label><input type="number" bind:value={m.bestiary.charmsPoints} /></div>
            </div>
            <div class="form-group"><label>Locations</label><textarea bind:value={m.bestiary.locations}></textarea></div>
          </div>
        {/if}
      </div>

      <!-- Bosstiary -->
      <div class="classification-section">
        <div class="classification-section-header">
          <div class="classification-section-title">Bosstiary</div>
          <button class="classification-toggle" class:is-active={!!m.bosstiary} onclick={toggleBosstiary}>
            {m.bosstiary ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <p class="classification-section-description">Boss rarity information exported in monster.bosstiary.</p>
        <div class="classification-section-body">
          {#if m.bosstiary}
            <div class="form-row">
              <div class="form-group"><label>Boss Race ID</label><input type="number" bind:value={m.bosstiary.bossRaceId} /></div>
              <div class="form-group"><label>Boss Race Constant</label><input type="text" bind:value={m.bosstiary.bossRace} /></div>
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
