<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  let m = $derived(monsterState.currentMonster);

  function markTouched(field: string) {
    if (!m) return;
    if (!m.meta) m.meta = { missingFields: [], touchedFields: [] };
    if (!m.meta.touchedFields.includes(field)) {
      m.meta.touchedFields.push(field);
    }
  }
</script>

{#if m}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.basic.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <div class="form-group">
          <label for="m-name">{translate("monster.card.basic.name")}</label>
          <input id="m-name" type="text" bind:value={m.name} />
        </div>
        <div class="form-group">
          <label for="m-desc"
            >{translate("monster.card.basic.description")}</label
          >
          <textarea
            id="m-desc"
            bind:value={m.description}
            oninput={() => markTouched("description")}
          ></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-exp"
              >{translate("monster.card.basic.experience")}</label
            >
            <input
              id="m-exp"
              type="number"
              bind:value={m.experience}
              oninput={() => markTouched("experience")}
            />
          </div>
          <div class="form-group">
            <label for="m-hp">{translate("monster.card.basic.health")}</label>
            <input
              id="m-hp"
              type="number"
              bind:value={m.health}
              oninput={() => markTouched("health")}
            />
          </div>
          <div class="form-group">
            <label for="m-maxhp"
              >{translate("monster.card.basic.maxHealth")}</label
            >
            <input
              id="m-maxhp"
              type="number"
              bind:value={m.maxHealth}
              oninput={() => markTouched("maxHealth")}
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-speed">{translate("monster.card.basic.speed")}</label>
            <input
              id="m-speed"
              type="number"
              bind:value={m.speed}
              oninput={() => markTouched("speed")}
            />
          </div>
          <div class="form-group">
            <label for="m-mana"
              >{translate("monster.card.basic.manaCost")}</label
            >
            <input
              id="m-mana"
              type="number"
              bind:value={m.manaCost}
              oninput={() => markTouched("manaCost")}
            />
          </div>
          <div class="form-group">
            <label for="m-race">{translate("monster.card.basic.race")}</label>
            <input
              id="m-race"
              type="text"
              bind:value={m.race}
              oninput={() => markTouched("race")}
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="m-corpse"
              >{translate("monster.card.basic.corpseId")}</label
            >
            <input
              id="m-corpse"
              type="number"
              bind:value={m.corpse}
              oninput={() => markTouched("corpse")}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
