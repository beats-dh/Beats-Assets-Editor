<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import type { ElementEntry, ImmunityEntry } from "../../../../monsterTypes";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let elements = $state<ElementEntry[]>([]);
  let immunities = $state<ImmunityEntry[]>([]);

  $effect(() => {
    if (isOpen && monsterState.currentMonster) {
      elements = JSON.parse(
        JSON.stringify(monsterState.currentMonster.elements),
      );
      immunities = JSON.parse(
        JSON.stringify(monsterState.currentMonster.immunities),
      );
    }
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.elements = elements.filter(
        (e) => e.elementType.trim().length > 0,
      );
      monsterState.currentMonster.immunities = immunities.filter(
        (e) => e.immunityType.trim().length > 0,
      );
    }
    isOpen = false;
  }
  function addElement() {
    elements = [...elements, { elementType: "", percent: 0 }];
  }
  function addImmunity() {
    immunities = [...immunities, { immunityType: "", condition: false }];
  }
  function removeElement(i: number) {
    elements = elements.filter((_, idx) => idx !== i);
  }
  function removeImmunity(i: number) {
    immunities = immunities.filter((_, idx) => idx !== i);
  }
</script>

{#if isOpen}
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
        <h3>{translate("monster.modal.elements.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.elements.elementsTab")}</h4>
          <div class="modal-list">
            {#if elements.length === 0}<div class="empty-state">
                {translate("monster.modal.elements.empty")}
              </div>
            {:else}{#each elements as el, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.elements.elementName")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeElement(i)}>&times;</button
                    >
                  </div>
                  <div class="modal-grid">
                    <div class="monster-modal-field">
                      <label for="el-type-{i}"
                        >{translate("monster.modal.elements.type")}</label
                      ><input
                        id="el-type-{i}"
                        type="text"
                        bind:value={el.elementType}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="el-perc-{i}"
                        >{translate("monster.modal.elements.percent")}</label
                      ><input
                        id="el-perc-{i}"
                        type="number"
                        bind:value={el.percent}
                      />
                    </div>
                  </div>
                </div>
              {/each}{/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addElement}
            style="margin-top: 1rem;"
            >{translate("monster.modal.elements.addBtn")}</button
          >
        </div>
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.elements.immunitiesTab")}</h4>
          <div class="modal-list">
            {#if immunities.length === 0}<div class="empty-state">
                {translate("monster.modal.elements.empty")}
              </div>
            {:else}{#each immunities as imm, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.elements.immunityName")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeImmunity(i)}>&times;</button
                    >
                  </div>
                  <div class="modal-grid">
                    <div class="monster-modal-field">
                      <label for="imm-type-{i}"
                        >{translate("monster.modal.elements.type")}</label
                      ><input
                        id="imm-type-{i}"
                        type="text"
                        bind:value={imm.immunityType}
                      />
                    </div>
                    <div class="monster-modal-field checkbox">
                      <input
                        id="imm-cond-{i}"
                        type="checkbox"
                        bind:checked={imm.condition}
                      /><label for="imm-cond-{i}"
                        >{translate(
                          "monster.modal.elements.immuneCondition",
                        )}</label
                      >
                    </div>
                  </div>
                </div>
              {/each}{/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addImmunity}
            style="margin-top: 1rem;"
            >{translate("monster.modal.elements.addImmunityBtn")}</button
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
