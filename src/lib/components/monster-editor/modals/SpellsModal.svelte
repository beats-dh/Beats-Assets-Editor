<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import type {
    AttackEntry,
    DefenseEntry,
    LuaProperty,
  } from "../../../../monsterTypes";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let attacks = $state<AttackEntry[]>([]);
  let defenses = $state<DefenseEntry[]>([]);

  $effect(() => {
    if (isOpen && monsterState.currentMonster) {
      attacks = JSON.parse(JSON.stringify(monsterState.currentMonster.attacks));
      defenses = JSON.parse(
        JSON.stringify(monsterState.currentMonster.defenses.entries),
      );
    }
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.attacks = attacks;
      monsterState.currentMonster.defenses.entries = defenses;
    }
    isOpen = false;
  }
  function addAttack() {
    attacks = [
      ...attacks,
      { name: "", interval: 2000, chance: 100 } as AttackEntry,
    ];
  }
  function addDefense() {
    defenses = [
      ...defenses,
      { name: "", interval: 2000, chance: 100 } as DefenseEntry,
    ];
  }
  function removeAttack(i: number) {
    attacks = attacks.filter((_, idx) => idx !== i);
  }
  function removeDefense(i: number) {
    defenses = defenses.filter((_, idx) => idx !== i);
  }
  function addProperty(list: LuaProperty[] | undefined): LuaProperty[] {
    return [...(list || []), { key: "", value: "" }];
  }
  function removeProperty(
    list: LuaProperty[] | undefined,
    i: number,
  ): LuaProperty[] {
    return (list || []).filter((_, idx) => idx !== i);
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
    <div class="monster-modal" style="width: min(1100px, 95%);">
      <div class="monster-modal-header">
        <h3>{translate("monster.modal.spells.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.spells.attacksTab")}</h4>
          <div class="modal-list">
            {#each attacks as attack, i}
              <div class="modal-list-item">
                <div class="modal-list-item-header">
                  {translate("monster.modal.spells.attackPrefix")}
                  {i + 1}<button
                    class="btn-icon"
                    onclick={() => removeAttack(i)}>&times;</button
                  >
                </div>
                <div class="modal-grid">
                  <div class="monster-modal-field">
                    <label for="att-name-{i}"
                      >{translate("monster.modal.spells.nameLabel")}</label
                    ><input
                      id="att-name-{i}"
                      type="text"
                      bind:value={attack.name}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-int-{i}"
                      >{translate("monster.modal.spells.intervalLabel")}</label
                    ><input
                      id="att-int-{i}"
                      type="number"
                      bind:value={attack.interval}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-chan-{i}"
                      >{translate("monster.modal.spells.chanceLabel")}</label
                    ><input
                      id="att-chan-{i}"
                      type="number"
                      bind:value={attack.chance}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-mind-{i}"
                      >{translate("monster.modal.spells.minDamageLabel")}</label
                    ><input
                      id="att-mind-{i}"
                      type="number"
                      bind:value={attack.minDamage}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-maxd-{i}"
                      >{translate("monster.modal.spells.maxDamageLabel")}</label
                    ><input
                      id="att-maxd-{i}"
                      type="number"
                      bind:value={attack.maxDamage}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-type-{i}"
                      >{translate("monster.modal.spells.typeLabel")}</label
                    ><input
                      id="att-type-{i}"
                      type="text"
                      bind:value={attack.combatType}
                    />
                  </div>
                  <div class="monster-modal-field checkbox">
                    <input
                      id="att-target-{i}"
                      type="checkbox"
                      bind:checked={attack.target}
                    /><label for="att-target-{i}"
                      >{translate(
                        "monster.modal.spells.needTargetLabel",
                      )}</label
                    >
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-eff-{i}"
                      >{translate("monster.modal.spells.effectLabel")}</label
                    ><input
                      id="att-eff-{i}"
                      type="text"
                      bind:value={attack.effect}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-ran-{i}"
                      >{translate("monster.modal.spells.rangeLabel")}</label
                    ><input
                      id="att-ran-{i}"
                      type="number"
                      bind:value={attack.range}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-rad-{i}"
                      >{translate("monster.modal.spells.radiusLabel")}</label
                    ><input
                      id="att-rad-{i}"
                      type="number"
                      bind:value={attack.radius}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-len-{i}"
                      >{translate("monster.modal.spells.lengthLabel")}</label
                    ><input
                      id="att-len-{i}"
                      type="number"
                      bind:value={attack.length}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-spr-{i}"
                      >{translate("monster.modal.spells.spreadLabel")}</label
                    ><input
                      id="att-spr-{i}"
                      type="number"
                      bind:value={attack.spread}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="att-sh-{i}"
                      >{translate(
                        "monster.modal.spells.shootEffectLabel",
                      )}</label
                    ><input
                      id="att-sh-{i}"
                      type="text"
                      bind:value={attack.shootEffect}
                    />
                  </div>
                </div>
                <div class="attack-subsection">
                  <div class="attack-subsection-title">
                    {translate("monster.modal.spells.conditionTitle")}
                  </div>
                  <div class="attack-property-list">
                    {#each attack.condition || [] as prop, j}
                      <div class="attack-property-row">
                        <input
                          type="text"
                          bind:value={prop.key}
                          placeholder={translate(
                            "monster.modal.spells.propKeyPlaceholder",
                          )}
                        />
                        <input
                          type="text"
                          bind:value={prop.value}
                          placeholder={translate(
                            "monster.modal.spells.propValuePlaceholder",
                          )}
                        />
                        <button
                          class="btn-icon"
                          onclick={() =>
                            (attack.condition = removeProperty(
                              attack.condition,
                              j,
                            ))}>&times;</button
                        >
                      </div>
                    {/each}
                    <button
                      class="btn-secondary btn-compact"
                      onclick={() =>
                        (attack.condition = addProperty(attack.condition))}
                      >{translate("monster.modal.spells.addPropBtn")}</button
                    >
                  </div>
                </div>
              </div>
            {/each}
          </div>
          <button
            class="btn-secondary"
            onclick={addAttack}
            style="margin-top: 1rem;"
            >{translate("monster.modal.spells.addAttackBtn")}</button
          >
        </div>
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.spells.defensesTab")}</h4>
          <div class="modal-list">
            {#each defenses as defense, i}
              <div class="modal-list-item">
                <div class="modal-list-item-header">
                  {translate("monster.modal.spells.defensePrefix")}
                  {i + 1}<button
                    class="btn-icon"
                    onclick={() => removeDefense(i)}>&times;</button
                  >
                </div>
                <div class="modal-grid">
                  <div class="monster-modal-field">
                    <label for="def-name-{i}"
                      >{translate("monster.modal.spells.nameLabel")}</label
                    ><input
                      id="def-name-{i}"
                      type="text"
                      bind:value={defense.name}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-int-{i}"
                      >{translate("monster.modal.spells.intervalLabel")}</label
                    ><input
                      id="def-int-{i}"
                      type="number"
                      bind:value={defense.interval}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-chan-{i}"
                      >{translate("monster.modal.spells.chanceLabel")}</label
                    ><input
                      id="def-chan-{i}"
                      type="number"
                      bind:value={defense.chance}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-mind-{i}"
                      >{translate("monster.modal.spells.minDamageLabel")}</label
                    ><input
                      id="def-mind-{i}"
                      type="number"
                      bind:value={defense.minDamage}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-maxd-{i}"
                      >{translate("monster.modal.spells.maxDamageLabel")}</label
                    ><input
                      id="def-maxd-{i}"
                      type="number"
                      bind:value={defense.maxDamage}
                    />
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-type-{i}"
                      >{translate("monster.modal.spells.typeLabel")}</label
                    ><input
                      id="def-type-{i}"
                      type="text"
                      bind:value={defense.combatType}
                    />
                  </div>
                  <div class="monster-modal-field checkbox">
                    <input
                      id="def-target-{i}"
                      type="checkbox"
                      bind:checked={defense.target}
                    /><label for="def-target-{i}"
                      >{translate(
                        "monster.modal.spells.needTargetLabel",
                      )}</label
                    >
                  </div>
                  <div class="monster-modal-field">
                    <label for="def-eff-{i}"
                      >{translate("monster.modal.spells.effectLabel")}</label
                    ><input
                      id="def-eff-{i}"
                      type="text"
                      bind:value={defense.effect}
                    />
                  </div>
                </div>
                <div class="attack-subsection">
                  <div class="attack-subsection-title">
                    {translate("monster.modal.spells.conditionTitle")}
                  </div>
                  <div class="attack-property-list">
                    {#each defense.condition || [] as prop, j}
                      <div class="attack-property-row">
                        <input
                          type="text"
                          bind:value={prop.key}
                          placeholder={translate(
                            "monster.modal.spells.propKeyPlaceholder",
                          )}
                        />
                        <input
                          type="text"
                          bind:value={prop.value}
                          placeholder={translate(
                            "monster.modal.spells.propValuePlaceholder",
                          )}
                        />
                        <button
                          class="btn-icon"
                          onclick={() =>
                            (defense.condition = removeProperty(
                              defense.condition,
                              j,
                            ))}>&times;</button
                        >
                      </div>
                    {/each}
                    <button
                      class="btn-secondary btn-compact"
                      onclick={() =>
                        (defense.condition = addProperty(defense.condition))}
                      >{translate("monster.modal.spells.addPropBtn")}</button
                    >
                  </div>
                </div>
              </div>
            {/each}
          </div>
          <button
            class="btn-secondary"
            onclick={addDefense}
            style="margin-top: 1rem;"
            >{translate("monster.modal.spells.addDefenseBtn")}</button
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
