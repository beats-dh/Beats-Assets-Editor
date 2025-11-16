import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { showStatus } from "../utils";
import { translate, type TranslationKey } from "../i18n";
import { closeAssetDetails, refreshAssetDetails } from "../assetDetails";
import { getCurrentCategory, loadAssets } from "../assetUI";
import type { CompleteAppearanceItem } from "../types";
import { clearAssetSelection, removeAssetSelection } from "../assetSelection";
import type { AssetSelectionChangeDetail } from "../assetSelection";
import { initExportModal, openExportModal } from "./exportModal";

type SkippedImport = {
  category: string;
  id: number;
  reason: string;
  source_path?: string;
};

type ImportResponse = {
  inserted: CompleteAppearanceItem[];
  skipped: SkippedImport[];
};

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
type ActionMessageKey = "import" | "export" | "duplicate" | "copyFlagsFrom" | "pasteFlagsInto" | "delete";
const ACTION_VERB_KEYS: Record<ActionMessageKey, TranslationKey> = {
  import: "action.verb.import",
  export: "action.verb.export",
  duplicate: "action.verb.duplicate",
  copyFlagsFrom: "action.verb.copyFlagsFrom",
  pasteFlagsInto: "action.verb.pasteFlagsInto",
  delete: "action.verb.delete"
};
const ACTION_BUTTON_LABEL_KEYS: Record<keyof typeof ACTION_BUTTON_IDS, TranslationKey> = {
  export: "action.button.export",
  import: "action.button.import",
  duplicate: "action.button.duplicate",
  copy: "action.button.copyFlags",
  paste: "action.button.pasteFlags",
  delete: "action.button.delete",
  create: "action.button.new"
};
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

const translateActionVerb = (action: ActionMessageKey): string => translate(ACTION_VERB_KEYS[action]);

let selectedTargets: AssetTarget[] = [];
let primarySelection: AssetTarget | null = null;
let detailTarget: AssetTarget | null = null;

const SKIPPED_REASON_SAMPLE_LIMIT = 5;

function getFileNameFromPath(path?: string | null): string | null {
  if (!path) {
    return null;
  }
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (segments.length === 0) {
    return path;
  }
  const lastSegment = segments[segments.length - 1];
  return lastSegment || path;
}

function formatSkippedDetails(skipped: SkippedImport[]): string {
  if (skipped.length === 0) {
    return "";
  }

  const grouped = new Map<
    string,
    { reason: string; source?: string | null; ids: number[] }
  >();

  skipped.forEach((entry) => {
    const key = `${entry.reason}:${entry.source_path ?? ""}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.ids.push(entry.id);
    } else {
      grouped.set(key, {
        reason: entry.reason,
        source: entry.source_path,
        ids: [entry.id]
      });
    }
  });

  return Array.from(grouped.values())
    .map((group) => {
      const reasonText = translate(
        `status.importSkipped.reason.${group.reason}` as TranslationKey,
        { count: group.ids.length }
      );
      const idList = group.ids
        .slice(0, SKIPPED_REASON_SAMPLE_LIMIT)
        .map((id) => `#${id}`)
        .join(", ");
      const remaining =
        group.ids.length > SKIPPED_REASON_SAMPLE_LIMIT
          ? ` +${group.ids.length - SKIPPED_REASON_SAMPLE_LIMIT}`
          : "";
      const sourceName = getFileNameFromPath(group.source);
      const fileSuffix = sourceName ? ` @ ${sourceName}` : "";
      return `${reasonText} (${idList}${remaining})${fileSuffix}`;
    })
    .join(" • ");
}

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

function getSingleTargetOrNotify(action: ActionMessageKey): AssetTarget | null {
  const targets = getActionTargets(false);
  if (targets.length === 0) {
    showStatus(
      translate('status.selectAppearanceAction', {
        action: translateActionVerb(action)
      }),
      "error"
    );
    return null;
  }
  return targets[0];
}

function getBatchTargetsOrNotify(action: ActionMessageKey): AssetTarget[] | null {
  const targets = getActionTargets(true);
  if (targets.length === 0) {
    showStatus(
      translate('status.selectMultipleAppearances', {
        action: translateActionVerb(action)
      }),
      "error"
    );
    return null;
  }
  return targets;
}

async function handleExport(category?: string, referenceId?: number): Promise<void> {
  console.info("Export modal triggered", { category, referenceId });
  const opened = await openExportModal(category, referenceId);
  if (!opened) {
    console.warn("Unable to open export modal; see previous log.");
  }
}

async function handleImport(category: string): Promise<void> {
  try {
    const selection = await open({
      multiple: true,
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
    });

    const singleSelection = typeof selection === "string" ? selection : "";
    const paths = Array.isArray(selection)
      ? selection.filter((item): item is string => typeof item === "string" && item.length > 0)
      : singleSelection.length > 0
        ? [singleSelection]
        : [];

    if (paths.length === 0) {
      return;
    }

    const mode: ImportMode = "new";
    const importedItems: CompleteAppearanceItem[] = [];
    const skippedItems: SkippedImport[] = [];
    const failedImports: { path: string; error: unknown }[] = [];

    for (const path of paths) {
      try {
        const result = await invoke<ImportResponse>("import_appearance_from_file", {
          category,
          path,
          mode
        });
        if (result?.inserted) {
          importedItems.push(...result.inserted);
        }
        if (result?.skipped) {
          skippedItems.push(...result.skipped);
        }
      } catch (error) {
        failedImports.push({ path, error });
        console.error(`Failed to import appearance from ${path}`, error);
      }
    }

    if (skippedItems.length > 0) {
      const detailText = formatSkippedDetails(skippedItems);
      showStatus(
        translate('status.importSkippedSummary', {
          count: skippedItems.length,
          details: detailText
        }),
        "info"
      );
    }

    if (importedItems.length > 0) {
      await invoke("save_appearances_file");
      await loadAssets();
      const lastImported = importedItems[importedItems.length - 1];
      await refreshAssetDetails(category, lastImported.id);

      const statusKey =
        importedItems.length === 1 ? 'status.appearanceImported' : 'status.appearancesImportedBatch';
      const statusPayload: Record<string, number> =
        importedItems.length === 1
          ? { id: lastImported.id }
          : { count: importedItems.length };
      showStatus(translate(statusKey, statusPayload), "success");
    }

    if (failedImports.length > 0) {
      const level = importedItems.length === 0 ? "error" : "warning";
      const failedDetails = failedImports
        .map((entry) => getFileNameFromPath(entry.path) ?? entry.path)
        .filter(Boolean)
        .join(", ");
      const suffix = failedDetails ? ` (${failedDetails})` : "";
      showStatus(
        `${translate('status.appearanceImportPartial', {
          success: importedItems.length,
          failed: failedImports.length
        })}${suffix}`,
        level
      );
    }
  } catch (error) {
    console.error("Failed to import appearance", error);
    showStatus(translate('status.appearanceImportFailed'), "error");
  }
}

async function handleDuplicate(category: string, id: number): Promise<void> {
  try {
    const desiredIdInput = window.prompt(translate('prompt.enterDuplicateId'), "");
    let desiredId: number | null = null;
    if (desiredIdInput && desiredIdInput.trim().length > 0) {
      const parsed = Number(desiredIdInput);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        desiredId = parsed;
      } else {
        showStatus(translate('status.invalidIdAuto'), "error");
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
    showStatus(translate('status.appearanceDuplicated', { id: duplicated.id }), "success");
  } catch (error) {
    console.error("Failed to duplicate appearance", error);
    showStatus(translate('status.appearanceDuplicateFailed'), "error");
  }
}

async function handleCreateNew(category: string): Promise<void> {
  try {
    const idValue = window.prompt(translate('prompt.enterNewId'), "");
    let desiredId: number | null = null;
    if (idValue && idValue.trim().length > 0) {
      const parsed = Number(idValue);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        desiredId = parsed;
      } else {
        showStatus(translate('status.invalidIdAuto'), "error");
      }
    }

    const name = window.prompt(translate('prompt.enterName'), "");
    const description = window.prompt(translate('prompt.enterDescription'), "");

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
    showStatus(translate('status.appearanceCreated', { id: created.id }), "success");
  } catch (error) {
    console.error("Failed to create appearance", error);
    showStatus(translate('status.appearanceCreateFailed'), "error");
  }
}

async function handleCopyFlags(category: string, id: number): Promise<void> {
  try {
    await invoke("copy_appearance_flags", { category, id });
    hasClipboard = true;
    updateActionButtonStates();
    showStatus(translate('status.flagsCopied', { id }), "success");
  } catch (error) {
    console.error("Failed to copy flags", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("clipboard")) {
      hasClipboard = false;
      updateActionButtonStates();
    }
    showStatus(translate('status.flagsCopyFailed'), "error");
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
        ? translate('status.flagsAppliedSingle', { id: targets[0].id })
        : translate('status.flagsAppliedMultiple', { count: targets.length });
    showStatus(message, "success");
  } catch (error) {
    console.error("Failed to paste flags", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("clipboard")) {
      hasClipboard = false;
    }
    showStatus(translate('status.flagsPasteFailed'), "error");
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
    if (!window.confirm(translate('confirm.deleteSingle', { id: target.id }))) {
      return;
    }
  } else {
    const ids = uniqueTargets.map((target) => `#${target.id}`).join(", ");
    if (!window.confirm(translate('confirm.deleteMultiple', { count: uniqueTargets.length, ids }))) {
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
        ? translate('status.appearanceDeletedSingle', { id: uniqueTargets[0].id })
        : translate('status.appearanceDeletedMultiple', { count: uniqueTargets.length });
    showStatus(message, "success");
  } catch (error) {
    console.error("Failed to delete appearance", error);
    showStatus(translate('status.appearanceDeleteFailed'), "error");
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
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.import}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.import}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.import)}
        </button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.export}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.export}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.export)}
        </button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.duplicate}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.duplicate}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.duplicate)}
        </button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.copy}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.copy}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.copy)}
        </button>
        <button type="button" class="appearance-action-button" id="${ACTION_BUTTON_IDS.paste}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.paste}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.paste)}
        </button>
        <button type="button" class="appearance-action-button destructive" id="${ACTION_BUTTON_IDS.delete}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.delete}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.delete)}
        </button>
        <button type="button" class="appearance-action-button primary" id="${ACTION_BUTTON_IDS.create}" data-i18n="${ACTION_BUTTON_LABEL_KEYS.create}">
          ${translate(ACTION_BUTTON_LABEL_KEYS.create)}
        </button>
      </div>
    `;

    const importBtn = getActionButton("import");
    importBtn?.addEventListener("click", () => {
      const category = resolveCategory(currentCategory);
      if (!category) {
        showStatus(translate('status.selectCategoryFirst'), "error");
        return;
      }
      void handleImport(category);
    });

    const exportBtn = getActionButton("export");
    exportBtn?.addEventListener("click", () => {
      const reference = typeof currentId === "number" ? currentId : undefined;
      void handleExport(currentCategory ?? undefined, reference);
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
      const target = getSingleTargetOrNotify("copyFlagsFrom");
      if (target) {
        void handleCopyFlags(target.category, target.id);
      }
    });

    const pasteBtn = getActionButton("paste");
    pasteBtn?.addEventListener("click", () => {
      if (!hasClipboard) {
        showStatus(translate('status.copyFlagsBeforePasting'), "error");
        return;
      }
      const targets = getBatchTargetsOrNotify("pasteFlagsInto");
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

export function updateActionButtonStates(): void {
  // First check if we should even show the action bar for this category
  const activeCategory = getCurrentCategory();
  const shouldShow = SUPPORTED_CATEGORIES.has(activeCategory);

  // Get the action bar container directly (don't build it if not already built)
  const container = document.getElementById(ACTION_CONTAINER_ID) as HTMLDivElement | null;
  if (!container) {
    return;
  }

  // Show or hide based on category support
  if (!shouldShow) {
    container.style.display = 'none';
    return;
  } else {
    container.style.display = 'flex';
  }

  // Now ensure buttons are built
  ensureActionBar();

  const hasSingleTarget = getActionTargets(false).length > 0;
  const hasBatchTargets = getActionTargets(true).length > 0;
  const hasCategory = Boolean(resolveCategory(currentCategory));

  const importBtn = getActionButton("import");
  if (importBtn) {
    importBtn.disabled = !hasCategory;
  }

  const exportBtn = getActionButton("export");
  if (exportBtn) {
    exportBtn.disabled = !hasCategory;
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
  initExportModal();
  ensureActionBar();
  setActionSelection(resolveCategory(null), null);
  attachDetailListener();
  attachSelectionListener();
}
