<script lang="ts">
  import { monsterState } from "../../../../stores/monsterState.svelte";
  import { translate } from "../../../../i18n";
  import ColorField from "./ColorField.svelte";
  import MonsterOutfitPreview from "./MonsterOutfitPreview.svelte";
  import { OUTFIT_COLOR_COUNT } from "../utils";
  let m = $derived(monsterState.currentMonster);

  function randomizeColors() {
    if (!m) return;
    const rnd = () => Math.floor(Math.random() * OUTFIT_COLOR_COUNT);
    handleColorChange("head", rnd());
    handleColorChange("body", rnd());
    handleColorChange("legs", rnd());
    handleColorChange("feet", rnd());
  }

  function handleColorChange(
    field: "head" | "body" | "legs" | "feet",
    val: number,
  ) {
    if (!m) return;
    if (!m.outfit) {
      m.outfit = {
        lookType: 0,
        lookHead: 0,
        lookBody: 0,
        lookLegs: 0,
        lookFeet: 0,
        lookAddons: 0,
        lookMount: 0,
      };
    }
    if (field === "head") m.outfit.lookHead = val;
    else if (field === "body") m.outfit.lookBody = val;
    else if (field === "legs") m.outfit.lookLegs = val;
    else if (field === "feet") m.outfit.lookFeet = val;
  }
</script>

{#if m && m.outfit}
  <div class="monster-card">
    <div class="monster-card-header">
      {translate("monster.card.outfit.title")}
    </div>
    <div class="monster-card-body">
      <div class="card-content">
        <MonsterOutfitPreview outfit={m.outfit} />

        <div class="form-row">
          <div class="form-group">
            <label for="outfit-type"
              >{translate("monster.card.outfit.lookType")}</label
            ><input
              id="outfit-type"
              type="number"
              bind:value={m.outfit.lookType}
            />
          </div>
          <div class="form-group">
            <label for="outfit-type-ex"
              >{translate("monster.card.outfit.lookTypeEx")}</label
            ><input
              id="outfit-type-ex"
              type="number"
              value={0}
              disabled
              title={translate("monster.card.outfit.lookTypeExTitle")}
            />
          </div>
          <div class="form-group">
            <label for="outfit-mount"
              >{translate("monster.card.outfit.mount")}</label
            ><input
              id="outfit-mount"
              type="number"
              bind:value={m.outfit.lookMount}
            />
          </div>
        </div>
        <div class="form-row">
          <ColorField
            label={translate("monster.card.outfit.head")}
            value={m.outfit.lookHead}
            onChange={(v) => handleColorChange("head", v)}
          />
          <ColorField
            label={translate("monster.card.outfit.body")}
            value={m.outfit.lookBody}
            onChange={(v) => handleColorChange("body", v)}
          />
          <ColorField
            label={translate("monster.card.outfit.legs")}
            value={m.outfit.lookLegs}
            onChange={(v) => handleColorChange("legs", v)}
          />
          <ColorField
            label={translate("monster.card.outfit.feet")}
            value={m.outfit.lookFeet}
            onChange={(v) => handleColorChange("feet", v)}
          />
          <button
            type="button"
            class="card-edit-button outfit-randomize-btn"
            title={translate("monster.card.outfit.randomize")}
            onclick={randomizeColors}>🎲</button
          >
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="outfit-addons"
              >{translate("monster.card.outfit.addons")}</label
            ><input
              id="outfit-addons"
              type="number"
              bind:value={m.outfit.lookAddons}
            />
          </div>
          <div class="form-group">
            <label for="outfit-corpse"
              >{translate("monster.card.outfit.corpse")}</label
            ><input id="outfit-corpse" type="number" bind:value={m.corpse} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
