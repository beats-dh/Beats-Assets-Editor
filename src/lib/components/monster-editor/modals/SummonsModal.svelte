<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import type { MonsterSummon } from "../../../../monsterTypes";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let summonData = $state<MonsterSummon | undefined>();
  let enabled = $state(false);

  $effect(() => {
    if (isOpen && monsterState.currentMonster) {
      if (monsterState.currentMonster.summon) {
        summonData = JSON.parse(
          JSON.stringify(monsterState.currentMonster.summon),
        );
        enabled = true;
      } else {
        summonData = { maxSummons: 0, summons: [] };
        enabled = false;
      }
    }
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.summon = !enabled ? undefined : summonData;
    }
    isOpen = false;
  }
  function addSummon() {
    if (summonData)
      summonData.summons = [
        ...summonData.summons,
        { name: "", chance: 10, interval: 2000, count: 1 },
      ];
  }
  function removeSummon(i: number) {
    if (summonData)
      summonData.summons = summonData.summons.filter((_, idx) => idx !== i);
  }
</script>

{#if isOpen && summonData}
  <div
    class="monster-modal-backdrop"
    role="button"
    tabindex="0"
    onclick={(e) => {
      if (e.target === e.currentTarget) isOpen = false;
    }}
    onkeydown={(e) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if (e.target === e.currentTarget) isOpen = false;
      }
    }}
  >
    <div class="monster-modal">
      <div class="monster-modal-header">
        <h3>{translate("monster.modal.summons.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.summons.configTab")}</h4>
          <div class="monster-modal-field checkbox">
            <input
              id="summons-enabled"
              type="checkbox"
              bind:checked={enabled}
            /><label for="summons-enabled"
              >{translate("monster.modal.summons.enableLabel")}</label
            >
          </div>
          <div class="monster-modal-field">
            <label for="summons-max"
              >{translate("monster.modal.summons.maxLabel")}</label
            ><input
              id="summons-max"
              type="number"
              bind:value={summonData.maxSummons}
              disabled={!enabled}
            />
          </div>
        </div>
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.summons.creaturesTab")}</h4>
          <div class="modal-list">
            {#if !enabled}<div class="empty-state">
                {translate("monster.modal.summons.disabledEmpty")}
              </div>
            {:else if summonData.summons.length === 0}<div class="empty-state">
                {translate("monster.modal.summons.empty")}
              </div>
            {:else}{#each summonData.summons as summon, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.summons.summonPrefix")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeSummon(i)}>&times;</button
                    >
                  </div>
                  <div class="modal-grid">
                    <div class="monster-modal-field">
                      <label for="sum-name-{i}"
                        >{translate("monster.modal.summons.nameLabel")}</label
                      ><input
                        id="sum-name-{i}"
                        type="text"
                        bind:value={summon.name}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="sum-chan-{i}"
                        >{translate("monster.modal.summons.chanceLabel")}</label
                      ><input
                        id="sum-chan-{i}"
                        type="number"
                        bind:value={summon.chance}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="sum-int-{i}"
                        >{translate(
                          "monster.modal.summons.intervalLabel",
                        )}</label
                      ><input
                        id="sum-int-{i}"
                        type="number"
                        bind:value={summon.interval}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="sum-count-{i}"
                        >{translate("monster.modal.summons.countLabel")}</label
                      ><input
                        id="sum-count-{i}"
                        type="number"
                        bind:value={summon.count}
                      />
                    </div>
                  </div>
                </div>
              {/each}{/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addSummon}
            disabled={!enabled}
            style="margin-top: 1rem;"
            >{translate("monster.modal.summons.addBtn")}</button
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
