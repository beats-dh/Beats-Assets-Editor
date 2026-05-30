<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import SpellsModal from "../modals/SpellsModal.svelte";
  let m = $derived(monsterState.currentMonster);
  let showModal = $state(false);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.spells.title")}
      <button class="card-edit-button" onclick={() => (showModal = true)}
        >{translate("monster.card.spells.edit")}</button
      >
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        {#if m.attacks.length === 0 && m.defenses.entries.length === 0}
          <div class="empty-state">
            {translate("monster.card.spells.empty")}
          </div>
        {:else}
          {#if m.attacks.length > 0}
            <h4 class="section-title">
              {translate("monster.card.spells.offensive")}
            </h4>
            <div class="attacks-list">
              {#each m.attacks as attack}
                <div class="attack-item">
                  <div class="attack-item-header">
                    <strong
                      >{attack.name ||
                        translate("monster.card.spells.unnamed")}</strong
                    >
                    <span class="attack-badge attack-badge-offense"
                      >{translate("monster.card.spells.attack")}</span
                    >
                  </div>
                  <div class="attack-meta-grid">
                    {#if attack.interval > 0}<div class="attack-meta-entry">
                        <span class="attack-meta-label"
                          >{translate("monster.card.spells.interval")}</span
                        ><span class="attack-meta-value"
                          >{attack.interval}
                          {translate("monster.card.spells.ms")}</span
                        >
                      </div>{/if}
                    <div class="attack-meta-entry">
                      <span class="attack-meta-label"
                        >{translate("monster.card.spells.chance")}</span
                      ><span class="attack-meta-value">{attack.chance}%</span>
                    </div>
                    {#if attack.minDamage || attack.maxDamage}<div
                        class="attack-meta-entry"
                      >
                        <span class="attack-meta-label"
                          >{translate("monster.card.spells.damage")}</span
                        ><span class="attack-meta-value"
                          >{attack.minDamage || 0}
                          {translate("monster.card.spells.to")}
                          {attack.maxDamage || 0}</span
                        >
                      </div>{/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
          {#if m.defenses.entries.length > 0}
            <h4 class="section-title" style="margin-top: 1rem;">
              {translate("monster.card.spells.defensive")}
            </h4>
            <div class="defenses-list">
              {#each m.defenses.entries as defense}
                <div class="attack-item">
                  <div class="attack-item-header">
                    <strong
                      >{defense.name ||
                        translate("monster.card.spells.unnamed")}</strong
                    >
                    <span class="attack-badge attack-badge-defense"
                      >{translate("monster.card.spells.defense")}</span
                    >
                  </div>
                  <div class="attack-meta-grid">
                    {#if defense.interval > 0}<div class="attack-meta-entry">
                        <span class="attack-meta-label"
                          >{translate("monster.card.spells.interval")}</span
                        ><span class="attack-meta-value"
                          >{defense.interval}
                          {translate("monster.card.spells.ms")}</span
                        >
                      </div>{/if}
                    <div class="attack-meta-entry">
                      <span class="attack-meta-label"
                        >{translate("monster.card.spells.chance")}</span
                      ><span class="attack-meta-value">{defense.chance}%</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<SpellsModal bind:isOpen={showModal} />

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
