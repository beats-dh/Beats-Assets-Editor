export interface ImageRequestMessage {
  id: string;
  sprite: ArrayBuffer;
}

export interface ImageBatchRequestMessage {
  id: string;
  sprites: ArrayBuffer[];
}

export interface ImageResponseMessage {
  id: string;
  buffer: ArrayBuffer | null;
}

export interface ImageBatchResponseMessage {
  id: string;
  buffers: (ArrayBuffer | null)[];
}

async function decodeSingle(sprite: ArrayBuffer): Promise<ArrayBuffer | null> {
  try {
    const blob = new Blob([sprite], { type: 'image/png' });
    const bitmap = await createImageBitmap(blob);
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const outBlob = await offscreen.convertToBlob({ type: 'image/png' });
    return await outBlob.arrayBuffer();
  } catch {
    return null;
  }
}

self.onmessage = async (event: MessageEvent<ImageRequestMessage | ImageBatchRequestMessage>) => {
  const data = event.data;

  // Batch request: decode multiple sprites in one message
  if ('sprites' in data && Array.isArray(data.sprites)) {
    const { id, sprites } = data as ImageBatchRequestMessage;
    const buffers = await Promise.all(sprites.map(decodeSingle));
    (self as unknown as Worker).postMessage({ id, buffers } satisfies ImageBatchResponseMessage);
    return;
  }

  // Single request (backwards compatible)
  const { id, sprite } = data as ImageRequestMessage;
  const buffer = await decodeSingle(sprite);
  (self as unknown as Worker).postMessage({ id, buffer } satisfies ImageResponseMessage);
};
