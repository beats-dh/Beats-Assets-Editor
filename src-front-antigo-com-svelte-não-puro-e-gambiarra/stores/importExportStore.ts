import { writable } from 'svelte/store';

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

export const isImportModalOpen = writable(false);
export const importContext = writable<ImportContext | null>(null);
export const importPaths = writable<string[]>([]);
export const importResolve = writable<((value: ImportStartIds | null) => void) | null>(null);

export function openImportModal(paths: string[], context: ImportContext): Promise<ImportStartIds | null> {
  importPaths.set(paths);
  importContext.set(context);
  isImportModalOpen.set(true);
  
  return new Promise((resolve) => {
    importResolve.set(resolve);
  });
}

export function closeImportModal(result: ImportStartIds | null) {
  isImportModalOpen.set(false);
  importContext.set(null);
  importPaths.set([]);
  
  importResolve.update(resolve => {
    if (resolve) resolve(result);
    return null;
  });
}
