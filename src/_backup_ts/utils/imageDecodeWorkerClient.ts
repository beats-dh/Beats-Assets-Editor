import type { ImageRequestMessage, ImageResponseMessage } from '../workers/imageBitmapWorker';

let worker: Worker | null = null;
const pendingDecodes = new Map<string, (buffer: ArrayBuffer | null) => void>();
let requestCounter = 0;

function resetWorker(): void {
  worker?.terminate();
  worker = null;
  pendingDecodes.forEach(resolve => resolve(null));
  pendingDecodes.clear();
}

function ensureWorker(): void {
  if (worker) return;

  try {
    worker = new Worker(new URL('../workers/imageBitmapWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<ImageResponseMessage>) => {
      const { id, buffer } = event.data;
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

export function disposeImageDecodeWorker(): void {
  resetWorker();
}
