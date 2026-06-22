import { save, open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { invoke } from "../utils/invoke";
import { COMMANDS } from "../commands";
import { translate } from "../i18n";
import { loadAssetsData } from "./assetService";
import { openImportModal, type ImportContext } from "../stores/importExportState.svelte";
import { openConfirmModal } from "../stores/confirmState.svelte";
import { clearAssetSelection, removeAssetSelection } from "../stores/selectionState.svelte";

interface AssetTarget {
  category: string;
  id: number;
}

interface ImportBatchResult {
  imported: number[];
  skipped: number[];
}

export async function handleExport(category: string, id: number): Promise<void> {
  try {
    const defaultName = `appearance-${id}.json`;
    const destination = await save({
      defaultPath: defaultName,
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }],
    });

    if (!destination) return;

    const lower = destination.toLowerCase();
    const useAec = lower.endsWith('.aec');
    const command = useAec ? COMMANDS.EXPORT_APPEARANCE_TO_AEC : COMMANDS.EXPORT_APPEARANCE_TO_JSON;
    await invoke(command, { category, id, path: destination });
    alert(translate('status.appearanceExported', { id }));
  } catch (error) {
    console.error("Failed to export appearance", error);
    alert(translate('status.appearanceExportFailed'));
  }
}

export async function exportQueueToFolder(
  items: { category: string; id: number }[],
  format: "aec" | "json",
): Promise<boolean> {
  if (items.length === 0) return false;
  const dir = await open({
    directory: true,
    multiple: false,
    title: translate("export.queue.dialogTitle"),
  });
  if (!dir || typeof dir !== "string") return false;

  const ext = format === "aec" ? "aec" : "json";
  const command =
    format === "aec"
      ? COMMANDS.EXPORT_APPEARANCE_TO_AEC
      : COMMANDS.EXPORT_APPEARANCE_TO_JSON;

  let ok = 0;
  const failed: number[] = [];
  for (const item of items) {
    try {
      const path = `${dir}/${item.category}-${item.id}.${ext}`;
      await invoke(command, { category: item.category, id: item.id, path });
      ok++;
    } catch (err) {
      console.error("Failed to export queued item", item, err);
      failed.push(item.id);
    }
  }
  alert(
    translate("status.queueExported", {
      ok: String(ok),
      total: String(items.length),
    }),
  );
  return failed.length === 0;
}

/**
 * F2 — compiles all imported sprites into the client's catalog (DESTRUCTIVE:
 * rewrites catalog-content.json and adds a .cwm sheet, backing the catalog up to
 * .bak). Reloads the sprite catalog and saves the appearances so the remapped
 * sprite references persist. Confirmed first because it overwrites game assets.
 */
export async function handleCompileImportedSprites(): Promise<void> {
  const confirmed = await openConfirmModal(
    translate("confirm.compileSprites"),
    translate("action.button.compileSprites"),
  );
  if (!confirmed) return;

  try {
    const tibiaPath = await invoke<string | null>(COMMANDS.GET_TIBIA_BASE_PATH);
    if (!tibiaPath) {
      alert(translate("status.compileNoPath"));
      return;
    }
    const assetsDir = await join(tibiaPath, "assets");
    const catalogPath = await join(assetsDir, "catalog-content.json");

    const result = await invoke<{ sprites_compiled: number; sheet_file: string }>(
      COMMANDS.COMPILE_IMPORTED_SPRITES,
      { assetsDir, catalogPath },
    );

    // Reload the catalog so the new sheet is visible, then persist remapped refs.
    await invoke(COMMANDS.LOAD_SPRITES_CATALOG, { catalogPath, assetsDir });
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssetsData();

    alert(
      translate("status.compileDone", {
        count: String(result.sprites_compiled),
        file: result.sheet_file,
      }),
    );
  } catch (err) {
    console.error("Failed to compile imported sprites", err);
    alert(translate("status.compileFailed", { err: String(err) }));
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
    const ids = await invoke<number[]>(COMMANDS.IMPORT_IMAGE_AS_TILES, {
      filePath: file,
      tileWidth: 32,
      tileHeight: 32,
      chromaKeyEnabled: true,
      chromaKeyColor: "#FF00FF",
    });
    return ids;
  } catch (err) {
    console.error("Failed to import image as tiles", err);
    alert(translate("status.imageImportFailed"));
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
    alert(translate("status.spritesExported", { count: String(written.length) }));
  } catch (error) {
    console.error("Failed to export sprites", error);
    alert(translate("status.spritesExportFailed"));
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
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      await loadAssetsData();
    }

    const messageKey = skippedCount > 0 ? 'status.appearanceImportSummary' : 'status.appearanceImportBatch';
    const message = translate(messageKey, {
      count: importedCount,
      imported: importedCount,
      skipped: skippedCount,
    });
    alert(message);
  } catch (error) {
    console.error("Failed to import appearance", error);
    alert(translate('status.appearanceImportFailed'));
  }
}

// Clipboard state for flags
let hasClipboard = false;

export async function handleCopyFlags(category: string, id: number): Promise<void> {
  try {
    await invoke(COMMANDS.COPY_APPEARANCE_FLAGS, { category, id });
    hasClipboard = true;
    alert(translate('status.flagsCopied', { id }));
  } catch (error) {
    console.error("Failed to copy flags", error);
    hasClipboard = false;
    alert(translate('status.flagsCopyFailed'));
  }
}

export async function handlePasteFlagsBatch(targets: AssetTarget[]): Promise<void> {
  if (targets.length === 0) return;
  if (!hasClipboard) {
    alert(translate('status.copyFlagsBeforePasting'));
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
    alert(message);
  } catch (error) {
    console.error("Failed to paste flags", error);
    alert(translate('status.flagsPasteFailed'));
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
    alert(message);
  } catch (error) {
    console.error("Failed to delete appearance", error);
    alert(translate('status.appearanceDeleteFailed'));
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
    alert(translate('status.appearancesDuplicatedBatch', { count: String(newIds.length) }));
    return newIds;
  } catch (error) {
    console.error("Failed to duplicate appearances", error);
    alert(translate('status.appearanceDuplicateFailed') || 'Failed to duplicate');
    return null;
  }
}

export async function handleDuplicate(category: string, id: number, newId?: number): Promise<number | null> {
  try {
    let targetId = newId;
    if (targetId === undefined) {
      const idInput = prompt(translate('prompt.enterDuplicateId') || 'Enter new ID for duplicate (leave empty for auto):', '');
      if (idInput === null) return null;

      if (idInput.trim()) {
        targetId = Number.parseInt(idInput, 10);
        if (Number.isNaN(targetId)) {
          alert(translate('status.invalidId') || 'Invalid ID');
          return null;
        }
        if (category === 'Objects' && targetId <= 100) {
          alert(translate('status.idTooLow'));
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

    alert(translate('status.appearanceDuplicated', { id, newId: duplicatedId }) || `Duplicated #${id} to #${duplicatedId}`);
    return duplicatedId;
  } catch (error) {
    console.error("Failed to duplicate appearance", error);
    alert(translate('status.appearanceDuplicateFailed') || 'Failed to duplicate');
    return null;
  }
}

export async function handleCreateNew(category: string, desiredId?: number): Promise<number | null> {
  try {
    let newId = desiredId;

    if (newId === undefined) {
      const idInput = prompt(translate('prompt.enterNewId') || 'Enter ID for new appearance (leave empty for auto):', '');
      if (idInput === null) return null;

      if (idInput.trim()) {
        newId = Number.parseInt(idInput, 10);
        if (Number.isNaN(newId)) {
          alert(translate('status.invalidId') || 'Invalid ID');
          return null;
        }
        if (category === 'Objects' && newId <= 100) {
          alert(translate('status.idTooLow'));
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

    alert(translate('status.appearanceCreated', { id: createdId }) || `Created appearance #${createdId}`);
    return createdId;
  } catch (error) {
    console.error("Failed to create appearance", error);
    alert(translate('status.appearanceCreateFailed') || 'Failed to create');
    return null;
  }
}

export function getHasClipboard(): boolean {
  return hasClipboard;
}

export type { AssetTarget };
