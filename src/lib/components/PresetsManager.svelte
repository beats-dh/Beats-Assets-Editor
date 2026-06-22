<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "../../utils/invoke";
  import { COMMANDS } from "../../commands";
  import { translate } from "../../i18n";
  import { showStatus } from "../../utils";

  interface Preset {
    id: string;
    name: string;
    tibia_base_path?: string | null;
    monster_base_path?: string | null;
    npc_base_path?: string | null;
  }

  let presets = $state<Preset[]>([]);
  let activeId = $state<string | null>(null);

  async function load() {
    try {
      const state = await invoke<{
        presets: Preset[];
        active_preset_id: string | null;
      }>(COMMANDS.GET_PRESETS);
      presets = state.presets;
      activeId = state.active_preset_id;
    } catch (err) {
      console.error("Failed to load presets", err);
    }
  }

  onMount(load);

  async function saveCurrent() {
    const name = prompt(translate("settings.presets.namePrompt"));
    if (!name) return;
    try {
      const [tibia, monster, npc] = await Promise.all([
        invoke<string | null>(COMMANDS.GET_TIBIA_BASE_PATH),
        invoke<string | null>(COMMANDS.GET_MONSTER_BASE_PATH),
        invoke<string | null>(COMMANDS.GET_NPC_BASE_PATH),
      ]);
      const preset: Preset = {
        id: crypto.randomUUID(),
        name,
        tibia_base_path: tibia,
        monster_base_path: monster,
        npc_base_path: npc,
      };
      await invoke(COMMANDS.SAVE_PRESET, { preset });
      showStatus(translate("settings.presets.saved", { name }), "success");
      await load();
    } catch (err) {
      console.error("Failed to save preset", err);
      showStatus(translate("settings.presets.error"), "error");
    }
  }

  async function applyPreset(id: string) {
    try {
      await invoke(COMMANDS.APPLY_PRESET, { id });
      activeId = id;
      showStatus(translate("settings.presets.applied"), "success");
    } catch (err) {
      console.error("Failed to apply preset", err);
      showStatus(translate("settings.presets.error"), "error");
    }
  }

  async function removePreset(id: string) {
    try {
      await invoke(COMMANDS.DELETE_PRESET, { id });
      await load();
    } catch (err) {
      console.error("Failed to delete preset", err);
    }
  }
</script>

<div class="settings-section">
  <div class="settings-section-header">
    <h4 class="settings-title">{translate("settings.presets.title")}</h4>
    <p class="settings-description">
      {translate("settings.presets.description")}
    </p>
  </div>

  {#if presets.length === 0}
    <p class="settings-description">{translate("settings.presets.empty")}</p>
  {:else}
    <ul class="presets-list">
      {#each presets as p (p.id)}
        <li class="preset-row" class:active={p.id === activeId}>
          <span class="preset-name"
            >{p.name}{p.id === activeId ? " ●" : ""}</span
          >
          <span class="preset-actions">
            <button type="button" onclick={() => applyPreset(p.id)}>
              {translate("settings.presets.apply")}
            </button>
            <button
              type="button"
              class="preset-remove"
              title={translate("settings.presets.remove")}
              onclick={() => removePreset(p.id)}>✕</button
            >
          </span>
        </li>
      {/each}
    </ul>
  {/if}

  <button type="button" class="settings-select" onclick={saveCurrent}>
    {translate("settings.presets.saveCurrent")}
  </button>
</div>

<style>
  .presets-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .preset-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }
  .preset-row.active {
    border-color: var(--accent-color, #4f46e5);
  }
  .preset-name {
    color: var(--text-secondary);
  }
  .preset-actions {
    display: flex;
    gap: 4px;
  }
  .preset-actions button {
    font-size: 12px;
    padding: 2px 8px;
    cursor: pointer;
    background: var(--surface-bg);
    border: 1px solid var(--border-hover);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
  }
  .preset-remove:hover {
    color: var(--error-color);
  }
</style>
