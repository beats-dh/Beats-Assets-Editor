// Sprite tile-size chooser state (Svelte 5 runes).
//
// Promise-resolving modal (same pattern as importExportState.openImportModal):
// when an imported image is larger than a single standard sprite, the user picks
// the tile size to slice it into. Resolves with the chosen {width,height} tile,
// or null if cancelled.

export interface TileSize {
    width: number;
    height: number;
}

/// The four representable Tibia sprite tile sizes (catalog spritetype 0..3).
export const STANDARD_TILE_SIZES: TileSize[] = [
    { width: 32, height: 32 },
    { width: 32, height: 64 },
    { width: 64, height: 32 },
    { width: 64, height: 64 },
];

/// True when (w,h) is exactly one of the four standard sprite sizes.
export function isStandardTileSize(width: number, height: number): boolean {
    return STANDARD_TILE_SIZES.some((s) => s.width === width && s.height === height);
}

export const spriteImportSizeState = $state({
    isOpen: false,
    imageWidth: 0,
    imageHeight: 0,
    resolve: null as ((value: TileSize | null) => void) | null,
});

export function openSpriteImportSizeModal(imageWidth: number, imageHeight: number): Promise<TileSize | null> {
    spriteImportSizeState.imageWidth = imageWidth;
    spriteImportSizeState.imageHeight = imageHeight;
    spriteImportSizeState.isOpen = true;

    return new Promise((resolve) => {
        spriteImportSizeState.resolve = resolve;
    });
}

export function closeSpriteImportSizeModal(result: TileSize | null) {
    spriteImportSizeState.isOpen = false;

    if (spriteImportSizeState.resolve) {
        spriteImportSizeState.resolve(result);
        spriteImportSizeState.resolve = null;
    }
}
