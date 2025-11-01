import { createFolderSelectionView, type FolderLoadContext } from '../editorFolderSelection';
import './monstersNpc.css';
import { loadMonsterLibrary } from './monsterLibrary';
import type { EditorViewOptions } from './types';
import { createLoadingOverlay, renderMonsterLibrary } from './ui';
import { attachAssetsSelection } from './assetsSelection';

const MONSTER_SCRIPTS_KEY = 'monsterScriptsDirectory';
const MONSTER_ASSETS_KEY = 'monstersNpcAssetsDirectory';

async function handleMonsterFolderLoad({
  path,
  status,
  resultsContainer,
}: FolderLoadContext): Promise<void> {
  resultsContainer.innerHTML = '';
  const overlay = createLoadingOverlay('Scanning monster scripts...');
  resultsContainer.append(overlay);
  const overlayText = overlay.querySelector('.entity-loading-text') as HTMLElement | null;

  const monsters = await loadMonsterLibrary(path, {
    onProgress: message => {
      status.textContent = message;
      if (overlayText) {
        overlayText.textContent = message;
      }
    },
  });

  resultsContainer.innerHTML = '';
  renderMonsterLibrary(monsters, resultsContainer);
  status.textContent = monsters.length === 0
    ? 'No monsters were detected in the selected directory.'
    : `Loaded ${monsters.length} monsters from ${path}.`;
}

export function createMonsterEditorView({ onBack }: EditorViewOptions): HTMLElement {
  let assetsReady = false;

  return createFolderSelectionView({
    onBack,
    title: 'Monster editor',
    description: 'Load monster behaviours from .lua scripts to inspect and edit them.',
    storageKey: MONSTER_SCRIPTS_KEY,
    loadButtonLabel: 'Load monster scripts',
    helpText: 'First, load the Tibia assets used for looktype previews. Then scan your monster script directory to inspect their data.',
    emptyStateText: 'Enter or select a folder before loading monster scripts.',
    resultHeading: 'Detected monster scripts',
    folderTitle: 'Monster scripts directory',
    folderLabel: 'Scripts folder',
    placeholder: 'C:\\Tibia\\data\\monster',
    browseButtonLabel: 'Selecionar diretório',
    scanningText: 'Scanning for monster scripts...',
    readyText: 'Monster scripts folder captured. Script ingestion will mirror the assets workflow soon.',
    shouldEnableLoadButton: () => assetsReady,
    onViewReady: elements => {
      attachAssetsSelection(elements, {
        storageKey: MONSTER_ASSETS_KEY,
        title: 'Tibia assets directory',
        folderLabel: 'Tibia folder',
        placeholder: 'C:\\Tibia',
        loadButtonLabel: 'Load Tibia assets',
        browseButtonLabel: 'Selecionar diretório',
        resultHeading: 'Assets prepared for monster previews',
        entityLabel: 'monster editor',
        onReadyChange: ready => {
          assetsReady = ready;
          if (ready) {
            elements.status.hidden = false;
            elements.status.textContent = 'Assets loaded. You can now load monster scripts.';
          } else {
            elements.status.hidden = false;
            elements.status.textContent = 'Load Tibia assets before indexing monster scripts.';
          }
          elements.updateLoadButtonState();
        },
      });
      elements.helper.textContent = 'Select the Tibia installation that contains your appearance assets, then load the monster scripts to review them with accurate looktype previews.';
      elements.status.hidden = false;
      elements.status.textContent = 'Load Tibia assets before indexing monster scripts.';
      elements.updateLoadButtonState();
    },
    onFolderLoaded: async context => {
      if (!assetsReady) {
        context.status.hidden = false;
        context.status.textContent = 'Load Tibia assets before indexing monster scripts.';
        return;
      }
      try {
        await handleMonsterFolderLoad(context);
      } catch (error) {
        console.error('Failed to build monster library:', error);
        context.resultsContainer.innerHTML = '';
        const errorMessage = document.createElement('p');
        errorMessage.className = 'entity-empty-state';
        errorMessage.textContent = 'We could not load this folder. Please review the console for additional details.';
        context.resultsContainer.append(errorMessage);
        context.status.textContent = 'Loading the monster library failed.';
      }
    },
  });
}
