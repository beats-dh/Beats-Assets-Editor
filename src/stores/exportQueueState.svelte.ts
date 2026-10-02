// Export queue (DatEditor "Add to Export List" parity) — accumulate appearances
// and export them all at once. Frontend-only: the batch export reuses the
// existing single-item export commands per entry.

export interface ExportQueueItem {
    category: string;
    id: number;
}

export const exportQueueState = $state({
    items: [] as ExportQueueItem[],
    isOpen: false,
});

export function isInExportQueue(category: string, id: number): boolean {
    return exportQueueState.items.some((i) => i.category === category && i.id === id);
}

export function addToExportQueue(category: string, id: number) {
    if (!isInExportQueue(category, id)) {
        exportQueueState.items = [...exportQueueState.items, { category, id }];
    }
}

export function removeFromExportQueue(category: string, id: number) {
    exportQueueState.items = exportQueueState.items.filter(
        (i) => !(i.category === category && i.id === id),
    );
}

export function clearExportQueue() {
    exportQueueState.items = [];
}

export function openExportQueue() {
    exportQueueState.isOpen = true;
}

export function closeExportQueue() {
    exportQueueState.isOpen = false;
}
