import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "../utils/invoke";
import { COMMANDS } from "../commands";
import { translate } from "../i18n";
import { loadAssetsData } from "./assetService";
import { openImportModal, type ImportContext } from "../stores/importExportStore";
import { openConfirmModal } from "../stores/confirmStore"; // Need to check/create this wrapper
import { clearAssetSelection, removeAssetSelection } from "../stores/selectionStore";

// Helper for status (assuming utils has it or we mock it)
// We might need to import showStatus from a different place if utils.ts was deleted.
// Actually utils.ts seems to exist in src/utils.ts? No, I see src/utils/ in the file list.
// Let's assume src/utils/index.ts or similar exports it, or I'll implement a basic one if needed.
// Looking at Launcher.svelte: import { showStatus } from '../utils'; -> this likely refers to src/utils.ts if it exists in root?
// The file list showed 'utils.ts' in root.

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
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
    });

    if (!destination) {
      return;
    }

    const lower = destination.toLowerCase();
    const useAec = lower.endsWith('.aec');
    const command = useAec ? COMMANDS.EXPORT_APPEARANCE_TO_AEC : COMMANDS.EXPORT_APPEARANCE_TO_JSON;
    await invoke(command, { category, id, path: destination });
    // showStatus(translate('status.appearanceExported', { id }), "success");
    alert(translate('status.appearanceExported', { id })); // Fallback
  } catch (error) {
    console.error("Failed to export appearance", error);
    alert(translate('status.appearanceExportFailed'));
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
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
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
      startIds
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
      skipped: skippedCount
    });
    alert(message); // Fallback for showStatus
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
    // Logic for Undo would go here (saving snapshots), simplifying for now
    
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
