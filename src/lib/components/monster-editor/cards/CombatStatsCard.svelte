<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.combat.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <div class="form-row">
          <div class="form-group">
            <label>{translate("monster.card.combat.defense")}</label><input
              type="number"
              bind:value={m.defenses.defense}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.combat.armor")}</label><input
              type="number"
              bind:value={m.defenses.armor}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.combat.mitigation")}</label><input
              type="number"
              step="0.01"
              bind:value={m.defenses.mitigation}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
