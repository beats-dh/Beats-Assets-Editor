import { createFolderSelectionView } from "./editorFolderSelection";

export interface EditorViewOptions {
  onBack: () => void;
}

const MONSTER_SCRIPTS_KEY = "monsterScriptsDirectory";

export function createMonsterEditorView({ onBack }: EditorViewOptions): HTMLElement {
  return createFolderSelectionView({
    onBack,
    title: "Monster editor",
    description: "Load monster behaviours from .lua scripts to inspect and edit them.",
    storageKey: MONSTER_SCRIPTS_KEY,
    loadButtonLabel: "Load monster scripts",
    helpText: "Choose the root folder that contains your monster .lua files. We'll catalogue them like we do with appearance assets.",
    emptyStateText: "Enter or select a folder before loading monster scripts.",
    resultHeading: "Detected monster scripts",
    folderTitle: "Monster scripts directory",
    folderLabel: "Scripts folder",
    placeholder: "C:\\Tibia\\data\\monster",
    browseButtonLabel: "Selecionar diretório",
    scanningText: "Scanning for monster scripts...",
    readyText: "Monster scripts folder captured. Script ingestion will mirror the assets workflow soon.",
  });
}
