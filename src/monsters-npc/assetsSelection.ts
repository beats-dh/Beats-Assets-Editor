import { open } from '@tauri-apps/plugin-dialog';
import type { FolderSelectionViewElements } from '../editorFolderSelection';
import { loadAssetsForScripts } from './assetsLoader';

interface AttachAssetsSelectionOptions {
  storageKey: string;
  title: string;
  folderLabel: string;
  placeholder: string;
  loadButtonLabel: string;
  browseButtonLabel?: string;
  resultHeading: string;
  entityLabel: string;
  onReadyChange: (ready: boolean) => void;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function attachAssetsSelection(
  elements: FolderSelectionViewElements,
  options: AttachAssetsSelectionOptions,
): void {
  const card = document.createElement('div');
  card.className = 'launcher-folder-card';

  const title = document.createElement('h3');
  title.className = 'launcher-folder-title';
  title.textContent = options.title;

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';

  const label = document.createElement('label');
  label.textContent = options.folderLabel;

  const inputRow = document.createElement('div');
  inputRow.className = 'input-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'modern-input';
  input.placeholder = options.placeholder;
  input.autocomplete = 'off';
  input.value = localStorage.getItem(options.storageKey) ?? '';

  const browseButton = document.createElement('button');
  browseButton.type = 'button';
  browseButton.className = 'btn-secondary';
  browseButton.textContent = options.browseButtonLabel ?? 'Selecionar diretório';

  inputRow.append(input, browseButton);
  label.append(inputRow);
  inputGroup.append(label);

  const loadButton = document.createElement('button');
  loadButton.type = 'button';
  loadButton.className = 'btn-primary launcher-folder-load';
  loadButton.innerHTML = `<span class="btn-icon">🗃️</span><span>${options.loadButtonLabel}</span>`;
  loadButton.disabled = !input.value.trim();

  const status = document.createElement('p');
  status.className = 'launcher-secondary-text';
  status.hidden = true;

  const results = document.createElement('div');
  results.className = 'launcher-folder-results';
  results.hidden = true;

  card.append(title, inputGroup, loadButton, status, results);

  const updateLoadState = () => {
    loadButton.disabled = !input.value.trim();
  };

  const setStatus = (message: string, hidden = false) => {
    status.hidden = hidden;
    status.textContent = message;
  };

  const setLoading = (loading: boolean, message?: string) => {
    if (loading) {
      loadButton.disabled = true;
      loadButton.dataset.loading = 'true';
      setStatus(message ?? 'Processing assets...', false);
    } else {
      delete loadButton.dataset.loading;
      updateLoadState();
      if (message) {
        setStatus(message, false);
      }
    }
  };

  input.addEventListener('input', () => {
    const value = input.value.trim();
    if (value) {
      localStorage.setItem(options.storageKey, value);
    } else {
      localStorage.removeItem(options.storageKey);
    }
    updateLoadState();
  });

  browseButton.addEventListener('click', async () => {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === 'string' && selection) {
        input.value = selection;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (error) {
      console.error('Failed to open directory chooser for assets:', error);
    }
  });

  loadButton.addEventListener('click', async () => {
    const tibiaPath = input.value.trim();
    if (!tibiaPath) {
      setStatus(`Select the Tibia directory that provides assets for the ${options.entityLabel}.`, false);
      return;
    }

    setLoading(true, 'Loading appearances and sprites...');
    results.hidden = true;
    results.innerHTML = '';

    try {
      const assetResult = await loadAssetsForScripts(tibiaPath, {
        onProgress: message => setStatus(message, false),
      });

      results.hidden = false;

      const heading = document.createElement('h4');
      heading.textContent = options.resultHeading;

      const summary = document.createElement('p');
      summary.className = 'launcher-secondary-text';
      summary.textContent = `Objects: ${formatNumber(assetResult.stats.object_count)}, Outfits: ${formatNumber(assetResult.stats.outfit_count)}, Effects: ${formatNumber(assetResult.stats.effect_count)}, Missiles: ${formatNumber(assetResult.stats.missile_count)}`;

      const spriteSummary = document.createElement('p');
      spriteSummary.className = 'launcher-secondary-text';
      spriteSummary.textContent = `Loaded ${formatNumber(assetResult.spriteCount)} sprites for preview animations.`;

      const pathInfo = document.createElement('p');
      pathInfo.className = 'launcher-secondary-text';
      pathInfo.textContent = assetResult.appearancePath;

      results.append(heading, summary, spriteSummary, pathInfo);

      setStatus(`Assets ready from ${assetResult.appearancePath}.`, false);
      options.onReadyChange(true);
    } catch (error) {
      console.error('Failed to prepare assets for monsters/NPCs:', error);
      const message = error instanceof Error ? error.message : 'Unknown error while loading assets.';
      setStatus(message, false);
      options.onReadyChange(false);
    } finally {
      setLoading(false);
    }
  });

  updateLoadState();
  options.onReadyChange(false);
  elements.card.insertBefore(card, elements.fieldset);
}
