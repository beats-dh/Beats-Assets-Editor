import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import type { AppearanceStats } from '../../types';
import {
  clearSpritesCache,
  forceLoadSprites,
  resetSpriteLoaderState,
  setUserTibiaPath,
} from '../../spriteCache';

export interface LoadTibiaAssetsOptions {
  onProgress?: (message: string) => void;
  loadSounds?: boolean;
}

export interface LoadTibiaAssetsResult {
  stats: AppearanceStats;
  appearancePath: string;
  selectedFile: string;
  spriteCount: number;
  files: string[];
  soundsLoaded: boolean;
}

function emitProgress(options: LoadTibiaAssetsOptions | undefined, message: string): void {
  options?.onProgress?.(message);
}

export async function loadTibiaAssets(
  tibiaPath: string,
  options?: LoadTibiaAssetsOptions,
): Promise<LoadTibiaAssetsResult> {
  const trimmedPath = tibiaPath.trim();
  if (!trimmedPath) {
    throw new Error('A valid Tibia directory is required.');
  }

  setUserTibiaPath(trimmedPath);
  emitProgress(options, 'Saving Tibia directory preference...');

  try {
    await invoke('set_tibia_base_path', { tibiaPath: trimmedPath });
  } catch (error) {
    console.warn('Failed to persist Tibia path (non-fatal):', error);
  }

  emitProgress(options, 'Searching for appearance data files...');
  const files = await invoke<string[]>('list_appearance_files', { tibiaPath: trimmedPath });
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No appearance data files were found in the selected Tibia directory.');
  }

  const assetsDir = await join(trimmedPath, 'assets');
  let selectedFile = 'appearances_latest.dat';
  if (!files.includes(selectedFile)) {
    [selectedFile] = files;
  }

  const appearancePath = await join(assetsDir, selectedFile);
  emitProgress(options, `Loading ${selectedFile}...`);
  const stats = await invoke<AppearanceStats>('load_appearances_file', { path: appearancePath });

  let soundsLoaded = false;
  if (options?.loadSounds) {
    emitProgress(options, 'Loading sounds data...');
    try {
      const soundsDir = await join(trimmedPath, 'sounds');
      await invoke('load_sounds_file', { soundsDir });
      soundsLoaded = true;
    } catch (error) {
      console.warn('Failed to load sounds (optional):', error);
    }
  }

  emitProgress(options, 'Preparing sprites for previews...');
  clearSpritesCache();
  resetSpriteLoaderState();

  let spriteCount = 0;
  try {
    spriteCount = await forceLoadSprites(trimmedPath);
  } catch (error) {
    console.error('Failed to load sprites from Tibia assets directory:', error);
    throw new Error('Sprites could not be loaded. Ensure the assets directory contains catalog-content.json and sprite sheets.');
  }

  emitProgress(options, 'Assets ready.');
  return {
    stats,
    appearancePath,
    selectedFile,
    spriteCount,
    files,
    soundsLoaded,
  };
}
