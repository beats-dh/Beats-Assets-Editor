<script lang="ts">
  import { npcState } from "../../../../stores/npcState.svelte";
  import { translate } from "../../../../i18n";
  import ColorField from "../../monster-editor/cards/ColorField.svelte";
  import MonsterOutfitPreview from "../../monster-editor/cards/MonsterOutfitPreview.svelte";

  let npc = $derived(npcState.currentNpc);

  function handleInput(field: string) {
    if (npcState.currentNpc) {
      if (!npcState.currentNpc.meta)
        npcState.currentNpc.meta = { missingFields: [], touchedFields: [] };
      if (!npcState.currentNpc.meta.touchedFields.includes(field)) {
        npcState.currentNpc.meta.touchedFields.push(field);
      }
      npcState.currentNpc.meta.missingFields =
        npcState.currentNpc.meta.missingFields.filter((f) => f !== field);
    }
  }

  function handleColorChange(
    field: "head" | "body" | "legs" | "feet",
    val: number,
  ) {
    if (!npc) return;
    if (!npc.outfit) {
      npc.outfit = {
        lookType: 0,
        lookHead: 0,
        lookBody: 0,
        lookLegs: 0,
        lookFeet: 0,
        lookAddons: 0,
        lookMount: 0,
      };
    }
    if (field === "head") npc.outfit.lookHead = val;
    else if (field === "body") npc.outfit.lookBody = val;
    else if (field === "legs") npc.outfit.lookLegs = val;
    else if (field === "feet") npc.outfit.lookFeet = val;

    handleInput("outfit");
  }
</script>

{#if npc && npc.outfit}
  <div class="monster-card">
    <div class="monster-card-header">{translate("npc.card.outfit.title")}</div>
    <div class="monster-card-body">
      <div class="card-content">
        <!-- Re-using existing preview canvas -->
        <MonsterOutfitPreview outfit={npc.outfit} />

        <div class="form-row" style="margin-top: 10px;">
          <div class="form-group">
            <label for="lookType">{translate("npc.card.outfit.lookType")}</label
            >
            <input
              id="lookType"
              type="number"
              bind:value={npc.outfit.lookType}
              onchange={() => handleInput("outfit")}
            />
          </div>
          <div class="form-group">
            <label for="lookMount"
              >{translate("npc.card.outfit.lookMount")}</label
            >
            <input
              id="lookMount"
              type="number"
              bind:value={npc.outfit.lookMount}
              onchange={() => handleInput("outfit")}
            />
          </div>
          <div class="form-group">
            <label for="lookAddons"
              >{translate("npc.card.outfit.lookAddons")}</label
            >
            <input
              id="lookAddons"
              type="number"
              bind:value={npc.outfit.lookAddons}
              onchange={() => handleInput("outfit")}
            />
          </div>
        </div>
        <div class="form-row">
          <!-- Re-using existing palette editor -->
          <ColorField
            label={translate("modal.static.head")}
            value={npc.outfit.lookHead}
            onChange={(v) => handleColorChange("head", v)}
          />
          <ColorField
            label={translate("modal.static.body")}
            value={npc.outfit.lookBody}
            onChange={(v) => handleColorChange("body", v)}
          />
          <ColorField
            label={translate("modal.static.legs")}
            value={npc.outfit.lookLegs}
            onChange={(v) => handleColorChange("legs", v)}
          />
          <ColorField
            label={translate("modal.static.feet")}
            value={npc.outfit.lookFeet}
            onChange={(v) => handleColorChange("feet", v)}
          />
        </div>
      </div>
    </div>
  </div>
{/if}
