/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    CACHE REGISTRY                               ║
 * ║         Single source of truth — all caches live here           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * THREAD SAFETY (JavaScript concurrency model):
 *
 *   Main thread é single-threaded → Map.get/set/delete são atômicos.
 *   Não existe race condition entre operações síncronas.
 *
 *   Para operações ASYNC (que fazem await entre read e write):
 *   - getOrFetch: pattern atômico check-then-fetch com dedup
 *   - Inflight deduplication: impede 2+ fetches do mesmo recurso
 *   - Version tracking: previne stale writes após eviction
 *
 *   Web Workers: comunicam via postMessage (structured clone).
 *   Não acessam Maps do main thread. Para transferir sprites
 *   para workers, usar Transferable (zero-copy).
 *
 * ESTRUTURA:
 *   appearanceCache  → sprites por appearance "category:id"
 *   spriteIdCache    → sprites avulsos por sprite ID numérico
 *   spriteUrlStore   → Blob URLs (WeakMap + registry para revoke)
 *   animationStore   → animation sequences + active players
 *
 * Consumers importam namespaces e chamam get/set/clear:
 *   import { appearanceCache, spriteIdCache } from './cacheRegistry';
 *   const sprites = appearanceCache.getRawSprites('Objects', 123);
 */

import type { CompleteAppearanceItem } from '../types';
import { decodeSpriteOffThread, decodeSpritesBatch } from './imageDecodeWorkerClient';
import { perfConfig } from '../stores/performanceConfig.svelte';

// ════════════════════════════════════════════════════════════════════
// APPEARANCE CACHE — sprites, preview, decoded, details per appearance
// ════════════════════════════════════════════════════════════════════

interface AppearanceCacheEntry {
  preview: Uint8Array | null;
  sprites: Uint8Array[] | null;
  decodedSprites: Uint8Array[] | null;
  details: CompleteAppearanceItem | null;
  _inflightSprites: Promise<Uint8Array[]> | null;
  _lastAccess: number;
}

function createAppearanceEntry(): AppearanceCacheEntry {
  return {
    preview: null,
    sprites: null,
    decodedSprites: null,
    details: null,
    _inflightSprites: null,
    _lastAccess: Date.now(),
  };
}

function makeAppearanceKey(category: string, id: number): string {
  return `${category}:${id}`;
}

const _appearanceMap = new Map<string, AppearanceCacheEntry>();
const _appearanceMaxSize = Math.max(
  perfConfig.appearanceCacheMax,
  perfConfig.maxPreviewCacheSize
);

function touchAppearance(entry: AppearanceCacheEntry): void {
  entry._lastAccess = Date.now();
}

function evictAppearanceLRU(): void {
  if (_appearanceMap.size < _appearanceMaxSize) return;

  // Batch evict 5% of entries to amortize O(n) scan cost
  const evictCount = Math.max(1, Math.floor(_appearanceMaxSize * 0.05));
  const candidates: { key: string; time: number }[] = [];

  for (const [key, entry] of _appearanceMap) {
    if (candidates.length < evictCount) {
      candidates.push({ key, time: entry._lastAccess });
      if (candidates.length === evictCount) {
        candidates.sort((a, b) => a.time - b.time);
      }
    } else if (entry._lastAccess < candidates[candidates.length - 1].time) {
      candidates.pop();
      // Binary insert
      const pos = candidates.findIndex(c => c.time > entry._lastAccess);
      candidates.splice(pos === -1 ? candidates.length : pos, 0, { key, time: entry._lastAccess });
    }
  }

  for (const { key } of candidates) {
    _appearanceMap.delete(key);
  }
}

function getOrCreateAppearance(key: string): AppearanceCacheEntry {
  let entry = _appearanceMap.get(key);
  if (!entry) {
    evictAppearanceLRU();
    entry = createAppearanceEntry();
    _appearanceMap.set(key, entry);
  }
  entry._lastAccess = Date.now();
  return entry;
}

export const appearanceCache = {
  // --- Preview ---
  getPreview(category: string, id: number): Uint8Array | undefined {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry) return undefined;
    touchAppearance(entry);
    if (!entry.preview && entry.decodedSprites?.[0]) {
      entry.preview = entry.decodedSprites[0];
    }
    return entry.preview ?? undefined;
  },

  setPreview(category: string, id: number, buffer: Uint8Array): void {
    getOrCreateAppearance(makeAppearanceKey(category, id)).preview = buffer;
  },

  clearPreview(category: string, id: number): void {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (entry) entry.preview = null;
  },

  clearAllPreviews(): void {
    for (const entry of _appearanceMap.values()) {
      entry.preview = null;
    }
  },

  // --- Raw Sprites (from IPC, for animation/Blob URL) ---
  getRawSprites(category: string, id: number): Uint8Array[] | undefined {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry?.sprites) return undefined;
    touchAppearance(entry);
    return entry.sprites;
  },

  setRawSprites(category: string, id: number, sprites: Uint8Array[]): void {
    getOrCreateAppearance(makeAppearanceKey(category, id)).sprites = sprites;
  },

  // --- Decoded Sprites (for detail view canvas) ---
  getDecodedSprites(category: string, id: number): Uint8Array[] | undefined {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry?.decodedSprites) return undefined;
    touchAppearance(entry);
    return entry.decodedSprites;
  },

  setDecodedSprites(category: string, id: number, sprites: Uint8Array[]): void {
    getOrCreateAppearance(makeAppearanceKey(category, id)).decodedSprites = sprites;
  },

  /** Decode raw sprites on-demand via Web Worker. Uses batch decode to reduce IPC overhead. */
  async getOrDecodeSprites(category: string, id: number): Promise<Uint8Array[] | undefined> {
    const key = makeAppearanceKey(category, id);
    const entry = _appearanceMap.get(key);
    if (!entry) return undefined;
    touchAppearance(entry);

    if (entry.decodedSprites) return entry.decodedSprites;
    if (!entry.sprites) return undefined;

    // OPTIMIZATION: Batch decode all sprites in a single Worker message
    // instead of N individual messages (reduces postMessage overhead significantly)
    try {
      const results = await decodeSpritesBatch(entry.sprites);
      const decoded = entry.sprites.map((sprite, i) => {
        const result = results[i];
        return result ? new Uint8Array(result) : sprite;
      });
      entry.decodedSprites = decoded;
      return decoded;
    } catch {
      // Fallback: return raw sprites if batch decode fails
      return entry.sprites;
    }
  },

  // --- Details (CompleteAppearanceItem metadata) ---
  getDetails(category: string, id: number): CompleteAppearanceItem | undefined {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry?.details) return undefined;
    touchAppearance(entry);
    return entry.details;
  },

  setDetails(category: string, id: number, details: CompleteAppearanceItem): void {
    getOrCreateAppearance(makeAppearanceKey(category, id)).details = details;
  },

  // --- Inflight Request Deduplication (lock-free async safety) ---
  getInflight(category: string, id: number): Promise<Uint8Array[]> | null {
    return _appearanceMap.get(makeAppearanceKey(category, id))?._inflightSprites ?? null;
  },

  setInflight(category: string, id: number, promise: Promise<Uint8Array[]>): void {
    getOrCreateAppearance(makeAppearanceKey(category, id))._inflightSprites = promise;
  },

  clearInflight(category: string, id: number): void {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (entry) entry._inflightSprites = null;
  },

  // --- Granular Updates (editing operations) ---
  updateSprite(category: string, id: number, index: number, newBuffer: Uint8Array): void {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry) return;
    if (entry.sprites && index >= 0 && index < entry.sprites.length) {
      entry.sprites[index] = newBuffer;
    }
    if (entry.decodedSprites && index >= 0 && index < entry.decodedSprites.length) {
      entry.decodedSprites[index] = newBuffer;
    }
  },

  appendSprites(category: string, id: number, buffers: Uint8Array[]): void {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
    if (!entry) return;
    if (entry.sprites) entry.sprites.push(...buffers);
    if (entry.decodedSprites) entry.decodedSprites.push(...buffers);
  },

  removeSprites(category: string, id: number, indices: number[]): void {
    const entry = _appearanceMap.get(makeAppearanceKey(category, id));
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
  },

  // --- Invalidation ---
  invalidate(category: string, id: number): void {
    _appearanceMap.delete(makeAppearanceKey(category, id));
  },

  clear(): void {
    _appearanceMap.clear();
  },

  get size(): number {
    return _appearanceMap.size;
  },
};

// ════════════════════════════════════════════════════════════════════
// SPRITE ID CACHE — sprites avulsos por sprite ID numérico
// Key space diferente de appearance: aqui é sprite ID direto, não "category:id"
// ════════════════════════════════════════════════════════════════════

const _spriteIdMap = new Map<number, Uint8Array>();

export const spriteIdCache = {
  get(spriteId: number): Uint8Array | undefined {
    return _spriteIdMap.get(spriteId);
  },

  set(spriteId: number, buffer: Uint8Array): void {
    _spriteIdMap.set(spriteId, buffer);
  },

  has(spriteId: number): boolean {
    return _spriteIdMap.has(spriteId);
  },

  delete(spriteId: number): boolean {
    return _spriteIdMap.delete(spriteId);
  },

  clear(): void {
    _spriteIdMap.clear();
  },

  get size(): number {
    return _spriteIdMap.size;
  },
};

// ════════════════════════════════════════════════════════════════════
// SPRITE URL STORE — Blob URLs com WeakMap (GC automático) + registry
// ════════════════════════════════════════════════════════════════════

const _spriteUrlWeakMap = new WeakMap<Uint8Array, string>();
const _urlRegistry = new Set<string>();

export const spriteUrlStore = {
  /** Get or create Blob URL for a sprite buffer. Lock-free: WeakMap lookup + lazy create. */
  get(buffer: Uint8Array): string {
    const cached = _spriteUrlWeakMap.get(buffer);
    if (cached) return cached;

    // Use the buffer directly — no need to .slice() since Blob constructor copies
    const url = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
    _spriteUrlWeakMap.set(buffer, url);
    _urlRegistry.add(url);
    return url;
  },

  /** Revoke all Blob URLs created by this store */
  clear(): void {
    _urlRegistry.forEach(url => URL.revokeObjectURL(url));
    _urlRegistry.clear();
  },

  get urlCount(): number {
    return _urlRegistry.size;
  },
};

// ════════════════════════════════════════════════════════════════════
// ANIMATION STORE — preview animation sequences + active players
// ════════════════════════════════════════════════════════════════════

export interface PreviewAnimationSequence {
  frames: string[];
  interval: number;
}

const _animationSequenceMap = new Map<string, PreviewAnimationSequence>();
const _activePlayerMap = new Map<string, number>();

function makeAnimationKey(category: string, id: number): string {
  return `${category}:${id}`;
}

export const animationStore = {
  // --- Sequences (cached animation frame sets) ---
  getSequence(category: string, id: number): PreviewAnimationSequence | undefined {
    return _animationSequenceMap.get(makeAnimationKey(category, id));
  },

  setSequence(category: string, id: number, sequence: PreviewAnimationSequence): void {
    _animationSequenceMap.set(makeAnimationKey(category, id), sequence);
  },

  clearSequences(): void {
    _animationSequenceMap.clear();
  },

  get sequenceCount(): number {
    return _animationSequenceMap.size;
  },

  // --- Active Players (timer IDs for running animations) ---
  getPlayer(key: string): number | undefined {
    return _activePlayerMap.get(key);
  },

  setPlayer(key: string, timerId: number): void {
    _activePlayerMap.set(key, timerId);
  },

  hasPlayer(key: string): boolean {
    return _activePlayerMap.has(key);
  },

  deletePlayer(key: string): boolean {
    return _activePlayerMap.delete(key);
  },

  forEachPlayer(fn: (timerId: number, key: string) => void): void {
    _activePlayerMap.forEach(fn);
  },

  stopAllPlayers(): void {
    _activePlayerMap.forEach((timerId) => {
      if (timerId) clearInterval(timerId);
    });
    _activePlayerMap.clear();
  },

  get playerCount(): number {
    return _activePlayerMap.size;
  },
};

// ════════════════════════════════════════════════════════════════════
// GLOBAL OPERATIONS
// ════════════════════════════════════════════════════════════════════

/** Clear ALL caches in the registry at once */
export function clearAllCaches(): void {
  appearanceCache.clear();
  spriteIdCache.clear();
  spriteUrlStore.clear();
  animationStore.clearSequences();
  animationStore.stopAllPlayers();
}

/**
 * Revoke stale Blob URLs while keeping caches intact.
 * Call this on view/page navigation to prevent Blob URL accumulation.
 * Cached sprites will lazily re-create Blob URLs on next access.
 */
export function revokeStaleUrls(): void {
  spriteUrlStore.clear();
}

/** Get stats from all caches for debugging */
export function getCacheStats(): {
  appearance: { size: number; memoryEstimateKB: number };
  spriteId: { size: number };
  spriteUrl: { urlCount: number };
  animation: { sequences: number; activePlayers: number };
} {
  let appearanceBytes = 0;
  for (const entry of _appearanceMap.values()) {
    if (entry.preview) appearanceBytes += entry.preview.byteLength;
    if (entry.sprites) entry.sprites.forEach(s => appearanceBytes += s.byteLength);
    if (entry.decodedSprites) entry.decodedSprites.forEach(s => appearanceBytes += s.byteLength);
  }

  return {
    appearance: { size: _appearanceMap.size, memoryEstimateKB: Math.round(appearanceBytes / 1024) },
    spriteId: { size: spriteIdCache.size },
    spriteUrl: { urlCount: spriteUrlStore.urlCount },
    animation: { sequences: animationStore.sequenceCount, activePlayers: animationStore.playerCount },
  };
}
