# Implementation Plan: Port Texture Tab and Sprite Library

## Goal
Port the "Texture" tab and "Sprite Library" functionality from the backup repository to the current project, ensuring exact feature parity (including UI structure and complex interactions like drag & drop).

## User Review Required
> [!IMPORTANT]
> The current "Texture" tab and "Sprite Library" implementation will be significantly refactored. The backup's logic for "pure Svelte" porting includes specific state management for sprite previews and library interactions that overrides existing behavior.

## Proposed Changes

### 1. Sprite Library Refactoring
The Sprite Library needs to match the backup's side-panel behavior and capabilities (multi-select drag & drop, range loading).

#### [MODIFY] [SpriteLibraryDrawer.svelte](src/components/drawers/SpriteLibraryDrawer.svelte)
-   **Structure:** Ensure it behaves as a side drawer (overlay or shift content) matching `styles/texture.css` from backup.
-   **Multi-Select:** Implement `Set<number>` based selection with `Ctrl/Cmd` click support.
-   **Drag & Drop:** Implement `dragstart` to transfer a custom JSON payload (`{ spriteIds: number[] }`) consistent with what `TextureEditor` expects.
-   **IO:** Support parsing ranges (e.g., "1-100") in the search input.
-   **Rendering:** Use `TextureSpriteList`-like rendering for consistency.

### 2. Texture Editor Architecture
Refactor `src/components/asset-details/texture/` to match the logical structure of the backup's `textureTab.ts`.

#### [MODIFY] [TextureEditor.svelte](src/components/asset-details/texture/TextureEditor.svelte)
-   **State:** Adopt `OutfitPreviewState` and `ObjectPreviewState`.
-   **Stores:** Manage the sprite list and handle Tauri invocations (`update_appearance_sprites`).
-   **Library Integration:** Add a wrapper or slot to include `SpriteLibraryDrawer` or a trigger to open it. (The backup had it as a global drawer, effectively).
-   **Drop Handler:** Implement `handleSpriteDrop` to accept data from the Library.

#### [MODIFY] [TexturePreview.svelte](src/components/asset-details/texture/TexturePreview.svelte)
-   **Canvas:** Implement `renderSpriteVariant`, `draw` (composition of layers/addons).
-   **Interaction:** Drop Zone for sprites.
-   **Outfit Logic:** Addon, Mount, Blending, Colorizing (Head/Body/Legs/Feet).

#### [MODIFY] [TextureControls.svelte](src/components/asset-details/texture/TextureControls.svelte)
-   **Inputs:** Direction buttons, Addon slider, Frame slider, Color pickers.

#### [MODIFY] [TextureSettings.svelte](src/components/asset-details/texture/TextureSettings.svelte)
-   **Forms:** Property grids for Pattern W/H/D, Layers, Frames.
-   **Animation:** Timing phases editor.
-   **Bounding Boxes:** Table editor for adding/removing boxes.

#### [MODIFY] [TextureSpriteList.svelte](src/components/asset-details/texture/TextureSpriteList.svelte)
-   **List:** Draggable chips for reordering.
-   **actions:** Remove, Add (append).

### 3. Styles
#### [NEW] [texture.css](src/styles/texture.css)
-   Port the full CSS from backup to support the specific layout (two columns + floating library drawer).

## Verification Plan

### Test Scenarios
1.  **Sprite Library**:
    -   Open Library (click 'Search' icon or button).
    -   Type "100-110", click Load -> Sprites appear.
    -   Ctrl+Click multiple sprites -> Selection highlights.
    -   Drag selection -> Icon follows cursor.
2.  **Texture Tab**:
    -   Drop dragged sprites onto "Drop Zone" -> Replaces current sprite.
    -   Drop onto "Sprite List" -> Reorders or Appends (if dropped at end).
    -   Modify "Head Color" -> Preview updates immediately.
    -   Change "Frame" slider -> Preview updates.
3.  **Persistence**:
    -   Save -> Reload -> verify changes are kept.
