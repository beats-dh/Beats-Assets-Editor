import type { ImageRequestMessage, ImageResponseMessage, ImageBatchRequestMessage, ImageBatchResponseMessage } from '../workers/imageBitmapWorker';

let worker: Worker | null = null;
const pendingDecodes = new Map<string, (buffer: ArrayBuffer | null) => void>();
const pendingBatches = new Map<string, (buffers: (ArrayBuffer | null)[]) => void>();
let requestCounter = 0;

function resetWorker(): void {
  worker?.terminate();
  worker = null;
  pendingDecodes.forEach(resolve => resolve(null));
  pendingDecodes.clear();
  pendingBatches.forEach(resolve => resolve([]));
  pendingBatches.clear();
}

function ensureWorker(): void {
  if (worker) return;

  try {
    worker = new Worker(new URL('../workers/imageBitmapWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<ImageResponseMessage | ImageBatchResponseMessage>) => {
      const data = event.data;

      // Batch response
      if ('buffers' in data && Array.isArray(data.buffers)) {
        const resolver = pendingBatches.get(data.id);
        if (resolver) {
          resolver(data.buffers);
          pendingBatches.delete(data.id);
        }
        return;
      }

      // Single response
      const { id, buffer } = data as ImageResponseMessage;
      const resolver = pendingDecodes.get(id);
      if (resolver) {
        resolver(buffer ?? null);
        pendingDecodes.delete(id);
      }
    };
    worker.onerror = (error) => {
      console.error('Image decode worker error:', error);
      resetWorker();
    };
  } catch (error) {
    console.warn('Failed to start image decode worker:', error);
    worker = null;
  }
}

export async function decodeSpriteOffThread(sprite: Uint8Array): Promise<ArrayBuffer | null> {
  ensureWorker();
  if (!worker) {
    return null;
  }

  const requestId = `sprite-${Date.now()}-${requestCounter++}`;
  const spriteBuffer = sprite.slice().buffer;

  const promise = new Promise<ArrayBuffer | null>((resolve) => {
    pendingDecodes.set(requestId, resolve);
    const message: ImageRequestMessage = { id: requestId, sprite: spriteBuffer };
    worker!.postMessage(message, [spriteBuffer]);
  });

  return promise;
}

/**
 * Batch decode multiple sprites in a single Worker message.
 * Reduces postMessage overhead from N messages to 1 message.
 */
export async function decodeSpritesBatch(sprites: Uint8Array[]): Promise<(ArrayBuffer | null)[]> {
  if (sprites.length === 0) return [];

  // For very small batches, use individual calls
  if (sprites.length === 1) {
    const result = await decodeSpriteOffThread(sprites[0]);
    return [result];
  }

  ensureWorker();
  if (!worker) {
    return sprites.map(() => null);
  }

  const requestId = `batch-${Date.now()}-${requestCounter++}`;
  const buffers = sprites.map(s => s.slice().buffer);

  const promise = new Promise<(ArrayBuffer | null)[]>((resolve) => {
    pendingBatches.set(requestId, resolve);
    const message: ImageBatchRequestMessage = { id: requestId, sprites: buffers };
    worker!.postMessage(message, buffers);
  });

  return promise;
}

export function disposeImageDecodeWorker(): void {
  resetWorker();
}
