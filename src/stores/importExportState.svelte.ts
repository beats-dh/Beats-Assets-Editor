// Import/Export state using Svelte 5 runes

export interface ImportStartIds {
    objects: number | null;
    outfits: number | null;
    effects: number | null;
    missiles: number | null;
}

export interface ImportContext {
    latest: {
        objects: number;
        outfits: number;
        effects: number;
        missiles: number;
        sounds: number;
    };
    present: {
        objects: boolean;
        outfits: boolean;
        effects: boolean;
        missiles: boolean;
    };
}

export const importExportState = $state({
    isModalOpen: false,
    context: null as ImportContext | null,
    paths: [] as string[],
    resolve: null as ((value: ImportStartIds | null) => void) | null,
});

export function openImportModal(paths: string[], context: ImportContext): Promise<ImportStartIds | null> {
    importExportState.paths = paths;
    importExportState.context = context;
    importExportState.isModalOpen = true;

    return new Promise((resolve) => {
        importExportState.resolve = resolve;
    });
}

export function closeImportModal(result: ImportStartIds | null) {
    importExportState.isModalOpen = false;
    importExportState.context = null;
    importExportState.paths = [];

    if (importExportState.resolve) {
        importExportState.resolve(result);
        importExportState.resolve = null;
    }
}
