<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentMonster } from '../../../stores/monsterStore';
  import { invoke } from '../../../utils/invoke';
  import ColorField from './ColorField.svelte';
  import { getAppearanceSprites, bufferToObjectUrl } from '../../../spriteCache';
  import { computeSpriteIndex, computeGroupOffsetsFromDetails } from '../../../animation';
  import { getSpriteUrl } from '../../../utils/spriteUrlCache';
  import { outfitColorIdToRgb } from '../utils';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import type { MonsterOutfit } from '../../../monsterTypes';

  // --- Worker Logic ---
  let outfitComposeWorker: Worker | null = null;
  let outfitComposeRequestId = 0;
  const outfitPending = new Map<string, (value: string | null) => void>();

  function initOutfitWorker() {
    if (outfitComposeWorker) return;
    try {
      outfitComposeWorker = new Worker(
        new URL('../../../workers/outfitComposeWorker.ts', import.meta.url),
        { type: 'module' }
      );
      outfitComposeWorker.onmessage = (event) => {
        const { id, buffer } = event.data;
        const resolve = outfitPending.get(id);
        if (resolve) {
          const dataUrl = buffer ? getSpriteUrl(new Uint8Array(buffer)) : null;
          resolve(dataUrl);
          outfitPending.delete(id);
        }
      };
    } catch (error) {
      console.error(error);
      outfitComposeWorker = null;
    }
  }

  function bufferSlice(sprite: Uint8Array): ArrayBuffer {
    return sprite.slice().buffer;
  }

  // --- Logic ---
  let spriteSrc = "";
  let previewDirections: any[] = [];
  let animationTimer: number | null = null;
  let spritePlaceholder = "?";
  let currentDirectionIndex = 0;
  let animationFrameIndex = 0;
  
  // Cache
  const outfitSpriteMetadataCache = new Map<number, { spriteInfo: CompleteSpriteInfo; baseOffset: number }>();

  async function loadOutfitSprite(outfit: MonsterOutfit, preserveDirection = false) {
      stopAnimation();
      if (!preserveDirection) {
          currentDirectionIndex = 0;
      }

      try {
          const sprites = await getAppearanceSprites("Outfits", outfit.lookType);
          const newDirections = await getDirectionalSpritesForOutfit(outfit, sprites);
          previewDirections = newDirections;
          
          if (!preserveDirection) {
              const preferredIndex = Math.min(previewDirections.length - 1, 2);
              currentDirectionIndex = preferredIndex >= 0 ? preferredIndex : 0;
          } else if (previewDirections.length > 0) {
              currentDirectionIndex = Math.min(currentDirectionIndex, previewDirections.length - 1);
          } else {
              currentDirectionIndex = 0;
          }

          if (previewDirections.length === 0) {
              spritePlaceholder = "—";
              spriteSrc = "";
          } else {
              spritePlaceholder = "";
              animationFrameIndex = 0;
              startAnimation();
          }
      } catch (error) {
          console.error("Failed to load outfit sprite:", error);
          stopAnimation();
          previewDirections = [];
          currentDirectionIndex = 0;
          spritePlaceholder = "!";
          spriteSrc = "";
      }
  }

  function startAnimation() {
      stopAnimation();
      if (previewDirections.length === 0) return;

      const directionPreview = previewDirections[currentDirectionIndex];
      if (!directionPreview || directionPreview.frames.length === 0) return;

      const playFrame = () => {
          const frame = directionPreview.frames[animationFrameIndex];
          if (frame) {
              spriteSrc = frame;
          }
          const duration = directionPreview.durations[animationFrameIndex] ?? 150;
          animationTimer = window.setTimeout(() => {
              animationFrameIndex = (animationFrameIndex + 1) % directionPreview.frames.length;
              playFrame();
          }, Math.max(60, duration));
      };

      playFrame();
  }

  function stopAnimation() {
      if (animationTimer !== null) {
          window.clearTimeout(animationTimer);
          animationTimer = null;
      }
  }

  function rotateSprite() {
      if (previewDirections.length <= 1) return;
      currentDirectionIndex = (currentDirectionIndex + 1) % previewDirections.length;
      animationFrameIndex = 0;
      startAnimation();
  }

  // --- Helper Functions ported from monsterEditor.ts ---
  async function getDirectionalSpritesForOutfit(outfit: MonsterOutfit, sprites: Uint8Array[]) {
      if (sprites.length === 0) return [];
      try {
          const metadata = await getOutfitSpriteMetadata(outfit.lookType);
          if (metadata) {
              const { spriteInfo, baseOffset } = metadata;
              const directionCount = Math.max(1, Math.min(4, spriteInfo.pattern_width ?? 4));
              const addonCount = Math.max(1, spriteInfo.pattern_height ?? 1);
              const mountCount = Math.max(1, spriteInfo.pattern_depth ?? 1);
              const addonIndex = computeAddonPatternIndex(outfit.lookAddons, addonCount);
              const mountIndex = computeMountPatternIndex(outfit.lookMount, mountCount);
              const frameCount = computeFrameCount(spriteInfo);
              const phaseDurations = getAnimationDurations(spriteInfo, frameCount);

              const previews = [];
              for (let direction = 0; direction < directionCount; direction++) {
                  const renderResults = await Promise.all(
                      Array.from({ length: frameCount }, (_, phaseIndex) =>
                          composeOutfitSprite({
                              sprites,
                              spriteInfo,
                              baseOffset,
                              direction,
                              addonIndex,
                              mountIndex,
                              outfit,
                              phaseIndex
                          })
                      )
                  );

                  const frames: string[] = [];
                  const durations: number[] = [];
                  renderResults.forEach((result, index) => {
                      if (result) {
                          frames.push(result);
                          durations.push(phaseDurations[index] ?? 200);
                      }
                  });
                  if (frames.length > 0) {
                      previews.push({ direction, frames, durations });
                  }
              }
              if (previews.length > 0) return previews;
          }
      } catch (e) {
          console.warn(e);
      }
      // Fallback
      const fallback = sprites[0];
      if (!fallback) return [];
      return [{ direction: 0, frames: [bufferToObjectUrl(fallback)], durations: [250] }];
  }

  async function getOutfitSpriteMetadata(lookType: number) {
      if (outfitSpriteMetadataCache.has(lookType)) return outfitSpriteMetadataCache.get(lookType)!;
      try {
          const details = await invoke<CompleteAppearanceItem>("get_complete_appearance", { category: "Outfits", id: lookType });
          if (!details || !details.frame_groups?.length) return null;
          const groupOffsets = computeGroupOffsetsFromDetails(details);
          const targetIndex = selectOutfitPreviewGroup(details);
          if (targetIndex < 0) return null;
          const spriteInfo = details.frame_groups[targetIndex]?.sprite_info;
          if (!spriteInfo) return null;
          const metadata = { spriteInfo, baseOffset: groupOffsets[targetIndex] ?? 0 };
          outfitSpriteMetadataCache.set(lookType, metadata);
          return metadata;
      } catch (e) { return null; }
  }

  function selectOutfitPreviewGroup(details: CompleteAppearanceItem): number {
      if (!details.frame_groups || details.frame_groups.length === 0) return -1;
      if (details.frame_groups.length > 1 && hasAnimatedSprite(details.frame_groups[1]?.sprite_info)) return 1;
      for (let i = 0; i < details.frame_groups.length; i++) {
          if (hasAnimatedSprite(details.frame_groups[i]?.sprite_info)) return i;
      }
      return 0;
  }

  function hasAnimatedSprite(spriteInfo: CompleteSpriteInfo | undefined): boolean {
      if (!spriteInfo) return false;
      const phaseCount = spriteInfo.animation?.phases?.length ?? spriteInfo.pattern_frames ?? 1;
      return phaseCount > 1;
  }

  function computeAddonPatternIndex(addons: number, patternHeight: number): number {
      if (patternHeight <= 1) return 0;
      if (patternHeight >= 4) {
          const hasAddon1 = (addons & 1) !== 0;
          const hasAddon2 = (addons & 2) !== 0;
          if (hasAddon1 && hasAddon2) return Math.min(patternHeight - 1, 3);
          if (hasAddon1) return 1;
          if (hasAddon2) return Math.min(patternHeight - 1, 2);
          return 0;
      }
      return Math.min(patternHeight - 1, Math.max(0, addons));
  }

  function computeMountPatternIndex(lookMount: number, patternDepth: number): number {
      if (patternDepth <= 1) return 0;
      if (lookMount <= 0) return 0;
      return 1;
  }

  function computeFrameCount(spriteInfo: CompleteSpriteInfo): number {
      const layers = spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1;
      const pw = spriteInfo.pattern_width ?? 1;
      const ph = spriteInfo.pattern_height ?? 1;
      const pd = spriteInfo.pattern_depth ?? 1;
      const spritesPerFrame = Math.max(1, layers * pw * ph * pd);
      const totalSprites = spriteInfo.sprite_ids?.length ?? spritesPerFrame;
      const inferredFrames = Math.max(1, Math.floor(totalSprites / spritesPerFrame));
      const metadataFrames = spriteInfo.animation?.phases?.length ?? spriteInfo.pattern_frames ?? inferredFrames;
      return Math.max(1, metadataFrames, inferredFrames);
  }

  function getAnimationDurations(spriteInfo: CompleteSpriteInfo, frameCountOverride?: number): number[] {
      const frames = frameCountOverride ?? computeFrameCount(spriteInfo);
      return Array.from({ length: frames }, () => 100);
  }

  async function composeOutfitSprite(params: any): Promise<string | null> {
      const { sprites, spriteInfo, baseOffset, direction, addonIndex, mountIndex, outfit, phaseIndex } = params;
      const addonLayersToDraw = addonIndex > 0 ? [0, addonIndex] : [0];
      const frameCount = computeFrameCount(spriteInfo);
      const normalizedPhase = ((phaseIndex % frameCount) + frameCount) % frameCount;
      const primaryIndex = baseOffset + computeSpriteIndex(spriteInfo, 0, direction, addonLayersToDraw[0], mountIndex, normalizedPhase);
      if (!sprites[primaryIndex]) return null;

      initOutfitWorker();
      const layers: any[] = [];
      const totalLayers = spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1;
      const hasTemplateLayer = totalLayers > 1;

      const headColor = outfitColorIdToRgb(outfit.lookHead);
      const bodyColor = outfitColorIdToRgb(outfit.lookBody);
      const legsColor = outfitColorIdToRgb(outfit.lookLegs);
      const feetColor = outfitColorIdToRgb(outfit.lookFeet);

      for (const addonLayer of addonLayersToDraw) {
          const spriteIdx = baseOffset + computeSpriteIndex(spriteInfo, 0, direction, addonLayer, mountIndex, normalizedPhase);
          const spriteData = sprites[spriteIdx];
          if (!spriteData) continue;
          const layer: any = { sprite: bufferSlice(spriteData) };
          if (hasTemplateLayer) {
              const templateIndex = baseOffset + computeSpriteIndex(spriteInfo, 1, direction, addonLayer, mountIndex, normalizedPhase);
              const templateData = sprites[templateIndex];
              if (templateData) layer.template = bufferSlice(templateData);
          }
          layers.push(layer);
      }

      if (!outfitComposeWorker || layers.length === 0) return null;
      const id = `outfit-compose-${Date.now()}-${outfitComposeRequestId++}`;
      const transferables = layers.flatMap(l => [l.sprite, l.template].filter(Boolean));
      
      return new Promise((resolve) => {
          outfitPending.set(id, resolve);
          outfitComposeWorker!.postMessage({
              id,
              layers,
              colors: { head: headColor, body: bodyColor, legs: legsColor, feet: feetColor }
          }, transferables);
      });
  }

  // Watch for changes
  // We need to debounce or handle changes carefully.
  // Svelte's reactive statements trigger on assignment.
  // If user edits fields, we call loadOutfitSprite.
  
  function handleLookTypeChange(e: Event) {
      const val = parseInt((e.target as HTMLInputElement).value) || 0;
      if ($currentMonster) {
          $currentMonster.outfit.lookType = val;
          loadOutfitSprite($currentMonster.outfit, false);
      }
  }

  function handleMountChange(e: Event) {
      const val = parseInt((e.target as HTMLInputElement).value) || 0;
      if ($currentMonster) {
          $currentMonster.outfit.lookMount = val;
          loadOutfitSprite($currentMonster.outfit, true);
      }
  }

  function handleAddonsChange(e: Event) {
      const val = parseInt((e.target as HTMLInputElement).value) || 0;
      if ($currentMonster) {
          $currentMonster.outfit.lookAddons = val;
          loadOutfitSprite($currentMonster.outfit, true);
      }
  }

  function handleColorChange(part: 'lookHead' | 'lookBody' | 'lookLegs' | 'lookFeet', color: number) {
      if ($currentMonster) {
          $currentMonster.outfit[part] = color;
          loadOutfitSprite($currentMonster.outfit, true);
      }
  }

  onMount(() => {
      if ($currentMonster) {
          loadOutfitSprite($currentMonster.outfit);
      }
  });

  onDestroy(() => {
      stopAnimation();
  });
  
  // Re-run if monster changes entirely
  let lastMonsterName = "";
  $: if ($currentMonster && $currentMonster.name !== lastMonsterName) {
      lastMonsterName = $currentMonster.name;
      loadOutfitSprite($currentMonster.outfit);
  }
</script>

{#if $currentMonster}
<div class="monster-card">
  <div class="monster-card-header">
     👤 Outfit & Appearance
  </div>
  <div class="monster-card-body">
     <div class="card-content">
        <div class="outfit-preview">
            <div class="outfit-sprite-container">
                {#if spriteSrc}
                    <img src={spriteSrc} class="outfit-sprite-image" alt="Outfit Preview" style="width: 80%; height: 80%; object-fit: contain; image-rendering: pixelated;" />
                {:else}
                    <div class="sprite-placeholder-text" style="display: flex;">{spritePlaceholder}</div>
                {/if}
                <button type="button" class="sprite-rotate-button" title="Rotacionar sprite" on:click={rotateSprite} disabled={previewDirections.length <= 1}>
                    ⟳
                </button>
            </div>
            
            <div class="outfit-info">
                <div class="outfit-info-item"><div class="outfit-info-label">Type</div><div class="outfit-info-value">{$currentMonster.outfit.lookType}</div></div>
                <div class="outfit-info-item"><div class="outfit-info-label">Head</div><div class="outfit-info-value">{$currentMonster.outfit.lookHead}</div></div>
                <div class="outfit-info-item"><div class="outfit-info-label">Body</div><div class="outfit-info-value">{$currentMonster.outfit.lookBody}</div></div>
                <div class="outfit-info-item"><div class="outfit-info-label">Legs</div><div class="outfit-info-value">{$currentMonster.outfit.lookLegs}</div></div>
                <div class="outfit-info-item"><div class="outfit-info-label">Feet</div><div class="outfit-info-value">{$currentMonster.outfit.lookFeet}</div></div>
                <div class="outfit-info-item"><div class="outfit-info-label">Addons</div><div class="outfit-info-value">{$currentMonster.outfit.lookAddons}</div></div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
               <label>Look Type</label>
               <input type="number" value={$currentMonster.outfit.lookType} on:input={handleLookTypeChange} min="0" />
            </div>
            <div class="form-group">
               <label>Look Mount</label>
               <input type="number" value={$currentMonster.outfit.lookMount} on:input={handleMountChange} min="0" />
            </div>
        </div>

        <div class="color-row">
            <ColorField label="Head" value={$currentMonster.outfit.lookHead} onChange={(v) => handleColorChange('lookHead', v)} />
            <ColorField label="Body" value={$currentMonster.outfit.lookBody} onChange={(v) => handleColorChange('lookBody', v)} />
            <ColorField label="Legs" value={$currentMonster.outfit.lookLegs} onChange={(v) => handleColorChange('lookLegs', v)} />
            <ColorField label="Feet" value={$currentMonster.outfit.lookFeet} onChange={(v) => handleColorChange('lookFeet', v)} />
        </div>

        <div class="form-row" style="margin-top: 1rem;">
            <div class="form-group">
               <label>Addons</label>
               <input type="number" value={$currentMonster.outfit.lookAddons} on:input={handleAddonsChange} min="0" max="3" />
            </div>
        </div>
     </div>
  </div>
</div>
{/if}
