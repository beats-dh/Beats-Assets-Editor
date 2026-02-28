<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import SummonsModal from "../modals/SummonsModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);

  function enableSummons() {
    if (m) {
      m.summon = { maxSummons: 0, summons: [] };
      showModal = true;
    }
  }
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.summons.title")}
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.summons.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if !m.summon}
          <div class="empty-state">
            {translate("monster.card.summons.disabled")}
          </div>
          <button class="btn-secondary" onclick={enableSummons}
            >{translate("monster.card.summons.enableBtn")}</button
          >
        {:else}
          <div class="form-group">
            <label>{translate("monster.card.summons.max")}</label><input
              type="number"
              bind:value={m.summon.maxSummons}
            />
          </div>
          <div class="summons-list">
            {#if m.summon.summons.length === 0}
              <div class="empty-state">
                {translate("monster.card.summons.empty")}
              </div>
            {:else}
              {#each m.summon.summons as summon}
                <div class="summon-item">
                  <strong>{summon.name}</strong> - {translate(
                    "monster.card.summons.count",
                  )}: {summon.count}, {translate(
                    "monster.card.summons.chance",
                  )}: {summon.chance}%, {translate(
                    "monster.card.summons.interval",
                  )}: {summon.interval}ms
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<SummonsModal bind:isOpen={showModal} />
