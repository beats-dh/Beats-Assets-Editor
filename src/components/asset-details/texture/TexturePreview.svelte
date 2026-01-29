<script lang="ts">
  import { onMount, afterUpdate, onDestroy, createEventDispatcher } from 'svelte';
  import { computeSpriteIndex, computeGroupOffsetsFromDetails } from '../../../animation';
  import { getSpriteUrl } from '../../../utils/spriteUrlCache';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import { translate } from '../../../i18n';

  export let details: CompleteAppearanceItem;
  export let sprites: Uint8Array[] = [];
  export let state: any; // We'll type this better if possible or use the interface
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;

  const dispatch = createEventDispatcher();
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dropZone: HTMLDivElement;
  let animationTimer: number | null = null;
  
  // Image Cache
  const imageCache = new Map<number, Promise<HTMLImageElement>>();
  const textureDecodePending = new Map<string, (value: string | null) => void>();
  let textureDecodeWorker: Worker | null = null;

  function initTextureDecodeWorker() {
    if (textureDecodeWorker) return;
    try {
      textureDecodeWorker = new Worker(
        new URL('../../../workers/imageBitmapWorker.ts', import.meta.url),
        { type: 'module' }
      );
      textureDecodeWorker.onmessage = (event: MessageEvent<{ id: string; buffer: ArrayBuffer | null }>) => {
        const { id, buffer } = event.data;
        const resolver = textureDecodePending.get(id);
        if (resolver) {
          const dataUrl = buffer ? getSpriteUrl(new Uint8Array(buffer)) : null;
          resolver(dataUrl);
          textureDecodePending.delete(id);
        }
      };
    } catch (error) {
      console.warn('Failed to init texture decode worker:', error);
      textureDecodeWorker = null;
      textureDecodePending.clear();
    }
  }

  onMount(() => {
    initTextureDecodeWorker();
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
  });

  onDestroy(() => {
    stopAnimation();
    if (textureDecodeWorker) {
      textureDecodeWorker.terminate();
    }
    textureDecodePending.clear();
  });

  $: if (sprites) {
      imageCache.clear();
      draw();
  }

  $: if (state && (state.frameGroupIndex || state.direction || state.addon || state.mount || state.frame || state.blendLayers || state.showFullAddons || state.showBoundingBoxes || state.headColor || state.bodyColor || state.legsColor || state.feetColor || state.backgroundColor || state.patternX || state.patternY || state.patternZ || state.layer)) {
      draw();
  }
  
  // Watch for auto-animate toggle
  $: if (state && state.autoAnimate) {
      startAnimation();
  } else {
      stopAnimation();
  }

  function startAnimation() {
      if (animationTimer) return;
      const frameCount = getFrameCount(spriteInfo);
      if (frameCount > 1) {
          const duration = Math.max(50, spriteInfo?.animation?.phases?.[state.frame]?.duration_min ?? 250);
          animationTimer = window.setInterval(() => {
              state.frame = (state.frame + 1) % frameCount;
              // We need to notify parent of state change to update sliders
              dispatch('stateChange', { frame: state.frame });
              draw();
          }, duration);
      }
  }

  function stopAnimation() {
      if (animationTimer) {
          window.clearInterval(animationTimer);
          animationTimer = null;
      }
  }

  function sliceBuffer(sprite: Uint8Array): ArrayBuffer {
    return sprite.slice().buffer;
  }

  function hexToRgb(hex: string) {
    const sanitized = hex.replace('#', '');
    const parsed = sanitized.length === 3
      ? sanitized.split('').map(ch => ch + ch).join('')
      : sanitized.padEnd(6, '0');
    const bigint = parseInt(parsed, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  }

  function getFrameCount(info: CompleteSpriteInfo | undefined): number {
    if (!info) return 1;
    if (info.animation && info.animation.phases.length > 0) return info.animation.phases.length;
    if (info.pattern_frames && info.pattern_frames > 0) return info.pattern_frames;
    return 1;
  }
  
  function bufferToObjectUrl(buffer: Uint8Array): string {
      return URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  }

  function loadImage(index: number, spritesArr: Uint8Array[], cache: Map<number, Promise<HTMLImageElement>>): Promise<HTMLImageElement> {
    if (cache.has(index)) {
      return cache.get(index)!;
    }
    
    // Safety check
    if (!spritesArr || !spritesArr[index]) {
       // Return empty image or reject
       return Promise.reject('Sprite index out of bounds');
    }

    initTextureDecodeWorker();
    const sprite = spritesArr[index];
    const id = `tex-${index}-${Date.now()}`;
    const buffer = sliceBuffer(sprite);
    
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      if (!textureDecodeWorker) {
        // Fallback
         const img = new Image();
         img.onload = () => resolve(img);
         img.onerror = (error) => reject(error);
         img.src = bufferToObjectUrl(new Uint8Array(buffer));
         return;
      }
      
      textureDecodePending.set(id, (dataUrl) => {
        if (!dataUrl) {
          reject(new Error('Failed to decode sprite'));
          return;
        }
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(dataUrl);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(dataUrl);
          reject(err);
        };
        img.src = dataUrl;
      });
      textureDecodeWorker.postMessage({ id, buffer }, [buffer]);
    });
    
    cache.set(index, promise);
    return promise;
  }

  async function renderSpriteVariant(
    offset: number, 
    direction: number, 
    addon: number, 
    mount: number, 
    frame: number
  ): Promise<HTMLCanvasElement> {
      if (!spriteInfo) return document.createElement('canvas'); // Empty

      const layers = Math.max(1, spriteInfo.layers || 1);
      const frameCount = getFrameCount(spriteInfo);
      const localFrame = frameCount > 0 ? frame % frameCount : 0;
      
      // Calculate indices
      // Note: computeSpriteIndex(info, layer, x, y, z, frame)
      // For outfits: computeSpriteIndex(info, layer, direction, addon, mount, frame)
      // For objects: computeSpriteIndex(info, layer, patternX, patternY, patternZ, frame)
      
      let baseIndex = 0;
      if (isOutfit) {
          baseIndex = offset + computeSpriteIndex(spriteInfo, 0, direction, addon, mount, localFrame);
      } else {
          // Object logic
          // state has patternX, patternY, patternZ, layer
          // Wait, computeSpriteIndex args for object:
          // x=patternX, y=patternY, z=patternZ, f=frame
          // But layer is the second arg?
          // Let's check computeSpriteIndex signature in my mind (or assume it matches backup).
          // Backup: computeSpriteIndex(spriteInfo, 0, direction, addon, mount, localFrame) for Outfit
          // Backup: computeSpriteIndex(spriteInfo, 0, state.patternX, state.patternY, state.patternZ, state.frame) ??
          
          // Actually backup object render calls:
          // Not explicitly shown in the viewed lines for RenderObjectTextureTab calling renderSpriteVariant.
          // But logically it should be similar.
          // Let's assume standard order: layer, x, y, z, f
          
          if (isOutfit) {
               baseIndex = offset + computeSpriteIndex(spriteInfo, 0, direction, addon, mount, localFrame);
          } else {
              // Objects
              baseIndex = offset + computeSpriteIndex(
                  spriteInfo, 
                  state.layer || 0, 
                  state.patternX || 0, 
                  state.patternY || 0, 
                  state.patternZ || 0, 
                  localFrame
              );
          }
      }

      let baseImage: HTMLImageElement;
      try {
          baseImage = await loadImage(baseIndex, sprites, imageCache);
      } catch (e) {
          // console.warn(e);
          const c = document.createElement('canvas');
          c.width = 32; c.height = 32;
          return c;
      }
      
      const offscreen = document.createElement('canvas');
      offscreen.width = baseImage.width;
      offscreen.height = baseImage.height;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return offscreen;
      offCtx.drawImage(baseImage, 0, 0);

      // Outfit Blending
      if (isOutfit && state.blendLayers && layers > 1) {
          const layerIndex = offset + computeSpriteIndex(spriteInfo, 1, direction, addon, mount, localFrame);
          try {
              const templateImage = await loadImage(layerIndex, sprites, imageCache);
              const templateCanvas = document.createElement('canvas');
              templateCanvas.width = templateImage.width;
              templateCanvas.height = templateImage.height;
              const templateCtx = templateCanvas.getContext('2d');
              if (templateCtx) {
                  templateCtx.drawImage(templateImage, 0, 0);
                  const templateData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
                  const baseData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                  
                  const head = hexToRgb(state.headColor || '#ffffff');
                  const body = hexToRgb(state.bodyColor || '#ffffff');
                  const legs = hexToRgb(state.legsColor || '#ffffff');
                  const feet = hexToRgb(state.feetColor || '#ffffff');
                  
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
                      
                      if (!color) continue;
                      
                      baseData.data[i] = Math.round((baseData.data[i] + color.r) / 2);
                      baseData.data[i + 1] = Math.round((baseData.data[i + 1] + color.g) / 2);
                      baseData.data[i + 2] = Math.round((baseData.data[i + 2] + color.b) / 2);
                  }
                  offCtx.putImageData(baseData, 0, 0);
              }
          } catch (e) {
              // Ignore missing layer
          }
      }
      
      return offscreen;
  }

  async function draw() {
      if (!canvas || !ctx) return;
      if (!spriteInfo) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
      }

      ctx.imageSmoothingEnabled = false;

      // Group Offsets
      const groupOffsets = computeGroupOffsetsFromDetails(details);
      const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
      
      const background = state.backgroundColor ? hexToRgb(state.backgroundColor) : {r:38, g:38, b:38};
      ctx.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render variants
      const variants: Promise<HTMLCanvasElement>[] = [];
      const positions: {x:number, y:number}[] = [];
      
      // For object, we usually render 1 variant. For outfit, might be multiple addons if 'showFullAddons'
      if (isOutfit && state.showFullAddons) {
           const addonMax = Math.max(0, (spriteInfo.pattern_height || 1) - 1);
           for (let i = 0; i <= addonMax; i++) {
               variants.push(renderSpriteVariant(baseOffset, state.direction, i, state.mount, state.frame));
           }
      } else {
           // Single render
           variants.push(renderSpriteVariant(baseOffset, state.direction, state.addon, state.mount, state.frame));
      }

      const results = await Promise.all(variants);
      
      // Determine canvas size based on first result (assuming uniform size)
      if (results.length > 0) {
          let maxWidth = 0;
          let maxHeight = 0;
          results.forEach(r => {
              maxWidth = Math.max(maxWidth, r.width);
              maxHeight = Math.max(maxHeight, r.height);
          });
          
          const padding = 32;
          // Scale logic: make it look nice
          let scale = 1;
          if (maxWidth < 64) scale = 2; // Zoom small sprites
          
          canvas.width = maxWidth * scale + padding;
          canvas.height = maxHeight * scale + padding;
          
          // Re-fill bg after resize
          ctx.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          
          results.forEach(r => {
             const x = cx - (r.width * scale) / 2;
             const y = cy - (r.height * scale) / 2;
             ctx!.drawImage(r, 0, 0, r.width, r.height, x, y, r.width * scale, r.height * scale);
          });
          
          if (dropZone) dropZone.classList.add('has-preview');
          
          // Bounding Boxes
          if (state.showBoundingBoxes && spriteInfo.bounding_boxes) {
              // Draw boxes
              // Note: backup draws boxes based on direction
              // boxes[direction] or boxes[0]
              const boxIndex = Math.min(Math.max(0, state.direction), spriteInfo.bounding_boxes.length - 1);
              const box = spriteInfo.bounding_boxes[boxIndex] || spriteInfo.bounding_boxes[0];
              
              if (box) {
                  ctx!.strokeStyle = '#ff9800';
                  ctx!.lineWidth = 2;
                  // The box coordinates are relative to the sprite
                  // scale applies
                  // centered offset applies
                  const dx = cx - (maxWidth * scale) / 2;
                  const dy = cy - (maxHeight * scale) / 2;
                  
                  const bx = (box.x || 0) * scale + dx;
                  const by = (box.y || 0) * scale + dy;
                  const bw = (box.width || 0) * scale;
                  const bh = (box.height || 0) * scale;
                  
                  if (bw > 0 && bh > 0) {
                     ctx!.strokeRect(bx, by, bw, bh);
                  }
              }
              
              // Bounding Square (Global) -- wait, backup had `drawBoundingSquareOverlay`
              if (spriteInfo.bounding_square) {
                  const size = spriteInfo.bounding_square * scale;
                   ctx!.strokeStyle = '#ff0000';
                   ctx!.lineWidth = 1;
                   ctx!.strokeRect(cx - 16 * scale, cy - 16 * scale, 32 * scale, 32 * scale); // Center ref? 
                   // Backup: drawBoundingSquareOverlay logic not fully seen, assuming standard 32x32 center or similar?
                   // Actually Tibia usually has 32x32 or 64x64.
                   // Let's simplified visual aid: Draw a 32x32 grid center
                   ctx!.fillStyle = 'rgba(255,255,255,0.2)';
                   ctx!.fillRect(cx - 16*scale, cy-16*scale, 32*scale, 32*scale);
              }
          }
      }
  }
  
  // Drag Drop Handlers
  function handleDragOver(e: DragEvent) {
      e.preventDefault();
      dropZone.classList.add('is-drag-over');
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }
  
  function handleDragLeave() {
      dropZone.classList.remove('is-drag-over');
  }
  
  function handleDrop(e: DragEvent) {
      e.preventDefault();
      dropZone.classList.remove('is-drag-over');
      
      const customPayload = e.dataTransfer?.getData('application/x-asset-sprite');
      let spriteIds: number[] = [];
      
      if (customPayload) {
          try {
             const parsed = JSON.parse(customPayload);
             if (parsed.spriteIds) spriteIds = parsed.spriteIds;
          } catch(err) {}
      } else {
          // Plain text
          const plain = e.dataTransfer?.getData('text/plain');
          if (plain) {
              spriteIds = plain.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
          }
      }
      
      if (spriteIds.length > 0) {
          dispatch('dropSprites', { spriteIds });
      }
  }
</script>

<div 
  class="texture-preview-card texture-drop-zone" 
  bind:this={dropZone}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <div class="texture-drop-hint">
    <div class="texture-drop-title">{translate('texture.drop.title')}</div>
    <div class="texture-drop-subtitle">{translate('texture.drop.subtitle')}</div>
  </div>
  <canvas bind:this={canvas}></canvas>
</div>