// ✅ IMPROVED: Using type-safe utilities
import { join, tempDir } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { showStatus } from "./utils";
import { translate, type TranslationKey } from "./i18n";
import { closeAssetDetails, refreshAssetDetails } from "./assetDetails";
import { getCurrentCategory, loadAssets } from "./assetUI";
import type { CompleteAppearanceItem } from "./types";
import { clearAssetSelection, removeAssetSelection } from "./assetSelection";
import type { AssetSelectionChangeDetail } from "./assetSelection";
import { recordAction } from "./history";
import { openConfirmModal } from "./confirmModal";
import { invoke } from "./utils/invoke";
import { COMMANDS } from "./commands";
import { modalClosed, modalOpened } from "./modalState";

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

function parseNumericId(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function promptForRequiredId(promptKey: TranslationKey): number | null {
  const input = window.prompt(translate(promptKey), "");
  if (input === null) {
    return null;
  }
  const parsed = parseNumericId(input);
  if (parsed === null) {
    showStatus(translate('status.invalidId'), "error");
    return null;
  }
  return parsed;
}

function promptForOptionalId(promptKey: TranslationKey): number | null {
  const input = window.prompt(translate(promptKey), "");
  if (input === null) {
    return null;
  }
  if (!input.trim()) {
    return null;
  }
  const parsed = parseNumericId(input);
  if (parsed === null) {
    showStatus(translate('status.invalidIdAuto'), "error");
    return null;
  }
  return parsed;
}

function normalizeFileSelection(selection: string | string[] | null): string[] {
  if (!selection) {
    return [];
  }
  return Array.isArray(selection) ? selection : [selection];
}

interface AppearanceRenderedDetail {
  category?: string;
  id?: number;
}

interface ImportBatchResult {
  imported: number[];
  skipped: number[];
}

interface ImportStartIds {
  objects?: number | null;
  outfits?: number | null;
  effects?: number | null;
  missiles?: number | null;
}

interface ImportPresence {
  objects: boolean;
  outfits: boolean;
  effects: boolean;
  missiles: boolean;
}

interface LatestAssetIds {
  objects: number;
  outfits: number;
  effects: number;
  missiles: number;
  sounds: number;
}

interface ImportContext {
  latest: LatestAssetIds;
  present: ImportPresence;
}

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

  const grid = document.querySelector('#assets-grid');
  if (grid) {
    const checked = Array.from(grid.querySelectorAll<HTMLInputElement>('.asset-select-checkbox:checked'));
    if (checked.length > 0) {
      const targets = checked
        .map((input) => {
          const id = Number(input.dataset.assetId);
          const category = input.dataset.category;
          if (!Number.isNaN(id) && category) {
            return { category, id };
          }
          return null;
        })
        .filter((item): item is AssetTarget => Boolean(item));

      if (targets.length > 0) {
        if (preferMultiple) {
          return targets;
        }
        return [targets[targets.length - 1]];
      }
    }
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

async function handleExport(category: string, id: number): Promise<void> {
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
    showStatus(translate('status.appearanceExported', { id }), "success");
  } catch (error) {
    console.error("Failed to export appearance", error);
    showStatus(translate('status.appearanceExportFailed'), "error");
  }
}

async function handleImport(_category: string): Promise<void> {
  try {
    const selection = await open({
      multiple: true,
      filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
    });

    const paths = normalizeFileSelection(selection);
    if (paths.length === 0) {
      return;
    }

    const startIds = await promptForImportStartIds(paths);
    if (startIds === null) {
      return;
    }

    const result = await invoke<ImportBatchResult>(COMMANDS.IMPORT_APPEARANCES_FROM_FILES_ALL, {
      paths,
      startIds
    });

    const importedCount = result.imported.length;
    const skippedCount = result.skipped.length;

    if (importedCount > 0) {
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      await loadAssets();
    }

    const messageKey = skippedCount > 0 ? 'status.appearanceImportSummary' : 'status.appearanceImportBatch';
    const message = translate(messageKey, {
      count: importedCount,
      imported: importedCount,
      skipped: skippedCount
    });
    showStatus(message, importedCount > 0 ? "success" : "error");
  } catch (error) {
    console.error("Failed to import appearance", error);
    showStatus(translate('status.appearanceImportFailed'), "error");
  }
}

async function promptForImportStartIds(paths: string[]): Promise<ImportStartIds | null> {
  const modal = document.getElementById("import-start-id-modal") as HTMLElement | null;
  const table = document.getElementById("import-start-id-table") as HTMLElement | null;
  const confirmBtn = document.getElementById("import-start-id-confirm") as HTMLButtonElement | null;
  const cancelBtn = document.getElementById("import-start-id-cancel") as HTMLButtonElement | null;
  const closeBtn = document.getElementById("close-import-start-id") as HTMLButtonElement | null;
  const titleEl = document.getElementById("import-start-id-title") as HTMLElement | null;
  const descEl = document.getElementById("import-start-id-desc") as HTMLElement | null;

  if (!modal || !table || !confirmBtn || !cancelBtn || !closeBtn || !titleEl || !descEl) {
    const startId = promptForOptionalId('prompt.enterImportStartId');
    if (startId === null) {
      return null;
    }
    return {
      objects: startId,
      outfits: startId,
      effects: startId,
      missiles: startId
    };
  }

  const context = await invoke<ImportContext>(COMMANDS.GET_IMPORT_CONTEXT, { paths });
  const inputs: Partial<Record<keyof ImportStartIds, HTMLInputElement>> = {};

  titleEl.textContent = translate('importStartIds.title');
  descEl.textContent = translate('importStartIds.description');
  confirmBtn.textContent = translate('action.button.import');
  cancelBtn.textContent = translate('action.button.cancel');

  table.innerHTML = "";
  const headerRow = document.createElement("div");
  headerRow.className = "import-start-id-row header";
  const headerCategory = document.createElement("span");
  headerCategory.textContent = translate('importStartIds.header.category');
  const headerLatest = document.createElement("span");
  headerLatest.textContent = translate('importStartIds.header.latest');
  const headerStart = document.createElement("span");
  headerStart.textContent = translate('importStartIds.header.start');
  headerRow.append(headerCategory, headerLatest, headerStart);
  table.appendChild(headerRow);

  const createRow = (
    key: keyof ImportStartIds | "sounds",
    label: string,
    latest: number,
    enabled: boolean
  ): void => {
    const row = document.createElement("div");
    row.className = "import-start-id-row";
    if (!enabled) {
      row.classList.add("disabled");
    }

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const latestEl = document.createElement("span");
    latestEl.className = "import-start-id-latest";
    latestEl.textContent = String(latest);

    row.append(labelEl, latestEl);

    if (key === "sounds") {
      const placeholder = document.createElement("span");
      placeholder.className = "import-start-id-placeholder";
      placeholder.textContent = translate('importStartIds.notApplicable');
      row.appendChild(placeholder);
      table.appendChild(row);
      return;
    }

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.className = "import-start-id-input";
    if (!enabled) {
      input.disabled = true;
      input.placeholder = translate('importStartIds.notInImport');
    } else {
      const defaultValue = latest > 0 ? latest + 1 : 1;
      input.value = String(defaultValue);
      input.placeholder = translate('importStartIds.placeholder');
    }
    row.appendChild(input);
    table.appendChild(row);
    inputs[key] = input;
  };

  createRow("objects", translate('category.objects'), context.latest.objects, context.present.objects);
  createRow("outfits", translate('category.outfits'), context.latest.outfits, context.present.outfits);
  createRow("effects", translate('category.effects'), context.latest.effects, context.present.effects);
  createRow("missiles", translate('category.missiles'), context.latest.missiles, context.present.missiles);
  createRow("sounds", translate('category.sounds'), context.latest.sounds, false);

  modal.style.display = "flex";
  modal.classList.add("show");
  modalOpened();

  const backdrop = modal.querySelector(".modal-backdrop") as HTMLElement | null;

  return new Promise((resolve) => {
    const cleanup = (): void => {
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      closeBtn.removeEventListener("click", onCancel);
      backdrop?.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKeydown);
      modal.classList.remove("show");
      modal.style.display = "none";
      modalClosed();
    };

    const onConfirm = (): void => {
      const startIds: ImportStartIds = {
        objects: null,
        outfits: null,
        effects: null,
        missiles: null
      };

      const keys: (keyof ImportStartIds)[] = ["objects", "outfits", "effects", "missiles"];
      for (const key of keys) {
        const input = inputs[key];
        if (!input || input.disabled) {
          continue;
        }
        const raw = input.value.trim();
        if (!raw) {
          startIds[key] = null;
          continue;
        }
        const parsed = parseNumericId(raw);
        if (parsed === null) {
          showStatus(translate('status.invalidIdAuto'), "error");
          input.focus();
          return;
        }
        startIds[key] = parsed;
      }

      cleanup();
      resolve(startIds);
    };

    const onCancel = (): void => {
      cleanup();
      resolve(null);
    };

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
    closeBtn.addEventListener("click", onCancel);
    backdrop?.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKeydown);

    const firstInput = inputs.objects || inputs.outfits || inputs.effects || inputs.missiles;
    firstInput?.focus();
  });
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
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
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
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
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
    await invoke(COMMANDS.COPY_APPEARANCE_FLAGS, { category, id });
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
      await invoke(COMMANDS.PASTE_APPEARANCE_FLAGS, { category: target.category, id: target.id });
    }
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
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

  const confirmed = uniqueTargets.length === 1
    ? await openConfirmModal(
      translate('confirm.deleteSingle', { id: uniqueTargets[0].id }),
      translate('action.verb.delete')
    )
    : await openConfirmModal(
      translate('confirm.deleteMultiple', {
        count: uniqueTargets.length,
        ids: uniqueTargets.map((target) => `#${target.id}`).join(", ")
      }),
      translate('action.verb.delete')
    );

  if (!confirmed) {
    return;
  }

  try {
    const tmpDir = await tempDir();
    const snapshots: { category: string; id: number; path: string }[] = [];

    for (const target of uniqueTargets) {
      const uniqueName = `appearance-undo-${target.category}-${target.id}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
      const snapshotPath = await join(tmpDir, uniqueName);
      await invoke(COMMANDS.EXPORT_APPEARANCE_TO_JSON, {
        category: target.category,
        id: target.id,
        path: snapshotPath
      });
      snapshots.push({ ...target, path: snapshotPath });
    }

    for (const target of uniqueTargets) {
      await invoke(COMMANDS.DELETE_APPEARANCE, { category: target.category, id: target.id });
      removeAssetSelection(target.category, target.id);
    }
    await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
    await loadAssets();
    closeAssetDetails();
    clearAssetSelection();
    setActionSelection(resolveCategory(null), null);
    const message =
      uniqueTargets.length === 1
        ? translate('status.appearanceDeletedSingle', { id: uniqueTargets[0].id })
        : translate('status.appearanceDeletedMultiple', { count: uniqueTargets.length });
    showStatus(message, "success");

    recordAction({
      description: uniqueTargets.length === 1
        ? translate('status.appearanceDeletedSingle', { id: uniqueTargets[0].id })
        : translate('status.appearanceDeletedMultiple', { count: uniqueTargets.length }),
      undo: async () => {
        for (const snap of snapshots) {
          await invoke<CompleteAppearanceItem>("import_appearance_from_json", {
            category: snap.category,
            path: snap.path,
            // Use "new" to reintroduce the deleted ID even if it no longer exists
            mode: "new",
            newId: snap.id
          });
        }
        await invoke("save_appearances_file");
        await loadAssets();
        if (snapshots.length === 1) {
          await refreshAssetDetails(snapshots[0].category, snapshots[0].id);
        }
      },
      redo: async () => {
        for (const snap of snapshots) {
          await invoke(COMMANDS.DELETE_APPEARANCE, { category: snap.category, id: snap.id });
          removeAssetSelection(snap.category, snap.id);
        }
        await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
        await loadAssets();
        closeAssetDetails();
        clearAssetSelection();
        setActionSelection(resolveCategory(null), null);
      }
    });
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
      const category = resolveCategory(null);
      if (!category) {
        showStatus(
          translate('status.selectAppearanceAction', {
            action: translateActionVerb("import")
          }),
          "error"
        );
        return;
      }
      void handleImport(category);
    });

    const exportBtn = getActionButton("export");
    exportBtn?.addEventListener("click", () => {
      const target = getActionTargets(false)[0];
      const category = target?.category ?? resolveCategory(null);
      if (!category) {
        showStatus(
          translate('status.selectAppearanceAction', {
            action: translateActionVerb("export")
          }),
          "error"
        );
        return;
      }
      const targetId = target?.id ?? promptForRequiredId('prompt.enterExportId');
      if (targetId === null) {
        return;
      }
      void handleExport(category, targetId);
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
  ensureActionBar();
  setActionSelection(resolveCategory(null), null);
  attachDetailListener();
  attachSelectionListener();
}
