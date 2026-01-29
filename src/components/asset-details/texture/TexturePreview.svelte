<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { computeSpriteIndex, computeGroupOffsetsFromDetails } from '../../../animation';
  import { getSpriteUrl } from '../../../utils/spriteUrlCache';
  import { bufferToObjectUrl } from '../../../spriteCache';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';
  import { translate } from '../../../i18n';

  export let details: CompleteAppearanceItem;
  export let sprites: Uint8Array[] = [];
  export let state: any;
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;

  const dispatch = createEventDispatcher();
  const MIN_PREVIEW_DIM = 140;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dropZone: HTMLDivElement;
  let animationTimer: number | null = null;

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

  function sliceBuffer(sprite: Uint8Array): ArrayBuffer {
    return sprite.slice().buffer;
  }

  function ensureNumber(value: number | undefined | null, fallback = 0): number {
    return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
  }

  function clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
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

  function computePreviewDimensions(
    baseWidth: number,
    baseHeight: number,
    boxes: Array<{ x: number; y: number; width: number; height: number }>,
    boundingSquare: number | null
  ): { width: number; height: number } {
    let width = baseWidth;
    let height = baseHeight;
    for (const box of boxes) {
      width = Math.max(width, box.x + box.width);
      height = Math.max(height, box.y + box.height);
    }
    if (boundingSquare && boundingSquare > 0) {
      width = Math.max(width, boundingSquare);
      height = Math.max(height, boundingSquare);
    }
    return { width, height };
  }

  function computePreviewScale(width: number, height: number): number {
    const maxDim = Math.max(width, height);
    if (maxDim === 0) return 1;
    return Math.max(1, Math.floor(MIN_PREVIEW_DIM / maxDim));
  }

  function drawBoundingSquareOverlay(ctx: CanvasRenderingContext2D, boundingSquare: number | null, scale = 1): void {
    if (!boundingSquare || boundingSquare <= 0) return;
    ctx.save();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const sq = boundingSquare * scale;
    ctx.strokeRect(0, 0, sq, sq);
    ctx.restore();
  }

  function getBoundingSquareValue(): number | null {
    if (!spriteInfo) return null;
    const value = Number(spriteInfo.bounding_square ?? '');
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function getPreviewBoundingBoxes(): Array<{ x: number; y: number; width: number; height: number }> {
    const boxes = spriteInfo?.bounding_boxes ?? [];
    return boxes.map((box) => ({
      x: ensureNumber(box.x, 0),
      y: ensureNumber(box.y, 0),
      width: ensureNumber(box.width, 0),
      height: ensureNumber(box.height, 0)
    }));
  }

  function drawOutfitBoundingBoxes(boxes: Array<{ x: number; y: number; width: number; height: number }>, scale = 1) {
    if (!boxes.length || !ctx) return;
    const directionIndex = clamp(state.direction, 0, boxes.length - 1);
    const box = boxes[directionIndex] || boxes[0];
    if (!box) return;
    ctx.save();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1;
    const x = ensureNumber(box.x, 0) * scale;
    const y = ensureNumber(box.y, 0) * scale;
    const w = ensureNumber(box.width, 0) * scale;
    const h = ensureNumber(box.height, 0) * scale;
    if (w > 0 && h > 0) {
      ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }

  async function loadImage(index: number, spritesArr: Uint8Array[], cache: Map<number, Promise<HTMLImageElement>>): Promise<HTMLImageElement> {
    if (cache.has(index)) {
      return cache.get(index)!;
    }
    initTextureDecodeWorker();
    const sprite = spritesArr[index];
    const id = `tex-${index}-${Date.now()}`;
    const buffer = sliceBuffer(sprite);
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      if (!textureDecodeWorker) {
        reject(new Error('Texture decode worker unavailable'));
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
      textureDecodeWorker.postMessage({ id, sprite: buffer }, [buffer]);
    }).catch((err) => {
      console.warn('Falling back to main thread decode for sprite', index, err);
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
        img.src = bufferToObjectUrl(sprite);
      });
    });
    cache.set(index, promise);
    return promise;
  }

  async function renderSpriteVariant(
    info: CompleteSpriteInfo,
    baseOffset: number,
    direction: number,
    addon: number,
    mount: number,
    frame: number
  ): Promise<HTMLCanvasElement> {
    const layers = Math.max(1, ensureNumber(info.layers, 1));
    const frameCount = getFrameCount(info);
    const localFrame = frameCount > 0 ? frame % frameCount : 0;
    const baseIndex = baseOffset + computeSpriteIndex(info, 0, direction, addon, mount, localFrame);
    const baseImage = await loadImage(baseIndex, sprites, imageCache);
    const offscreen = document.createElement('canvas');
    offscreen.width = baseImage.width;
    offscreen.height = baseImage.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return offscreen;
    offCtx.drawImage(baseImage, 0, 0);

    if (state.blendLayers && layers > 1) {
      const layerIndex = baseOffset + computeSpriteIndex(info, 1, direction, addon, mount, localFrame);
      const templateImage = await loadImage(layerIndex, sprites, imageCache);
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
          let color: { r: number; g: number; b: number } | null = null;
          if (rt > 0 && gt > 0 && bt === 0) {
            color = head;
          } else if (rt > 0 && gt === 0 && bt === 0) {
            color = body;
          } else if (rt === 0 && gt > 0 && bt === 0) {
            color = legs;
          } else if (rt === 0 && gt === 0 && bt > 0) {
            color = feet;
          }
          if (!color) continue;
          baseData.data[i] = Math.round((baseData.data[i] + color.r) / 2);
          baseData.data[i + 1] = Math.round((baseData.data[i + 1] + color.g) / 2);
          baseData.data[i + 2] = Math.round((baseData.data[i + 2] + color.b) / 2);
        }
        offCtx.putImageData(baseData, 0, 0);
      }
    }

    return offscreen;
  }

  async function drawOutfit(): Promise<void> {
    if (!ctx || !canvas) return;
    const info = spriteInfo;
    if (!info) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dropZone?.classList.remove('has-preview');
      return;
    }
    if (!sprites || sprites.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dropZone?.classList.remove('has-preview');
      return;
    }
    ctx.imageSmoothingEnabled = false;
    const frameCount = getFrameCount(info);
    const boxes = getPreviewBoundingBoxes();
    const boundingSquare = getBoundingSquareValue();
    const groupOffsets = computeGroupOffsetsFromDetails(details);
    const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
    const directionMax = Math.max(0, ensureNumber(info.pattern_width, 1) - 1);
    const addonMax = Math.max(0, ensureNumber(info.pattern_height, 1) - 1);
    const mountMax = Math.max(0, ensureNumber(info.pattern_depth, 1) - 1);
    state.direction = clamp(state.direction, 0, directionMax);
    state.addon = clamp(state.addon, 0, addonMax);
    state.mount = clamp(state.mount, 0, mountMax);
    state.frame = clamp(state.frame, 0, Math.max(frameCount - 1, 0));

    const direction = state.direction;
    const mount = state.mount;
    const background = hexToRgb(state.backgroundColor);

    const variants: number[] = [];
    if (state.showFullAddons) {
      for (let addon = 0; addon <= addonMax; addon++) {
        variants.push(addon);
      }
    } else {
      variants.push(state.addon);
    }

    let initialized = false;
    ctx.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let scale = 1;
    for (const addon of variants) {
      const rendered = await renderSpriteVariant(info, baseOffset, direction, addon, mount, state.frame);
      if (!initialized) {
        const { width, height } = computePreviewDimensions(rendered.width, rendered.height, boxes, boundingSquare);
        scale = computePreviewScale(width, height);
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        initialized = true;
      }
      ctx.drawImage(rendered, 0, 0, rendered.width, rendered.height, 0, 0, rendered.width * scale, rendered.height * scale);
    }

    if (state.showBoundingBoxes) {
      drawBoundingSquareOverlay(ctx, boundingSquare, scale);
      drawOutfitBoundingBoxes(boxes, scale);
    }

    dropZone?.classList.add('has-preview');
  }

  async function drawObject(): Promise<void> {
    if (!ctx || !canvas) return;
    const info = spriteInfo;
    if (!info) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dropZone?.classList.remove('has-preview');
      return;
    }
    if (!sprites || sprites.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dropZone?.classList.remove('has-preview');
      return;
    }
    ctx.imageSmoothingEnabled = false;
    const groupOffsets = computeGroupOffsetsFromDetails(details);
    const baseOffset = groupOffsets[state.frameGroupIndex] ?? 0;
    const patternWidth = Math.max(1, ensureNumber(info.pattern_width, 1));
    const patternHeight = Math.max(1, ensureNumber(info.pattern_height, 1));
    const patternDepth = Math.max(1, ensureNumber(info.pattern_depth, 1));
    const layers = Math.max(1, ensureNumber(info.layers, 1));
    const frameCount = getFrameCount(info);

    state.patternX = clamp(state.patternX, 0, patternWidth - 1);
    state.patternY = clamp(state.patternY, 0, patternHeight - 1);
    state.patternZ = clamp(state.patternZ, 0, patternDepth - 1);
    state.layer = clamp(state.layer, 0, layers - 1);
    state.frame = clamp(state.frame, 0, Math.max(frameCount - 1, 0));

    const aggregatedIndex = baseOffset + computeSpriteIndex(
      info,
      state.layer,
      state.patternX,
      state.patternY,
      state.patternZ,
      state.frame
    );

    const image = await loadImage(aggregatedIndex, sprites, imageCache);
    const boxes = getPreviewBoundingBoxes();
    const boundingSquare = getBoundingSquareValue();
    const { width, height } = computePreviewDimensions(image.width, image.height, boxes, boundingSquare);
    const scale = computePreviewScale(width, height);
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * scale, image.height * scale);

    if (state.showBoundingBoxes) {
      drawBoundingSquareOverlay(ctx, boundingSquare, scale);
      if (boxes.length > 0) {
        const directionIndex = clamp(state.patternX, 0, boxes.length - 1);
        const box = boxes[directionIndex] || boxes[0];
        if (box) {
          ctx.save();
          ctx.strokeStyle = '#00bcd4';
          ctx.lineWidth = 1;
          const x = ensureNumber(box.x, 0) * scale;
          const y = ensureNumber(box.y, 0) * scale;
          const w = ensureNumber(box.width, 0) * scale;
          const h = ensureNumber(box.height, 0) * scale;
          if (w > 0 && h > 0) {
            ctx.strokeRect(x, y, w, h);
          }
          ctx.restore();
        }
      }
    }

    dropZone?.classList.add('has-preview');
  }

  async function draw(): Promise<void> {
    if (isOutfit) {
      await drawOutfit();
    } else {
      await drawObject();
    }
  }

  function startAnimation() {
    if (!isOutfit || animationTimer) return;
    const frameCount = getFrameCount(spriteInfo);
    if (frameCount > 1) {
      const duration = Math.max(50, spriteInfo?.animation?.phases?.[state.frame]?.duration_min ?? 250);
      animationTimer = window.setInterval(() => {
        state.frame = (state.frame + 1) % frameCount;
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

  $: if (state) {
    spriteInfo;
    draw();
  }

  $: if (state?.autoAnimate && isOutfit) {
    startAnimation();
  } else {
    stopAnimation();
  }

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
      } catch (_err) {
      }
    } else {
      const plain = e.dataTransfer?.getData('text/plain');
      if (plain) {
        spriteIds = plain.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      }
    }

    if (spriteIds.length > 0) {
      dispatch('dropSprites', { spriteIds });
    }
  }
</script>

<div
  class="texture-preview-card texture-drop-zone"
  id="texture-drop-zone"
  bind:this={dropZone}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <div class="texture-drop-hint">
    <div class="texture-drop-title">{translate('texture.drop.title')}</div>
    <div class="texture-drop-subtitle">{translate('texture.drop.subtitle')}</div>
  </div>
  <canvas
    bind:this={canvas}
    id={isOutfit ? 'outfit-preview-canvas' : 'object-preview-canvas'}
    width="96"
    height="96"
  ></canvas>
</div>
