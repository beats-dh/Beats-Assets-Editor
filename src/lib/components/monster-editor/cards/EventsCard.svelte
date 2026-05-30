<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import EventsModal from "../modals/EventsModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.events.title")}
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.events.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if !m.events || m.events.length === 0}
          <div class="empty-state">
            {translate("monster.card.events.empty")}
          </div>
          <button class="btn-secondary" onclick={() => (showModal = true)}
            >{translate("monster.card.events.addBtn")}</button
          >
        {:else}
          <div class="events-list">
            {#each m.events as event}
              <span class="event-pill">{event}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<EventsModal bind:isOpen={showModal} />
