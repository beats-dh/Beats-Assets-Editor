/**
 * Unified Sprite Cache
 *
 * Single source of truth for all appearance-related cached data.
 * Replaces 6 separate caches that previously stored overlapping data:
 *
 *   ANTES (6 caches separados):
 *   ┌──────────────────────────┬─────────────────────────┬──────────────┐
 *   │ appearanceSpriteCache    │ string → Uint8Array[]   │ spriteCache  │
 *   │ previewSpriteCache       │ string → Uint8Array     │ spriteLoading│
 *   │ detailSpriteCache        │ string → Uint8Array[]   │ spriteLoading│
 *   │ detailSpritePromises     │ string → Promise        │ spriteLoading│
 *   │ decodedSpriteCache       │ string → Uint8Array     │ decodedSprite│
 *   │ detailCache              │ string → Appearance     │ animation    │
 *   └──────────────────────────┴─────────────────────────┴──────────────┘
 *
 *   DEPOIS (1 cache unificado):
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ unifiedSpriteCache["Objects:123"] = {                           │
 *   │   preview:        Uint8Array      (decoded 1st sprite)          │
 *   │   sprites:        Uint8Array[]    (raw from IPC)                │
 *   │   decodedSprites: Uint8Array[]    (all decoded via Worker)      │
 *   │   details:        CompleteAppearanceItem  (metadata)            │
 *   │ }                                                                │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Backend caches (Rust) DEVEM ser mantidos:
 *   - Sprite sheet cache: evita re-ler .spr/.bmp do disco
 *   - Appearance cache: evita re-parse do .dat
 *   - Esses caches eliminam I/O de disco; o cache frontend elimina IPC
 */

import type { CompleteAppearanceItem } from '../types';
import { decodeSpriteOffThread } from './imageDecodeWorkerClient';
import { perfConfig } from '../stores/performanceConfig.svelte';

interface AppearanceCacheEntry {
  /** Decoded preview sprite (first sprite, ready for grid display) */
  preview: Uint8Array | null;
  /** Raw sprites from IPC (all frames — used by animation via Blob URL) */
  sprites: Uint8Array[] | null;
  /** Decoded sprites (all frames decoded via Web Worker) */
  decodedSprites: Uint8Array[] | null;
  /** Appearance metadata from get_complete_appearance */
  details: CompleteAppearanceItem | null;
  /** In-flight promise for sprite fetching (request deduplication) */
  _inflightSprites: Promise<Uint8Array[]> | null;
  /** LRU timestamp */
  _lastAccess: number;
}

function createEntry(): AppearanceCacheEntry {
  return {
    preview: null,
    sprites: null,
    decodedSprites: null,
    details: null,
    _inflightSprites: null,
    _lastAccess: Date.now(),
  };
}

function makeKey(category: string, id: number): string {
  return `${category}:${id}`;
}

class UnifiedSpriteCacheImpl {
  private cache = new Map<string, AppearanceCacheEntry>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  private getOrCreate(key: string): AppearanceCacheEntry {
    let entry = this.cache.get(key);
    if (!entry) {
      this.evictIfNeeded();
      entry = createEntry();
      this.cache.set(key, entry);
    }
    entry._lastAccess = Date.now();
    return entry;
  }

  private touch(entry: AppearanceCacheEntry): void {
    entry._lastAccess = Date.now();
  }

  private evictIfNeeded(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry._lastAccess < oldestTime) {
        oldestTime = entry._lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) this.cache.delete(oldestKey);
  }

  // --- Preview ---

  getPreview(category: string, id: number): Uint8Array | undefined {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry) return undefined;
    this.touch(entry);
    // Derive from decoded sprites if preview not explicitly set
    if (!entry.preview && entry.decodedSprites?.[0]) {
      entry.preview = entry.decodedSprites[0];
    }
    return entry.preview ?? undefined;
  }

  setPreview(category: string, id: number, buffer: Uint8Array): void {
    const entry = this.getOrCreate(makeKey(category, id));
    entry.preview = buffer;
  }

  /** Clear only the preview for a specific entry (keeps sprites/details) */
  clearPreview(category: string, id: number): void {
    const entry = this.cache.get(makeKey(category, id));
    if (entry) entry.preview = null;
  }

  clearAllPreviews(): void {
    for (const entry of this.cache.values()) {
      entry.preview = null;
    }
  }

  // --- Raw Sprites (from IPC, for animation/Blob URL) ---

  getRawSprites(category: string, id: number): Uint8Array[] | undefined {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry?.sprites) return undefined;
    this.touch(entry);
    return entry.sprites;
  }

  setRawSprites(category: string, id: number, sprites: Uint8Array[]): void {
    const entry = this.getOrCreate(makeKey(category, id));
    entry.sprites = sprites;
  }

  // --- Decoded Sprites (for detail view canvas) ---

  getDecodedSprites(category: string, id: number): Uint8Array[] | undefined {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry?.decodedSprites) return undefined;
    this.touch(entry);
    return entry.decodedSprites;
  }

  setDecodedSprites(category: string, id: number, sprites: Uint8Array[]): void {
    const entry = this.getOrCreate(makeKey(category, id));
    entry.decodedSprites = sprites;
  }

  /** Decode raw sprites if not already decoded, return decoded array */
  async getOrDecodeSprites(category: string, id: number): Promise<Uint8Array[] | undefined> {
    const key = makeKey(category, id);
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    this.touch(entry);

    if (entry.decodedSprites) return entry.decodedSprites;
    if (!entry.sprites) return undefined;

    const decoded = await Promise.all(
      entry.sprites.map(async (sprite) => {
        try {
          const result = await decodeSpriteOffThread(sprite);
          return result ? new Uint8Array(result) : sprite;
        } catch {
          return sprite;
        }
      })
    );

    entry.decodedSprites = decoded;
    return decoded;
  }

  // --- Details (CompleteAppearanceItem metadata) ---

  getDetails(category: string, id: number): CompleteAppearanceItem | undefined {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry?.details) return undefined;
    this.touch(entry);
    return entry.details;
  }

  setDetails(category: string, id: number, details: CompleteAppearanceItem): void {
    const entry = this.getOrCreate(makeKey(category, id));
    entry.details = details;
  }

  // --- Request Deduplication ---

  getInflightSprites(category: string, id: number): Promise<Uint8Array[]> | null {
    const entry = this.cache.get(makeKey(category, id));
    return entry?._inflightSprites ?? null;
  }

  setInflightSprites(category: string, id: number, promise: Promise<Uint8Array[]>): void {
    const entry = this.getOrCreate(makeKey(category, id));
    entry._inflightSprites = promise;
  }

  clearInflightSprites(category: string, id: number): void {
    const entry = this.cache.get(makeKey(category, id));
    if (entry) entry._inflightSprites = null;
  }

  // --- Granular Updates (for editing operations) ---

  updateSprite(category: string, id: number, index: number, newBuffer: Uint8Array): void {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry) return;
    if (entry.sprites && index >= 0 && index < entry.sprites.length) {
      entry.sprites[index] = newBuffer;
    }
    if (entry.decodedSprites && index >= 0 && index < entry.decodedSprites.length) {
      entry.decodedSprites[index] = newBuffer;
    }
  }

  appendSprites(category: string, id: number, buffers: Uint8Array[]): void {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry) return;
    if (entry.sprites) entry.sprites.push(...buffers);
    if (entry.decodedSprites) entry.decodedSprites.push(...buffers);
  }

  removeSprites(category: string, id: number, indices: number[]): void {
    const entry = this.cache.get(makeKey(category, id));
    if (!entry) return;
    const sorted = [...indices].sort((a, b) => b - a);

    if (entry.sprites) {
      for (const i of sorted) {
        if (i >= 0 && i < entry.sprites.length) entry.sprites.splice(i, 1);
      }
    }
    if (entry.decodedSprites) {
      for (const i of sorted) {
        if (i >= 0 && i < entry.decodedSprites.length) entry.decodedSprites.splice(i, 1);
      }
    }
  }

  // --- Invalidation ---

  invalidate(category: string, id: number): void {
    this.cache.delete(makeKey(category, id));
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /** Debug: returns stats about all cached entries */
  getStats(): { size: number; memoryEstimateKB: number; entries: { key: string; hasPreview: boolean; spritesCount: number; hasDecoded: boolean; hasDetails: boolean }[] } {
    const entries: { key: string; hasPreview: boolean; spritesCount: number; hasDecoded: boolean; hasDetails: boolean }[] = [];
    let totalBytes = 0;

    for (const [key, entry] of this.cache) {
      const spritesCount = entry.sprites?.length ?? 0;
      if (entry.preview) totalBytes += entry.preview.byteLength;
      if (entry.sprites) entry.sprites.forEach(s => totalBytes += s.byteLength);
      if (entry.decodedSprites) entry.decodedSprites.forEach(s => totalBytes += s.byteLength);

      entries.push({
        key,
        hasPreview: !!entry.preview,
        spritesCount,
        hasDecoded: !!entry.decodedSprites,
        hasDetails: !!entry.details,
      });
    }

    return { size: this.cache.size, memoryEstimateKB: Math.round(totalBytes / 1024), entries };
  }
}

export const unifiedSpriteCache = new UnifiedSpriteCacheImpl(
  Math.max(perfConfig.appearanceCacheMax, perfConfig.maxPreviewCacheSize)
);
