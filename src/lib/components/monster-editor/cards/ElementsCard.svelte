<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import ElementsModal from "../modals/ElementsModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.elements.title")}
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.elements.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if m.elements.length > 0}
          <h4 class="section-title">
            {translate("monster.card.elements.elements")}
          </h4>
          <div class="elements-list">
            {#each m.elements as el}
              <div class="element-item">
                <strong>{el.elementType}</strong>: {el.percent}%
              </div>
            {/each}
          </div>
        {/if}
        {#if m.immunities.length > 0}
          <h4 class="section-title" style="margin-top: 1rem;">
            {translate("monster.card.elements.immunities")}
          </h4>
          <div class="immunities-list">
            {#each m.immunities as imm}
              <div class="immunity-item">
                <strong>{imm.immunityType}</strong>: {imm.condition
                  ? translate("monster.card.elements.yes")
                  : translate("monster.card.elements.no")}
              </div>
            {/each}
          </div>
        {/if}
        {#if m.elements.length === 0 && m.immunities.length === 0}
          <div class="empty-state">
            {translate("monster.card.elements.empty")}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<ElementsModal bind:isOpen={showModal} />

<style>
  .section-title {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
