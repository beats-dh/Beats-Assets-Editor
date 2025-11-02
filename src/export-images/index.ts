import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { translate } from '../i18n';
import { showStatus } from '../utils';

interface ExportImagesTarget {
  category: string;
  id: number;
}

interface ExportImagesOptionsPayload {
  exportGif: boolean;
  gifOnly: boolean;
  exportMounted: boolean;
  exportFullAddons: boolean;
  exportOnlyPng: boolean;
  exportAllPng: boolean;
}

interface ExportImagesSummary {
  exportedFiles: number;
  targets: number;
}

let overlayEl: HTMLDivElement | null = null;
let dialogEl: HTMLDivElement | null = null;
let closeBtn: HTMLButtonElement | null = null;
let cancelBtn: HTMLButtonElement | null = null;
let confirmBtn: HTMLButtonElement | null = null;
let directoryInput: HTMLInputElement | null = null;
let chooseDirBtn: HTMLButtonElement | null = null;
let gifCheckbox: HTMLInputElement | null = null;
let gifOnlyCheckbox: HTMLInputElement | null = null;
let mountedCheckbox: HTMLInputElement | null = null;
let addonsCheckbox: HTMLInputElement | null = null;
let singlePngCheckbox: HTMLInputElement | null = null;
let allPngCheckbox: HTMLInputElement | null = null;
let titleEl: HTMLElement | null = null;
let descriptionEl: HTMLElement | null = null;
let summaryEl: HTMLElement | null = null;
let outputsHeaderEl: HTMLElement | null = null;
let outfitHeaderEl: HTMLElement | null = null;
let directoryLabelEl: HTMLElement | null = null;

let currentTargets: ExportImagesTarget[] = [];
let selectedDirectory: string | null = null;
let initialized = false;

function ensureDialog(): void {
  if (initialized) {
    return;
  }

  overlayEl = document.createElement('div');
  overlayEl.className = 'export-images-overlay';
  overlayEl.innerHTML = `
    <div class="export-images-dialog" role="dialog" aria-modal="true">
      <header class="export-images-header">
        <h2 data-role="title"></h2>
        <button type="button" class="export-images-close" data-role="close" aria-label="close">×</button>
      </header>
      <div class="export-images-content">
        <p class="export-images-description" data-role="description"></p>
        <p class="export-images-summary" data-role="summary"></p>
        <section class="export-images-section">
          <h3 data-role="directory-label"></h3>
          <div class="export-images-field">
            <div class="export-images-path-row">
              <input type="text" data-role="directory-input" readonly />
              <button type="button" class="btn-secondary" data-role="choose-directory"></button>
            </div>
          </div>
        </section>
        <section class="export-images-section">
          <h3 data-role="outputs-header"></h3>
          <div class="export-images-options">
            <label class="export-images-option">
              <input type="checkbox" data-role="export-gif" />
              <span></span>
            </label>
            <div class="export-images-suboptions">
              <label class="export-images-option">
                <input type="checkbox" data-role="gif-only" />
                <span></span>
              </label>
            </div>
            <label class="export-images-option">
              <input type="checkbox" data-role="export-single-png" />
              <span></span>
            </label>
            <label class="export-images-option">
              <input type="checkbox" data-role="export-all-png" />
              <span></span>
            </label>
          </div>
        </section>
        <section class="export-images-section">
          <h3 data-role="outfit-header"></h3>
          <div class="export-images-options">
            <label class="export-images-option">
              <input type="checkbox" data-role="export-mounted" />
              <span></span>
            </label>
            <label class="export-images-option">
              <input type="checkbox" data-role="export-addons" />
              <span></span>
            </label>
          </div>
        </section>
      </div>
      <footer class="export-images-footer">
        <button type="button" class="btn-secondary" data-role="cancel"></button>
        <button type="button" class="btn-primary" data-role="confirm"></button>
      </footer>
    </div>
  `;

  dialogEl = overlayEl.querySelector('.export-images-dialog');
  closeBtn = overlayEl.querySelector('[data-role="close"]');
  cancelBtn = overlayEl.querySelector('[data-role="cancel"]');
  confirmBtn = overlayEl.querySelector('[data-role="confirm"]');
  directoryInput = overlayEl.querySelector('[data-role="directory-input"]');
  chooseDirBtn = overlayEl.querySelector('[data-role="choose-directory"]');
  gifCheckbox = overlayEl.querySelector('[data-role="export-gif"]');
  gifOnlyCheckbox = overlayEl.querySelector('[data-role="gif-only"]');
  mountedCheckbox = overlayEl.querySelector('[data-role="export-mounted"]');
  addonsCheckbox = overlayEl.querySelector('[data-role="export-addons"]');
  singlePngCheckbox = overlayEl.querySelector('[data-role="export-single-png"]');
  allPngCheckbox = overlayEl.querySelector('[data-role="export-all-png"]');
  titleEl = overlayEl.querySelector('[data-role="title"]');
  descriptionEl = overlayEl.querySelector('[data-role="description"]');
  summaryEl = overlayEl.querySelector('[data-role="summary"]');
  outputsHeaderEl = overlayEl.querySelector('[data-role="outputs-header"]');
  outfitHeaderEl = overlayEl.querySelector('[data-role="outfit-header"]');
  directoryLabelEl = overlayEl.querySelector('[data-role="directory-label"]');

  if (!overlayEl || !dialogEl || !closeBtn || !cancelBtn || !confirmBtn || !directoryInput || !chooseDirBtn || !gifCheckbox || !gifOnlyCheckbox || !mountedCheckbox || !addonsCheckbox || !singlePngCheckbox || !allPngCheckbox || !titleEl || !descriptionEl || !summaryEl || !outputsHeaderEl || !outfitHeaderEl || !directoryLabelEl) {
    throw new Error('Failed to initialize export images dialog');
  }

  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);
  overlayEl.addEventListener('click', (event) => {
    if (event.target === overlayEl) {
      closeDialog();
    }
  });

  chooseDirBtn.addEventListener('click', () => {
    void pickDirectory();
  });

  gifCheckbox.addEventListener('change', () => {
    updateGifOnlyState();
  });

  gifOnlyCheckbox.addEventListener('change', () => {
    updateGifOnlyState();
  });

  confirmBtn.addEventListener('click', () => {
    void handleConfirm();
  });

  singlePngCheckbox.addEventListener('change', () => {
    if (singlePngCheckbox?.checked) {
      allPngCheckbox!.checked = false;
    }
  });

  allPngCheckbox.addEventListener('change', () => {
    if (allPngCheckbox?.checked) {
      singlePngCheckbox!.checked = false;
    }
  });

  document.addEventListener('app-language-changed', updateDialogTexts);

  document.body.appendChild(overlayEl);
  updateDialogTexts();
  resetDialogState();
  initialized = true;
}

function resetDialogState(): void {
  selectedDirectory = null;
  if (directoryInput) {
    directoryInput.value = '';
  }

  gifCheckbox!.checked = false;
  gifOnlyCheckbox!.checked = false;
  mountedCheckbox!.checked = false;
  addonsCheckbox!.checked = false;
  singlePngCheckbox!.checked = false;
  allPngCheckbox!.checked = false;

  updateGifOnlyState();
  setWorkingState(false);
}

function setWorkingState(active: boolean): void {
  if (!confirmBtn || !cancelBtn || !closeBtn || !chooseDirBtn) {
    return;
  }
  confirmBtn.disabled = active;
  cancelBtn.disabled = active;
  closeBtn.disabled = active;
  chooseDirBtn.disabled = active;
}

function updateGifOnlyState(): void {
  if (!gifCheckbox || !gifOnlyCheckbox || !singlePngCheckbox || !allPngCheckbox) return;
  const enabled = gifCheckbox.checked;
  gifOnlyCheckbox.disabled = !enabled;
  if (!enabled) {
    gifOnlyCheckbox.checked = false;
  }

  const gifOnlyActive = enabled && gifOnlyCheckbox.checked;
  if (gifOnlyActive) {
    singlePngCheckbox.checked = false;
    allPngCheckbox.checked = false;
  }
  singlePngCheckbox.disabled = gifOnlyActive;
  allPngCheckbox.disabled = gifOnlyActive;
}

function updateDialogTexts(): void {
  if (!initialized || !overlayEl) {
    return;
  }

  titleEl!.textContent = translate('exportImages.dialog.title');
  descriptionEl!.textContent = translate('exportImages.dialog.description');
  directoryLabelEl!.textContent = translate('exportImages.field.outputDirectory');
  chooseDirBtn!.textContent = translate('exportImages.button.chooseDirectory');
  outputsHeaderEl!.textContent = translate('exportImages.section.outputs');
  outfitHeaderEl!.textContent = translate('exportImages.section.outfitOptions');
  cancelBtn!.textContent = translate('exportImages.button.cancel');
  confirmBtn!.textContent = translate('exportImages.button.confirm');

  const gifLabel = overlayEl!.querySelector('[data-role="export-gif"] + span');
  if (gifLabel) {
    gifLabel.textContent = translate('exportImages.option.exportGif');
  }
  const gifOnlyLabel = overlayEl!.querySelector('[data-role="gif-only"] + span');
  if (gifOnlyLabel) {
    gifOnlyLabel.textContent = translate('exportImages.option.gifOnly');
  }
  const singlePngLabel = overlayEl!.querySelector('[data-role="export-single-png"] + span');
  if (singlePngLabel) {
    singlePngLabel.textContent = translate('exportImages.option.exportOnlyPng');
  }
  const allPngLabel = overlayEl!.querySelector('[data-role="export-all-png"] + span');
  if (allPngLabel) {
    allPngLabel.textContent = translate('exportImages.option.exportAllPng');
  }
  const mountedLabel = overlayEl!.querySelector('[data-role="export-mounted"] + span');
  if (mountedLabel) {
    mountedLabel.textContent = translate('exportImages.option.exportMounted');
  }
  const addonsLabel = overlayEl!.querySelector('[data-role="export-addons"] + span');
  if (addonsLabel) {
    addonsLabel.textContent = translate('exportImages.option.exportFullAddons');
  }

  updateSummary();
}

function updateSummary(): void {
  if (!summaryEl) return;
  summaryEl.textContent = translate('exportImages.summary.targets', {
    count: currentTargets.length
  });
}

async function pickDirectory(): Promise<void> {
  try {
    const selection = await open({ directory: true, multiple: false });
    const path = Array.isArray(selection) ? selection[0] : selection;
    if (typeof path === 'string' && directoryInput) {
      selectedDirectory = path;
      directoryInput.value = path;
    }
  } catch (error) {
    console.error('Failed to pick directory', error);
    showStatus(translate('status.exportImagesChooseDirectoryError'), 'error');
  }
}

function closeDialog(): void {
  if (!overlayEl) {
    return;
  }
  overlayEl.classList.remove('is-open');
}

function gatherOptions(): ExportImagesOptionsPayload {
  return {
    exportGif: Boolean(gifCheckbox?.checked),
    gifOnly: Boolean(gifOnlyCheckbox?.checked),
    exportMounted: Boolean(mountedCheckbox?.checked),
    exportFullAddons: Boolean(addonsCheckbox?.checked),
    exportOnlyPng: Boolean(singlePngCheckbox?.checked),
    exportAllPng: Boolean(allPngCheckbox?.checked)
  };
}

function validateOptions(options: ExportImagesOptionsPayload): boolean {
  const hasGif = options.exportGif || options.gifOnly;
  const hasPng = options.exportOnlyPng || options.exportAllPng;
  if (!hasGif && !hasPng) {
    showStatus(translate('status.exportImagesNoOptions'), 'error');
    return false;
  }
  if (!selectedDirectory) {
    showStatus(translate('status.exportImagesChooseDirectory'), 'error');
    return false;
  }
  return true;
}

async function handleConfirm(): Promise<void> {
  if (!confirmBtn) return;
  const options = gatherOptions();
  if (!validateOptions(options)) {
    return;
  }

  try {
    setWorkingState(true);
    showStatus(translate('status.exportImagesInProgress'), 'loading');

    const summary = await invoke<ExportImagesSummary>('export_appearances_images', {
      targets: currentTargets,
      destination: selectedDirectory,
      options
    });

    closeDialog();
    showStatus(
      translate('status.exportImagesSuccess', {
        exported: summary.exportedFiles,
        count: summary.targets
      }),
      'success'
    );
  } catch (error) {
    console.error('Failed to export images', error);
    showStatus(translate('status.exportImagesFailed'), 'error');
  } finally {
    setWorkingState(false);
  }
}

export function openExportImagesDialog(targets: ExportImagesTarget[]): void {
  ensureDialog();
  currentTargets = targets.slice();
  resetDialogState();
  updateDialogTexts();
  overlayEl!.classList.add('is-open');
}
