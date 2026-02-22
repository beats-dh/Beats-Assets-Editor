<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { computeSpriteIndex, computeGroupOffsetsFromDetails } from '../../../../animation';
  import { getSpriteUrl } from '../../../../utils/spriteUrlCache';
  import { bufferToObjectUrl } from '../../../../spriteCache';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../../types';
  import { translate } from '../../../../i18n';
  interface Props {
    details: CompleteAppearanceItem;
    sprites: Uint8Array[];
    previewState: any;
    spriteInfo: CompleteSpriteInfo | undefined;
    isOutfit: boolean;
    onDropSprites?: (detail: { spriteIds: number[] }) => void;
    onStateChange?: (detail: any) => void;
  }
  let { details, sprites, previewState: ps, spriteInfo, isOutfit, onDropSprites, onStateChange }: Props = $props();

  const MIN_PREVIEW_DIM = 140;
  let canvas = $state<HTMLCanvasElement | undefined>();
  let ctx: CanvasRenderingContext2D | null = null;
  let dropZone = $state<HTMLDivElement | undefined>();
  let animationTimer: number | null = null;
  const imageCache = new Map<number, Promise<HTMLImageElement>>();
  const textureDecodePending = new Map<string, (value: string | null) => void>();
  let textureDecodeWorker: Worker | null = null;

  function initTextureDecodeWorker() {
    if (textureDecodeWorker) return;
    try {
      textureDecodeWorker = new Worker(new URL('../../../../workers/imageBitmapWorker.ts', import.meta.url), { type: 'module' });
      textureDecodeWorker.onmessage = (event: MessageEvent<{ id: string; buffer: ArrayBuffer | null }>) => {
        const { id, buffer } = event.data;
        const resolver = textureDecodePending.get(id);
        if (resolver) { const dataUrl = buffer ? getSpriteUrl(new Uint8Array(buffer)) : null; resolver(dataUrl); textureDecodePending.delete(id); }
      };
    } catch (error) { console.warn('Failed to init texture decode worker:', error); textureDecodeWorker = null; textureDecodePending.clear(); }
  }

  function sliceBuffer(sprite: Uint8Array): ArrayBuffer { return sprite.slice().buffer; }
  function ensureNumber(value: number | undefined | null, fallback = 0): number { return typeof value === 'number' && !Number.isNaN(value) ? value : fallback; }
  function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
  function hexToRgb(hex: string) { const s = hex.replace('#', ''); const p = s.length === 3 ? s.split('').map(c => c + c).join('') : s.padEnd(6, '0'); const n = parseInt(p, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
  function getFrameCount(info: CompleteSpriteInfo | undefined): number { if (!info) return 1; if (info.animation && info.animation.phases.length > 0) return info.animation.phases.length; if (info.pattern_frames && info.pattern_frames > 0) return info.pattern_frames; return 1; }

  function computePreviewDimensions(baseWidth: number, baseHeight: number, boxes: Array<{ x: number; y: number; width: number; height: number }>, boundingSquare: number | null): { width: number; height: number } {
    let width = baseWidth, height = baseHeight;
    for (const box of boxes) { width = Math.max(width, box.x + box.width); height = Math.max(height, box.y + box.height); }
    if (boundingSquare && boundingSquare > 0) { width = Math.max(width, boundingSquare); height = Math.max(height, boundingSquare); }
    return { width, height };
  }
  function computePreviewScale(width: number, height: number): number { const maxDim = Math.max(width, height); if (maxDim === 0) return 1; return Math.max(1, Math.floor(MIN_PREVIEW_DIM / maxDim)); }

  function drawBoundingSquareOverlay(ctx2d: CanvasRenderingContext2D, boundingSquare: number | null, scale = 1): void {
    if (!boundingSquare || boundingSquare <= 0) return;
    ctx2d.save(); ctx2d.strokeStyle = '#4caf50'; ctx2d.lineWidth = 1; ctx2d.setLineDash([4, 4]); ctx2d.strokeRect(0, 0, boundingSquare * scale, boundingSquare * scale); ctx2d.restore();
  }
  function getBoundingSquareValue(): number | null { if (!spriteInfo) return null; const v = Number(spriteInfo.bounding_square ?? ''); return Number.isFinite(v) && v > 0 ? v : null; }
  function getPreviewBoundingBoxes(): Array<{ x: number; y: number; width: number; height: number }> {
    return (spriteInfo?.bounding_boxes ?? []).map(box => ({ x: ensureNumber(box.x, 0), y: ensureNumber(box.y, 0), width: ensureNumber(box.width, 0), height: ensureNumber(box.height, 0) }));
  }
  function drawOutfitBoundingBoxes(boxes: Array<{ x: number; y: number; width: number; height: number }>, scale = 1) {
    if (!boxes.length || !ctx) return;
    const dirIdx = clamp(ps.direction, 0, boxes.length - 1); const box = boxes[dirIdx] || boxes[0]; if (!box) return;
    ctx.save(); ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1;
    const x = ensureNumber(box.x, 0) * scale, y = ensureNumber(box.y, 0) * scale, w = ensureNumber(box.width, 0) * scale, h = ensureNumber(box.height, 0) * scale;
    if (w > 0 && h > 0) ctx.strokeRect(x, y, w, h); ctx.restore();
  }

  async function loadImage(index: number, spritesArr: Uint8Array[], cache: Map<number, Promise<HTMLImageElement>>): Promise<HTMLImageElement> {
    if (cache.has(index)) return cache.get(index)!;
    initTextureDecodeWorker();
    const sprite = spritesArr[index]; const id = `tex-${index}-${Date.now()}`; const buffer = sliceBuffer(sprite);
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      if (!textureDecodeWorker) { reject(new Error('Worker unavailable')); return; }
      textureDecodePending.set(id, (dataUrl) => { if (!dataUrl) { reject(new Error('Decode failed')); return; } const img = new Image(); img.onload = () => { URL.revokeObjectURL(dataUrl); resolve(img); }; img.onerror = (err) => { URL.revokeObjectURL(dataUrl); reject(err); }; img.src = dataUrl; });
      textureDecodeWorker.postMessage({ id, sprite: buffer }, [buffer]);
    }).catch((err) => { console.warn('Falling back to main thread decode', index, err); return new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = (error) => reject(error); img.src = bufferToObjectUrl(sprite); }); });
    cache.set(index, promise); return promise;
  }

  async function renderSpriteVariant(info: CompleteSpriteInfo, baseOffset: number, direction: number, addon: number, mount: number, frame: number): Promise<HTMLCanvasElement> {
    const layers = Math.max(1, ensureNumber(info.layers, 1)); const frameCount = getFrameCount(info); const localFrame = frameCount > 0 ? frame % frameCount : 0;
    const baseIndex = baseOffset + computeSpriteIndex(info, 0, direction, addon, mount, localFrame);
    const baseImage = await loadImage(baseIndex, sprites, imageCache);
    const offscreen = document.createElement('canvas'); offscreen.width = baseImage.width; offscreen.height = baseImage.height;
    const offCtx = offscreen.getContext('2d'); if (!offCtx) return offscreen;
    offCtx.drawImage(baseImage, 0, 0);
    if (ps.blendLayers && layers > 1) {
      const layerIndex = baseOffset + computeSpriteIndex(info, 1, direction, addon, mount, localFrame);
      const templateImage = await loadImage(layerIndex, sprites, imageCache);
      const tc = document.createElement('canvas'); tc.width = templateImage.width; tc.height = templateImage.height; const tCtx = tc.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(templateImage, 0, 0); const td = tCtx.getImageData(0, 0, tc.width, tc.height); const bd = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
        const head = hexToRgb(ps.headColor), body = hexToRgb(ps.bodyColor), legs = hexToRgb(ps.legsColor), feet = hexToRgb(ps.feetColor);
        for (let i = 0; i < td.data.length; i += 4) {
          const rt = td.data[i], gt = td.data[i+1], bt = td.data[i+2], alpha = td.data[i+3]; if (alpha === 0) continue;
          let color: { r: number; g: number; b: number } | null = null;
          if (rt > 0 && gt > 0 && bt === 0) color = head; else if (rt > 0 && gt === 0 && bt === 0) color = body; else if (rt === 0 && gt > 0 && bt === 0) color = legs; else if (rt === 0 && gt === 0 && bt > 0) color = feet;
          if (!color) continue;
          bd.data[i] = Math.round((bd.data[i] + color.r) / 2); bd.data[i+1] = Math.round((bd.data[i+1] + color.g) / 2); bd.data[i+2] = Math.round((bd.data[i+2] + color.b) / 2);
        }
        offCtx.putImageData(bd, 0, 0);
      }
    }
    return offscreen;
  }

  async function drawOutfit(): Promise<void> {
    if (!ctx || !canvas) return; const info = spriteInfo;
    if (!info || !sprites || sprites.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); dropZone?.classList.remove('has-preview'); return; }
    ctx.imageSmoothingEnabled = false;
    const boxes = getPreviewBoundingBoxes(); const boundingSquare = getBoundingSquareValue();
    const groupOffs = computeGroupOffsetsFromDetails(details); const baseOffset = groupOffs[ps.frameGroupIndex] ?? 0;
    const dirMax = Math.max(0, ensureNumber(info.pattern_width, 1) - 1); const adMax = Math.max(0, ensureNumber(info.pattern_height, 1) - 1); const mtMax = Math.max(0, ensureNumber(info.pattern_depth, 1) - 1);
    const frameCount = getFrameCount(info);
    ps.direction = clamp(ps.direction, 0, dirMax); ps.addon = clamp(ps.addon, 0, adMax); ps.mount = clamp(ps.mount, 0, mtMax); ps.frame = clamp(ps.frame, 0, Math.max(frameCount - 1, 0));
    const variants: number[] = ps.showFullAddons ? Array.from({ length: adMax + 1 }, (_, i) => i) : [ps.addon];
    const bg = hexToRgb(ps.backgroundColor);
    ctx.fillStyle = `rgb(${bg.r}, ${bg.g}, ${bg.b})`; ctx.clearRect(0, 0, canvas.width, canvas.height);
    let scale = 1; let initialized = false;
    for (const addon of variants) {
      const rendered = await renderSpriteVariant(info, baseOffset, ps.direction, addon, ps.mount, ps.frame);
      if (!initialized) { const { width, height } = computePreviewDimensions(rendered.width, rendered.height, boxes, boundingSquare); scale = computePreviewScale(width, height); canvas.width = width * scale; canvas.height = height * scale; ctx.fillRect(0, 0, canvas.width, canvas.height); initialized = true; }
      ctx.drawImage(rendered, 0, 0, rendered.width, rendered.height, 0, 0, rendered.width * scale, rendered.height * scale);
    }
    if (ps.showBoundingBoxes) { drawBoundingSquareOverlay(ctx, boundingSquare, scale); drawOutfitBoundingBoxes(boxes, scale); }
    dropZone?.classList.add('has-preview');
  }

  async function drawObject(): Promise<void> {
    if (!ctx || !canvas) return; const info = spriteInfo;
    if (!info || !sprites || sprites.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); dropZone?.classList.remove('has-preview'); return; }
    ctx.imageSmoothingEnabled = false;
    const groupOffs = computeGroupOffsetsFromDetails(details); const baseOffset = groupOffs[ps.frameGroupIndex] ?? 0;
    const pW = Math.max(1, ensureNumber(info.pattern_width, 1)), pH = Math.max(1, ensureNumber(info.pattern_height, 1)), pD = Math.max(1, ensureNumber(info.pattern_depth, 1)), layers = Math.max(1, ensureNumber(info.layers, 1));
    const frameCount = getFrameCount(info);
    ps.patternX = clamp(ps.patternX, 0, pW - 1); ps.patternY = clamp(ps.patternY, 0, pH - 1); ps.patternZ = clamp(ps.patternZ, 0, pD - 1); ps.layer = clamp(ps.layer, 0, layers - 1); ps.frame = clamp(ps.frame, 0, Math.max(frameCount - 1, 0));
    const aggIdx = baseOffset + computeSpriteIndex(info, ps.layer, ps.patternX, ps.patternY, ps.patternZ, ps.frame);
    const image = await loadImage(aggIdx, sprites, imageCache);
    const boxes = getPreviewBoundingBoxes(); const boundingSquare = getBoundingSquareValue();
    const { width, height } = computePreviewDimensions(image.width, image.height, boxes, boundingSquare);
    const scale = computePreviewScale(width, height);
    canvas.width = width * scale; canvas.height = height * scale; ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * scale, image.height * scale);
    if (ps.showBoundingBoxes) {
      drawBoundingSquareOverlay(ctx, boundingSquare, scale);
      if (boxes.length > 0) { const di = clamp(ps.patternX, 0, boxes.length - 1); const box = boxes[di] || boxes[0]; if (box) { ctx.save(); ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 1; const x = ensureNumber(box.x, 0) * scale, y = ensureNumber(box.y, 0) * scale, w = ensureNumber(box.width, 0) * scale, h = ensureNumber(box.height, 0) * scale; if (w > 0 && h > 0) ctx.strokeRect(x, y, w, h); ctx.restore(); } }
    }
    dropZone?.classList.add('has-preview');
  }

  async function draw() { if (isOutfit) await drawOutfit(); else await drawObject(); }

  function startAnimation() {
    if (!isOutfit || animationTimer) return; const frameCount = getFrameCount(spriteInfo);
    if (frameCount > 1) { const dur = Math.max(50, spriteInfo?.animation?.phases?.[ps.frame]?.duration_min ?? 250); animationTimer = window.setInterval(() => { ps.frame = (ps.frame + 1) % frameCount; onStateChange?.({ frame: ps.frame }); draw(); }, dur); }
  }
  function stopAnimation() { if (animationTimer) { window.clearInterval(animationTimer); animationTimer = null; } }

  onMount(() => { initTextureDecodeWorker(); if (canvas) ctx = canvas.getContext('2d'); });
  onDestroy(() => { stopAnimation(); if (textureDecodeWorker) textureDecodeWorker.terminate(); textureDecodePending.clear(); });

  $effect(() => { if (sprites) { imageCache.clear(); draw(); } });
  $effect(() => { if (ps) { spriteInfo; draw(); } });
  $effect(() => { if (ps?.autoAnimate && isOutfit) startAnimation(); else stopAnimation(); });

  function handleDragOver(e: DragEvent) { e.preventDefault(); dropZone?.classList.add('is-drag-over'); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; }
  function handleDragLeave() { dropZone?.classList.remove('is-drag-over'); }
  function handleDrop(e: DragEvent) {
    e.preventDefault(); dropZone?.classList.remove('is-drag-over');
    const customPayload = e.dataTransfer?.getData('application/x-asset-sprite'); let spriteIds: number[] = [];
    if (customPayload) { try { const parsed = JSON.parse(customPayload); if (parsed.spriteIds) spriteIds = parsed.spriteIds; } catch (_) {} }
    else { const plain = e.dataTransfer?.getData('text/plain'); if (plain) spriteIds = plain.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)); }
    if (spriteIds.length > 0) onDropSprites?.({ spriteIds });
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="texture-preview-card texture-drop-zone" id="texture-drop-zone" bind:this={dropZone} ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
  <div class="texture-drop-hint"><div class="texture-drop-title">{translate('texture.drop.title')}</div><div class="texture-drop-subtitle">{translate('texture.drop.subtitle')}</div></div>
  <canvas bind:this={canvas} id={isOutfit ? 'outfit-preview-canvas' : 'object-preview-canvas'} width="96" height="96"></canvas>
</div>
