import type { AppearanceStats } from '../types';
import { loadTibiaAssets } from '../features/tibiaAssets/loader';

export interface AssetsLoadOptions {
  onProgress?: (message: string) => void;
}

export interface AssetsLoadResult {
  stats: AppearanceStats;
  appearancePath: string;
  selectedFile: string;
  spriteCount: number;
}

export async function loadAssetsForScripts(basePath: string, options: AssetsLoadOptions = {}): Promise<AssetsLoadResult> {
  const result = await loadTibiaAssets(basePath, {
    loadSounds: false,
    onProgress: message => options.onProgress?.(message),
  });

  return {
    stats: result.stats,
    appearancePath: result.appearancePath,
    selectedFile: result.selectedFile,
    spriteCount: result.spriteCount,
  };
}
