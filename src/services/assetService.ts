import { invoke } from '../utils/invoke';
import { COMMANDS } from '../commands';
import { assetsState } from '../stores/assetsState.svelte';
import type { CompleteAppearanceItem } from '../types';

async function loadSoundItems(sub: string, page: number, size: number): Promise<{ items: CompleteAppearanceItem[]; total: number }> {
  let soundItems: any[] = [];
  let total = 0;

  if (sub === 'Ambience Streams') {
    soundItems = await invoke('list_ambience_streams', { page, pageSize: size });
    total = await invoke('get_ambience_stream_count');
  } else if (sub === 'Ambience Object Streams') {
    soundItems = await invoke('list_ambience_object_streams', { page, pageSize: size });
    total = await invoke('get_ambience_object_stream_count');
  } else if (sub === 'Music Templates') {
    soundItems = await invoke('list_music_templates', { page, pageSize: size });
    total = await invoke('get_music_template_count');
  } else {
    // Default to Sound Effects
    const typeFilter = sub === 'All' ? null : sub;
    soundItems = await invoke('list_numeric_sound_effects', { page, pageSize: size, soundType: typeFilter });
    total = await invoke('get_sound_effect_count');
  }

  // Map to compatible structure
  const items = soundItems.map(s => ({
    id: s.id,
    name: s.filename || s.sound_type || `Sound #${s.id}`,
    description: '',
    flags: {} as any,
  })) as unknown as CompleteAppearanceItem[];

  return { items, total };
}

/**
 * Navigates the asset list so the appearance with `id` is on the visible page.
 * Uses `find_appearance_position` (position within the subcategory-filtered,
 * sorted list — it ignores the text search), so any active text search is
 * cleared first to keep the displayed list consistent with that position.
 * Returns false when the id is not found in the current category/subcategory.
 */
export async function jumpToAppearanceId(id: number): Promise<boolean> {
  const category = assetsState.currentCategory;
  if (category === 'Sounds') return false;

  const sub = assetsState.currentSubcategory;
  const subcategory = category === 'Objects' && sub !== 'All' ? sub : null;

  const pos = await invoke<number | null>(COMMANDS.FIND_APPEARANCE_POSITION, {
    category,
    id,
    subcategory,
  });
  if (pos === null || pos === undefined) return false;

  assetsState.searchQuery = '';
  assetsState.currentPage = Math.floor(pos / assetsState.pageSize);
  await loadAssetsData();
  return true;
}

export async function loadAssetsData(append = false) {
  assetsState.isLoading = true;

  const category = assetsState.currentCategory;
  const page = assetsState.currentPage;
  const size = assetsState.pageSize;
  const search = assetsState.searchQuery;
  const sub = assetsState.currentSubcategory;

  try {
    let items: CompleteAppearanceItem[] = [];
    let total = 0;

    if (category === 'Sounds') {
      ({ items, total } = await loadSoundItems(sub, page, size));
    } else if (assetsState.flagFilter) {
      // Flag-combination search (DatEditor SearchWindow) — ignores text/subcategory.
      const response = await invoke<{ total: number; items: CompleteAppearanceItem[] }>(COMMANDS.SEARCH_APPEARANCES_BY_FLAGS, {
        category,
        flags: assetsState.flagFilter.flags,
        animatedOnly: assetsState.flagFilter.animatedOnly,
        page,
        pageSize: size,
      });
      items = response.items;
      total = response.total;
    } else {
      // Standard Appearance Assets
      const response = await invoke<{ total: number; items: CompleteAppearanceItem[] }>(COMMANDS.LIST_APPEARANCES_BY_CATEGORY, {
        category,
        page,
        pageSize: size,
        search: search || null,
        subcategory: category === 'Objects' && sub !== 'All' ? sub : null,
      });

      items = response.items;
      total = response.total;
    }

    if (append) {
      assetsState.assets = [...assetsState.assets, ...items];
    } else {
      assetsState.assets = items;
    }

    assetsState.totalItems = total;

  } catch (error) {
    console.error('Error loading assets:', error);
  } finally {
    assetsState.isLoading = false;
  }
}
