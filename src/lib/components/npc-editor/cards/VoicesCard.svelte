<script lang="ts">
  import { npcState } from "../../../../stores/npcState.svelte";
  import { translate } from "../../../../i18n";

  let npc = $derived(npcState.currentNpc);

  function handleInput() {
    if (npc) {
      if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
      if (!npc.meta.touchedFields.includes("voices")) {
        npc.meta.touchedFields.push("voices");
      }
      npc.meta.missingFields = npc.meta.missingFields.filter(
        (f) => f !== "voices",
      );

      // Update proxy structure if undefined
      if (!npc.voices) {
        npc.voices = { interval: 0, chance: 0, lines: [] };
      }
    }
  }

  function addVoice() {
    if (npc) {
      handleInput();
      npc.voices!.lines = [...npc.voices!.lines, { text: "", yell: false }];
    }
  }

  function removeVoice(index: number) {
    if (npc && npc.voices) {
      handleInput();
      npc.voices.lines.splice(index, 1);
      npc.voices.lines = [...npc.voices.lines];
    }
  }
</script>

{#if npc}
  <div class="monster-card">
    <div class="monster-card-header">{translate("npc.card.voices.title")}</div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if !npc.voices || (npc.voices.lines.length === 0 && npc.voices.interval === 0)}
          <div class="form-group" style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);"
              >{translate("npc.card.voices.empty")}</span
            >
          </div>
          <button class="btn-primary" onclick={addVoice}
            >{translate("npc.card.voices.addSetup")}</button
          >
        {:else}
          <div
            class="form-row"
            style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: start; margin-bottom: 16px;"
          >
            <div class="form-group" style="margin: 0;">
              <label for="vInterval" style="font-size: 11px;"
                >{translate("npc.card.voices.interval")}</label
              >
              <input
                id="vInterval"
                type="number"
                bind:value={npc.voices.interval}
                onchange={handleInput}
              />
            </div>
            <div class="form-group" style="margin: 0;">
              <label for="vChance" style="font-size: 11px;"
                >{translate("npc.card.voices.chance")}</label
              >
              <input
                id="vChance"
                type="number"
                bind:value={npc.voices.chance}
                onchange={handleInput}
              />
            </div>
            <div class="form-group" style="margin: 0;">
              <label for="vAction" style="font-size: 11px; visibility: hidden;"
                >Action</label
              >
              <button id="vAction" class="btn-primary" onclick={addVoice}
                >{translate("npc.card.voices.addQuote")}</button
              >
            </div>
          </div>

          <div
            class="voices-list"
            style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;"
          >
            {#each npc.voices.lines as voice, i}
              <div
                class="voice-item"
                style="display: flex; gap: 12px; align-items: center;"
              >
                <input
                  type="text"
                  style="flex: 1; font-size: 13px; background: transparent; border: none; color: var(--text-primary); outline: none; padding: 0;"
                  placeholder={translate("npc.card.voices.placeholder")}
                  bind:value={voice.text}
                  onchange={handleInput}
                />

                <label
                  style="font-size: 11px; margin: 0; display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-primary);"
                >
                  <input
                    type="checkbox"
                    style="accent-color: var(--primary-accent); width: 16px; height: 16px; cursor: pointer; margin: 0;"
                    bind:checked={voice.yell}
                    onchange={handleInput}
                  />
                  {translate("npc.card.voices.yell")}
                </label>

                <button
                  class="btn-danger-icon"
                  style="padding: 6px 8px; font-size: 12px; margin: 0; display: flex; align-items: center; justify-content: center;"
                  onclick={() => removeVoice(i)}
                  title={translate("npc.card.voices.remove")}
                >
                  ✕
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .btn-danger-icon {
    background: color-mix(in srgb, var(--error-color) 10%, transparent);
    color: var(--error-color);
    border: 1px solid color-mix(in srgb, var(--error-color) 20%, transparent);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-danger-icon:hover {
    background: var(--error-color);
    color: white;
  }
</style>
