export interface OutfitComposeLayer {
  sprite: ArrayBuffer;
  template?: ArrayBuffer;
}

export interface OutfitComposeRequestMessage {
  id: string;
  layers: OutfitComposeLayer[];
  colors: {
    head: RGB;
    body: RGB;
    legs: RGB;
    feet: RGB;
  };
}

export interface OutfitComposeResponseMessage {
  id: string;
  dataUrl: string | null;
}

interface RGB { r: number; g: number; b: number; }

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function bufferToBitmap(buffer: ArrayBuffer): Promise<ImageBitmap> {
  const blob = new Blob([buffer], { type: 'image/png' });
  return createImageBitmap(blob);
}

async function applyTemplate(
  templateBuffer: ArrayBuffer,
  canvas: OffscreenCanvas,
  ctx: OffscreenCanvasRenderingContext2D,
  colors: { head: RGB; body: RGB; legs: RGB; feet: RGB }
): Promise<void> {
  const templateBitmap = await bufferToBitmap(templateBuffer);
  const tempCanvas = new OffscreenCanvas(templateBitmap.width, templateBitmap.height);
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.drawImage(templateBitmap, 0, 0);
  const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const baseData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < templateData.data.length; i += 4) {
    const r = templateData.data[i];
    const g = templateData.data[i + 1];
    const b = templateData.data[i + 2];
    const alpha = templateData.data[i + 3];
    if (alpha === 0) continue;

    let targetColor: RGB | null = null;
    if (r > 0 && g > 0 && b === 0) targetColor = colors.head;
    else if (r > 0 && g === 0 && b === 0) targetColor = colors.body;
    else if (r === 0 && g > 0 && b === 0) targetColor = colors.legs;
    else if (r === 0 && g === 0 && b > 0) targetColor = colors.feet;

    if (!targetColor) continue;

    baseData.data[i] = clampByte((baseData.data[i] + targetColor.r) / 2);
    baseData.data[i + 1] = clampByte((baseData.data[i + 1] + targetColor.g) / 2);
    baseData.data[i + 2] = clampByte((baseData.data[i + 2] + targetColor.b) / 2);
  }

  ctx.putImageData(baseData, 0, 0);
}

async function composeOutfit(request: OutfitComposeRequestMessage): Promise<string | null> {
  if (request.layers.length === 0) return null;

  const baseBitmap = await bufferToBitmap(request.layers[0].sprite);
  const canvas = new OffscreenCanvas(baseBitmap.width, baseBitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  for (const layer of request.layers) {
    const bitmap = await bufferToBitmap(layer.sprite);
    ctx.drawImage(bitmap, 0, 0);
    if (layer.template) {
      await applyTemplate(layer.template, canvas, ctx, request.colors);
    }
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:image/png;base64,${base64}`;
}

self.onmessage = async (event: MessageEvent<OutfitComposeRequestMessage>) => {
  const { id } = event.data;
  try {
    const dataUrl = await composeOutfit(event.data);
    const response: OutfitComposeResponseMessage = { id, dataUrl };
    (self as unknown as Worker).postMessage(response);
  } catch (_error) {
    const response: OutfitComposeResponseMessage = { id, dataUrl: null };
    (self as unknown as Worker).postMessage(response);
  }
};
