<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  let m = $derived(monsterState.currentMonster);

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
    return { bossRaceId: 0, bossRace: "" };
  }

  function toggleBosstiary() {
    if (!m) return;
    if (m.bosstiary) {
      m.bosstiary = undefined;
    } else {
      m.bosstiary = createDefaultBosstiary();
    }
  }
</script>

{#if m}
  <div class="monster-card classification-card">
    <div class="monster-card-header">
      {translate("monster.card.class.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <div class="form-row">
          <div class="form-group">
            <label>{translate("monster.card.class.raceId")}</label><input
              type="number"
              bind:value={m.raceId}
            />
          </div>
        </div>

        <!-- Bestiary -->
        <div class="classification-section">
          <div class="classification-section-header">
            <div class="classification-section-title">
              {translate("monster.card.class.bestiary")}
            </div>
            <button class="classification-toggle is-active" disabled
              >{translate("monster.card.class.enabled")}</button
            >
          </div>
          <p class="classification-section-description">
            {translate("monster.card.class.bestiaryDesc")}
          </p>
          {#if !m.bestiary}
            <button
              class="btn-secondary"
              onclick={() => {
                if (m) m.bestiary = createDefaultBestiary();
              }}>{translate("monster.card.class.initBestiary")}</button
            >
          {:else}
            <div class="classification-section-body">
              <div class="form-row">
                <div class="form-group">
                  <label>{translate("monster.card.class.class")}</label><input
                    type="text"
                    bind:value={m.bestiary.class}
                  />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.basic.race")}</label><input
                    type="text"
                    bind:value={m.bestiary.race}
                  />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.stars")}</label><input
                    type="number"
                    bind:value={m.bestiary.stars}
                  />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.occurrence")}</label
                  ><input type="number" bind:value={m.bestiary.occurrence} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>{translate("monster.card.class.toKill")}</label><input
                    type="number"
                    bind:value={m.bestiary.toKill}
                  />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.firstUnlock")}</label
                  ><input type="number" bind:value={m.bestiary.firstUnlock} />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.secondUnlock")}</label
                  ><input type="number" bind:value={m.bestiary.secondUnlock} />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.charmsPoints")}</label
                  ><input type="number" bind:value={m.bestiary.charmsPoints} />
                </div>
              </div>
              <div class="form-group">
                <label>{translate("monster.card.class.locations")}</label
                ><textarea bind:value={m.bestiary.locations}></textarea>
              </div>
            </div>
          {/if}
        </div>

        <!-- Bosstiary -->
        <div class="classification-section">
          <div class="classification-section-header">
            <div class="classification-section-title">
              {translate("monster.card.class.bosstiary")}
            </div>
            <button
              class="classification-toggle"
              class:is-active={!!m.bosstiary}
              onclick={toggleBosstiary}
            >
              {m.bosstiary
                ? translate("monster.card.class.enabled")
                : translate("monster.card.class.disabled")}
            </button>
          </div>
          <p class="classification-section-description">
            {translate("monster.card.class.bosstiaryDesc")}
          </p>
          <div class="classification-section-body">
            {#if m.bosstiary}
              <div class="form-row">
                <div class="form-group">
                  <label>{translate("monster.card.class.bossRaceId")}</label
                  ><input type="number" bind:value={m.bosstiary.bossRaceId} />
                </div>
                <div class="form-group">
                  <label>{translate("monster.card.class.bossRaceConst")}</label
                  ><input type="text" bind:value={m.bosstiary.bossRace} />
                </div>
              </div>
            {:else}
              <p class="classification-placeholder">
                {translate("monster.card.class.bossDisabled")}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
