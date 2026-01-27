import { writable, get } from 'svelte/store';
import type { CompleteAppearanceItem } from '../types';
import { recordAction } from '../history';

// ============================================================================
// Single Asset Selection (Details Modal)
// ============================================================================

export const selectedAsset = writable<CompleteAppearanceItem | null>(null);
export const isDetailsModalOpen = writable<boolean>(false);
export const activeTab = writable<'details' | 'edit' | 'texture'>('details');

export function openAssetDetails(asset: CompleteAppearanceItem) {
  selectedAsset.set(asset);
  activeTab.set('details');
  isDetailsModalOpen.set(true);
}

export function closeAssetDetails() {
  isDetailsModalOpen.set(false);
  selectedAsset.set(null);
}

// ============================================================================
// Multiple Asset Selection (Grid Selection)
// ============================================================================

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

// Internal state for multiple selection
// We could expose this as a store, but for now we maintain the existing API
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
      undo: () => applySelectionSnapshot(snapshotBefore),
      redo: () => applySelectionSnapshot(snapshotAfter),
    });
  }
  dispatchSelectionChanged();
}

function applySelectionSnapshot(snapshot: AssetSelectionSnapshot): void {
  if (isApplyingSnapshot) return;
  isApplyingSnapshot = true;

  const targetKeys = new Set(snapshot.selected.map((item) => `${item.category}:${item.id}`));

  // Unselect items not present in the snapshot
  // Note: We can't directly manipulate DOM here easily without store binding
  // Ideally, components should react to the store/event.
  // The original code tried to manipulate DOM directly via updateCardSelection.
  // We will dispatch the event and let CategoryView handle UI updates via reactivity if possible,
  // or we maintain the DOM manipulation if CategoryView relies on it (it uses isAssetSelected check).
  
  // Apply snapshot
  selection.splice(0, selection.length, ...snapshot.selected.map((item) => ({ ...item })));
  primarySelection = snapshot.primary ? { ...snapshot.primary } : null;

  isApplyingSnapshot = false;
  dispatchSelectionChanged();
}

function findIndex(category: string, id: number): number {
  return selection.findIndex((item) => item.category === category && item.id === id);
}

// Note: Direct DOM manipulation removed in favor of Svelte reactivity.
// CategoryView should subscribe to changes or re-render on event.

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
  selection.splice(0, selection.length);
  primarySelection = null;

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

  commitHistory(snapshotBefore, true);
}

export function getCurrentSelection(): AssetSelectionItem[] {
  return selection.map((item) => ({ ...item }));
}

export function getPrimarySelection(): AssetSelectionItem | null {
  return primarySelection ? { ...primarySelection } : null;
}
