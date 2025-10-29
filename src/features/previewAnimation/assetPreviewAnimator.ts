import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../types';
import {
  computeGroupOffsetsFromDetails,
  computeSpriteIndex,
  decomposeSpriteIndex
} from '../../animation';
import {
  resolveOutfitPreviewDirection,
  resolveOutfitPreviewInterval
} from './outfit/outfitPreviewSettings';

export interface PreviewAnimationSequence {
  frames: string[];
  interval: number;
}

const previewCache = new Map<string, PreviewAnimationSequence>();

export async function buildAssetPreviewAnimation(
  category: string,
  appearanceId: number,
  details: CompleteAppearanceItem,
  sprites: string[]
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
  sprites: string[]
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
  sprites: string[],
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
      frames.push(sprite);
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
  sprites: string[],
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
  const imageCache = new Map<number, Promise<HTMLImageElement>>();

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
    const composed = await composeFrame(aggregatedIndexes, sprites, imageCache);
    if (composed) {
      frames.push(composed);
    }
  }
  return frames;
}

async function composeFrame(
  indices: number[],
  sprites: string[],
  cache: Map<number, Promise<HTMLImageElement>>
): Promise<string | null> {
  const images: HTMLImageElement[] = [];
  for (const index of indices) {
    if (index < 0 || index >= sprites.length) {
      continue;
    }
    const base64 = sprites[index];
    if (!base64) {
      continue;
    }
    images.push(await loadImage(index, base64, cache));
  }
  if (images.length === 0) {
    return null;
  }
  const width = Math.max(...images.map(img => img.width));
  const height = Math.max(...images.map(img => img.height));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  images.forEach(image => {
    context.drawImage(image, 0, 0);
  });
  const dataUrl = canvas.toDataURL('image/png');
  const [, base64] = dataUrl.split(',');
  return base64 || null;
}

function loadImage(
  index: number,
  base64: string,
  cache: Map<number, Promise<HTMLImageElement>>
): Promise<HTMLImageElement> {
  if (cache.has(index)) {
    return cache.get(index)!;
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = `data:image/png;base64,${base64}`;
  });
  cache.set(index, promise);
  return promise;
}

export function clearPreviewAnimationCache(): void {
  previewCache.clear();
}
