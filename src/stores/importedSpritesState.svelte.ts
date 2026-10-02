// Tracks how many imported (not-yet-compiled) sprites are held in the backend.
// The header surfaces the "Compile imported sprites" action only when count > 0.
// The backend DashMap is the source of truth; we just mirror its length.

import { invoke } from "../utils/invoke";
import { COMMANDS } from "../commands";

export const importedSpritesState = $state({
    count: 0,
});

export async function refreshImportedSpriteCount(): Promise<void> {
    try {
        importedSpritesState.count = await invoke<number>(COMMANDS.COUNT_IMPORTED_SPRITES);
    } catch (error) {
        console.error("Failed to count imported sprites", error);
        importedSpritesState.count = 0;
    }
}
