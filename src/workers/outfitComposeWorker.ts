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
  buffer: ArrayBuffer | null;
}

interface RGB { r: number; g: number; b: number; }

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
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

async function composeOutfit(request: OutfitComposeRequestMessage): Promise<ArrayBuffer | null> {
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
  return await blob.arrayBuffer();
}

self.onmessage = async (event: MessageEvent<OutfitComposeRequestMessage>) => {
  const { id } = event.data;
  try {
    const buffer = await composeOutfit(event.data);
    const response: OutfitComposeResponseMessage = { id, buffer };
    (self as unknown as Worker).postMessage(response);
  } catch (_error) {
    const response: OutfitComposeResponseMessage = { id, buffer: null };
    (self as unknown as Worker).postMessage(response);
  }
};
