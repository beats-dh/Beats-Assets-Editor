<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.flags.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <div
          class="form-group"
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-sm);"
        >
          <label class="checkbox-group" for="flag-summonable"
            ><input
              id="flag-summonable"
              type="checkbox"
              bind:checked={m.flags.summonable}
            />
            {translate("monster.card.flags.summonable")}</label
          >
          <label class="checkbox-group" for="flag-attackable"
            ><input
              id="flag-attackable"
              type="checkbox"
              bind:checked={m.flags.attackable}
            />
            {translate("monster.card.flags.attackable")}</label
          >
          <label class="checkbox-group" for="flag-hostile"
            ><input
              id="flag-hostile"
              type="checkbox"
              bind:checked={m.flags.hostile}
            />
            {translate("monster.card.flags.hostile")}</label
          >
          <label class="checkbox-group" for="flag-convinceable"
            ><input
              id="flag-convinceable"
              type="checkbox"
              bind:checked={m.flags.convinceable}
            />
            {translate("monster.card.flags.convinceable")}</label
          >
          <label class="checkbox-group" for="flag-pushable"
            ><input
              id="flag-pushable"
              type="checkbox"
              bind:checked={m.flags.pushable}
            />
            {translate("monster.card.flags.pushable")}</label
          >
          <label class="checkbox-group" for="flag-rewardBoss"
            ><input
              id="flag-rewardBoss"
              type="checkbox"
              bind:checked={m.flags.rewardBoss}
            />
            {translate("monster.card.flags.rewardBoss")}</label
          >
          <label class="checkbox-group" for="flag-illusionable"
            ><input
              id="flag-illusionable"
              type="checkbox"
              bind:checked={m.flags.illusionable}
            />
            {translate("monster.card.flags.illusionable")}</label
          >
          <label class="checkbox-group" for="flag-canPushItems"
            ><input
              id="flag-canPushItems"
              type="checkbox"
              bind:checked={m.flags.canPushItems}
            />
            {translate("monster.card.flags.canPushItems")}</label
          >
          <label class="checkbox-group" for="flag-canPushCreatures"
            ><input
              id="flag-canPushCreatures"
              type="checkbox"
              bind:checked={m.flags.canPushCreatures}
            />
            {translate("monster.card.flags.canPushCreatures")}</label
          >
          <label class="checkbox-group" for="flag-healthHidden"
            ><input
              id="flag-healthHidden"
              type="checkbox"
              bind:checked={m.flags.healthHidden}
            />
            {translate("monster.card.flags.healthHidden")}</label
          >
          <label class="checkbox-group" for="flag-isBlockable"
            ><input
              id="flag-isBlockable"
              type="checkbox"
              bind:checked={m.flags.isBlockable}
            />
            {translate("monster.card.flags.isBlockable")}</label
          >
          <label class="checkbox-group" for="flag-walkOnEnergy"
            ><input
              id="flag-walkOnEnergy"
              type="checkbox"
              bind:checked={m.flags.canWalkOnEnergy}
            />
            {translate("monster.card.flags.walkOnEnergy")}</label
          >
          <label class="checkbox-group" for="flag-walkOnFire"
            ><input
              id="flag-walkOnFire"
              type="checkbox"
              bind:checked={m.flags.canWalkOnFire}
            />
            {translate("monster.card.flags.walkOnFire")}</label
          >
          <label class="checkbox-group" for="flag-walkOnPoison"
            ><input
              id="flag-walkOnPoison"
              type="checkbox"
              bind:checked={m.flags.canWalkOnPoison}
            />
            {translate("monster.card.flags.walkOnPoison")}</label
          >
        </div>
        <div class="form-row" style="margin-top: var(--space-md);">
          <div class="form-group">
            <label for="flag-static-att"
              >{translate("monster.card.flags.staticAttackChance")}</label
            ><input
              id="flag-static-att"
              type="number"
              bind:value={m.flags.staticAttackChance}
            />
          </div>
          <div class="form-group">
            <label for="flag-target-dist"
              >{translate("monster.card.flags.targetDistance")}</label
            ><input
              id="flag-target-dist"
              type="number"
              bind:value={m.flags.targetDistance}
            />
          </div>
          <div class="form-group">
            <label for="flag-run-health"
              >{translate("monster.card.flags.runHealth")}</label
            ><input
              id="flag-run-health"
              type="number"
              bind:value={m.flags.runHealth}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.3);
    border-radius: 4px;
    cursor: pointer;
  }
  .checkbox-group input {
    width: 16px;
    height: 16px;
    accent-color: #8b5cf6;
  }
</style>
