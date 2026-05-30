// Selection state using Svelte 5 runes — rewritten without DOM manipulation or CustomEvent
import type { CompleteAppearanceItem } from '../types';
import { recordAction } from '../history';

// ============================================================================
// Single Asset Selection (Details Modal)
// ============================================================================

export const detailsModal = $state({
    selectedAsset: null as CompleteAppearanceItem | null,
    isOpen: false,
    activeTab: 'details' as 'details' | 'edit' | 'texture',
});

export function openAssetDetails(asset: CompleteAppearanceItem, resetTab = true) {
    detailsModal.selectedAsset = asset;
    if (resetTab) {
        detailsModal.activeTab = 'details';
    }
    detailsModal.isOpen = true;
}

export function closeAssetDetails() {
    detailsModal.isOpen = false;
    detailsModal.selectedAsset = null;
}

// ============================================================================
// Multiple Asset Selection (Grid Selection)
// ============================================================================

export interface AssetSelectionItem {
    category: string;
    id: number;
}

interface SelectionSnapshot {
    selected: AssetSelectionItem[];
    primary: AssetSelectionItem | null;
}

// Reactive selection state — components react to changes automatically
export const selectionState = $state({
    selected: [] as AssetSelectionItem[],
    primary: null as AssetSelectionItem | null,
    // Bumped on every change so derived state recalculates
    version: 0,
});

function createSnapshot(): SelectionSnapshot {
    return {
        selected: selectionState.selected.map(item => ({ ...item })),
        primary: selectionState.primary ? { ...selectionState.primary } : null,
    };
}

function snapshotChanged(snapshot: SelectionSnapshot): boolean {
    if (snapshot.selected.length !== selectionState.selected.length) return true;

    for (let i = 0; i < selectionState.selected.length; i++) {
        const cur = selectionState.selected[i];
        const prev = snapshot.selected[i];
        if (!prev || cur.category !== prev.category || cur.id !== prev.id) return true;
    }

    const a = snapshot.primary;
    const b = selectionState.primary;
    if (!a && !b) return false;
    if (!a || !b) return true;
    return a.category !== b.category || a.id !== b.id;
}

function applySnapshot(snapshot: SelectionSnapshot) {
    selectionState.selected = snapshot.selected.map(item => ({ ...item }));
    selectionState.primary = snapshot.primary ? { ...snapshot.primary } : null;
    selectionState.version++;
}

function commitHistory(before: SelectionSnapshot | null, record: boolean) {
    selectionState.version++;
    if (record && before && snapshotChanged(before)) {
        const after = createSnapshot();
        recordAction({
            description: 'Atualizar seleção',
            undo: () => applySnapshot(before),
            redo: () => applySnapshot(after),
        });
    }
}

function findIndex(category: string, id: number): number {
    return selectionState.selected.findIndex(
        item => item.category === category && item.id === id
    );
}

export function isAssetSelected(category: string, id: number): boolean {
    return findIndex(category, id) !== -1;
}

export function setAssetSelection(category: string, id: number, selected: boolean, recordHistory = true) {
    const before = recordHistory ? createSnapshot() : null;
    const idx = findIndex(category, id);

    if (selected) {
        if (idx === -1) {
            const item: AssetSelectionItem = { category, id };
            selectionState.selected = [...selectionState.selected, item];
            selectionState.primary = item;
        } else {
            selectionState.primary = selectionState.selected[idx];
        }
    } else if (idx !== -1) {
        const removed = selectionState.selected[idx];
        selectionState.selected = selectionState.selected.filter((_, i) => i !== idx);
        if (selectionState.primary?.category === removed.category && selectionState.primary?.id === removed.id) {
            selectionState.primary = selectionState.selected.length > 0
                ? selectionState.selected[selectionState.selected.length - 1]
                : null;
        }
    } else {
        return;
    }

    commitHistory(before, recordHistory);
}

export function toggleAssetSelection(category: string, id: number) {
    setAssetSelection(category, id, !isAssetSelected(category, id));
}

export function clearAssetSelection() {
    if (selectionState.selected.length === 0) return;

    const before = createSnapshot();
    selectionState.selected = [];
    selectionState.primary = null;
    commitHistory(before, true);
}

export function removeAssetSelection(category: string, id: number) {
    const idx = findIndex(category, id);
    if (idx === -1) return;

    const before = createSnapshot();
    const removed = selectionState.selected[idx];
    selectionState.selected = selectionState.selected.filter((_, i) => i !== idx);
    if (selectionState.primary?.category === removed.category && selectionState.primary?.id === removed.id) {
        selectionState.primary = selectionState.selected.length > 0
            ? selectionState.selected[selectionState.selected.length - 1]
            : null;
    }
    commitHistory(before, true);
}

export function getCurrentSelection(): AssetSelectionItem[] {
    return selectionState.selected.map(item => ({ ...item }));
}

export function getPrimarySelection(): AssetSelectionItem | null {
    return selectionState.primary ? { ...selectionState.primary } : null;
}
