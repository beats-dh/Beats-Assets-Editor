import { recordAction } from './history';

export interface AssetSelectionItem {
  category: string;
  id: number;
}

export interface AssetSelectionChangeDetail {
  selected: AssetSelectionItem[];
  primary: AssetSelectionItem | null;
}

interface AssetSelectionSnapshot {
  selected: AssetSelectionItem[];
  primary: AssetSelectionItem | null;
}

const selection: AssetSelectionItem[] = [];
let primarySelection: AssetSelectionItem | null = null;
let isApplyingSnapshot = false;

function dispatchSelectionChanged(): void {
  const detail: AssetSelectionChangeDetail = {
    selected: selection.map((item) => ({ ...item })),
    primary: primarySelection ? { ...primarySelection } : null,
  };
  document.dispatchEvent(new CustomEvent<AssetSelectionChangeDetail>('asset-selection-changed', { detail }));
}

function createSnapshot(): AssetSelectionSnapshot {
  return {
    selected: selection.map((item) => ({ ...item })),
    primary: primarySelection ? { ...primarySelection } : null,
  };
}

function selectionChangedSince(snapshot: AssetSelectionSnapshot): boolean {
  if (snapshot.selected.length !== selection.length) {
    return true;
  }

  for (let i = 0; i < selection.length; i += 1) {
    const current = selection[i];
    const prev = snapshot.selected[i];
    if (!prev || current.category !== prev.category || current.id !== prev.id) {
      return true;
    }
  }

  const primaryA = snapshot.primary;
  const primaryB = primarySelection;
  if (!primaryA && !primaryB) {
    return false;
  }
  if (!primaryA || !primaryB) {
    return true;
  }
  return primaryA.category !== primaryB.category || primaryA.id !== primaryB.id;
}

function commitHistory(snapshotBefore: AssetSelectionSnapshot | null, recordHistory: boolean): void {
  if (recordHistory && snapshotBefore && selectionChangedSince(snapshotBefore)) {
    const snapshotAfter = createSnapshot();
    recordAction({
      description: 'Atualizar seleção',
      undo: () => applySelectionSnapshot(snapshotBefore, true),
      redo: () => applySelectionSnapshot(snapshotAfter, true),
    });
  }
  dispatchSelectionChanged();
}

function applySelectionSnapshot(snapshot: AssetSelectionSnapshot, skipHistory = false): void {
  if (isApplyingSnapshot) return;
  isApplyingSnapshot = true;

  const targetKeys = new Set(snapshot.selected.map((item) => `${item.category}:${item.id}`));

  // Unselect items not present in the snapshot
  selection.forEach((item) => {
    const key = `${item.category}:${item.id}`;
    if (!targetKeys.has(key)) {
      updateCardSelection(item.category, item.id, false);
    }
  });

  // Apply snapshot
  selection.splice(0, selection.length, ...snapshot.selected.map((item) => ({ ...item })));
  primarySelection = snapshot.primary ? { ...snapshot.primary } : null;

  // Select items in the snapshot
  snapshot.selected.forEach((item) => {
    updateCardSelection(item.category, item.id, true);
  });

  isApplyingSnapshot = false;
  dispatchSelectionChanged();
}

function findIndex(category: string, id: number): number {
  return selection.findIndex((item) => item.category === category && item.id === id);
}

function updateCardSelection(category: string, id: number, selected: boolean): void {
  const card = document.querySelector<HTMLElement>(`.asset-item[data-asset-id="${id}"][data-category="${category}"]`);
  if (card) {
    card.classList.toggle('is-selected', selected);
  }

  const checkbox = card?.querySelector<HTMLInputElement>('.asset-select-checkbox');
  if (checkbox) {
    checkbox.checked = selected;
  }
}

export function isAssetSelected(category: string, id: number): boolean {
  return findIndex(category, id) !== -1;
}

export function setAssetSelection(category: string, id: number, selected: boolean, recordHistory = true): void {
  const snapshotBefore = recordHistory ? createSnapshot() : null;
  const existingIndex = findIndex(category, id);

  if (selected) {
    if (existingIndex === -1) {
      const item: AssetSelectionItem = { category, id };
      selection.push(item);
      primarySelection = item;
    } else {
      primarySelection = selection[existingIndex];
    }
  } else if (existingIndex !== -1) {
    const [removed] = selection.splice(existingIndex, 1);
    if (primarySelection && primarySelection.category === removed.category && primarySelection.id === removed.id) {
      primarySelection = selection.length > 0 ? selection[selection.length - 1] : null;
    }
  } else {
    return;
  }

  updateCardSelection(category, id, selected);
  commitHistory(snapshotBefore, recordHistory);
}

export function toggleAssetSelection(category: string, id: number): void {
  const shouldSelect = !isAssetSelected(category, id);
  setAssetSelection(category, id, shouldSelect);
}

export function clearAssetSelection(): void {
  if (selection.length === 0) {
    return;
  }

  const snapshotBefore = createSnapshot();
  const snapshot = selection.splice(0, selection.length);
  primarySelection = null;

  snapshot.forEach((item) => {
    updateCardSelection(item.category, item.id, false);
  });

  commitHistory(snapshotBefore, true);
}

export function removeAssetSelection(category: string, id: number): void {
  const existingIndex = findIndex(category, id);
  if (existingIndex === -1) {
    return;
  }

  const snapshotBefore = createSnapshot();
  const [removed] = selection.splice(existingIndex, 1);
  if (primarySelection && primarySelection.category === removed.category && primarySelection.id === removed.id) {
    primarySelection = selection.length > 0 ? selection[selection.length - 1] : null;
  }

  updateCardSelection(category, id, false);
  commitHistory(snapshotBefore, true);
}

export function getCurrentSelection(): AssetSelectionItem[] {
  return selection.map((item) => ({ ...item }));
}

export function getPrimarySelection(): AssetSelectionItem | null {
  return primarySelection ? { ...primarySelection } : null;
}
