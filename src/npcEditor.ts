import { createFolderSelectionView } from "./editorFolderSelection";
import type { EditorViewOptions } from "./monsterEditor";

const NPC_SCRIPTS_KEY = "npcScriptsDirectory";

export function createNpcEditorView({ onBack }: EditorViewOptions): HTMLElement {
  return createFolderSelectionView({
    onBack,
    title: "NPC editor",
    description: "Load NPC dialogue and behaviour scripts to review and adjust them.",
    storageKey: NPC_SCRIPTS_KEY,
    loadButtonLabel: "Load NPC scripts",
    helpText: "Select the folder that stores your NPC .lua files. We'll index them using the same workflow as assets.",
    emptyStateText: "Enter or select a folder before loading NPC scripts.",
    resultHeading: "Detected NPC scripts",
    folderTitle: "NPC scripts directory",
    folderLabel: "Scripts folder",
    placeholder: "C:\\Tibia\\data\\npc",
    browseButtonLabel: "Selecionar diretório",
    scanningText: "Scanning for NPC scripts...",
    readyText: "NPC scripts folder captured. Dialogue ingestion will follow the assets experience soon.",
  });
}
