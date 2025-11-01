import { createFolderSelectionView } from '../editorFolderSelection';
import './monstersNpc.css';
import { loadNpcLibrary } from './npcLibrary';
import type { EditorViewOptions } from './types';
import { createLoadingOverlay, renderNpcLibrary } from './ui';
import { attachAssetsSelection } from './assetsSelection';

const NPC_SCRIPTS_KEY = 'npcScriptsDirectory';
const SHARED_ASSETS_KEY = 'monstersNpcAssetsDirectory';

export function createNpcEditorView({ onBack }: EditorViewOptions): HTMLElement {
  let assetsReady = false;

  return createFolderSelectionView({
    onBack,
    title: 'NPC editor',
    description: 'Load NPC dialogue and behaviour scripts to review and adjust them.',
    storageKey: NPC_SCRIPTS_KEY,
    loadButtonLabel: 'Load NPC scripts',
    helpText: 'Load the Tibia assets used for outfit previews, then scan your NPC script directory.',
    emptyStateText: 'Enter or select a folder before loading NPC scripts.',
    resultHeading: 'Detected NPC scripts',
    folderTitle: 'NPC scripts directory',
    folderLabel: 'Scripts folder',
    placeholder: 'C:\\Tibia\\data\\npc',
    browseButtonLabel: 'Selecionar diretório',
    scanningText: 'Scanning for NPC scripts...',
    readyText: 'NPC scripts folder captured. Dialogue ingestion will follow the assets experience soon.',
    shouldEnableLoadButton: () => assetsReady,
    onViewReady: elements => {
      attachAssetsSelection(elements, {
        storageKey: SHARED_ASSETS_KEY,
        title: 'Tibia assets directory',
        folderLabel: 'Tibia folder',
        placeholder: 'C:\\Tibia',
        loadButtonLabel: 'Load Tibia assets',
        browseButtonLabel: 'Selecionar diretório',
        resultHeading: 'Assets prepared for NPC previews',
        entityLabel: 'NPC editor',
        onReadyChange: ready => {
          assetsReady = ready;
          if (ready) {
            elements.status.hidden = false;
            elements.status.textContent = 'Assets loaded. You can now load NPC scripts.';
          } else {
            elements.status.hidden = false;
            elements.status.textContent = 'Load Tibia assets before indexing NPC scripts.';
          }
          elements.updateLoadButtonState();
        },
      });
      elements.helper.textContent = 'Select the Tibia installation to supply outfit sprites, then load the NPC scripts to explore their dialogues and storage usage.';
      elements.status.hidden = false;
      elements.status.textContent = 'Load Tibia assets before indexing NPC scripts.';
      elements.updateLoadButtonState();
    },
    onFolderLoaded: async context => {
      if (!assetsReady) {
        context.status.hidden = false;
        context.status.textContent = 'Load Tibia assets before indexing NPC scripts.';
        return;
      }
      context.resultsContainer.innerHTML = '';
      const overlay = createLoadingOverlay('Scanning NPC scripts...');
      context.resultsContainer.append(overlay);
      const overlayText = overlay.querySelector('.entity-loading-text') as HTMLElement | null;
      try {
        const npcs = await loadNpcLibrary(context.path, {
          onProgress: message => {
            context.status.textContent = message;
            if (overlayText) {
              overlayText.textContent = message;
            }
          },
        });
        context.resultsContainer.innerHTML = '';
        renderNpcLibrary(npcs, context.resultsContainer);
        context.status.textContent = npcs.length === 0
          ? 'No NPCs were detected in the selected directory.'
          : `Loaded ${npcs.length} NPCs from ${context.path}.`;
      } catch (error) {
        console.error('Failed to build NPC library:', error);
        context.resultsContainer.innerHTML = '';
        const errorMessage = document.createElement('p');
        errorMessage.className = 'entity-empty-state';
        errorMessage.textContent = 'We could not load this folder. Please review the console for additional details.';
        context.resultsContainer.append(errorMessage);
        context.status.textContent = 'Loading the NPC library failed.';
      }
    },
  });
}
