export interface ImageRequestMessage {
  id: string;
  sprite: ArrayBuffer;
}

export interface ImageResponseMessage {
  id: string;
  buffer: ArrayBuffer | null;
}

self.onmessage = async (event: MessageEvent<ImageRequestMessage>) => {
  const { id, sprite } = event.data;
  try {
    const blob = new Blob([sprite], { type: 'image/png' });
    const bitmap = await createImageBitmap(blob);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      (self as unknown as Worker).postMessage({ id, buffer: null } satisfies ImageResponseMessage);
      return;
    }
    ctx.drawImage(bitmap, 0, 0);
    const outBlob = await offscreen.convertToBlob({ type: 'image/png' });
    const outBuffer = await outBlob.arrayBuffer();
    (self as unknown as Worker).postMessage({ id, buffer: outBuffer } satisfies ImageResponseMessage);
  } catch (_error) {
    (self as unknown as Worker).postMessage({ id, buffer: null } satisfies ImageResponseMessage);
  }
};
