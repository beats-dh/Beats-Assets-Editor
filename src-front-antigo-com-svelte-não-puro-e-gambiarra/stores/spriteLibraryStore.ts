import { writable } from 'svelte/store';

export type SpriteSelectCallback = (id: number) => void;

interface SpriteLibraryState {
  isOpen: boolean;
  mode: 'browse' | 'select';
  onSelect?: SpriteSelectCallback;
}

const initialState: SpriteLibraryState = {
  isOpen: false,
  mode: 'browse'
};

function createSpriteLibraryStore() {
  const { subscribe, update } = writable<SpriteLibraryState>(initialState);

  return {
    subscribe,
    openBrowse: () => update(s => ({ ...s, isOpen: true, mode: 'browse', onSelect: undefined })),
    openSelect: (callback: SpriteSelectCallback) => update(s => ({ ...s, isOpen: true, mode: 'select', onSelect: callback })),
    close: () => update(s => ({ ...s, isOpen: false, onSelect: undefined }))
  };
}

export const spriteLibraryStore = createSpriteLibraryStore();
