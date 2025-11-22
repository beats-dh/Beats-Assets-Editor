import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../types';
import type { ComposeResponseMessage } from '../../workers/animationWorker';
import {
  computeGroupOffsetsFromDetails,
  computeSpriteIndex,
  decomposeSpriteIndex
} from '../../animation';
import {
  resolveOutfitPreviewDirection,
  resolveOutfitPreviewInterval
} from './outfit/outfitPreviewSettings';
import { getSpriteUrl, clearSpriteUrlCache } from '../../utils/spriteUrlCache';

export interface PreviewAnimationSequence {
  frames: string[];
  interval: number;
}

const previewCache = new Map<string, PreviewAnimationSequence>();
let composeWorker: Worker | null = null;
let composeRequestId = 0;
const workerPending = new Map<string, (value: string | null) => void>();

function bufferToUrl(buffer: Uint8Array): string {
  return getSpriteUrl(buffer);
}

function initComposeWorker(): void {
  if (composeWorker) return;
  try {
    composeWorker = new Worker(
      new URL('../../workers/animationWorker.ts', import.meta.url),
      { type: 'module' }
    );
    composeWorker.onmessage = (event: MessageEvent<ComposeResponseMessage>) => {
      const { id, buffer } = event.data;
      const resolver = workerPending.get(id);
      if (resolver) {
        const dataUrl = buffer ? getSpriteUrl(new Uint8Array(buffer)) : null;
        resolver(dataUrl);
        workerPending.delete(id);
      }
    };
  } catch (error) {
    composeWorker = null;
    workerPending.clear();
  }
}

async function composeFrameWithWorker(indices: number[], sprites: Uint8Array[]): Promise<string | null> {
  initComposeWorker();
  if (!composeWorker || indices.length === 0) return null;

  const id = `compose-${Date.now()}-${composeRequestId++}`;
  const buffers = indices
    .map((idx) => {
      if (idx < 0 || idx >= sprites.length) return null;
      const sprite = sprites[idx];
      if (!sprite) return null;
      return sprite.buffer.slice(sprite.byteOffset, sprite.byteOffset + sprite.byteLength);
    })
    .filter((buf): buf is ArrayBuffer => !!buf);

  if (buffers.length === 0) return null;

  const result = new Promise<string | null>((resolve) => {
    workerPending.set(id, resolve);
    composeWorker!.postMessage({ id, spriteBuffers: buffers }, buffers);
  });
  return await result;
}

export async function buildAssetPreviewAnimation(
  category: string,
  appearanceId: number,
  details: CompleteAppearanceItem,
  sprites: Uint8Array[]
): Promise<PreviewAnimationSequence | null> {
  const cacheKey = `${category}:${appearanceId}`;
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  const sequence = await buildSequence(category, details, sprites);
  if (!sequence) {
    return null;
  }

  previewCache.set(cacheKey, sequence);
  return sequence;
}

function getFrameCount(spriteInfo: CompleteSpriteInfo | undefined): number {
  if (!spriteInfo) return 0;
  if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) {
    return spriteInfo.animation.phases.length;
  }
  if (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 0) {
    return spriteInfo.pattern_frames;
  }
  return 0;
}

function selectFrameGroupIndex(
  category: string,
  details: CompleteAppearanceItem
): number {
  if (details.frame_groups.length === 0) {
    return -1;
  }
  if (category === 'Outfits') {
    if (details.frame_groups.length > 1 && hasAnimatedSprite(details.frame_groups[1]?.sprite_info)) {
      return 1;
    }
  }
  for (let i = 0; i < details.frame_groups.length; i++) {
    if (hasAnimatedSprite(details.frame_groups[i]?.sprite_info)) {
      return i;
    }
  }
  return -1;
}

function hasAnimatedSprite(spriteInfo: CompleteSpriteInfo | undefined): boolean {
  if (!spriteInfo) return false;
  return getFrameCount(spriteInfo) > 1;
}

async function buildSequence(
  category: string,
  details: CompleteAppearanceItem,
  sprites: Uint8Array[]
): Promise<PreviewAnimationSequence | null> {
  const groupIndex = selectFrameGroupIndex(category, details);
  if (groupIndex < 0) {
    return null;
  }
  const frameGroup = details.frame_groups[groupIndex];
  const spriteInfo = frameGroup?.sprite_info;
  if (!spriteInfo) {
    return null;
  }
  const frameCount = getFrameCount(spriteInfo);
  if (frameCount <= 1) {
    return null;
  }
  const groupOffsets = computeGroupOffsetsFromDetails(details);
  const baseOffset = groupOffsets[groupIndex] ?? 0;

  if (category === 'Outfits') {
    const directionIndex = resolveOutfitPreviewDirection(spriteInfo);
    const frames = await buildOutfitFrames(
      spriteInfo,
      baseOffset,
      sprites,
      frameCount,
      directionIndex
    );
    if (frames.length === 0) {
      return null;
    }
    const interval = resolveOutfitPreviewInterval(spriteInfo);
    return { frames, interval };
  }

  const frames = buildGenericFrames(spriteInfo, baseOffset, sprites, frameCount);
  if (frames.length === 0) {
    return null;
  }
  return {
    frames,
    interval: 100
  };
}

function buildGenericFrames(
  spriteInfo: CompleteSpriteInfo,
  baseOffset: number,
  sprites: Uint8Array[],
  frameCount: number
): string[] {
  const frames: string[] = [];
  const baseDimensions = decomposeSpriteIndex(spriteInfo, 0);
  for (let phase = 0; phase < frameCount; phase++) {
    const spriteIndex = baseOffset + computeSpriteIndex(
      spriteInfo,
      baseDimensions.layerIndex,
      baseDimensions.x,
      baseDimensions.y,
      baseDimensions.z,
      phase
    );
    const sprite = sprites[spriteIndex];
    if (sprite) {
      frames.push(bufferToUrl(sprite));
    }
  }
  return frames;
}

function ensureNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

async function buildOutfitFrames(
  spriteInfo: CompleteSpriteInfo,
  baseOffset: number,
  sprites: Uint8Array[],
  frameCount: number,
  directionIndex: number,
  maxFrames = frameCount
): Promise<string[]> {
  const frames: string[] = [];
  const directionCount = Math.max(1, ensureNumber(spriteInfo.pattern_width, 1));
  const addonCount = Math.max(1, ensureNumber(spriteInfo.pattern_height, 1));
  const mountCount = Math.max(1, ensureNumber(spriteInfo.pattern_depth, 1));
  const safeDirectionIndex = Math.min(Math.max(0, directionIndex), directionCount - 1);
  const addonMax = Math.max(addonCount - 1, 0);
  const mountIndex = Math.min(0, mountCount - 1);
  const totalFrames = Math.min(frameCount, Math.max(1, maxFrames));

  for (let frame = 0; frame < totalFrames; frame++) {
    const aggregatedIndexes: number[] = [];
    for (let addon = 0; addon <= addonMax; addon++) {
      const spriteIndex = baseOffset + computeSpriteIndex(
        spriteInfo,
        0,
        safeDirectionIndex,
        addon,
        mountIndex,
        frame
      );
      aggregatedIndexes.push(spriteIndex);
    }
    const composed = await composeFrame(aggregatedIndexes, sprites);
    if (composed) {
      frames.push(composed);
    }
  }
  return frames;
}

async function composeFrame(
  indices: number[],
  sprites: Uint8Array[]
): Promise<string | null> {
  return composeFrameWithWorker(indices, sprites);
}

export function clearPreviewAnimationCache(): void {
  previewCache.clear();
  clearSpriteUrlCache();
  workerPending.clear();
}
