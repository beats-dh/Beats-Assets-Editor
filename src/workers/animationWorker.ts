export interface ComposeRequestMessage {
  id: string;
  spriteBuffers: ArrayBuffer[];
}

export interface ComposeResponseMessage {
  id: string;
  dataUrl: string | null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function composeSprites(spriteBuffers: ArrayBuffer[]): Promise<string | null> {
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
  const ab = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(ab);
  return `data:image/png;base64,${base64}`;
}

self.onmessage = async (event: MessageEvent<ComposeRequestMessage>) => {
  const { id, spriteBuffers } = event.data;
  try {
    const dataUrl = await composeSprites(spriteBuffers);
    const message: ComposeResponseMessage = { id, dataUrl };
    (self as unknown as Worker).postMessage(message);
  } catch (_err) {
    const message: ComposeResponseMessage = { id, dataUrl: null };
    (self as unknown as Worker).postMessage(message);
  }
};
