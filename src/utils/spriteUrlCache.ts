/**
 * Re-export from cacheRegistry for backwards compatibility.
 * All cache state lives in cacheRegistry.ts — this is just an alias.
 */
import { spriteUrlStore } from './cacheRegistry';

export function getSpriteUrl(buffer: Uint8Array): string {
  return spriteUrlStore.get(buffer);
}

export function clearSpriteUrlCache(): void {
  spriteUrlStore.clear();
}
