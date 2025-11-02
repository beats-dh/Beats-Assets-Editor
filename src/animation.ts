import { invoke } from '@tauri-apps/api/core';
import type { CompleteAppearanceItem, CompleteSpriteInfo, SpriteDecomposition, GroupMapping } from './types';
import { getAppearanceSprites } from './spriteCache';
import { buildAssetPreviewAnimation } from './features/previewAnimation/assetPreviewAnimator';

// Active animation players storage
const activeAnimationPlayers = new Map<string, number>();

export function stopAllAnimationPlayers(): void {
  activeAnimationPlayers.forEach((timerId) => {
    if (timerId) clearInterval(timerId);
  });
  activeAnimationPlayers.clear();
}

// Stop only detail/modal animations, keep grid auto animations running
export function stopDetailAnimationPlayers(): void {
  const detailsContent = document.querySelector('#details-content') as HTMLElement | null;

  activeAnimationPlayers.forEach((timerId, key) => {
    if (key.startsWith('detail:') || key.startsWith('card:')) {
      if (timerId) clearInterval(timerId);
      activeAnimationPlayers.delete(key);
    }
  });
  // Remove visual animating state from detail items
  detailsContent?.querySelectorAll('.detail-sprite-item.animating').forEach(el => el.classList.remove('animating'));
}

export function computeSpriteIndex(
  spriteInfo: CompleteSpriteInfo,
  layerIndex: number,
  x: number,
  y: number,
  z: number,
  phaseIndex: number
): number {
  const layers = (spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1);
  const pw = (spriteInfo.pattern_width ?? 1);
  const ph = (spriteInfo.pattern_height ?? 1);
  const pd = (spriteInfo.pattern_depth ?? 1);
  const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
  let idx = phaseIndex % frames;
  idx = idx * pd + (z || 0);
  idx = idx * ph + (y || 0);
  idx = idx * pw + (x || 0);
  idx = idx * layers + (layerIndex || 0);
  return idx;
}

export function computeGroupOffsetsFromDetails(details: CompleteAppearanceItem): number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const fg of details.frame_groups) {
    const count = fg.sprite_info?.sprite_ids.length ?? 0;
    offsets.push(offset);
    offset += count;
  }
  return offsets;
}

export function getGroupIndexForAggregatedSprite(
  details: CompleteAppearanceItem,
  aggregatedIndex: number,
  offsets: number[]
): GroupMapping | null {
  for (let i = 0; i < details.frame_groups.length; i++) {
    const fg = details.frame_groups[i];
    const base = offsets[i];
    const size = fg.sprite_info?.sprite_ids.length ?? 0;
    if (aggregatedIndex >= base && aggregatedIndex < base + size) {
      return { groupIndex: i, localIndex: aggregatedIndex - base };
    }
  }
  return null;
}

export function decomposeSpriteIndex(spriteInfo: CompleteSpriteInfo, localIndex: number): SpriteDecomposition {
  const layers = (spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1);
  const pw = (spriteInfo.pattern_width ?? 1);
  const ph = (spriteInfo.pattern_height ?? 1);
  const pd = (spriteInfo.pattern_depth ?? 1);
  const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
  let u = Math.floor(localIndex);
  const layerIndex = u % layers; u = Math.floor(u / layers);
  const x = u % pw; u = Math.floor(u / pw);
  const y = u % ph; u = Math.floor(u / ph);
  const z = u % pd; u = Math.floor(u / pd);
  const phaseIndex = u % frames;
  return { layerIndex, x, y, z, phaseIndex };
}

export async function initAnimationPlayersForDetails(details: CompleteAppearanceItem, category: string): Promise<void> {
  const detailsContent = document.querySelector('#details-content') as HTMLElement | null;

  try {
    const sprites = await getAppearanceSprites(category, details.id);
    const groupOffsets = computeGroupOffsetsFromDetails(details);

    details.frame_groups.forEach((fg, index) => {
      const spriteInfo = fg.sprite_info;
      if (!spriteInfo) return;
      const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
      if (frames <= 1) return;

      const containerSelector = `.frame-group-detail`;
      const detailSections = detailsContent?.querySelectorAll(containerSelector);
      const groupEl = detailSections ? detailSections[index] as HTMLElement : null;
      if (!groupEl) return;

      // Create player UI
      const player = document.createElement('div');
      player.className = 'animation-player';
      player.innerHTML = `
        <div class="anim-canvas">
          <img class="anim-sprite-image" alt="Animation">
          <span class="anim-phase-label">Fase 1</span>
        </div>
        <div class="anim-controls">
          <button class="btn-secondary anim-btn" data-action="play">Play</button>
          <button class="btn-secondary anim-btn" data-action="pause" disabled>Pause</button>
          <label class="anim-speed">Velocidade (ms)
            <input type="number" min="50" max="1000" step="50" value="${spriteInfo.animation?.phases?.[0]?.duration_min ?? 250}">
          </label>
        </div>
      `;
      groupEl.appendChild(player);

      const imgEl = player.querySelector('img') as HTMLImageElement;
      const phaseLabel = player.querySelector('.anim-phase-label') as HTMLElement;
      const playBtn = player.querySelector('button[data-action="play"]') as HTMLButtonElement;
      const pauseBtn = player.querySelector('button[data-action="pause"]') as HTMLButtonElement;
      const speedInput = player.querySelector('input[type="number"]') as HTMLInputElement;

      const key = `detail:${details.id}:${index}`;
      let phase = 0;
      const baseOffset = groupOffsets[index];
      const draw = () => {
        const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, 0, 0, 0, 0, phase);
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
          phaseLabel.textContent = `Fase ${phase + 1}`;
        }
      };
      draw();

      const start = () => {
        const speed = Math.max(50, Math.min(1000, parseInt(speedInput.value || '250', 10)));
        const loopType = spriteInfo.animation?.loop_type ?? 0;
        const maxLoops = spriteInfo.animation?.loop_count;
        let direction = 1;
        let completedLoops = 0;
        const timerId = window.setInterval(() => {
          if (frames <= 1) return;
          if (loopType === -1) {
            phase += direction;
            if (phase >= frames - 1) {
              direction = -1;
            } else if (phase <= 0) {
              direction = 1;
            }
          } else if (loopType === 1) {
            phase += 1;
            if (phase >= frames) {
              phase = 0;
              completedLoops += 1;
              if (typeof maxLoops === 'number' && completedLoops >= maxLoops) {
                clearInterval(timerId);
                activeAnimationPlayers.delete(key);
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                return;
              }
            }
          } else {
            phase = (phase + 1) % frames;
          }
          draw();
        }, speed);
        activeAnimationPlayers.set(key, timerId);
        playBtn.disabled = true;
        pauseBtn.disabled = false;
      };
      const stop = () => {
        const timerId = activeAnimationPlayers.get(key);
        if (timerId) {
          clearInterval(timerId);
          activeAnimationPlayers.delete(key);
        }
        playBtn.disabled = false;
        pauseBtn.disabled = true;
      };

      playBtn.addEventListener('click', start);
      pauseBtn.addEventListener('click', stop);
      speedInput.addEventListener('change', () => {
        if (activeAnimationPlayers.has(key)) {
          stop();
          start();
        }
      });
    });
  } catch (e) {
    console.error('Failed to init animation players:', e);
  }
}

export function initDetailSpriteCardAnimations(
  appearanceId: number,
  sprites: string[],
  currentAppearanceDetails: CompleteAppearanceItem | null
): void {
  try {
    if (!currentAppearanceDetails) return;
    const details = currentAppearanceDetails;
    if (details.id !== appearanceId) return;

    const groupOffsets = computeGroupOffsetsFromDetails(details);
    const container = document.getElementById(`detail-sprites-${appearanceId}`);
    const cards = container?.querySelectorAll('.detail-sprite-item') ?? [];

    cards.forEach((card) => {
      const el = card as HTMLElement;
      const idxStr = el.getAttribute('data-agg-index');
      if (!idxStr) return;
      const aggIndex = parseInt(idxStr, 10);
      const mapping = getGroupIndexForAggregatedSprite(details, aggIndex, groupOffsets);
      if (!mapping) return;
      const { groupIndex, localIndex } = mapping;
      const spriteInfo = details.frame_groups[groupIndex]?.sprite_info;
      if (!spriteInfo) return;
      const frames = spriteInfo.animation ? spriteInfo.animation.phases.length : (spriteInfo.pattern_frames ?? 1);
      if (frames <= 1) return;

      const imgEl = el.querySelector('img.detail-sprite-image') as HTMLImageElement | null;
      if (!imgEl) return;

      const baseOffset = groupOffsets[groupIndex];
      const dims = decomposeSpriteIndex(spriteInfo, localIndex);
      const key = `card:${appearanceId}:${aggIndex}`;
      let phase = dims.phaseIndex;

      const draw = () => {
        const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, dims.layerIndex, dims.x, dims.y, dims.z, phase);
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
        }
      };

      const start = () => {
        const speed = Math.max(50, Math.min(1000, spriteInfo.animation?.phases?.[0]?.duration_min ?? 250));
        const loopType = spriteInfo.animation?.loop_type ?? 0;
        const maxLoops = spriteInfo.animation?.loop_count;
        let direction = 1;
        let completedLoops = 0;
        const timerId = window.setInterval(() => {
          if (frames <= 1) return;
          if (loopType === -1) {
            phase += direction;
            if (phase >= frames - 1) {
              direction = -1;
            } else if (phase <= 0) {
              direction = 1;
            }
          } else if (loopType === 1) {
            phase += 1;
            if (phase >= frames) {
              phase = 0;
              completedLoops += 1;
              if (typeof maxLoops === 'number' && completedLoops >= maxLoops) {
                clearInterval(timerId);
                activeAnimationPlayers.delete(key);
                el.classList.remove('animating');
                const spriteIdx = aggIndex;
                if (spriteIdx >= 0 && spriteIdx < sprites.length) {
                  imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
                }
                return;
              }
            }
          } else {
            phase = (phase + 1) % frames;
          }
          draw();
        }, speed);
        activeAnimationPlayers.set(key, timerId);
        el.classList.add('animating');
      };

      const stop = () => {
        const timerId = activeAnimationPlayers.get(key);
        if (timerId) {
          clearInterval(timerId);
          activeAnimationPlayers.delete(key);
        }
        el.classList.remove('animating');
        const spriteIdx = aggIndex;
        if (spriteIdx >= 0 && spriteIdx < sprites.length) {
          imgEl.src = `data:image/png;base64,${sprites[spriteIdx]}`;
        }
      };

      el.addEventListener('click', () => {
        if (activeAnimationPlayers.has(key)) {
          stop();
        } else {
          start();
        }
      });
    });
  } catch (e) {
    console.error('Failed to init sprite card animations:', e);
  }
}

export function initAssetCardAutoAnimation(
  category: string,
  appearanceId: number,
  sprites: string[],
  autoAnimateGridEnabled: boolean
): void {
  (async () => {
    try {
      const container = document.getElementById(`sprite-${appearanceId}`) as HTMLElement | null;
      const imgEl = container?.querySelector('img') as HTMLImageElement | null;
      if (!container || !imgEl) return;

      const details = await invoke('get_complete_appearance', { category, id: appearanceId }) as CompleteAppearanceItem;
      if (!autoAnimateGridEnabled) return;

      const sequence = await buildAssetPreviewAnimation(category, appearanceId, details, sprites);
      if (!sequence || sequence.frames.length === 0) {
        return;
      }

      const key = `asset:${category}:${appearanceId}`;

      // CRITICAL: Check if animation already exists to prevent duplicate timers
      if (activeAnimationPlayers.has(key)) {
        return; // Already animating, don't create duplicate timer
      }

      let frameIndex = 0;

      const draw = () => {
        const frame = sequence.frames[frameIndex];
        if (frame) {
          imgEl.src = `data:image/png;base64,${frame}`;
        }
      };
      draw();

      if (sequence.frames.length <= 1) {
        return;
      }

      const start = () => {
        const timerId = window.setInterval(() => {
          frameIndex = (frameIndex + 1) % sequence.frames.length;
          draw();
        }, sequence.interval);
        activeAnimationPlayers.set(key, timerId);
        container.classList.add('animating');
      };

      start();
    } catch (e) {
      console.warn('Failed to init auto animation for asset card:', e);
    }
  })();
}
