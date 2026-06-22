<script lang="ts">
  import { translate } from "../../i18n";

  interface Props {
    onApply: (flags: string[], animatedOnly: boolean) => void;
    onClear: () => void;
  }
  let { onApply, onClear }: Props = $props();

  // Same keys as the editor flag list / backend set_bool_flag mapping.
  const FLAG_KEYS = [
    "clip",
    "bottom",
    "top",
    "container",
    "cumulative",
    "usable",
    "forceuse",
    "multiuse",
    "liquidpool",
    "liquidcontainer",
    "unpass",
    "unmove",
    "unsight",
    "avoid",
    "no_movement_animation",
    "take",
    "hang",
    "rotate",
    "dont_hide",
    "translucent",
    "lying_object",
    "animate_always",
    "fullbank",
    "ignore_look",
    "wrap",
    "unwrap",
    "topeffect",
    "corpse",
    "player_corpse",
    "ammo",
    "show_off_socket",
    "reportable",
    "reverse_addons_east",
    "reverse_addons_west",
    "reverse_addons_south",
    "reverse_addons_north",
    "wearout",
    "clockexpire",
    "expire",
    "expirestop",
    "deco_item_kit",
    "dual_wielding",
  ];

  let selected = $state<Set<string>>(new Set());
  let animatedOnly = $state(false);
  let selectedCount = $derived(selected.size);

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selected = next;
  }

  function apply() {
    onApply(Array.from(selected), animatedOnly);
  }

  function clear() {
    selected = new Set();
    animatedOnly = false;
    onClear();
  }
</script>

<div class="flag-search-panel">
  <div class="flag-search-grid">
    {#each FLAG_KEYS as key}
      <label class="flag-search-toggle">
        <input
          type="checkbox"
          checked={selected.has(key)}
          onchange={() => toggle(key)}
        />
        <span>{translate(`asset.flags.${key}` as any)}</span>
      </label>
    {/each}
  </div>
  <div class="flag-search-actions">
    <label class="flag-search-toggle">
      <input type="checkbox" bind:checked={animatedOnly} />
      <span>{translate("flagSearch.animatedOnly")}</span>
    </label>
    <div class="flag-search-buttons">
      <button type="button" class="appearance-action-button" onclick={clear}>
        {translate("flagSearch.clear")}
      </button>
      <button
        type="button"
        class="appearance-action-button primary"
        onclick={apply}
        disabled={selectedCount === 0 && !animatedOnly}
      >
        {translate("flagSearch.apply", { count: String(selectedCount) })}
      </button>
    </div>
  </div>
</div>

<style>
  .flag-search-panel {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--surface-elevated, var(--secondary-bg));
    padding: 12px 16px;
    margin: 8px 16px 0;
  }
  .flag-search-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 4px 12px;
    max-height: 240px;
    overflow-y: auto;
  }
  .flag-search-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    white-space: nowrap;
  }
  .flag-search-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border-color);
  }
  .flag-search-buttons {
    display: flex;
    gap: 8px;
  }
</style>
