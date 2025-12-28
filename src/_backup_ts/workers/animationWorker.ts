export interface ComposeRequestMessage {
  id: string;
  spriteBuffers: ArrayBuffer[];
}

export interface ComposeResponseMessage {
  id: string;
  buffer: ArrayBuffer | null;
}

async function composeSprites(spriteBuffers: ArrayBuffer[]): Promise<ArrayBuffer | null> {
  if (spriteBuffers.length === 0) return null;

  const bitmaps = await Promise.all(
    spriteBuffers.map(async (buffer) => {
      const blob = new Blob([buffer], { type: 'image/png' });
      return createImageBitmap(blob);
    })
  );

  const width = Math.max(...bitmaps.map((bmp) => bmp.width));
  const height = Math.max(...bitmaps.map((bmp) => bmp.height));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  bitmaps.forEach((bmp) => ctx.drawImage(bmp, 0, 0));

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await blob.arrayBuffer();
}

self.onmessage = async (event: MessageEvent<ComposeRequestMessage>) => {
  const { id, spriteBuffers } = event.data;
  try {
    const buffer = await composeSprites(spriteBuffers);
    const message: ComposeResponseMessage = { id, buffer };
    (self as unknown as Worker).postMessage(message);
  } catch (_err) {
    const message: ComposeResponseMessage = { id, buffer: null };
    (self as unknown as Worker).postMessage(message);
  }
};
