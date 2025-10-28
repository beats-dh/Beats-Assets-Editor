import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { showStatus } from "./utils";
import { closeAssetDetails, refreshAssetDetails } from "./assetDetails";
import { getCurrentCategory, loadAssets } from "./assetUI";
import type { CompleteAppearanceItem } from "./types";
import { clearAssetSelection, removeAssetSelection } from "./assetSelection";
import type { AssetSelectionChangeDetail } from "./assetSelection";

const ACTION_CONTAINER_ID = "appearance-action-bar";
const ACTION_BUTTON_IDS = {
  export: "action-export-json",
  import: "action-import-json",
  duplicate: "action-duplicate",
  copy: "action-copy-flags",
  paste: "action-paste-flags",
  delete: "action-delete-appearance",
  create: "action-create-new"
} as const;
const SUPPORTED_CATEGORIES = new Set(["Objects", "Outfits", "Effects", "Missiles"]);

let initialized = false;
let actionBarBuilt = false;
let selectionListenerAttached = false;
let currentCategory: string | null = null;
let currentId: number | null = null;
let hasClipboard = false;

interface AssetTarget {
  category: string;
  id: number;
}

let selectedTargets: AssetTarget[] = [];
let primarySelection: AssetTarget | null = null;
let detailTarget: AssetTarget | null = null;

interface AppearanceRenderedDetail {
  category?: string;
  id?: number;
}

type ImportMode = "replace" | "new";

function filterSupportedTargets(targets: AssetTarget[]): AssetTarget[] {
  return targets.filter((target) => SUPPORTED_CATEGORIES.has(target.category));
}

function getSelectionPrimary(): AssetTarget | null {
  if (
    primarySelection &&
    selectedTargets.some(
      (item) => item.category === primarySelection!.category && item.id === primarySelection!.id
    )
  ) {
    return primarySelection;
  }

  if (selectedTargets.length > 0) {
    primarySelection = selectedTargets[selectedTargets.length - 1];
    return primarySelection;
  }

  primarySelection = null;
  return null;
}

function getActivePrimaryTarget(): AssetTarget | null {
  const selectionPrimary = getSelectionPrimary();
  if (selectionPrimary) {
    return selectionPrimary;
  }

  if (detailTarget && SUPPORTED_CATEGORIES.has(detailTarget.category)) {
    return detailTarget;
  }

  return null;
}

function getActionTargets(preferMultiple: boolean): AssetTarget[] {
  if (selectedTargets.length > 0) {
    if (preferMultiple) {
      return [...selectedTargets];
    }
    const primary = getSelectionPrimary();
    return primary ? [primary] : [];
  }

  if (detailTarget && SUPPORTED_CATEGORIES.has(detailTarget.category)) {
    return [detailTarget];
  }

  if (currentCategory && currentId !== null) {
    return [{ category: currentCategory, id: currentId }];
  }

  return [];
}

function applyActiveState(): void {
  const active = getActivePrimaryTarget();
  if (active) {
    currentCategory = active.category;
    currentId = active.id;
  } else {
    currentCategory = resolveCategory(null);
    currentId = null;
  }
  updateActionButtonStates();
}

function updateSelectionState(detail: AssetSelectionChangeDetail): void {
  const filtered = filterSupportedTargets(
    detail.selected.map((item) => ({ category: item.category, id: item.id }))
  );
  selectedTargets = filtered;
  if (detail.primary && SUPPORTED_CATEGORIES.has(detail.primary.category)) {
    primarySelection = { category: detail.primary.category, id: detail.primary.id };
  } else {
    primarySelection = null;
  }
  applyActiveState();
}

function getSingleTargetOrNotify(actionName: string): AssetTarget | null {
  const targets = getActionTargets(false);
  if (targets.length === 0) {
    showStatus(`Select an appearance to ${actionName}.`, "error");
    return null;
  }
  return targets[0];
}

function getBatchTargetsOrNotify(actionName: string): AssetTarget[] | null {
  const targets = getActionTargets(true);
  if (targets.length === 0) {
    showStatus(`Select at least one appearance to ${actionName}.`, "error");
    return null;
  }
  return targets;
}

async function handleExport(category: string, id: number): Promise<void> {
  try {
    const defaultName = `appearance-${id}.json`;
    const destination = await save({
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });

    if (!destination) {
      return;
    }

    await invoke("export_appearance_to_json", { category, id, path: destination });
    showStatus(`Appearance #${id} exported successfully`, "success");
  } catch (error) {
    console.error("Failed to export appearance", error);
    showStatus("Failed to export appearance", "error");
  }
}

async function handleImport(category: string, _currentId: number): Promise<void> {
  try {
    const selection = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });

    if (typeof selection !== "string" || !selection) {
      return;
    }

    let mode: ImportMode = "replace";
    if (!window.confirm("Import will replace the current appearance. Click Cancel to import as new object.")) {
      mode = "new";
    }

    let newId: number | null = null;
    if (mode === "new") {
      const userValue = window.prompt("Enter a new object ID (leave blank to auto assign)", "");
      if (userValue && userValue.trim().length > 0) {
        const parsed = Number(userValue);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          newId = parsed;
        } else {
          showStatus("Invalid ID provided. Using automatic assignment.", "error");
        }
      }
    }

    const result = await invoke<CompleteAppearanceItem>("import_appearance_from_json", {
      category,
      path: selection,
      mode,
      newId
    });

    const imported = result as CompleteAppearanceItem;
    await invoke("save_appearances_file");
    await loadAssets();
    await refreshAssetDetails(category, imported.id);
    showStatus(`Appearance imported as #${imported.id}`, "success");
  } catch (error) {
    console.error("Failed to import appearance", error);
    showStatus("Failed to import appearance", "error");
  }
}

async function handleDuplicate(category: string, id: number): Promise<void> {
  try {
    const desiredIdInput = window.prompt("Enter the new ID for the duplicated appearance (leave blank to auto assign)", "");
    let desiredId: number | null = null;
    if (desiredIdInput && desiredIdInput.trim().length > 0) {
      const parsed = Number(desiredIdInput);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        desiredId = parsed;
      } else {
        showStatus("Invalid ID provided. Using automatic assignment.", "error");
      }
    }

    const result = await invoke<CompleteAppearanceItem>("duplicate_appearance", {
      category,
      sourceId: id,
      targetId: desiredId
    });

    const duplicated = result as CompleteAppearanceItem;
    await invoke("save_appearances_file");
    await loadAssets();
    await refreshAssetDetails(category, duplicated.id);
    showStatus(`Appearance duplicated as #${duplicated.id}`, "success");
  } catch (error) {
    console.error("Failed to duplicate appearance", error);
    showStatus("Failed to duplicate appearance", "error");
  }
}

async function handleCreateNew(category: string): Promise<void> {
  try {
    const idValue = window.prompt("Enter the ID for the new appearance (leave blank to auto assign)", "");
    let desiredId: number | null = null;
    if (idValue && idValue.trim().length > 0) {
      const parsed = Number(idValue);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        desiredId = parsed;
      } else {
        showStatus("Invalid ID provided. Using automatic assignment.", "error");
      }
    }

    const name = window.prompt("Enter a name for the new appearance (optional)", "");
    const description = window.prompt("Enter a description for the new appearance (optional)", "");

    const result = await invoke<CompleteAppearanceItem>("create_empty_appearance", {
      category,
      newId: desiredId,
      name: name && name.trim().length > 0 ? name : null,
      description: description && description.trim().length > 0 ? description : null
    });

    const created = result as CompleteAppearanceItem;
    await invoke("save_appearances_file");
    await loadAssets();
    await refreshAssetDetails(category, created.id);
    showStatus(`Created new appearance #${created.id}`, "success");
  } catch (error) {
    console.error("Failed to create appearance", error);
    showStatus("Failed to create appearance", "error");
  }
}

async function handleCopyFlags(category: string, id: number): Promise<void> {
  try {
    await invoke("copy_appearance_flags", { category, id });
    hasClipboard = true;
    updateActionButtonStates();
    showStatus(`Flags copied from #${id}`, "success");
  } catch (error) {
    console.error("Failed to copy flags", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("clipboard")) {
      hasClipboard = false;
      updateActionButtonStates();
    }
    showStatus("Failed to copy flags", "error");
  }
}

async function handlePasteFlagsBatch(targets: AssetTarget[]): Promise<void> {
  if (targets.length === 0) {
    return;
  }

  try {
    for (const target of targets) {
      await invoke("paste_appearance_flags", { category: target.category, id: target.id });
    }
    await invoke("save_appearances_file");
    await loadAssets();

    const currentDetail = detailTarget;
    const shouldRefresh =
      Boolean(
        currentDetail &&
        targets.some((target) => target.category === currentDetail.category && target.id === currentDetail.id)
      );
    if (shouldRefresh && currentDetail) {
      await refreshAssetDetails(currentDetail.category, currentDetail.id);
    }

    hasClipboard = true;
    const message =
      targets.length === 1
        ? `Flags applied to #${targets[0].id}`
        : `Flags applied to ${targets.length} appearances`;
    showStatus(message, "success");
  } catch (error) {
    console.error("Failed to paste flags", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("clipboard")) {
      hasClipboard = false;
    }
    showStatus("Failed to paste flags", "error");
  } finally {
    updateActionButtonStates();
  }
}

async function handleDeleteAppearances(targets: AssetTarget[]): Promise<void> {
  const uniqueTargets = filterSupportedTargets(
    targets.map((target) => ({ category: target.category, id: target.id }))
  );

  if (uniqueTargets.length === 0) {
    return;
  }

  if (uniqueTargets.length === 1) {
    const target = uniqueTargets[0];
    if (!window.confirm(`Delete appearance #${target.id}? This action cannot be undone.`)) {
      return;
    }
  } else {
    const ids = uniqueTargets.map((target) => `#${target.id}`).join(", ");
    if (!window.confirm(`Delete ${uniqueTargets.length} appearances (${ids})? This action cannot be undone.`)) {
      return;
    }
  }

  try {
    for (const target of uniqueTargets) {
      await invoke("delete_appearance", { category: target.category, id: target.id });
      removeAssetSelection(target.category, target.id);
    }
    await invoke("save_appearances_file");
    await loadAssets();
    closeAssetDetails();
    clearAssetSelection();
    setActionSelection(resolveCategory(null), null);
    const message =
      uniqueTargets.length === 1
        ? `Appearance #${uniqueTargets[0].id} deleted`
        : `Deleted ${uniqueTargets.length} appearances`;
    showStatus(message, "success");
  } catch (error) {
    console.error("Failed to delete appearance", error);
    showStatus("Failed to delete appearance", "error");
  } finally {
    updateActionButtonStates();
  }
}

function resolveCategory(candidate: string | null): string | null {
  if (candidate && SUPPORTED_CATEGORIES.has(candidate)) {
    return candidate;
  }
  const active = getCurrentCategory();
  return SUPPORTED_CATEGORIES.has(active) ? active : null;
}

function ensureActionBar(): HTMLDivElement | null {
  const container = document.getElementById(ACTION_CONTAINER_ID) as HTMLDivElement | null;
  if (!container) {
    return null;
  }

  if (!actionBarBuilt) {
    container.innerHTML = `
      <div class="appearance-action-group">
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.import}">Import</button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.export}">Export</button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.duplicate}">Duplicate</button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.copy}">Copy Flags</button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.paste}">Paste Flags</button>
        <button type="button" class="appearance-action-button destructive" id="${ACTION_BUTTON_IDS.delete}">Delete</button>
        <button type="button" class="appearance-action-button primary" id="${ACTION_BUTTON_IDS.create}">New</button>
      </div>
    `;

    const importBtn = getActionButton("import");
    importBtn?.addEventListener("click", () => {
      const target = getSingleTargetOrNotify("import");
      if (target) {
        void handleImport(target.category, target.id);
      }
    });

    const exportBtn = getActionButton("export");
    exportBtn?.addEventListener("click", () => {
      const target = getSingleTargetOrNotify("export");
      if (target) {
        void handleExport(target.category, target.id);
      }
    });

    const duplicateBtn = getActionButton("duplicate");
    duplicateBtn?.addEventListener("click", () => {
      const target = getSingleTargetOrNotify("duplicate");
      if (target) {
        void handleDuplicate(target.category, target.id);
      }
    });

    const copyBtn = getActionButton("copy");
    copyBtn?.addEventListener("click", () => {
      const target = getSingleTargetOrNotify("copy flags from");
      if (target) {
        void handleCopyFlags(target.category, target.id);
      }
    });

    const pasteBtn = getActionButton("paste");
    pasteBtn?.addEventListener("click", () => {
      if (!hasClipboard) {
        showStatus("Copy flags before pasting.", "error");
        return;
      }
      const targets = getBatchTargetsOrNotify("paste flags into");
      if (targets) {
        void handlePasteFlagsBatch(targets);
      }
    });

    const deleteBtn = getActionButton("delete");
    deleteBtn?.addEventListener("click", () => {
      const targets = getBatchTargetsOrNotify("delete");
      if (targets) {
        void handleDeleteAppearances(targets);
      }
    });

    const createBtn = getActionButton("create");
    createBtn?.addEventListener("click", () => {
      const category = currentCategory || resolveCategory(null);
      if (category) {
        void handleCreateNew(category);
      }
    });

    actionBarBuilt = true;
  }

  return container;
}

function getActionButton(key: keyof typeof ACTION_BUTTON_IDS): HTMLButtonElement | null {
  const container = document.getElementById(ACTION_CONTAINER_ID);
  if (!container) {
    return null;
  }
  return container.querySelector<HTMLButtonElement>(`#${ACTION_BUTTON_IDS[key]}`);
}

function updateActionButtonStates(): void {
  const container = ensureActionBar();
  if (!container) {
    return;
  }

  const hasSingleTarget = getActionTargets(false).length > 0;
  const hasBatchTargets = getActionTargets(true).length > 0;
  const hasCategory = Boolean(resolveCategory(currentCategory));

  const importBtn = getActionButton("import");
  if (importBtn) {
    importBtn.disabled = !hasSingleTarget;
  }

  const exportBtn = getActionButton("export");
  if (exportBtn) {
    exportBtn.disabled = !hasSingleTarget;
  }

  const duplicateBtn = getActionButton("duplicate");
  if (duplicateBtn) {
    duplicateBtn.disabled = !hasSingleTarget;
  }

  const copyBtn = getActionButton("copy");
  if (copyBtn) {
    copyBtn.disabled = !hasSingleTarget;
  }

  const pasteBtn = getActionButton("paste");
  if (pasteBtn) {
    pasteBtn.disabled = !hasBatchTargets || !hasClipboard;
  }

  const deleteBtn = getActionButton("delete");
  if (deleteBtn) {
    deleteBtn.disabled = !hasBatchTargets;
  }

  const createBtn = getActionButton("create");
  if (createBtn) {
    createBtn.disabled = !hasCategory;
  }
}

function setActionSelection(category: string | null, id: number | null): void {
  const resolved = resolveCategory(category);
  detailTarget = resolved && typeof id === "number" ? { category: resolved, id } : null;
  applyActiveState();
}

function attachDetailListener(): void {
  document.addEventListener("appearance-details-rendered", (event: Event) => {
    const custom = event as CustomEvent<AppearanceRenderedDetail>;
    const detail = custom.detail;
    const category = detail ? resolveCategory(detail.category ?? null) : resolveCategory(null);
    const id = detail && typeof detail.id === "number" ? detail.id : null;
    setActionSelection(category, id);
  });

  document.addEventListener("appearance-details-closed", () => {
    setActionSelection(resolveCategory(null), null);
  });
}

function attachSelectionListener(): void {
  if (selectionListenerAttached) {
    return;
  }

  document.addEventListener("asset-selection-changed", (event: Event) => {
    const custom = event as CustomEvent<AssetSelectionChangeDetail>;
    updateSelectionState(custom.detail);
  });

  selectionListenerAttached = true;
}

export function setupImportExportFeature(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  ensureActionBar();
  setActionSelection(resolveCategory(null), null);
  attachDetailListener();
  attachSelectionListener();
}
