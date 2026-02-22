import { invoke } from '@tauri-apps/api/core';
import type { SpecialMeaningAppearanceIds } from './types';

let currentSpecialMeaningIds: SpecialMeaningAppearanceIds | null = null;

export async function loadSpecialMeaningIds(): Promise<SpecialMeaningAppearanceIds | null> {
  try {
    const result = await invoke<SpecialMeaningAppearanceIds | null>('get_special_meaning_ids');
    currentSpecialMeaningIds = result ?? null;
  } catch (error) {
    console.error('Failed to load SpecialMeaningAppearanceIds:', error);
    currentSpecialMeaningIds = null;
  }

  return currentSpecialMeaningIds;
}

export function getSpecialMeaningIds(): SpecialMeaningAppearanceIds | null {
  return currentSpecialMeaningIds;
}
