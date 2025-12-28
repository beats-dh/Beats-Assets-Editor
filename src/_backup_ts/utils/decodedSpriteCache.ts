import { decodeSpriteOffThread } from './imageDecodeWorkerClient';

const decodedSpriteCache = new Map<string, Uint8Array>();

export async function getDecodedSpriteBuffer(cacheKey: string, sprite: Uint8Array): Promise<Uint8Array> {
  const cached = decodedSpriteCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const decoded = await decodeSpriteOffThread(sprite);
    if (decoded) {
      const buffer = new Uint8Array(decoded);
      decodedSpriteCache.set(cacheKey, buffer);
      return buffer;
    }
  } catch (error) {
    console.warn('Failed to decode sprite off-thread', error);
  }

  decodedSpriteCache.set(cacheKey, sprite);
  return sprite;
}

export function invalidateDecodedSpriteCache(prefix?: string): void {
  if (!prefix) {
    decodedSpriteCache.clear();
    return;
  }
  for (const key of decodedSpriteCache.keys()) {
    if (key.startsWith(prefix)) {
      decodedSpriteCache.delete(key);
    }
  }
}
