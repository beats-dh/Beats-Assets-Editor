<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import type { LootEntry } from "../../../../monsterTypes";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let lootEntries = $state<LootEntry[]>([]);

  $effect(() => {
    if (isOpen && monsterState.currentMonster)
      lootEntries = JSON.parse(
        JSON.stringify(monsterState.currentMonster.loot),
      );
  });

  function save() {
    if (monsterState.currentMonster) {
      monsterState.currentMonster.loot = lootEntries
        .map((e) => ({
          id: e.id,
          name: e.name?.trim() || undefined,
          chance: e.chance || 0,
          minCount: e.minCount,
          maxCount: e.maxCount,
        }))
        .filter((e) => (e.id !== undefined || e.name) && e.chance >= 0);
    }
    isOpen = false;
  }
  function addItem() {
    lootEntries = [...lootEntries, { name: "", chance: 0 }];
  }
  function removeItem(i: number) {
    lootEntries = lootEntries.filter((_, idx) => idx !== i);
  }
</script>

{#if isOpen}
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
        <h3>{translate("monster.modal.loot.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.loot.tabTitle")}</h4>
          <div class="modal-list">
            {#if lootEntries.length === 0}
              <div class="empty-state">
                {translate("monster.modal.loot.empty")}
              </div>
            {:else}
              {#each lootEntries as entry, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.loot.itemPrefix")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeItem(i)}>&times;</button
                    >
                  </div>
                  <div class="modal-grid">
                    <div class="monster-modal-field">
                      <label for="loot-name-{i}"
                        >{translate("monster.modal.loot.nameLabel")}</label
                      ><input
                        id="loot-name-{i}"
                        type="text"
                        bind:value={entry.name}
                        placeholder={translate(
                          "monster.modal.loot.namePlaceholder",
                        )}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="loot-id-{i}"
                        >{translate("monster.modal.loot.idLabel")}</label
                      ><input
                        id="loot-id-{i}"
                        type="number"
                        bind:value={entry.id}
                        placeholder={translate(
                          "monster.modal.loot.idPlaceholder",
                        )}
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="loot-chance-{i}"
                        >{translate("monster.modal.loot.chanceLabel")}</label
                      ><input
                        id="loot-chance-{i}"
                        type="number"
                        bind:value={entry.chance}
                        min="0"
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="loot-min-{i}"
                        >{translate("monster.modal.loot.minLabel")}</label
                      ><input
                        id="loot-min-{i}"
                        type="number"
                        bind:value={entry.minCount}
                        min="0"
                      />
                    </div>
                    <div class="monster-modal-field">
                      <label for="loot-max-{i}"
                        >{translate("monster.modal.loot.maxLabel")}</label
                      ><input
                        id="loot-max-{i}"
                        type="number"
                        bind:value={entry.maxCount}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addItem}
            style="margin-top: 1rem;"
            >{translate("monster.modal.loot.addBtn")}</button
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
