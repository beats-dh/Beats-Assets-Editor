import { save, open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { invoke } from "../utils/invoke";
import { COMMANDS } from "../commands";
import { translate } from "../i18n";
import { showStatus } from "../utils";
import { loadAssetsData } from "./assetService";
import { openImportModal, type ImportContext } from "../stores/importExportState.svelte";
import { openConfirmModal } from "../stores/confirmState.svelte";
import { openPromptModal } from "../stores/promptState.svelte";
import { clearAssetSelection, removeAssetSelection } from "../stores/selectionState.svelte";
import { importedSpritesState, refreshImportedSpriteCount } from "../stores/importedSpritesState.svelte";
import { openSpriteImportSizeModal, isStandardTileSize } from "../stores/spriteImportSizeState.svelte";

interface AssetTarget {
  category: string;
  id: number;
}

interface ImportBatchResult {
  imported: number[];
  skipped: number[];
}

interface CompiledSheet {
  file: string;
  first_sprite_id: number;
  last_sprite_id: number;
  sprite_type: number;
  count: number;
}

interface CompileResult {
  sprites_compiled: number;
  sheets: CompiledSheet[];
  remap: [number, number][];
}

export async function handleExport(category: string, id: number): Promise<void> {
  try {
    // Default to AEC: it embeds the sprite bytes (field 7), so the exported
    // asset actually carries its images and can be re-imported (here or in the
    // C# Assets-Editor). JSON stays available but is metadata-only.
    const defaultName = `appearance-${id}.aec`;
    const destination = await save({
      defaultPath: defaultName,
      filters: [{ name: "Appearance", extensions: ["aec", "json"] }],
    });

    if (!destination) return;

    const lower = destination.toLowerCase();
    const useAec = !lower.endsWith('.json');
    const command = useAec ? COMMANDS.EXPORT_APPEARANCE_TO_AEC : COMMANDS.EXPORT_APPEARANCE_TO_JSON;
    await invoke(command, { category, id, path: destination });
    showStatus(translate('status.appearanceExported', { id }), 'success');
  } catch (error) {
    console.error("Failed to export appearance", error);
    showStatus(translate('status.appearanceExportFailed'), 'error');
  }
}

export async function exportQueueToFolder(
  items: { category: string; id: number }[],
  format: "aec" | "json",
): Promise<boolean> {
  if (items.length === 0) return false;

  // AEC: one self-contained bundle carrying every selected appearance plus its
  // sprites (field 7). "Save as" a single file, C# Assets-Editor compatible.
  if (format === "aec") {
    const destination = await save({
      defaultPath: "appearances.aec",
      filters: [{ name: "Appearance Bundle", extensions: ["aec"] }],
      title: translate("export.queue.dialogTitle"),
    });
    if (!destination) return false;

    try {
      await invoke(COMMANDS.EXPORT_APPEARANCES_TO_AEC_BUNDLE, {
        items: items.map((i) => ({ category: i.category, id: i.id })),
        path: destination,
      });
      showStatus(
        translate("status.queueExported", {
          ok: String(items.length),
          total: String(items.length),
        }),
        "success",
      );
      return true;
    } catch (err) {
      console.error("Failed to export AEC bundle", err);
      showStatus(
        translate("status.queueExported", { ok: "0", total: String(items.length) }),
        "error",
      );
      return false;
    }
  }

  // JSON: metadata-only, one file per item into a chosen folder (no sprites).
  const dir = await open({
    directory: true,
    multiple: false,
    title: translate("export.queue.dialogTitle"),
  });
  if (!dir || typeof dir !== "string") return false;

  let ok = 0;
  const failed: number[] = [];
  for (const item of items) {
    try {
      const path = `${dir}/${item.category}-${item.id}.json`;
      await invoke(COMMANDS.EXPORT_APPEARANCE_TO_JSON, { category: item.category, id: item.id, path });
      ok++;
    } catch (err) {
      console.error("Failed to export queued item", item, err);
      failed.push(item.id);
    }
  }
  showStatus(
    translate("status.queueExported", {
      ok: String(ok),
      total: String(items.length),
    }),
    failed.length === 0 ? "success" : "error",
  );
  return failed.length === 0;
}

/**
 * Bake the backend's pending imported sprites into the client's catalog
 * (DESTRUCTIVE: writes a .cwm sheet + updates catalog-content.json, backing it
 * up to .bak) and reload the sprite catalog so the new sheet is live and the
 * remapped appearance sprite references resolve. The caller is responsible for
 * saving the appearances afterwards. Throws if the tibia path is unknown.
 */
async function persistImportedSpritesToCatalog(): Promise<CompileResult> {
  const tibiaPath = await invoke<string | null>(COMMANDS.GET_TIBIA_BASE_PATH);
  if (!tibiaPath) {
    throw new Error(translate("status.compileNoPath"));
  }
  const assetsDir = await join(tibiaPath, "assets");
  const catalogPath = await join(assetsDir, "catalog-content.json");

  const result = await invoke<CompileResult>(
    COMMANDS.COMPILE_IMPORTED_SPRITES,
    { assetsDir, catalogPath },
  );
  // Reload the catalog so the new sheet is visible to the sprite loader.
  await invoke(COMMANDS.LOAD_SPRITES_CATALOG, { catalogPath, assetsDir });
  // The backend cleared the imported buffer; sync the badge/button visibility.
  await refreshImportedSpriteCount();
  return result;
}

/**
 * F2 — compiles all imported sprites into the client's catalog and saves the
 * appearances so the remapped sprite references persist. Confirmed first
 * because it overwrites game assets.
 */
export async function handleCompileImportedSprites(): Promise<void> {
  const confirmed = await openConfirmModal(
    translate("confirm.compileSprites"),
    translate("action.button.compileSprites"),
  );
  if (!confirmed) return;

  try {
    const result = await persistImportedSpritesToCatalog();
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();

    showStatus(
      translate("status.compileDone", {
        count: String(result.sprites_compiled),
        sheets: String(result.sheets.length),
      }),
      "success",
    );
  } catch (err) {
    console.error("Failed to compile imported sprites", err);
    showStatus(translate("status.compileFailed", { err: String(err) }), 'error');
  }
}

export async function handleImportImageTiles(): Promise<number[] | null> {
  const file = await open({
    multiple: false,
    filters: [{ name: "Image", extensions: ["png", "bmp"] }],
    title: translate("texture.spriteList.importDialogTitle"),
  });
  if (!file || typeof file !== "string") return null;
  try {
    // Decide the tile size: if the image already is one of the four standard
    // sprite sizes, import it as a single sprite; otherwise let the user pick a
    // tile size to slice the (larger) sheet into.
    const { width, height } = await invoke<{ width: number; height: number }>(
      COMMANDS.GET_IMAGE_DIMENSIONS,
      { filePath: file },
    );

    let tileWidth: number;
    let tileHeight: number;
    if (isStandardTileSize(width, height)) {
      tileWidth = width;
      tileHeight = height;
    } else {
      const size = await openSpriteImportSizeModal(width, height);
      if (size === null) return null; // cancelled
      tileWidth = size.width;
      tileHeight = size.height;
    }

    // Guard against silently dropping edge pixels (backend truncates cols/rows).
    if (width % tileWidth !== 0 || height % tileHeight !== 0) {
      showStatus(
        translate("status.imageNotDivisible", {
          width: String(width),
          height: String(height),
          tile: `${tileWidth}×${tileHeight}`,
        }),
        "error",
      );
      return null;
    }

    const ids = await invoke<number[]>(COMMANDS.IMPORT_IMAGE_AS_TILES, {
      filePath: file,
      tileWidth,
      tileHeight,
      chromaKeyEnabled: true,
      chromaKeyColor: "#FF00FF",
    });
    // Reveal the header "Compile imported sprites" action now that there are
    // pending sprites to compile.
    await refreshImportedSpriteCount();
    return ids;
  } catch (err) {
    console.error("Failed to import image as tiles", err);
    showStatus(translate("status.imageImportFailed"), 'error');
    return null;
  }
}

export async function handleExportSprites(spriteIds: number[]): Promise<void> {
  if (!spriteIds || spriteIds.length === 0) return;
  try {
    const dir = await open({
      directory: true,
      multiple: false,
      title: translate("texture.spriteList.exportDialogTitle"),
    });
    if (!dir || typeof dir !== "string") return;
    const written = await invoke<string[]>(COMMANDS.EXPORT_SPRITES_TO_PNG, {
      spriteIds,
      destinationDir: dir,
    });
    showStatus(translate("status.spritesExported", { count: String(written.length) }), 'success');
  } catch (error) {
    console.error("Failed to export sprites", error);
    showStatus(translate("status.spritesExportFailed"), 'error');
  }
}

function normalizeFileSelection(selection: string | string[] | null): string[] {
  if (!selection) return [];
  return Array.isArray(selection) ? selection : [selection];
}

export async function handleImport(): Promise<void> {
  try {
    const selection = await open({
      multiple: true,
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }],
    });

    const paths = normalizeFileSelection(selection);
    if (paths.length === 0) return;

    // Get context for the modal
    const context = await invoke<ImportContext>(COMMANDS.GET_IMPORT_CONTEXT, { paths });

    // Open modal and wait for result
    const startIds = await openImportModal(paths, context);
    if (startIds === null) return;

    const result = await invoke<ImportBatchResult>(COMMANDS.IMPORT_APPEARANCES_FROM_FILES_ALL, {
      paths,
      startIds,
    });

    const importedCount = result.imported.length;
    const skippedCount = result.skipped.length;

    if (importedCount > 0) {
      // The import may have pulled sprite bytes into the backend's pending
      // buffer (from AEC field 7 or the legacy .sprites companion). Bake them
      // into the catalog BEFORE saving, otherwise the appearances would persist
      // references to transient in-memory sprite IDs that vanish on reload —
      // the exact reason imports used to "lose" their sprites.
      await refreshImportedSpriteCount();
      if (importedSpritesState.count > 0) {
        await persistImportedSpritesToCatalog();
      }
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      await loadAssetsData();
    }

    const messageKey = skippedCount > 0 ? 'status.appearanceImportSummary' : 'status.appearanceImportBatch';
    const message = translate(messageKey, {
      count: importedCount,
      imported: importedCount,
      skipped: skippedCount,
    });
    showStatus(message, 'success');
  } catch (error) {
    console.error("Failed to import appearance", error);
    showStatus(translate('status.appearanceImportFailed'), 'error');
  }
}

// Clipboard state for flags
let hasClipboard = false;

export async function handleCopyFlags(category: string, id: number): Promise<void> {
  try {
    await invoke(COMMANDS.COPY_APPEARANCE_FLAGS, { category, id });
    hasClipboard = true;
    showStatus(translate('status.flagsCopied', { id }), 'success');
  } catch (error) {
    console.error("Failed to copy flags", error);
    hasClipboard = false;
    showStatus(translate('status.flagsCopyFailed'), 'error');
  }
}

export async function handlePasteFlagsBatch(targets: AssetTarget[]): Promise<void> {
  if (targets.length === 0) return;
  if (!hasClipboard) {
    showStatus(translate('status.copyFlagsBeforePasting'), 'error');
    return;
  }

  try {
    for (const target of targets) {
      await invoke(COMMANDS.PASTE_APPEARANCE_FLAGS, { category: target.category, id: target.id });
    }
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();

    const message = targets.length === 1
      ? translate('status.flagsAppliedSingle', { id: targets[0].id })
      : translate('status.flagsAppliedMultiple', { count: targets.length });
    showStatus(message, 'success');
  } catch (error) {
    console.error("Failed to paste flags", error);
    showStatus(translate('status.flagsPasteFailed'), 'error');
  }
}

export async function handleDeleteAppearances(targets: AssetTarget[]): Promise<void> {
  if (targets.length === 0) return;

  const confirmed = await openConfirmModal(
    targets.length === 1
      ? translate('confirm.deleteSingle', { id: targets[0].id })
      : translate('confirm.deleteMultiple', { count: targets.length, ids: targets.map(t => `#${t.id}`).join(", ") }),
    translate('action.verb.delete')
  );

  if (!confirmed) return;

  try {
    for (const target of targets) {
      await invoke(COMMANDS.DELETE_APPEARANCE, { category: target.category, id: target.id });
      removeAssetSelection(target.category, target.id);
    }
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();
    clearAssetSelection();

    const message = targets.length === 1
      ? translate('status.appearanceDeletedSingle', { id: targets[0].id })
      : translate('status.appearanceDeletedMultiple', { count: targets.length });
    showStatus(message, 'success');
  } catch (error) {
    console.error("Failed to delete appearance", error);
    showStatus(translate('status.appearanceDeleteFailed'), 'error');
  }
}

export async function handleDuplicateBatch(category: string, ids: number[], remapRefs = true): Promise<number[] | null> {
  if (ids.length === 0) return null;
  try {
    const pairs = await invoke<[number, number][]>(COMMANDS.DUPLICATE_APPEARANCES_BATCH, {
      category,
      sourceIds: ids,
      remapRefs,
    });
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();
    const newIds = pairs.map((p) => p[1]);
    showStatus(translate('status.appearancesDuplicatedBatch', { count: String(newIds.length) }), 'success');
    return newIds;
  } catch (error) {
    console.error("Failed to duplicate appearances", error);
    showStatus(translate('status.appearanceDuplicateFailed') || 'Failed to duplicate', 'error');
    return null;
  }
}

export async function handleDuplicate(category: string, id: number, newId?: number): Promise<number | null> {
  try {
    let targetId = newId;
    if (targetId === undefined) {
      const idInput = await openPromptModal({ title: translate('prompt.enterDuplicateId') });
      if (idInput === null) return null;

      if (idInput.trim()) {
        targetId = Number.parseInt(idInput, 10);
        if (Number.isNaN(targetId)) {
          showStatus(translate('status.invalidId') || 'Invalid ID', 'error');
          return null;
        }
        if (category === 'Objects' && targetId <= 100) {
          showStatus(translate('status.idTooLow'), 'error');
          return null;
        }
      }
    }

    const duplicatedId = await invoke<number>(COMMANDS.DUPLICATE_APPEARANCE, {
      category,
      sourceId: id,
      targetId,
    });

    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();

    showStatus(translate('status.appearanceDuplicated', { id, newId: duplicatedId }) || `Duplicated #${id} to #${duplicatedId}`, 'success');
    return duplicatedId;
  } catch (error) {
    console.error("Failed to duplicate appearance", error);
    showStatus(translate('status.appearanceDuplicateFailed') || 'Failed to duplicate', 'error');
    return null;
  }
}

export async function handleCreateNew(category: string, desiredId?: number): Promise<number | null> {
  try {
    let newId = desiredId;

    if (newId === undefined) {
      const idInput = await openPromptModal({ title: translate('prompt.enterNewId') });
      if (idInput === null) return null;

      if (idInput.trim()) {
        newId = Number.parseInt(idInput, 10);
        if (Number.isNaN(newId)) {
          showStatus(translate('status.invalidId') || 'Invalid ID', 'error');
          return null;
        }
        if (category === 'Objects' && newId <= 100) {
          showStatus(translate('status.idTooLow'), 'error');
          return null;
        }
      }
    }

    const createdId = await invoke<number>(COMMANDS.CREATE_EMPTY_APPEARANCE, {
      category,
      newId,
    });

    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();

    showStatus(translate('status.appearanceCreated', { id: createdId }) || `Created appearance #${createdId}`, 'success');
    return createdId;
  } catch (error) {
    console.error("Failed to create appearance", error);
    showStatus(translate('status.appearanceCreateFailed') || 'Failed to create', 'error');
    return null;
  }
}

export function getHasClipboard(): boolean {
  return hasClipboard;
}

export type { AssetTarget };
