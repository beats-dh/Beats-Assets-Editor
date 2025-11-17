import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { showStatus } from "../utils";
import { translate } from "../i18n";
import type { ImageExportResult } from "../types";

const CATEGORY_OPTIONS = ["Objects", "Outfits", "Effects", "Missiles"] as const;
type ExportCategory = (typeof CATEGORY_OPTIONS)[number];

interface CategoryRowRef {
  key: ExportCategory;
  checkbox: HTMLInputElement | null;
  start: HTMLInputElement | null;
  end: HTMLInputElement | null;
}

let initialized = false;
let modalElement: HTMLDivElement | null = null;
let errorElement: HTMLDivElement | null = null;
let confirmButton: HTMLButtonElement | null = null;
let destinationInput: HTMLInputElement | null = null;
let browseButton: HTMLButtonElement | null = null;
let customDelayInput: HTMLInputElement | null = null;
let formatOptions: NodeListOf<HTMLInputElement> | null = null;
let addonModeSelect: HTMLSelectElement | null = null;
let mountToggle: HTMLInputElement | null = null;
let mountIdInput: HTMLInputElement | null = null;
let cancelButton: HTMLButtonElement | null = null;
let closeButton: HTMLButtonElement | null = null;
let backdropElement: HTMLDivElement | null = null;
let colorInputs: Record<"head" | "body" | "legs" | "feet", HTMLInputElement | null> = {
  head: null,
  body: null,
  legs: null,
  feet: null
};

const categoryRows: CategoryRowRef[] = [];

export function initExportImagesModal(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  modalElement = document.getElementById("export-images-modal") as HTMLDivElement | null;
  errorElement = document.getElementById("export-images-modal-error") as HTMLDivElement | null;
  confirmButton = document.getElementById("export-images-confirm") as HTMLButtonElement | null;
  destinationInput = document.getElementById("image-export-destination") as HTMLInputElement | null;
  browseButton = document.getElementById("image-export-browse") as HTMLButtonElement | null;
  customDelayInput = document.getElementById("image-export-delay") as HTMLInputElement | null;
  formatOptions = document.querySelectorAll<HTMLInputElement>('input[name="image-export-format"]');
  addonModeSelect = document.getElementById("image-export-addon-mode") as HTMLSelectElement | null;
  mountToggle = document.getElementById("image-export-mount-toggle") as HTMLInputElement | null;
  mountIdInput = document.getElementById("image-export-mount-id") as HTMLInputElement | null;
  cancelButton = document.getElementById("export-images-cancel") as HTMLButtonElement | null;
  closeButton = document.getElementById("export-images-close") as HTMLButtonElement | null;
  backdropElement = document.getElementById("export-images-backdrop") as HTMLDivElement | null;

  colorInputs = {
    head: document.getElementById("image-export-color-head") as HTMLInputElement | null,
    body: document.getElementById("image-export-color-body") as HTMLInputElement | null,
    legs: document.getElementById("image-export-color-legs") as HTMLInputElement | null,
    feet: document.getElementById("image-export-color-feet") as HTMLInputElement | null
  };

  CATEGORY_OPTIONS.forEach((category) => {
    categoryRows.push({
      key: category,
      checkbox: document.getElementById(`image-export-${category.toLowerCase()}-toggle`) as HTMLInputElement | null,
      start: document.getElementById(`image-export-${category.toLowerCase()}-start`) as HTMLInputElement | null,
      end: document.getElementById(`image-export-${category.toLowerCase()}-end`) as HTMLInputElement | null
    });
  });

  confirmButton?.addEventListener("click", () => void handleExport());
  cancelButton?.addEventListener("click", hideModal);
  closeButton?.addEventListener("click", hideModal);
  backdropElement?.addEventListener("click", hideModal);
  browseButton?.addEventListener("click", () => void selectDestination());
  mountToggle?.addEventListener("change", () => updateMountState());

  const outfitsRow = categoryRows.find((row) => row.key === "Outfits");
  outfitsRow?.checkbox?.addEventListener("change", () => updateColorState());

  updateMountState();
  updateColorState();
  clearError();
}

export function openExportImagesModal(defaultCategory?: string, referenceId?: number): void {
  initExportImagesModal();
  if (!modalElement) {
    return;
  }
  resetForm(defaultCategory, referenceId);
  modalElement.style.display = "flex";
}

function hideModal(): void {
  if (modalElement) {
    modalElement.style.display = "none";
  }
}

function resetForm(defaultCategory?: string, referenceId?: number): void {
  clearError();
  confirmButton && (confirmButton.disabled = false);

  categoryRows.forEach((row) => {
    const isDefault = defaultCategory ? row.key === defaultCategory : row.key === "Objects";
    if (row.checkbox) row.checkbox.checked = isDefault;
    const baseValue = typeof referenceId === "number" && referenceId >= 0 ? referenceId : row.key === "Objects" ? 100 : 0;
    if (row.start) row.start.value = String(baseValue);
    if (row.end) row.end.value = String(baseValue);
  });

  destinationInput && (destinationInput.value = "");
  customDelayInput && (customDelayInput.value = "");
  formatOptions?.forEach((input) => {
    input.checked = input.value === "apng";
  });
  addonModeSelect && (addonModeSelect.value = "full");
  mountToggle && (mountToggle.checked = false);
  if (mountIdInput) {
    mountIdInput.value = "1";
    mountIdInput.disabled = true;
  }
  Object.values(colorInputs).forEach((input) => {
    if (input) input.value = input.defaultValue;
  });
  updateMountState();
  updateColorState();
}

function clearError(): void {
  if (errorElement) {
    errorElement.style.display = "none";
    errorElement.textContent = "";
  }
}

function showError(message: string): void {
  if (!errorElement) {
    return;
  }
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

async function selectDestination(): Promise<void> {
  try {
    const selected = await open({
      directory: true,
      recursive: false,
      defaultPath: destinationInput?.value || undefined
    });
    if (selected && typeof selected === "string" && destinationInput) {
      destinationInput.value = selected;
    }
  } catch (error) {
    console.error("Failed to select destination", error);
  }
}

function updateMountState(): void {
  if (!mountIdInput) return;
  const enabled = Boolean(mountToggle?.checked);
  mountIdInput.disabled = !enabled;
  if (!enabled) {
    mountIdInput.value = "1";
  }
}

function updateColorState(): void {
  const outfitSelected = categoryRows.find((row) => row.key === "Outfits")?.checkbox?.checked ?? false;
  Object.values(colorInputs).forEach((input) => {
    if (!input) return;
    input.disabled = !outfitSelected;
  });
}

async function handleExport(): Promise<void> {
  if (!confirmButton) return;

  clearError();

  const ranges = collectRanges();
  if (!ranges.length) {
    showError(translate("status.exportImages.noSelection"));
    return;
  }

  const destination = destinationInput?.value.trim() ?? "";
  if (!destination) {
    showError(translate("status.exportImages.noDestination"));
    return;
  }

  const invalidRange = ranges.find((range) => range.start_id > range.end_id);
  if (invalidRange) {
    showError(translate("status.exportImages.invalidRange"));
    return;
  }

  const options = buildOptions();

  confirmButton.disabled = true;
  try {
    const result = await invoke<ImageExportResult>("export_appearances_to_images", {
      ranges,
      destination,
      options
    });

    handleResult(destination, result);
    hideModal();
  } catch (error) {
    console.error("Image export failed", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("no appearances")) {
      showError(translate("status.exportNoAppearances"));
    } else {
      showError(translate("status.exportImages.error"));
    }
  } finally {
    confirmButton.disabled = false;
  }
}

function collectRanges(): Array<{ category: ExportCategory; start_id: number; end_id: number }> {
  const result: Array<{ category: ExportCategory; start_id: number; end_id: number }> = [];
  categoryRows.forEach((row) => {
    if (!row.checkbox?.checked) return;
    const startValue = Number(row.start?.value ?? "");
    const endValue = Number(row.end?.value ?? "");
    if (Number.isNaN(startValue) || Number.isNaN(endValue)) return;
    result.push({
      category: row.key,
      start_id: Math.max(0, startValue),
      end_id: Math.max(0, endValue)
    });
  });
  return result;
}

function buildOptions(): Record<string, unknown> {
  const colors = Object.entries(colorInputs).reduce<Record<string, string | undefined>>(
    (acc, [key, input]) => {
      if (input && !input.disabled) {
        acc[key] = input.value;
      }
      return acc;
    },
    {}
  );
  const hasColors = Object.values(colors).some((value) => Boolean(value));
  const selectedFormats = Array.from(formatOptions ?? [])
    .filter((input) => input.checked)
    .map((input) => input.value);
  if (selectedFormats.length === 0) {
    selectedFormats.push("apng");
  }
  const addonMode = addonModeSelect?.value ?? "full";

  return {
    custom_delay_ms: customDelayInput?.value ? Number(customDelayInput.value) : null,
    include_mount: Boolean(mountToggle?.checked),
    mount_id: mountIdInput?.disabled ? null : Number(mountIdInput?.value ?? 0),
    outfit_colors: hasColors ? colors : null,
    formats: selectedFormats,
    addon_mode: addonMode
  };
}

function handleResult(destination: string, summary: ImageExportResult): void {
  const exported = summary.exported_files;
  const failures = summary.failed.length;

  if (exported === 0 && failures > 0) {
    showStatus(translate("status.exportImages.error"), "error");
    return;
  }

  const label = `${destination}`;
  if (failures === 0) {
    showStatus(
      translate("status.exportImages.success", { count: exported, destination: label }),
      "success"
    );
    return;
  }

  const preview = formatFailurePreview(summary.failed);
  showStatus(
    `${translate("status.exportImages.partial", { exported, failed: failures })}${preview ? ` (${preview})` : ""}`,
    "warning"
  );
}

function formatFailurePreview(failures: NonNullable<ImageExportResult["failed"]>): string {
  if (!failures.length) {
    return "";
  }

  const preview = failures.slice(0, 3).map((failure) => `${failure.category} #${failure.id}`);
  const remainder = failures.length > 3 ? ` +${failures.length - 3}` : "";
  return `${preview.join(", ")}${remainder}`;
}
