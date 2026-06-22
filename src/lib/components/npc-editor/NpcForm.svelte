<script lang="ts">
  import { npcState } from "../../../stores/npcState.svelte";
  import { invoke } from "../../../utils/invoke";
  import { COMMANDS } from "../../../commands";
  import { translate } from "../../../i18n";
  import { showStatus } from "../../../utils";

  import BasicInfoCard from "./cards/BasicInfoCard.svelte";
  import OutfitCard from "./cards/OutfitCard.svelte";
  import FlagsCard from "./cards/FlagsCard.svelte";
  import VoicesCard from "./cards/VoicesCard.svelte";
  import ShopCard from "./cards/ShopCard.svelte";
  import DialoguesCard from "./cards/DialoguesCard.svelte";
  import ScriptingCard from "./cards/ScriptingCard.svelte";

  async function handleSave() {
    if (!npcState.currentNpc || !npcState.currentFilePath) return;

    if (!npcState.currentNpc.meta) {
      npcState.currentNpc.meta = { missingFields: [], touchedFields: [] };
    }

    try {
      await invoke(COMMANDS.SAVE_NPC_FILE, {
        filePath: npcState.currentFilePath,
        npc: npcState.currentNpc,
      });
      showStatus(translate("npc.form.saved"), "success");
      window.dispatchEvent(new CustomEvent("reload-npc-list"));
    } catch (err) {
      showStatus(translate("npc.form.error.save", { err: String(err) }), "error");
    }
  }
</script>

<div class="monster-editor-area">
  {#if !npcState.currentNpc}
    <div class="monster-editor-empty">{translate("npc.form.empty")}</div>
  {:else}
    <div class="monster-editor-toolbar">
      <button class="btn-primary" onclick={handleSave}
        >{translate("npc.form.saveBtn")}</button
      >
    </div>

    <div class="monster-content-area">
      <div class="monster-cards-grid">
        <OutfitCard />
        <BasicInfoCard />
        <FlagsCard />
        <VoicesCard />
        <ShopCard />
        <div style="grid-column: 1 / -1; display: grid; gap: 16px;">
          <DialoguesCard />
          <ScriptingCard />
        </div>
      </div>
    </div>
  {/if}
</div>
