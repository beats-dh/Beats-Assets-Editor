<script lang="ts">
  import { monsterState } from "../../../stores/monsterState.svelte";
  import { invoke } from "../../../utils/invoke";
  import { translate } from "../../../i18n";
  import { showStatus } from "../../../utils";
  import type { MonsterListEntry, Monster } from "../../../monsterTypes";

  interface Props {
    entry: MonsterListEntry;
    depth?: number;
  }
  let { entry, depth = 0 }: Props = $props();

  let isActive = $derived(monsterState.currentFilePath === entry.filePath);

  async function loadMonster() {
    if (monsterState.isLoading) return;
    try {
      const monster = await invoke<Monster>("load_monster_file", {
        filePath: entry.filePath,
      });
      if (monster) {
        if (!monster.meta)
          monster.meta = { missingFields: [], touchedFields: [] };
        if (!monster.events) monster.events = [];
      }
      monsterState.currentMonster = monster;
      monsterState.currentFilePath = entry.filePath;
    } catch (err) {
      console.error(err);
      showStatus(translate("monster.list.error.load", { err: String(err) }), "error");
    }
  }
</script>

<div
  class="monster-list-item"
  class:active={isActive}
  style="padding-left: {depth * 12 + 24}px"
  onclick={loadMonster}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      loadMonster();
    }
  }}
  role="button"
  tabindex="0"
>
  {entry.name}
</div>
