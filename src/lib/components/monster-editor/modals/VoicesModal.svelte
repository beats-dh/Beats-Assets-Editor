<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import type { MonsterVoices } from "../../../../monsterTypes";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let voicesData = $state<MonsterVoices | undefined>();
  let enabled = $state(false);

  $effect(() => {
    if (isOpen && monsterState.currentMonster) {
      if (monsterState.currentMonster.voices) {
        voicesData = JSON.parse(
          JSON.stringify(monsterState.currentMonster.voices),
        );
        enabled = true;
      } else {
        voicesData = { interval: 5000, chance: 10, entries: [] };
        enabled = false;
      }
    }
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.voices = !enabled ? undefined : voicesData;
    }
    isOpen = false;
  }
  function addVoice() {
    if (voicesData)
      voicesData.entries = [...voicesData.entries, { text: "", yell: false }];
  }
  function removeVoice(i: number) {
    if (voicesData)
      voicesData.entries = voicesData.entries.filter((_, idx) => idx !== i);
  }
</script>

{#if isOpen && voicesData}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="monster-modal-backdrop"
    onclick={(e) => {
      if (e.target === e.currentTarget) isOpen = false;
    }}
  >
    <div class="monster-modal">
      <div class="monster-modal-header">
        <h3>{translate("monster.modal.voices.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.voices.configTab")}</h4>
          <div class="monster-modal-field checkbox">
            <label
              ><input type="checkbox" bind:checked={enabled} /><span
                >{translate("monster.modal.voices.enableLabel")}</span
              ></label
            >
          </div>
          <div class="modal-grid">
            <div class="monster-modal-field">
              <label for="voices-interval"
                >{translate("monster.modal.voices.intervalLabel")}</label
              ><input
                id="voices-interval"
                type="number"
                bind:value={voicesData.interval}
                disabled={!enabled}
              />
            </div>
            <div class="monster-modal-field">
              <label for="voices-chance"
                >{translate("monster.modal.voices.chanceLabel")}</label
              ><input
                id="voices-chance"
                type="number"
                bind:value={voicesData.chance}
                disabled={!enabled}
              />
            </div>
          </div>
        </div>
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.voices.voicesTab")}</h4>
          <div class="modal-list">
            {#if !enabled}<div class="empty-state">
                {translate("monster.modal.voices.disabledEmpty")}
              </div>
            {:else if voicesData.entries.length === 0}<div class="empty-state">
                {translate("monster.modal.voices.empty")}
              </div>
            {:else}{#each voicesData.entries as voice, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.voices.voicePrefix")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeVoice(i)}>&times;</button
                    >
                  </div>
                  <div class="monster-modal-field">
                    <label for="voice-text-{i}"
                      >{translate("monster.modal.voices.textLabel")}</label
                    ><textarea
                      id="voice-text-{i}"
                      rows="2"
                      bind:value={voice.text}
                    ></textarea>
                  </div>
                  <div class="monster-modal-field checkbox">
                    <label
                      ><input type="checkbox" bind:checked={voice.yell} /><span
                        >{translate("monster.modal.voices.yellLabel")}</span
                      ></label
                    >
                  </div>
                </div>
              {/each}{/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addVoice}
            disabled={!enabled}
            style="margin-top: 1rem;"
            >{translate("monster.modal.voices.addBtn")}</button
          >
        </div>
      </div>
      <div class="monster-modal-footer">
        <button class="btn-secondary" onclick={() => (isOpen = false)}
          >{translate("monster.modal.shared.cancel")}</button
        >
        <button class="btn-primary" onclick={save}
          >{translate("monster.modal.shared.save")}</button
        >
      </div>
    </div>
  </div>
{/if}
