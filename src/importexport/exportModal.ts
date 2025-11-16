import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { translate } from "../i18n";
import { showStatus, delay } from "../utils";

const CATEGORY_OPTIONS = ["Objects", "Outfits", "Effects", "Missiles"] as const;
type ExportFormat = "json" | "aec";

type ExportFailure = {
  category: string;
  id: number;
  path: string;
  reason?: string;
};

type JsonExportSummary = {
  category: string;
  success: number;
  failed: number;
  failures: ExportFailure[];
};

type AecExportSummary = {
  category: string;
  success: number;
  failed: number;
  path: string;
};

let modalElement: HTMLDivElement | null = null;
let categoryOptionsContainer: HTMLDivElement | null = null;
let startInput: HTMLInputElement | null = null;
let endInput: HTMLInputElement | null = null;
let jsonDestinationInput: HTMLInputElement | null = null;
let aecDestinationInput: HTMLInputElement | null = null;
let includeSpritesCheckbox: HTMLInputElement | null = null;
let errorElement: HTMLDivElement | null = null;

let currentFormat: ExportFormat = "json";
let jsonDirectoryPath: string | null = null;
let aecFilePath: string | null = null;
let modalInitialized = false;

const selectedCategories = new Set<string>();

const EXPORT_FAILURE_PREVIEW_LIMIT = 3;
const MODAL_READY_POLL_INTERVAL_MS = 60;
const MODAL_READY_MAX_ATTEMPTS = 25;
const DOM_READY_TIMEOUT_MS = 2000;

const EXPORT_MODAL_TEMPLATE = `
  <div id="export-modal" class="asset-details-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title" aria-describedby="export-modal-desc" style="display: none;">
    <div class="modal-backdrop" id="export-modal-backdrop"></div>
    <div class="modal-content" role="document">
      <div class="modal-header">
        <div class="modal-title-stack">
          <h2 id="export-modal-title" data-i18n="modal.export.title">Export Appearances</h2>
          <p id="export-modal-desc" class="modal-subtitle" data-i18n="modal.export.description">Configure the export range and format.</p>
        </div>
        <button id="export-modal-close" class="close-btn" aria-label="Close export dialog">×</button>
      </div>
      <div class="modal-body">
        <div class="edit-section">
          <div id="export-modal-error" class="form-error" role="alert" style="display:none;"></div>
          <div class="form-grid">
            <div>
              <span class="field-label" data-i18n="modal.export.categoryLabel">Category</span>
              <div id="export-category-options" class="category-option-grid"></div>
            </div>
            <div>
              <span class="field-label" data-i18n="modal.export.formatLabel">Format</span>
              <fieldset class="radio-group" aria-label="Export format">
                <label>
                  <input type="radio" name="export-format" value="json" checked />
                  <span data-i18n="modal.export.format.json">JSON (one file per ID)</span>
                </label>
                <label>
                  <input type="radio" name="export-format" value="aec" />
                  <span data-i18n="modal.export.format.aec">AEC (legacy archive)</span>
                </label>
              </fieldset>
            </div>
          </div>

          <div class="form-grid">
            <label for="export-start-id" data-i18n="modal.export.startId">Start ID
              <input id="export-start-id" class="modern-input" type="number" min="0" />
            </label>
            <label for="export-end-id" data-i18n="modal.export.endId">End ID
              <input id="export-end-id" class="modern-input" type="number" min="0" />
            </label>
          </div>

          <div id="export-json-destination" class="edit-subsection">
            <span class="field-label" data-i18n="modal.export.jsonDestination">Destination folder</span>
            <div class="input-row">
              <input id="export-json-path" class="modern-input" type="text" readonly />
              <button id="export-json-browse" type="button" class="btn-secondary" data-i18n="modal.export.browse">Browse</button>
            </div>
          </div>

          <div id="export-aec-destination" class="edit-subsection" style="display:none;">
            <span class="field-label" data-i18n="modal.export.aecDestination">AEC file path</span>
            <div class="input-row">
              <input id="export-aec-path" class="modern-input" type="text" readonly />
              <button id="export-aec-browse" type="button" class="btn-secondary" data-i18n="modal.export.browse">Browse</button>
            </div>
          </div>

          <label class="checkbox-toggle" style="margin-top: var(--space-sm);">
            <input id="export-include-sprites" type="checkbox" checked />
            <span data-i18n="modal.export.includeSprites">Include sprite data (AEC only)</span>
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button id="export-modal-confirm" class="btn-primary" data-i18n="modal.export.submit">Export</button>
      </div>
    </div>
  </div>
`;

function areModalReferencesAvailable(): boolean {
  return Boolean(
    modalElement &&
      startInput &&
      endInput &&
      jsonDestinationInput &&
      aecDestinationInput &&
      categoryOptionsContainer
  );
}

function listMissingModalReferences(): string[] {
  const missing: string[] = [];
  if (!modalElement) missing.push("modalElement");
  if (!startInput) missing.push("startInput");
  if (!endInput) missing.push("endInput");
  if (!jsonDestinationInput) missing.push("jsonDestinationInput");
  if (!aecDestinationInput) missing.push("aecDestinationInput");
  if (!categoryOptionsContainer) missing.push("categoryOptionsContainer");
  return missing;
}

function ensureExportModalMarkup(): void {
  if (document.getElementById("export-modal")) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = EXPORT_MODAL_TEMPLATE.trim();
  const modal = wrapper.firstElementChild;
  if (!modal) {
    console.error("Failed to build export modal markup.");
    return;
  }
  document.body.appendChild(modal);
}

async function waitForModalReferences(): Promise<boolean> {
  if (document.readyState === "loading") {
    await new Promise<void>((resolve) => {
      const onContentLoaded = (): void => {
        resolve();
      };
      document.addEventListener("DOMContentLoaded", onContentLoaded, { once: true });
      setTimeout(() => {
        document.removeEventListener("DOMContentLoaded", onContentLoaded);
        resolve();
      }, DOM_READY_TIMEOUT_MS);
    });
  }

  for (let attempt = 0; attempt < MODAL_READY_MAX_ATTEMPTS; attempt += 1) {
    refreshModalReferences();
    if (areModalReferencesAvailable()) {
      return true;
    }
    await delay(MODAL_READY_POLL_INTERVAL_MS);
  }
  refreshModalReferences();
  return areModalReferencesAvailable();
}

function refreshModalReferences(): void {
  modalElement = document.getElementById("export-modal") as HTMLDivElement | null;
  categoryOptionsContainer = document.getElementById("export-category-options") as HTMLDivElement | null;
  startInput = document.getElementById("export-start-id") as HTMLInputElement | null;
  endInput = document.getElementById("export-end-id") as HTMLInputElement | null;
  jsonDestinationInput = document.getElementById("export-json-path") as HTMLInputElement | null;
  aecDestinationInput = document.getElementById("export-aec-path") as HTMLInputElement | null;
  includeSpritesCheckbox = document.getElementById("export-include-sprites") as HTMLInputElement | null;
  errorElement = document.getElementById("export-modal-error") as HTMLDivElement | null;
}

function resetModalState(removeExisting = false): void {
  if (removeExisting) {
    document.getElementById("export-modal")?.remove();
  }
  modalElement = null;
  categoryOptionsContainer = null;
  startInput = null;
  endInput = null;
  jsonDestinationInput = null;
  aecDestinationInput = null;
  includeSpritesCheckbox = null;
  errorElement = null;
  modalInitialized = false;
}

function getPathLeaf(path?: string | null): string | null {
  if (!path) return null;
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments.length ? segments[segments.length - 1] || path : path;
}

function formatExportFailureDetails(failures: ExportFailure[]): string {
  if (failures.length === 0) return "";
  const preview = failures
    .slice(0, EXPORT_FAILURE_PREVIEW_LIMIT)
    .map((failure) => {
      const fileName = getPathLeaf(failure.path);
      const suffix = fileName ? ` -> ${fileName}` : "";
      return `${failure.category} #${failure.id}${suffix}`;
    });
  const remainder =
    failures.length > EXPORT_FAILURE_PREVIEW_LIMIT
      ? ` +${failures.length - EXPORT_FAILURE_PREVIEW_LIMIT}`
      : "";
  return `${preview.join(", ")}${remainder}`;
}

function renderCategoryOptions(): void {
  if (!categoryOptionsContainer) return;
  categoryOptionsContainer.innerHTML = CATEGORY_OPTIONS.map(
    (category) => `
      <label class="checkbox-toggle">
        <input type="checkbox" value="${category}" />
        <span>${category}</span>
      </label>
    `
  ).join("");

  categoryOptionsContainer
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          if (currentFormat === "aec") {
            setSelectedCategories([input.value]);
          } else {
            selectedCategories.add(input.value);
          }
        } else {
          selectedCategories.delete(input.value);
        }
      });
    });
}

function setSelectedCategories(categories: string[]): void {
  selectedCategories.clear();
  categories.forEach((c) => selectedCategories.add(c));
  if (!categoryOptionsContainer) return;
  categoryOptionsContainer
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input) => {
      input.checked = selectedCategories.has(input.value);
    });
}

function getSelectedCategories(): string[] {
  if (selectedCategories.size === 0) {
    const fallback = CATEGORY_OPTIONS[0];
    selectedCategories.add(fallback);
    setSelectedCategories([fallback]);
  }
  return Array.from(selectedCategories);
}

function hideModal(): void {
  if (modalElement) {
    modalElement.style.display = "none";
  }
}

function showError(message: string): void {
  if (!errorElement) {
    return;
  }
  errorElement.textContent = message;
  errorElement.style.display = message ? "" : "none";
}

function updateFormatVisibility(): void {
  const jsonSection = document.getElementById("export-json-destination");
  const aecSection = document.getElementById("export-aec-destination");
  if (jsonSection) jsonSection.style.display = currentFormat === "json" ? "" : "none";
  if (aecSection) aecSection.style.display = currentFormat === "aec" ? "" : "none";
  if (currentFormat === "aec") {
    const first = getSelectedCategories()[0];
    setSelectedCategories([first]);
  }
}

async function selectDirectory(): Promise<void> {
  const selection = await open({ directory: true, multiple: false });
  const directory =
    typeof selection === "string" && selection.length > 0
      ? selection
      : Array.isArray(selection) && selection.length > 0
        ? selection[0]
        : null;
  if (!directory) {
    return;
  }
  jsonDirectoryPath = directory;
  if (jsonDestinationInput) {
    jsonDestinationInput.value = directory;
  }
}

async function selectAecFile(suggestedName: string): Promise<void> {
  const selection = await save({
    defaultPath: suggestedName.endsWith(".aec") ? suggestedName : `${suggestedName}.aec`,
    filters: [{ name: "Assets Editor Container", extensions: ["aec"] }]
  });
  if (!selection) {
    return;
  }
  aecFilePath = selection;
  if (aecDestinationInput) {
    aecDestinationInput.value = selection;
  }
}

async function exportAsJson(category: string, startId: number, endId: number): Promise<JsonExportSummary> {
  if (!jsonDirectoryPath) {
    throw new Error("Missing directory");
  }
  let success = 0;
  const failures: ExportFailure[] = [];
  for (let id = startId; id <= endId; id += 1) {
    const normalized = category.toLowerCase();
    const destination = await join(jsonDirectoryPath, `${normalized}-appearance-${id}.json`);
    try {
      await invoke("export_appearance_to_json", { category, id, path: destination });
      success += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Failed to export #${id} in ${category} to JSON`, reason);
      failures.push({ category, id, path: destination, reason });
    }
  }
  return { category, success, failed: failures.length, failures };
}

async function exportAsAec(category: string, startId: number, endId: number, includeSprites: boolean): Promise<AecExportSummary> {
  if (!aecFilePath) {
    throw new Error("Missing archive path");
  }
  const exported = await invoke<number>("export_appearances_to_aec", {
    category,
    startId,
    endId,
    path: aecFilePath,
    includeSprites
  });
  return { category, success: Number(exported), failed: 0, path: aecFilePath };
}

async function handleExportAction(): Promise<void> {
  if (!startInput || !endInput) {
    return;
  }

  const categories = getSelectedCategories();
  if (categories.length === 0) {
    showError(translate("status.exportNoCategory"));
    return;
  }

  const startId = Number(startInput.value);
  const endId = Number(endInput.value);

  if (Number.isNaN(startId) || Number.isNaN(endId) || startId < 0 || endId < startId) {
    showError(translate("status.exportRangeInvalid"));
    return;
  }

  if (currentFormat === "json" && !jsonDirectoryPath) {
    showError(translate("status.exportNoDestination"));
    return;
  }
  if (currentFormat === "aec") {
    if (categories.length !== 1) {
      showError(translate("status.exportAecSingleCategory"));
      return;
    }
    if (!aecFilePath) {
      showError(translate("status.exportNoDestination"));
      return;
    }
  }

  showError("");

  try {
    if (currentFormat === "json") {
      const summaries: JsonExportSummary[] = [];
      let totalSuccess = 0;
      for (const category of categories) {
        const summary = await exportAsJson(category, startId, endId);
        summaries.push(summary);
        totalSuccess += summary.success;
      }
      const failures = summaries.flatMap((summary) => summary.failures);
      const totalFailed = failures.length;

      if (totalSuccess === 0) {
        if (totalFailed === 0) {
          showStatus(translate("status.exportNoAppearances"), "error");
        } else {
          const detail = formatExportFailureDetails(failures);
          showStatus(
            `${translate("status.appearanceExportPartial", { success: totalSuccess, failed: totalFailed })}${
              detail ? ` (${detail})` : ""
            }`,
            "error"
          );
        }
        return;
      }

      const destinationLabel = jsonDirectoryPath ? `${categories.join(", ")} -> ${jsonDirectoryPath}` : categories.join(", ");
      const successMessage = translate("status.appearancesExported", {
        count: totalSuccess,
        start: startId,
        end: endId
      });
      showStatus(`${successMessage} (${destinationLabel})`, "success");
      if (totalFailed > 0) {
        const detail = formatExportFailureDetails(failures);
        showStatus(
          `${translate("status.appearanceExportPartial", { success: totalSuccess, failed: totalFailed })}${
            detail ? ` (${detail})` : ""
          }`,
          "warning"
        );
      }
    } else {
      const category = categories[0];
      const includeSprites = Boolean(includeSpritesCheckbox?.checked);
      const summary = await exportAsAec(category, startId, endId, includeSprites);
      if (summary.success === 0) {
        showStatus(translate("status.exportNoAppearances"), "error");
        return;
      }
      const targetLabel = `${category} -> ${summary.path}`;
      const successMessage = translate("status.appearancesExported", {
        count: summary.success,
        start: startId,
        end: endId
      });
      showStatus(`${successMessage} (${targetLabel})`, "success");
    }

    hideModal();
  } catch (error) {
    console.error("Export failed", error);
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (message.includes("no appearances")) {
      showError(translate("status.exportNoAppearances"));
    } else {
      showError(translate("status.appearanceExportFailed"));
    }
  }
}

function attachEventListeners(): void {
  if (!modalElement) {
    return;
  }

  const closeBtn = document.getElementById("export-modal-close");
  const backdrop = document.getElementById("export-modal-backdrop");
  const confirmBtn = document.getElementById("export-modal-confirm");
  const jsonBrowseBtn = document.getElementById("export-json-browse");
  const aecBrowseBtn = document.getElementById("export-aec-browse");

  closeBtn?.addEventListener("click", hideModal);
  backdrop?.addEventListener("click", hideModal);
  confirmBtn?.addEventListener("click", () => void handleExportAction());
  jsonBrowseBtn?.addEventListener("click", () => void selectDirectory());
  aecBrowseBtn?.addEventListener("click", () => {
    const startValue = startInput ? Number(startInput.value) : 0;
    const endValue = endInput ? Number(endInput.value) : startValue;
    const category = getSelectedCategories()[0] ?? "objects";
    const suggestion = `export-${category}-${startValue}-${endValue}.aec`;
    void selectAecFile(suggestion);
  });

  document.querySelectorAll<HTMLInputElement>('input[name="export-format"]').forEach((element) => {
    element.addEventListener("change", (event) => {
      const input = event.target as HTMLInputElement;
      if (input.checked) {
        currentFormat = input.value === "aec" ? "aec" : "json";
        updateFormatVisibility();
      }
    });
  });

  renderCategoryOptions();
  setSelectedCategories([CATEGORY_OPTIONS[0]]);
}

export function initExportModal(force = false): void {
  if (modalInitialized && !force) {
    return;
  }
  ensureExportModalMarkup();
  refreshModalReferences();
  if (!areModalReferencesAvailable()) {
    const missing = listMissingModalReferences();
    console.error("Export modal element missing.", missing);
    return;
  }
  attachEventListeners();
  modalInitialized = true;
}

export async function openExportModal(defaultCategory?: string, referenceId?: number): Promise<boolean> {
  ensureExportModalMarkup();
  const ready = await waitForModalReferences();

  refreshModalReferences();

  initExportModal();

  if (!areModalReferencesAvailable()) {
    const missingBeforeReset = listMissingModalReferences();
    console.warn("Export modal references missing; rebuilding modal markup.", missingBeforeReset);
    resetModalState(true);
    ensureExportModalMarkup();
    refreshModalReferences();
    initExportModal(true);
  }

  if (!modalElement || !startInput || !endInput || !jsonDestinationInput || !aecDestinationInput || !categoryOptionsContainer) {
    const missing = listMissingModalReferences();
    console.error("Export modal elements are missing; ensure the static HTML is present.", missing);
    if (missing.length > 0) {
      console.warn("Missing export modal references:", missing.join(", "));
    }
    showStatus(translate("status.exportModalUnavailable"), "error");
    return false;
  }

  if (!ready) {
    console.warn("Export modal references took longer than expected but were resolved after initialization.");
  }

  const normalizedCategory = CATEGORY_OPTIONS.includes(defaultCategory as typeof CATEGORY_OPTIONS[number])
    ? defaultCategory!
    : CATEGORY_OPTIONS[0];

  setSelectedCategories([normalizedCategory]);
  const fallbackId = typeof referenceId === "number" && referenceId >= 0 ? referenceId : 0;
  startInput.value = String(fallbackId);
  endInput.value = String(fallbackId);
  jsonDestinationInput.value = jsonDirectoryPath ?? "";
  aecDestinationInput.value = aecFilePath ?? "";
  if (includeSpritesCheckbox) {
    includeSpritesCheckbox.checked = true;
  }
  showError("");
  currentFormat = "json";
  document.querySelector<HTMLInputElement>('input[name="export-format"][value="json"]')?.click();
  updateFormatVisibility();

  if (modalElement) {
    modalElement.style.display = "flex";
  }
  return true;
}
