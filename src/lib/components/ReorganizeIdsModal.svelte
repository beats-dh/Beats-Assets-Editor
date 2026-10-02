<script lang="ts">
  import { save } from "@tauri-apps/plugin-dialog";
  import { join } from "@tauri-apps/api/path";
  import { invoke } from "../../utils/invoke";
  import { COMMANDS } from "../../commands";
  import { translate } from "../../i18n";
  import { showStatus } from "../../utils";
  import { loadAssetsData } from "../../services/assetService";
  import { appState } from "../../stores/appState.svelte";
  import { openConfirmModal } from "../../stores/confirmState.svelte";
  import {
    reorganizeIdsState,
    closeReorganizeIds,
  } from "../../stores/reorganizeIdsState.svelte";

  type Category = "Objects" | "Outfits" | "Effects" | "Missiles";
  const CATEGORIES: Category[] = ["Objects", "Outfits", "Effects", "Missiles"];

  interface Preview {
    count: number;
    changed: number;
    freed_from: number;
    freed_to: number;
  }
  interface ReorgResult {
    remap: [number, number][];
    count: number;
    changed: number;
    freed_from: number;
    freed_to: number;
  }
  interface CascadeResult {
    scanned: number;
    updated: number;
    replacements: number;
  }

  interface CatConfig {
    enabled: boolean;
    from: number | null;
    to: number | null;
  }

  function blankConfig(): Record<Category, CatConfig> {
    return {
      Objects: { enabled: false, from: null, to: null },
      Outfits: { enabled: false, from: null, to: null },
      Effects: { enabled: false, from: null, to: null },
      Missiles: { enabled: false, from: null, to: null },
    };
  }

  let cfg = $state<Record<Category, CatConfig>>(blankConfig());
  let previews = $state<Record<Category, Preview | null>>({
    Objects: null,
    Outfits: null,
    Effects: null,
    Missiles: null,
  });
  let busy = $state(false);

  // Enabled categories whose range is valid (from >= 1, from <= to).
  const validSelections = $derived(
    CATEGORIES.filter((c) => {
      const k = cfg[c];
      return (
        k.enabled &&
        k.from !== null &&
        k.to !== null &&
        k.from >= 1 &&
        k.from <= k.to
      );
    }),
  );

  function resetAndClose() {
    cfg = blankConfig();
    previews = {
      Objects: null,
      Outfits: null,
      Effects: null,
      Missiles: null,
    };
    closeReorganizeIds();
  }

  async function doPreview() {
    if (validSelections.length === 0 || busy) return;
    busy = true;
    try {
      for (const c of validSelections) {
        const k = cfg[c];
        previews[c] = await invoke<Preview>(
          COMMANDS.PREVIEW_REORGANIZE_APPEARANCE_IDS,
          { category: c, from: k.from, to: k.to },
        );
      }
    } catch (err) {
      console.error("Failed to preview reorganize", err);
      showStatus(translate("status.reorganizeFailed", { err: String(err) }), "error");
    } finally {
      busy = false;
    }
  }

  async function exportRemapMap(remapByCat: Record<string, [number, number][]>) {
    const anyMoved = Object.values(remapByCat).some((r) => r.length > 0);
    if (!anyMoved) return;
    const dest = await save({
      defaultPath: "id-remap.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
      title: translate("reorganize.exportMapTitle"),
    });
    if (!dest) return;
    const json = JSON.stringify({ categories: remapByCat }, null, 2);
    const bytes = Array.from(new TextEncoder().encode(json));
    await invoke(COMMANDS.SAVE_IMAGE_BYTES, { path: dest, bytes });
  }

  async function doApply() {
    if (validSelections.length === 0 || busy) return;

    const confirmed = await openConfirmModal(
      translate("reorganize.confirm", { count: String(validSelections.length) }),
      translate("reorganize.applyButton"),
    );
    if (!confirmed) return;

    busy = true;
    try {
      const remapByCat: Record<string, [number, number][]> = {};
      let totalChanged = 0;

      for (const c of validSelections) {
        const k = cfg[c];
        const result = await invoke<ReorgResult>(
          COMMANDS.REORGANIZE_APPEARANCE_IDS,
          { category: c, from: k.from, to: k.to },
        );
        remapByCat[c] = result.remap;
        totalChanged += result.changed;
      }

      // Persist the .dat so the renumbered ids and rewired internal references
      // survive a reload.
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);

      // Cascade the maps to the editor-managed files. Outfit ids drive monster/
      // npc lookType/lookMount and staticdata outfits; object ids drive npc shop
      // clientId. effect/missile have no external references here.
      const outfitRemap = remapByCat["Outfits"] ?? [];
      const objectRemap = remapByCat["Objects"] ?? [];
      let monstersUpdated = 0;
      let npcsUpdated = 0;
      let staticdataChanged = 0;

      if (outfitRemap.length > 0 && appState.monsterPath) {
        const r = await invoke<CascadeResult>(COMMANDS.APPLY_OUTFIT_REMAP_TO_MONSTERS, {
          monstersPath: appState.monsterPath,
          remap: outfitRemap,
        });
        monstersUpdated = r.updated;
      }
      if ((outfitRemap.length > 0 || objectRemap.length > 0) && appState.npcPath) {
        const r = await invoke<CascadeResult>(COMMANDS.APPLY_ID_REMAP_TO_NPCS, {
          npcsPath: appState.npcPath,
          outfitRemap,
          objectRemap,
        });
        npcsUpdated = r.updated;
      }
      if (outfitRemap.length > 0 && appState.tibiaPath) {
        staticdataChanged = await invoke<number>(COMMANDS.APPLY_OUTFIT_REMAP_TO_STATICDATA, {
          remap: outfitRemap,
        });
        if (staticdataChanged > 0) {
          const files = await invoke<string[]>(COMMANDS.LIST_STATICDATA_FILES, {
            tibiaPath: appState.tibiaPath,
          });
          if (files.length > 0) {
            const sdPath = await join(appState.tibiaPath, "assets", files[0]);
            await invoke(COMMANDS.SAVE_STATICDATA_FILE, { path: sdPath });
          }
        }
      }

      await loadAssetsData();

      // Export the old->new map so the user can fix server-side scripts/items.xml
      // /map by hand (those are outside the editor).
      await exportRemapMap(remapByCat);

      showStatus(
        translate("reorganize.done", {
          changed: String(totalChanged),
          monsters: String(monstersUpdated),
          npcs: String(npcsUpdated),
          staticdata: String(staticdataChanged),
        }),
        "success",
      );
      resetAndClose();
    } catch (err) {
      console.error("Failed to reorganize ids", err);
      showStatus(translate("status.reorganizeFailed", { err: String(err) }), "error");
    } finally {
      busy = false;
    }
  }
</script>

{#if reorganizeIdsState.isOpen}
  <div
    class="modal-backdrop"
    onclick={resetAndClose}
    onkeydown={(e) => {
      if (e.key === "Escape") resetAndClose();
    }}
    role="button"
    tabindex="0"
  >
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="modal-header">
        <h3>{translate("reorganize.title")}</h3>
        <button class="close-btn" onclick={resetAndClose}>&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">{translate("reorganize.description")}</p>

        <div class="cat-list">
          {#each CATEGORIES as c (c)}
            <div class="cat-row" class:disabled={!cfg[c].enabled}>
              <label class="cat-toggle">
                <input type="checkbox" bind:checked={cfg[c].enabled} />
                <span>{translate("category." + c.toLowerCase())}</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder={translate("reorganize.from")}
                bind:value={cfg[c].from}
                disabled={!cfg[c].enabled}
              />
              <input
                type="number"
                min="1"
                placeholder={translate("reorganize.to")}
                bind:value={cfg[c].to}
                disabled={!cfg[c].enabled}
              />
              <span class="cat-preview">
                {#if previews[c]}
                  {translate("reorganize.previewLine", {
                    count: String(previews[c]!.count),
                    changed: String(previews[c]!.changed),
                    from: String(previews[c]!.freed_from),
                    to: String(previews[c]!.freed_to),
                  })}
                {/if}
              </span>
            </div>
          {/each}
        </div>

        <p class="warn">{translate("reorganize.warning")}</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={resetAndClose} disabled={busy}
          >{translate("action.button.cancel")}</button
        >
        <button
          class="btn-secondary"
          onclick={doPreview}
          disabled={busy || validSelections.length === 0}
          >{translate("reorganize.previewButton")}</button
        >
        <button
          class="btn-primary"
          onclick={doApply}
          disabled={busy || validSelections.length === 0}
          >{translate("reorganize.applyButton")}</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  .modal-content {
    background: var(--surface-card);
    border-radius: 8px;
    width: 640px;
    max-width: 94%;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
  }
  .modal-body {
    padding: 1.5rem;
  }
  .modal-description {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }
  .cat-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cat-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 2fr;
    gap: 0.6rem;
    align-items: center;
    padding: 0.4rem 0.5rem;
    background: var(--surface-hover);
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }
  .cat-row.disabled {
    opacity: 0.55;
  }
  .cat-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }
  .cat-preview {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }
  input[type="number"] {
    background: var(--surface-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    width: 100%;
  }
  .warn {
    margin-top: 1rem;
    font-size: 0.82rem;
    color: var(--warning-color, #d08a2a);
  }
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .btn-primary {
    background: var(--primary-accent);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary {
    background: var(--surface-hover);
    color: var(--text-primary);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    cursor: pointer;
  }
</style>
