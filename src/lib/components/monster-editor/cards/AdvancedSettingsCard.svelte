<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  let m = $derived(monsterState.currentMonster);
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.advanced.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <h4 class="section-title">
          {translate("monster.card.advanced.light")}
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label>{translate("monster.card.advanced.level")}</label><input
              type="number"
              bind:value={m.light.level}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.advanced.color")}</label><input
              type="number"
              bind:value={m.light.color}
            />
          </div>
        </div>

        <h4 class="section-title">
          {translate("monster.card.advanced.changeTarget")}
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label>{translate("monster.card.advanced.interval")}</label><input
              type="number"
              bind:value={m.changeTarget.interval}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.advanced.chance")}</label><input
              type="number"
              bind:value={m.changeTarget.chance}
            />
          </div>
        </div>

        <h4 class="section-title">
          {translate("monster.card.advanced.targetStrategies")}
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label>{translate("monster.card.advanced.nearest")}</label><input
              type="number"
              bind:value={m.strategiesTarget.nearest}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.advanced.healthStrategy")}</label
            ><input type="number" bind:value={m.strategiesTarget.health} />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.advanced.damage")}</label><input
              type="number"
              bind:value={m.strategiesTarget.damage}
            />
          </div>
          <div class="form-group">
            <label>{translate("monster.card.advanced.random")}</label><input
              type="number"
              bind:value={m.strategiesTarget.random}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .section-title {
    margin: 1rem 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .section-title:first-child {
    margin-top: 0;
  }
</style>
