// Open/close state for the "Reorganize IDs" tool modal (Svelte 5 runes).

export const reorganizeIdsState = $state({
    isOpen: false,
});

export function openReorganizeIds() {
    reorganizeIdsState.isOpen = true;
}

export function closeReorganizeIds() {
    reorganizeIdsState.isOpen = false;
}
