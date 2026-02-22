export interface HistoryEntry {
  description: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
}

const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];
const HISTORY_LIMIT = 100;
let isPerforming = false;

export function recordAction(entry: HistoryEntry): void {
  if (isPerforming) {
    return;
  }
  undoStack.push(entry);
  if (undoStack.length > HISTORY_LIMIT) {
    undoStack.shift();
  }
  redoStack.length = 0;
}

export async function undo(): Promise<void> {
  if (isPerforming) return;
  const entry = undoStack.pop();
  if (!entry) return;

  isPerforming = true;
  try {
    await entry.undo();
    redoStack.push(entry);
  } finally {
    isPerforming = false;
  }
}

export async function redo(): Promise<void> {
  if (isPerforming) return;
  const entry = redoStack.pop();
  if (!entry) return;

  isPerforming = true;
  try {
    await entry.redo();
    undoStack.push(entry);
    if (undoStack.length > HISTORY_LIMIT) {
      undoStack.shift();
    }
  } finally {
    isPerforming = false;
  }
}

export function clearHistory(): void {
  undoStack.length = 0;
  redoStack.length = 0;
}
