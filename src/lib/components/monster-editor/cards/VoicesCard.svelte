<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import VoicesModal from "../modals/VoicesModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);

  function enableVoices() {
    if (m) {
      m.voices = { interval: 5000, chance: 10, entries: [] };
      showModal = true;
    }
  }
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.voices.title")}
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.voices.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if !m.voices}
          <div class="empty-state">
            {translate("monster.card.voices.disabled")}
          </div>
          <button class="btn-secondary" onclick={enableVoices}
            >{translate("monster.card.voices.enableBtn")}</button
          >
        {:else}
          <div class="form-row">
            <div class="form-group">
              <label for="voices-interval-input"
                >{translate("monster.card.voices.interval")}</label
              ><input
                id="voices-interval-input"
                type="number"
                bind:value={m.voices.interval}
              />
            </div>
            <div class="form-group">
              <label for="voices-chance-input"
                >{translate("monster.card.voices.chance")}</label
              ><input
                id="voices-chance-input"
                type="number"
                bind:value={m.voices.chance}
              />
            </div>
          </div>
          <div class="voices-list">
            {#if m.voices.entries.length === 0}
              <div class="empty-state">
                {translate("monster.card.voices.empty")}
              </div>
            {:else}
              {#each m.voices.entries as voice}
                <div class="voice-item">
                  "{voice.text}" {voice.yell
                    ? `(${translate("monster.card.voices.yell")})`
                    : `(${translate("monster.card.voices.say")})`}
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<VoicesModal bind:isOpen={showModal} />
