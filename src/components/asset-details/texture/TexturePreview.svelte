<script lang="ts">
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import { computeSpriteIndex, computeGroupOffsetsFromDetails } from '../../../animation';
  import { bufferToObjectUrl } from '../../../spriteCache';
  import { translate } from '../../../i18n';

  export let details: CompleteAppearanceItem;
  export let sprites: Uint8Array[];
  export let state: any;
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;

  const dispatch = createEventDispatcher();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrameId: number | null = null;
  let isDragging = false;

  // Hex to RGB helper
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // Ensure number helper
  function ensureNumber(val: any, fallback: number) {
    return (typeof val === 'number' && !isNaN(val)) ? val : fallback;
  }

  function getFrameCount(info: CompleteSpriteInfo) {
    return info.animation ? info.animation.phases.length : (info.pattern_frames ?? 1);
  }

  // Load image helper
  async function loadImage(buffer: Uint8Array): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = bufferToObjectUrl(buffer);
    });
  }

  // Drag and Drop Logic
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    isDragging = true;
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  interface SpriteDragPayload {
    spriteIds?: number[];
    localIndices?: number[];
    frameGroupIndex?: number;
  }

  function parseSpriteDragPayload(event: DragEvent): number[] | null {
    const data = event.dataTransfer;
    if (!data) return null;

    // Try custom payload first (set by TextureSpriteList)
    // Note: TextureSpriteList sets 'application/json' with the object
    const customPayload = data.getData('application/json');
    if (customPayload) {
      try {
        const parsed = JSON.parse(customPayload) as SpriteDragPayload;
        if (parsed && Array.isArray(parsed.spriteIds)) {
          return parsed.spriteIds.map(id => Number(id)).filter(id => Number.isFinite(id));
        }
      } catch (error) {
        console.warn('Failed to parse custom sprite drag payload', error);
      }
    }

    const plain = data.getData('text/plain');
    if (plain) {
      // Check if it's JSON first (TextureSpriteList also sets text/plain JSON)
      try {
         const parsed = JSON.parse(plain);
         if (parsed.spriteIds && Array.isArray(parsed.spriteIds)) {
             return parsed.spriteIds;
         }
      } catch (e) {
          // Ignore
      }

      const ids = plain.split(',').map(part => Number(part.trim())).filter(num => Number.isFinite(num));
      if (ids.length > 0) {
        return ids;
      }
    }

    return null;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const spriteIds = parseSpriteDragPayload(e);
    if (spriteIds && spriteIds.length > 0) {
        dispatch('dropSprites', { spriteIds });
    }
  }

  async function renderSpriteVariant(
    baseOffset: number,
    direction: number,
    addon: number,
    mount: number,
    frame: number
  ): Promise<HTMLCanvasElement | null> {
    if (!spriteInfo) return null;

    const layers = Math.max(1, ensureNumber(spriteInfo.layers ?? spriteInfo.pattern_layers, 1));
    const frameCount = getFrameCount(spriteInfo);
    const localFrame = frameCount > 0 ? frame % frameCount : 0;
    
    // Calculate index
    // For objects: patternX/Y/Z are mapped from state
    // For outfits: direction/addon/mount are mapped
    let idx = 0;
    if (isOutfit) {
        idx = computeSpriteIndex(spriteInfo, 0, direction, addon, mount, localFrame);
    } else {
        // Object mapping
        idx = computeSpriteIndex(spriteInfo, state.layer, state.patternX, state.patternY, state.patternZ, localFrame);
    }

    const baseIndex = baseOffset + idx;
    
    if (baseIndex < 0 || baseIndex >= sprites.length) return null;

    const baseImage = await loadImage(sprites[baseIndex]);
    const offscreen = document.createElement('canvas');
    offscreen.width = baseImage.width;
    offscreen.height = baseImage.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;
    
    offCtx.drawImage(baseImage, 0, 0);

    // Coloring for outfits
    if (isOutfit && state.blendLayers && layers > 1) {
      const layerIndex = baseOffset + computeSpriteIndex(spriteInfo, 1, direction, addon, mount, localFrame);
      if (layerIndex >= 0 && layerIndex < sprites.length) {
          const templateImage = await loadImage(sprites[layerIndex]);
          const templateCanvas = document.createElement('canvas');
          templateCanvas.width = templateImage.width;
          templateCanvas.height = templateImage.height;
          const templateCtx = templateCanvas.getContext('2d');
          
          if (templateCtx) {
            templateCtx.drawImage(templateImage, 0, 0);
            const templateData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
            const baseData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
            
            const head = hexToRgb(state.headColor);
            const body = hexToRgb(state.bodyColor);
            const legs = hexToRgb(state.legsColor);
            const feet = hexToRgb(state.feetColor);

            for (let i = 0; i < templateData.data.length; i += 4) {
              const rt = templateData.data[i];
              const gt = templateData.data[i + 1];
              const bt = templateData.data[i + 2];
              const alpha = templateData.data[i + 3];

              if (alpha === 0) continue;

              let color = null;
              if (rt > 0 && gt > 0 && bt === 0) color = head;
              else if (rt > 0 && gt === 0 && bt === 0) color = body;
              else if (rt === 0 && gt > 0 && bt === 0) color = legs;
              else if (rt === 0 && gt === 0 && bt > 0) color = feet;

              if (color) {
                baseData.data[i] = Math.round((baseData.data[i] + color.r) / 2);
                baseData.data[i+1] = Math.round((baseData.data[i+1] + color.g) / 2);
                baseData.data[i+2] = Math.round((baseData.data[i+2] + color.b) / 2);
              }
            }
            offCtx.putImageData(baseData, 0, 0);
          }
      }
    }

    return offscreen;
  }

  async function draw() {
    if (!canvas || !spriteInfo || sprites.length === 0) return;
    if (!ctx) ctx = canvas.getContext('2d');
    if (!ctx) return;

    const groupOffsets = computeGroupOffsetsFromDetails(details);
    const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
    
    // Background
    const bg = hexToRgb(state.backgroundColor);
    ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
    
    // Variants to draw
    const variants: number[] = [];
    const addonMax = Math.max(0, ensureNumber(spriteInfo.pattern_height, 1) - 1);

    if (isOutfit && state.showFullAddons) {
      for (let i = 0; i <= addonMax; i++) variants.push(i);
    } else {
      variants.push(isOutfit ? state.addon : 0);
    }

    // Pre-calculate/load all variants to prevent flickering
    const renderPromises = variants.map(addon => 
        renderSpriteVariant(baseOffset, state.direction, addon, state.mount, currentRenderFrame)
    );
    
    const results = await Promise.all(renderPromises);
    const firstRender = results[0];

    if (!firstRender) {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         return;
    }

    // Resize canvas if needed (scale up)
    const maxDim = Math.max(firstRender.width, firstRender.height);
    const MIN_PREVIEW_DIM = 140;
    const scale = Math.max(1, Math.floor(MIN_PREVIEW_DIM / (maxDim || 1)));
    
    if (canvas.width !== firstRender.width * scale || canvas.height !== firstRender.height * scale) {
        canvas.width = firstRender.width * scale;
        canvas.height = firstRender.height * scale;
    }
    
    // Clear and draw all at once
    ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    results.forEach(rendered => {
       if (rendered) {
           ctx.drawImage(rendered, 0, 0, rendered.width * scale, rendered.height * scale);
       }
    });
    
    // Draw BBox if needed
    if (state.showBoundingBoxes) {
      // Bounding Square Overlay
      const boundingSquare = ensureNumber(spriteInfo.bounding_square, 0);
      if (boundingSquare > 0) {
          ctx.save();
          ctx.strokeStyle = '#4caf50'; // Green
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          const sq = boundingSquare * scale;
          ctx.strokeRect(0, 0, sq, sq);
          ctx.restore();
      }

      if (spriteInfo.bounding_box_per_direction || spriteInfo.bounding_boxes) {
        const boxes = spriteInfo.bounding_boxes || spriteInfo.bounding_box_per_direction || [];
        const dirIndex = Math.min(isOutfit ? state.direction : state.patternX, boxes.length - 1);
        const bbox = boxes[dirIndex] || boxes[0];
      
        if (bbox) {
          ctx.save();
          ctx.strokeStyle = '#ff9800'; // Orange
          ctx.lineWidth = 1;
          ctx.strokeRect(bbox.x * scale, bbox.y * scale, bbox.width * scale, bbox.height * scale);
          ctx.restore();
        }
      }
    }
  }

  // Watch for changes
  $: {
      if (details && sprites && state) {
          // If not animating, ensure we redraw when props change
          if (!state.autoAnimate) {
             currentRenderFrame = state.frame;
             draw();
          }
      }
  }

  // Animation State
  let currentRenderFrame = 0;
  let lastTime = 0;


  $: if (!state.autoAnimate) {
    currentRenderFrame = state.frame;
    if (canvas) draw();
  }

  function startAnimation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    animationFrameId = requestAnimationFrame(loop);
  }

  function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    currentRenderFrame = state.frame;
    if (canvas) draw();
  }

  function loop(timestamp: number) {
    if (!state.autoAnimate) return;

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    
    // Get duration for current phase
    const frameCount = spriteInfo ? getFrameCount(spriteInfo) : 1;
    let duration = 200;
    
    if (spriteInfo && spriteInfo.animation && spriteInfo.animation.phases && spriteInfo.animation.phases.length > 0) {
        // Use duration_min for standard playback
        const phaseIndex = currentRenderFrame % spriteInfo.animation.phases.length;
        const phase = spriteInfo.animation.phases[phaseIndex];
        duration = phase.duration_min && phase.duration_min > 0 ? phase.duration_min : 200;
    }

    if (elapsed >= duration) {
        currentRenderFrame = (currentRenderFrame + 1) % frameCount;
        lastTime = timestamp;
        draw();
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  $: if (state.autoAnimate) {
      startAnimation();
  } else {
      stopAnimation();
  }

</script>

<div 
  class="texture-preview-card" 
  class:dragging={isDragging}
  class:has-preview={sprites.length > 0}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  {#if !spriteInfo}
    <div class="texture-empty-state">No sprite info available</div>
  {:else}
    <canvas bind:this={canvas}></canvas>
    {#if !sprites.length || isDragging}
        <div class="texture-drop-hint">
          <div class="texture-drop-title">{translate('texture.drop.title') || 'Drop sprites here'}</div>
          <div class="texture-drop-subtitle">{translate('texture.drop.subtitle') || 'Drag from list or desktop'}</div>
        </div>
    {/if}
  {/if}
</div>

<style>
  canvas {
    image-rendering: pixelated;
  }
  
  .texture-preview-card.dragging {
    border-color: var(--primary-color);
    background: var(--surface-2);
  }
</style>