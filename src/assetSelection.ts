export interface AssetSelectionItem {
  category: string;
  id: number;
}

export interface AssetSelectionChangeDetail {
  selected: AssetSelectionItem[];
  primary: AssetSelectionItem | null;
}

const selection: AssetSelectionItem[] = [];
let primarySelection: AssetSelectionItem | null = null;

function dispatchSelectionChanged(): void {
  const detail: AssetSelectionChangeDetail = {
    selected: selection.map((item) => ({ ...item })),
    primary: primarySelection ? { ...primarySelection } : null,
  };
  document.dispatchEvent(new CustomEvent<AssetSelectionChangeDetail>('asset-selection-changed', { detail }));
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

export function setAssetSelection(category: string, id: number, selected: boolean): void {
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
  dispatchSelectionChanged();
}

export function toggleAssetSelection(category: string, id: number): void {
  const shouldSelect = !isAssetSelected(category, id);
  setAssetSelection(category, id, shouldSelect);
}

export function clearAssetSelection(): void {
  if (selection.length === 0) {
    return;
  }

  const snapshot = selection.splice(0, selection.length);
  primarySelection = null;

  snapshot.forEach((item) => {
    updateCardSelection(item.category, item.id, false);
  });

  dispatchSelectionChanged();
}

export function removeAssetSelection(category: string, id: number): void {
  const existingIndex = findIndex(category, id);
  if (existingIndex === -1) {
    return;
  }

  const [removed] = selection.splice(existingIndex, 1);
  if (primarySelection && primarySelection.category === removed.category && primarySelection.id === removed.id) {
    primarySelection = selection.length > 0 ? selection[selection.length - 1] : null;
  }

  updateCardSelection(category, id, false);
  dispatchSelectionChanged();
}

export function getCurrentSelection(): AssetSelectionItem[] {
  return selection.map((item) => ({ ...item }));
}

export function getPrimarySelection(): AssetSelectionItem | null {
  return primarySelection ? { ...primarySelection } : null;
}
