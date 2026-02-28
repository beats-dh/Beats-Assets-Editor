<script lang="ts">
  import { npcState } from "../../../stores/npcState.svelte";
  import { invoke } from "../../../utils/invoke";
  import { translate } from "../../../i18n";
  import type { NpcListEntry, Npc } from "../../../npcTypes";

  interface Props {
    entry: NpcListEntry;
    depth?: number;
  }
  let { entry, depth = 0 }: Props = $props();

  let isActive = $derived(npcState.currentFilePath === entry.filePath);

  async function loadNpc() {
    if (npcState.isLoading) return;
    try {
      const npc = await invoke<Npc>("load_npc_file", {
        filePath: entry.filePath,
      });
      if (npc) {
        if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
      }
      npcState.currentNpc = npc;
      npcState.currentFilePath = entry.filePath;
    } catch (err) {
      console.error(err);
      alert(translate("npc.list.error.load", { err: String(err) }));
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="monster-list-item"
  class:active={isActive}
  style="padding-left: {depth * 12 + 24}px"
  onclick={loadNpc}
  role="button"
  tabindex="0"
>
  {entry.name}
</div>
