// Sprite Library state using Svelte 5 runes

export type SpriteSelectCallback = (id: number) => void;

export const spriteLibraryState = $state({
    isOpen: false,
    mode: 'browse' as 'browse' | 'select',
    onSelect: undefined as SpriteSelectCallback | undefined,
});

export function openBrowse() {
    spriteLibraryState.isOpen = true;
    spriteLibraryState.mode = 'browse';
    spriteLibraryState.onSelect = undefined;
}

export function openSelect(callback: SpriteSelectCallback) {
    spriteLibraryState.isOpen = true;
    spriteLibraryState.mode = 'select';
    spriteLibraryState.onSelect = callback;
}

export function closeSpriteLibrary() {
    spriteLibraryState.isOpen = false;
    spriteLibraryState.onSelect = undefined;
}
