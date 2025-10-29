import type { CompleteSpriteInfo } from '../../../types';

function ensureNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function getPhaseCount(spriteInfo: CompleteSpriteInfo): number {
  const animationPhases = spriteInfo.animation?.phases?.length ?? 0;
  if (animationPhases > 0) {
    return animationPhases;
  }
  return ensureNumber(spriteInfo.pattern_frames, 0);
}

export function resolveOutfitPreviewDirection(spriteInfo: CompleteSpriteInfo): number {
  const directionCount = Math.max(1, ensureNumber(spriteInfo.pattern_width, 1));

  if (directionCount >= 3) {
    return Math.min(2, directionCount - 1);
  }

  if (directionCount === 2) {
    return 1;
  }

  return 0;
}

export function resolveOutfitPreviewInterval(spriteInfo: CompleteSpriteInfo): number {
  const phases = getPhaseCount(spriteInfo);

  if (phases < 4) {
    return 300;
  }

  if (phases <= 8) {
    return 100;
  }

  return 75;
}
