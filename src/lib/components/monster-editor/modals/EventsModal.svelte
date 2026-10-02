<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  interface Props {
    isOpen: boolean;
  }
  let { isOpen = $bindable(false) }: Props = $props();
  let events = $state<string[]>([]);

  $effect(() => {
    if (isOpen && monsterState.currentMonster)
      events = [...(monsterState.currentMonster.events || [])];
  });

  function save() {
    if (monsterState.currentMonster)
      monsterState.currentMonster.events = events.filter(
        (e) => e.trim().length > 0,
      );
    isOpen = false;
  }
  function addEvent() {
    events = [...events, ""];
  }
  function removeEvent(i: number) {
    events = events.filter((_, idx) => idx !== i);
  }

  function onClose() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div
    class="monster-modal-backdrop"
    role="button"
    tabindex="0"
    onclick={onClose}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    }}
    aria-label="Close"
  >
    <div class="monster-modal">
      <div class="monster-modal-header">
        <h3>{translate("monster.modal.events.title")}</h3>
        <button class="modal-close-button" onclick={() => (isOpen = false)}
          >&times;</button
        >
      </div>
      <div class="monster-modal-body">
        <div class="monster-modal-section">
          <h4>{translate("monster.modal.events.tabTitle")}</h4>
          <div class="modal-list">
            {#if events.length === 0}<div class="empty-state">
                {translate("monster.modal.events.empty")}
              </div>
            {:else}{#each events as _, i}
                <div class="modal-list-item">
                  <div class="modal-list-item-header">
                    {translate("monster.modal.events.eventNamePrefix")}
                    {i + 1}<button
                      class="btn-icon"
                      onclick={() => removeEvent(i)}>&times;</button
                    >
                  </div>
                  <div class="monster-modal-field">
                    <label for="event-name-{i}"
                      >{translate("monster.modal.events.nameLabel")}</label
                    ><input
                      id="event-name-{i}"
                      type="text"
                      bind:value={events[i]}
                      placeholder={translate(
                        "monster.modal.events.namePlaceholder",
                      )}
                    />
                  </div>
                </div>
              {/each}{/if}
          </div>
          <button
            class="btn-secondary"
            onclick={addEvent}
            style="margin-top: 1rem;"
            >{translate("monster.modal.events.addBtn")}</button
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
